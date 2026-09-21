import * as THREE from 'three';
import { FontLoader, type FontData } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import fontData from '../assets/manrope-jelly.json';
import { waterVertex, waterFragment } from './water-shader';

type Letter = {
  char: string;
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>;
  home: THREE.Vector2;
  velocity: THREE.Vector2;
  size: THREE.Vector2;
  mode: 'home' | 'falling' | 'floating' | 'returning';
  wobble: { value: number };
  phase: number;
  wet: boolean;
  scale: number;
};

const HEIGHT = 10;
const MOBILE_HORIZON = .36; // UV origin is at the bottom.
const DESKTOP_HORIZON = .31;
const clamp = THREE.MathUtils.clamp;

export async function mountWaterScene() {
  const host = document.querySelector<HTMLElement>('#water-scene');
  const home = document.querySelector<HTMLElement>('.home');
  const controls = document.querySelector<HTMLElement>('.scene-accessibility');
  const resetButton = document.querySelector<HTMLButtonElement>('#water-reset');
  const pauseButton = document.querySelector<HTMLButtonElement>('#water-pause');
  const status = document.querySelector<HTMLElement>('#water-status');
  if (!host || !home || !controls || !resetButton || !pauseButton || !status) return;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  } catch {
    return; // The server-rendered name, photograph, and links remain fully usable.
  }
  const mobile = matchMedia('(pointer: coarse)').matches;
  const compact = matchMedia('(max-width: 640px)').matches;
  const horizon = compact ? MOBILE_HORIZON : DESKTOP_HORIZON;
  const waterY = (horizon - .5) * HEIGHT;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.transmissionResolutionScale = .5;
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-8, 8, 5, -5, .1, 80);
  camera.position.z = 20;
  const environmentGenerator = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = environmentGenerator.fromScene(room, .06);
  scene.environment = environment.texture;
  room.dispose();
  environmentGenerator.dispose();
  scene.add(new THREE.HemisphereLight(0xe7f6ed, 0x2b566a, .52));
  const keyLight = new THREE.DirectionalLight(0xfff5dd, 1.12);
  keyLight.position.set(-5, 8, 9);
  scene.add(keyLight);
  const rim = new THREE.DirectionalLight(0xb3e0f1, .65);
  rim.position.set(8, 2, 5);
  scene.add(rim);

  let photo: THREE.Texture;
  try {
    photo = await new THREE.TextureLoader().loadAsync('/images/background.jpg');
  } catch {
    environment.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    return;
  }
  photo.colorSpace = THREE.SRGBColorSpace;
  const photoMaterial = new THREE.MeshBasicMaterial({ map: photo, color: 0x91aeb7 });
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), photoMaterial);
  backdrop.position.z = -4;
  scene.add(backdrop);

  const target = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    samples: mobile ? 0 : 2,
  });
  const time = { value: 0 };
  const ripples = Array.from({ length: 12 }, () => new THREE.Vector4(0, 0, -100, 0));
  let rippleIndex = 0;
  const lakeMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uScene: { value: target.texture }, uTime: time,
      uHorizon: { value: horizon }, uAspect: { value: 1 }, uRipples: { value: ripples },
    },
    vertexShader: waterVertex,
    fragmentShader: waterFragment,
    depthTest: false,
    depthWrite: false,
  });
  const lakeScene = new THREE.Scene();
  const lakeQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), lakeMaterial);
  lakeScene.add(lakeQuad);
  const lakeCamera = new THREE.Camera();
  const font = new FontLoader().parse(fontData as unknown as FontData);
  const letters: Letter[] = [];
  const words = ['Vikram', 'Ramkumar.'];
  let worldWidth = 16;
  let width = 1;
  let height = 1;
  let paused = false;
  let hidden = document.hidden;
  let destroyed = false;
  let animationFrame = 0;
  let lastTime = 0;
  let introDone = false;
  let introTimer: ReturnType<typeof setTimeout> | undefined;
  let active: Letter | undefined;
  let pointerId: number | undefined;
  let hover: Letter | undefined;
  const pointer = new THREE.Vector2();
  const dragOffset = new THREE.Vector2();
  const previousPointer = new THREE.Vector2();
  let previousPointerTime = 0;
  const abort = new AbortController();
  const listenerOptions = { signal: abort.signal };

  function announce(message: string) { status!.textContent = message; }
  function splash(x: number, strength = 1, y = horizon - .01) {
    ripples[rippleIndex].set(x / worldWidth + .5, y, time.value, strength);
    rippleIndex = (rippleIndex + 1) % ripples.length;
  }

  function makeLetters() {
    for (const letter of letters) {
      scene.remove(letter.mesh);
      letter.mesh.geometry.dispose();
      letter.mesh.material.dispose();
    }
    letters.length = 0;
    // Real bevelled font outlines; each glyph is a separate deformable solid.
    const measure = (word: string) => [...word].reduce((sum, char) => sum + font.data.glyphs[char].ha / font.data.resolution + .045, 0);
    const fontSize = compact
      ? Math.min(1.85, worldWidth * .84 / measure(words[1]))
      : Math.min(1.64, worldWidth * .76 / measure(words[1]));
    words.forEach((word, row) => {
      let x = -measure(word) * fontSize / 2;
      [...word].forEach((char, index) => {
        const geometry = char === '.' ? new THREE.SphereGeometry(fontSize * .09, 24, 16) : new TextGeometry(char, {
          font, size: fontSize, depth: fontSize * .26, curveSegments: mobile ? 10 : 14,
          bevelEnabled: true, bevelThickness: fontSize * .035,
          bevelSize: fontSize * .025, bevelSegments: 5,
        });
        geometry.computeBoundingBox();
        const box = geometry.boundingBox!;
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        geometry.translate(-center.x, -center.y, -center.z);
        const material = new THREE.MeshPhysicalMaterial({
          color: 0x10bd80, metalness: 0, roughness: .2,
          transmission: .035, thickness: fontSize * .8, ior: 1.42,
          clearcoat: 1, clearcoatRoughness: .065,
          specularIntensity: .78, specularColor: new THREE.Color(0xe4fff4),
          attenuationColor: new THREE.Color(0x20bd92), attenuationDistance: 2.5,
          envMapIntensity: .75,
        });
        const wobble = { value: .28 };
        const phase = index * 1.23 + row * 2;
        material.onBeforeCompile = shader => {
          shader.uniforms.uJellyTime = time;
          shader.uniforms.uJellyWobble = wobble;
          shader.uniforms.uJellyPhase = { value: phase };
          shader.uniforms.uJellySize = { value: fontSize };
          shader.vertexShader = `
            uniform float uJellyTime;
            uniform float uJellyWobble;
            uniform float uJellyPhase;
            uniform float uJellySize;
            vec3 jellyDeform(vec3 p) {
              vec3 q = p / uJellySize;
              float energy = uJellyWobble * .13;
              float beat = uJellyTime * 8.2 + uJellyPhase;
              float primary = sin(beat);
              float secondary = sin(beat * 1.37 + .8);
              // A whole-body, volume-preserving wiggle rather than a travelling wave.
              float stretch = max(.82, 1.0 + primary * energy * .55);
              q.x /= sqrt(stretch);
              q.y *= stretch;
              q.z /= sqrt(stretch);
              float vertical = clamp(q.y * 1.6, -1.0, 1.0);
              q.x += vertical * secondary * energy * .20;
              q.z += (1.0 - vertical * vertical) * primary * energy * .14;
              return q * uJellySize;
            }
          ` + shader.vertexShader;
          // Move normals with the surface so highlights flow with the jelly.
          shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `
            #include <beginnormal_vertex>
            vec3 tangentA = normalize(cross(objectNormal, abs(objectNormal.y) < .9 ? vec3(0.,1.,0.) : vec3(1.,0.,0.)));
            vec3 tangentB = normalize(cross(objectNormal, tangentA));
            float e = .002 * uJellySize;
            vec3 base = jellyDeform(position);
            objectNormal = normalize(cross(jellyDeform(position + tangentA * e) - base, jellyDeform(position + tangentB * e) - base));
          `);
          shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
            vec3 transformed = jellyDeform(position);
          `);
        };
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -.075;
        // Align glyphs to a shared baseline (including the dot on the i).
        const lineY = row === 0 ? 1.28 : 1.28 - fontSize * .91;
        if (char === '.') center.y = fontSize * .09;
        mesh.position.set(x + center.x, lineY + center.y - fontSize * .37, 0);
        const letter: Letter = {
          char, mesh, home: new THREE.Vector2(mesh.position.x, mesh.position.y),
          velocity: new THREE.Vector2(), size: new THREE.Vector2(size.x, size.y),
          mode: 'home', wobble, phase, wet: false, scale: 1,
        };
        letters.push(letter);
        scene.add(mesh);
        x += (font.data.glyphs[char].ha / font.data.resolution + .045) * fontSize;
      });
    });
  }

  function resize() {
    release();
    width = host!.clientWidth;
    height = host!.clientHeight;
    worldWidth = HEIGHT * width / height;
    camera.left = -worldWidth / 2;
    camera.right = worldWidth / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    const pixelRatio = renderer.getPixelRatio();
    target.setSize(Math.round(width * pixelRatio), Math.round(height * pixelRatio));
    lakeMaterial.uniforms.uAspect.value = width / height;
    const image = photo.image as HTMLImageElement;
    const imageAspect = image.width / image.height;
    const coverWidth = Math.max(worldWidth, HEIGHT * imageAspect);
    backdrop.scale.set(coverWidth, coverWidth / imageAspect, 1);
    makeLetters();
    if (introDone) {
      const period = letters.find(letter => letter.char === '.');
      if (period) { period.mode = 'floating'; period.wet = true; period.mesh.position.y = waterY + period.size.y * .36; }
    }
    if (paused) render();
  }

  function render() {
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(lakeScene, lakeCamera);
  }

  function simulate(dt: number) {
    const floatingWidth = letters.reduce((total, letter) => total +
      (letter.mode === 'floating' || letter.mode === 'falling' ? letter.size.x + .05 : 0), 0);
    const floatingScale = Math.min(1, worldWidth * .86 / Math.max(.01, floatingWidth));
    for (const letter of letters) {
      const { mesh, velocity, size, mode } = letter;
      const scaleTarget = letter !== active && (mode === 'falling' || mode === 'floating') ? floatingScale : 1;
      letter.scale += (scaleTarget - letter.scale) * Math.min(1, dt * 4);
      letter.wobble.value *= Math.exp(-dt * 4.2);
      if (letter === active) {
        const dx = pointer.x + dragOffset.x - mesh.position.x;
        const dy = pointer.y + dragOffset.y - mesh.position.y;
        mesh.position.x += dx * Math.min(1, dt * 24);
        mesh.position.y += dy * Math.min(1, dt * 24);
        letter.wobble.value = Math.min(1.6, .25 + Math.hypot(dx, dy) * .7);
      } else if (mode === 'home') {
        mesh.position.y = letter.home.y;
      } else if (mode === 'returning') {
        velocity.x += ((letter.home.x - mesh.position.x) * 48 - velocity.x * 11) * dt;
        velocity.y += ((letter.home.y - mesh.position.y) * 48 - velocity.y * 11) * dt;
        mesh.position.x += velocity.x * dt;
        mesh.position.y += velocity.y * dt;
        if (Math.hypot(mesh.position.x - letter.home.x, mesh.position.y - letter.home.y) < .015 && velocity.length() < .08) {
          letter.mode = 'home';
          mesh.position.set(letter.home.x, letter.home.y, 0);
          velocity.set(0, 0);
        }
      } else {
        const floatY = waterY + size.y * letter.scale * .36;
        if (mode === 'falling') velocity.y -= 6.5 * dt;
        if (mesh.position.y < floatY) {
          if (!letter.wet) {
            splash(mesh.position.x, clamp(Math.abs(velocity.y) * .24, .45, 1.8));
            letter.wobble.value = 1.25;
            velocity.y = Math.min(1.4, Math.abs(velocity.y) * .16);
            letter.wet = true;
            letter.mode = 'floating';
            announce(`${letter.char === '.' ? 'The period' : letter.char} is floating.`);
          }
        }
        if (letter.mode === 'floating') {
          const bob = Math.sin(time.value * 1.35 + letter.phase) * .018;
          velocity.y += ((floatY + bob - mesh.position.y) * 34 - velocity.y * 9.5) * dt;
          velocity.x += Math.sin(time.value * .45 + letter.phase) * dt * .018;
        }
        velocity.x *= Math.exp(-dt * 1.1);
        mesh.position.x += velocity.x * dt;
        mesh.position.y += velocity.y * dt;
        mesh.position.y = Math.max(waterY - size.y * .25, mesh.position.y);
        const edge = worldWidth / 2 - size.x * letter.scale / 2 - .15;
        if (Math.abs(mesh.position.x) > edge) {
          mesh.position.x = clamp(mesh.position.x, -edge, edge);
          velocity.x *= -.5;
        }
      }
      const squash = Math.sin(time.value * 9.5 + letter.phase) * letter.wobble.value * .035;
      mesh.scale.set((1 + squash) * letter.scale, (1 - squash) * letter.scale, (1 + squash * .5) * letter.scale);
      const depthTarget = letter === active ? 1.2 : letter.mode === 'falling' || letter.mode === 'floating' ? .65 : 0;
      mesh.position.z += (depthTarget - mesh.position.z) * Math.min(1, dt * 8);
      const targetAngle = letter === active ? clamp(velocity.x * -.045, -.2, .2)
        : letter.mode === 'floating' ? clamp(velocity.x * -.06, -.09, .09) : 0;
      mesh.rotation.z += (targetAngle - mesh.rotation.z) * Math.min(1, dt * 7);
      mesh.rotation.y = -.06 + Math.sin(time.value * 8.2 + letter.phase) * letter.wobble.value * .025;
    }
    // Soft lateral collisions keep floating letters from piling into one another.
    for (let i = 0; i < letters.length; i++) {
      const a = letters[i];
      if (a.mode !== 'floating' || a === active) continue;
      for (let j = i + 1; j < letters.length; j++) {
        const b = letters[j];
        if (b.mode !== 'floating' || b === active) continue;
        const dx = b.mesh.position.x - a.mesh.position.x;
        const overlap = (a.size.x * a.scale + b.size.x * b.scale) * .48 - Math.abs(dx);
        if (overlap > 0 && Math.abs(a.mesh.position.y - b.mesh.position.y) < Math.max(a.size.y, b.size.y)) {
          const push = Math.sign(dx || .1) * overlap * .12;
          a.mesh.position.x -= push;
          b.mesh.position.x += push;
          a.velocity.x -= push * 2;
          b.velocity.x += push * 2;
        }
      }
    }
  }

  function frame(now: number) {
    if (paused || hidden || destroyed) { animationFrame = 0; return; }
    const dt = Math.min((now - (lastTime || now)) / 1000, .25);
    lastTime = now;
    time.value += dt;
    // Fixed-size substeps keep buoyancy stable without slowing it on modest GPUs.
    const steps = Math.max(1, Math.ceil(dt / (1 / 60)));
    for (let step = 0; step < steps; step++) simulate(dt / steps);
    render();
    animationFrame = requestAnimationFrame(frame);
  }
  function start() {
    if (!animationFrame && !paused && !hidden && !destroyed) {
      lastTime = 0;
      animationFrame = requestAnimationFrame(frame);
    }
  }

  function setPointer(event: PointerEvent) {
    const rect = host!.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / width - .5) * worldWidth,
      (.5 - (event.clientY - rect.top) / height) * HEIGHT);
  }
  function hitTest() {
    return [...letters].reverse().find(letter =>
      Math.abs(pointer.x - letter.mesh.position.x) < letter.size.x * letter.scale / 2 + .07 &&
      Math.abs(pointer.y - letter.mesh.position.y) < letter.size.y * letter.scale / 2 + .06);
  }
  function release() {
    if (active) {
      active.mode = 'falling';
      active.wet = false;
      active.wobble.value = 1;
      active = undefined;
    }
    if (pointerId !== undefined && renderer.domElement.hasPointerCapture(pointerId)) renderer.domElement.releasePointerCapture(pointerId);
    pointerId = undefined;
    host!.classList.remove('is-dragging');
  }
  renderer.domElement.addEventListener('pointerdown', event => {
    if (paused || event.button !== 0 || active) return;
    setPointer(event);
    active = hitTest();
    if (active) {
      pointerId = event.pointerId;
      renderer.domElement.setPointerCapture(event.pointerId);
      dragOffset.set(active.mesh.position.x - pointer.x, active.mesh.position.y - pointer.y);
      previousPointer.copy(pointer);
      previousPointerTime = event.timeStamp;
      active.velocity.set(0, 0);
      host.classList.add('is-dragging');
    } else if (pointer.y < waterY) {
      splash(pointer.x, .8, clamp(pointer.y / HEIGHT + .5, .02, horizon));
    }
  }, listenerOptions);
  renderer.domElement.addEventListener('pointermove', event => {
    if (paused || (pointerId !== undefined && event.pointerId !== pointerId)) return;
    setPointer(event);
    if (active) {
      const dt = Math.max(.008, (event.timeStamp - previousPointerTime) / 1000);
      active.velocity.set(clamp((pointer.x - previousPointer.x) / dt, -9, 9), clamp((pointer.y - previousPointer.y) / dt, -8, 8));
      previousPointer.copy(pointer);
      previousPointerTime = event.timeStamp;
    } else {
      const next = hitTest();
      if (next && next !== hover) next.wobble.value = .8;
      hover = next;
      host.classList.toggle('is-grabbable', !!hover);
    }
  }, listenerOptions);
  renderer.domElement.addEventListener('pointerup', event => {
    if (event.pointerId === pointerId) release();
  }, listenerOptions);
  renderer.domElement.addEventListener('pointercancel', release, listenerOptions);
  renderer.domElement.addEventListener('lostpointercapture', release, listenerOptions);
  renderer.domElement.addEventListener('pointerleave', () => {
    hover = undefined;
    host.classList.remove('is-grabbable');
  }, listenerOptions);
  // Only the letter band captures touch gestures. The surrounding page can scroll normally.
  renderer.domElement.addEventListener('touchstart', event => {
    if (active) event.preventDefault();
  }, { ...listenerOptions, passive: false });
  resetButton.addEventListener('click', () => {
    release();
    for (const letter of letters) {
      letter.mode = 'returning';
      letter.velocity.set(0, 0);
      letter.wobble.value = .65;
      letter.wet = false;
    }
    announce('Reassembling Vikram Ramkumar.');
  }, listenerOptions);
  pauseButton.addEventListener('click', () => {
    release();
    paused = !paused;
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.setAttribute('aria-label', paused ? 'Resume animation' : 'Pause animation');
    pauseButton.innerHTML = paused ? 'Resume <span aria-hidden="true">▷</span>' : 'Pause <span aria-hidden="true">Ⅱ</span>';
    resetButton.disabled = paused;
    if (paused) { cancelAnimationFrame(animationFrame); animationFrame = 0; }
    else start();
  }, listenerOptions);
  document.addEventListener('visibilitychange', () => {
    hidden = document.hidden;
    if (hidden) { release(); cancelAnimationFrame(animationFrame); animationFrame = 0; }
    else start();
  }, listenerOptions);
  const observer = new ResizeObserver(() => {
    if (width !== host.clientWidth || height !== host.clientHeight) resize();
  });
  observer.observe(host);

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    cancelAnimationFrame(animationFrame);
    clearTimeout(introTimer);
    abort.abort();
    observer.disconnect();
    home!.classList.remove('is-ready');
    controls!.hidden = true;
    for (const letter of letters) { letter.mesh.geometry.dispose(); letter.mesh.material.dispose(); }
    photo.dispose(); photoMaterial.dispose(); backdrop.geometry.dispose();
    environment.dispose(); target.dispose(); lakeMaterial.dispose(); lakeQuad.geometry.dispose();
    renderer.dispose(); renderer.domElement.remove();
  }
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    destroy();
  }, listenerOptions);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  reducedMotion.addEventListener('change', event => { if (event.matches) destroy(); }, listenerOptions);
  window.addEventListener('pagehide', event => { if (!event.persisted) destroy(); }, listenerOptions);
  resize();
  // Warm shader compilation before replacing accessible fallback typography.
  try {
    await renderer.compileAsync(scene, camera);
    if (destroyed) return;
    render();
    home.classList.add('is-ready');
    controls.hidden = false;
    start();
    // Begin the 1.5-second beat when the finished scene first becomes visible.
    introTimer = setTimeout(() => {
      if (destroyed || introDone) return;
      introDone = true;
      const period = letters.find(letter => letter.char === '.');
      if (!period || period === active || period.mode !== 'home') return;
      period.mode = 'falling';
      period.wet = false;
      period.velocity.set(.08, 0);
      period.wobble.value = 1.3;
      announce('The period dropped into the water.');
    }, 1500);
  } catch (error) {
    console.warn('Water scene unavailable; retaining the photographic homepage.', error);
    destroy();
  }
}
