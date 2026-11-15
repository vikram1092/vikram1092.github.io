import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/** Small, decorative scene. The SVG underneath is also the no-WebGL fallback. */
export function mountBalloons(host: HTMLElement) {
  const root = host.parentElement!;
  const title = root.querySelector('h1')!;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
  if (!context) { host.dataset.renderer = 'fallback'; return; }

  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 1000);
  camera.position.z = 500;
  const room = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x6b594b, 1.4));
  const key = new THREE.DirectionalLight(0xfff7e9, 2.1);
  key.position.set(-180, 230, 350);
  scene.add(key);

  const shape = new THREE.SphereGeometry(1, 32, 24);
  const position = shape.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i);
    const taper = .91 + .13 * y;
    position.setXYZ(i, position.getX(i) * taper, y * 1.22, position.getZ(i) * taper * .82);
  }
  shape.computeVertexNormals();
  const knot = new THREE.ConeGeometry(.105, .18, 12);
  const materials = [0xcba04e, 0xc77d91, 0x8a9e79].map((color) => new THREE.MeshPhysicalMaterial({
    color, metalness: .16, roughness: .31, clearcoat: .55, clearcoatRoughness: .24, envMapIntensity: .65,
  }));
  const stringMaterial = new THREE.LineBasicMaterial({ color: 0x9e8c72, transparent: true, opacity: .62 });
  const balloons = Array.from({ length: 6 }, (_, i) => {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(shape, materials[i % 3]));
    const tie = new THREE.Mesh(knot, materials[i % 3]);
    tie.position.y = -1.27;
    group.add(tie);
    const thread = new THREE.BufferGeometry();
    thread.setAttribute('position', new THREE.BufferAttribute(new Float32Array(33 * 3), 3));
    const line = new THREE.Line(thread, stringMaterial);
    line.frustumCulled = false;
    group.add(line);
    scene.add(group);
    return { group, thread, phase: i * 1.9, baseX: 0, baseY: 0, introX: 0, introY: 0, cornerX: 0, cornerY: 0, introRadius: 1, cornerRadius: 1, radius: 1, length: 1, x: 0, y: 0, vx: 0, vy: 0 };
  });
  let width = 1, height = 1, visible = true, disposed = false, contextLost = false;
  let frame = 0, last = 0, time = 0;
  let departure = root.classList.contains('is-started') ? performance.now() - 1600 : 0;

  function layout() {
    if (disposed || contextLost) return;
    const box = host.getBoundingClientRect();
    width = box.width;
    height = box.height;
    renderer.setSize(width, height, false);
    camera.left = -width / 2; camera.right = width / 2;
    camera.top = height / 2; camera.bottom = -height / 2;
    camera.updateProjectionMatrix();
    const mobile = width <= 650;
    const radius = mobile ? Math.min(24, width * .06) : 32;
    const cornerRadius = mobile ? 14 : 24;
    const safeTop = parseFloat(getComputedStyle(root.querySelector('.album')!).paddingTop);
    balloons.forEach((balloon, i) => {
      const index = i % 3;
      const side = i < 3 ? -1 : 1;
      const spread = side * [.45, -.65, .05][index];
      balloon.introRadius = radius * [1, .95, .74][index];
      balloon.cornerRadius = cornerRadius * [1, .95, .74][index];
      balloon.introX = side * (mobile ? width * .29 : Math.min(width / 2 - 70, title.getBoundingClientRect().width / 2 + 85)) + spread * radius;
      balloon.introY = (mobile ? 108 : 46) - [0, .62, 1.38][index] * radius;
      balloon.cornerX = side * (width / 2 - cornerRadius * 2.6) + spread * cornerRadius;
      // Keep the idle bob and strings inside the viewport, including the notch.
      balloon.cornerY = height / 2 - Math.max(cornerRadius * 2.2 + 12, safeTop - 28) - [0, .62, 1.38][index] * cornerRadius;
      balloon.group.position.z = index * 12;
    });
    draw(0);
    renderer.render(scene, camera);
  }
  function draw(dt: number) {
    time += dt;
    const progress = departure ? (motion.matches ? 1 : Math.min(1, (performance.now() - departure) / 1600)) : 0;
    const travel = motion.matches ? (departure ? 1 : 0) : 1 - (1 - progress) ** 3;
    host.dataset.position = progress === 1 ? 'corners' : departure ? 'departing' : 'intro';
    balloons.forEach((balloon, i) => {
      balloon.radius = THREE.MathUtils.lerp(balloon.introRadius, balloon.cornerRadius, travel);
      balloon.baseX = THREE.MathUtils.lerp(balloon.introX, balloon.cornerX, travel);
      balloon.baseY = THREE.MathUtils.lerp(balloon.introY, balloon.cornerY, travel);
      balloon.length = 2.4;
      balloon.group.scale.setScalar(balloon.radius);
      const { phase, radius, group, thread } = balloon;
      // Independent buoyancy rides a shared slow breeze, even without input.
      // Springs keep the larger movements soft and let a tap settle naturally.
      const breeze = Math.sin(time * .36 + .8) * radius * .08;
      const targetX = Math.sin(time * .75 + phase) * radius * .30 + breeze;
      const targetY = (Math.sin(time * 1.05 + phase * .7) * .34 + Math.cos(time * .5 + phase) * .06) * radius;
      balloon.vx += ((targetX - balloon.x) * 3.8 - balloon.vx * 1.9) * dt;
      balloon.vy += ((targetY - balloon.y) * 4.2 - balloon.vy * 2) * dt;
      balloon.x = THREE.MathUtils.clamp(balloon.x + balloon.vx * dt, -radius * .65, radius * .65);
      balloon.y = THREE.MathUtils.clamp(balloon.y + balloon.vy * dt, -radius * .55, radius * .55);
      group.position.x = balloon.baseX + balloon.x;
      group.position.y = balloon.baseY + balloon.y;
      group.rotation.z = Math.sin(time * .7 + phase) * .11 - balloon.vx * .002;
      group.rotation.y = Math.sin(time * .45 + phase) * .20;
      const points = thread.attributes.position;
      for (let j = 0; j <= 32; j++) {
        const t = j / 32;
        const wave = Math.sin(t * Math.PI * 2 + time * 1.1 + phase) * .23 * Math.sin(t * Math.PI);
        const trail = -balloon.x / radius * t * .8 + (i < 3 ? -.1 : .1) * t;
        points.setXYZ(j, wave + trail, -1.34 - t * balloon.length, -.06);
      }
      points.needsUpdate = true;
    });
  }
  function tick(now: number) {
    frame = requestAnimationFrame(tick);
    if (now - last < 1000 / 30) return;
    const dt = last ? Math.min((now - last) / 1000, .05) : 0;
    last = now;
    draw(dt);
    renderer.render(scene, camera);
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    const paused = motion.matches || document.hidden || !visible || contextLost || disposed;
    host.dataset.motion = motion.matches ? 'reduced' : paused ? 'paused' : 'running';
    if (motion.matches && !contextLost && !disposed) { draw(0); renderer.render(scene, camera); }
    if (!paused) frame = requestAnimationFrame(tick);
  }
  function nudge(event: PointerEvent) {
    if (motion.matches || disposed || contextLost) return;
    const box = host.getBoundingClientRect();
    const x = event.clientX - box.left - width / 2;
    const y = height / 2 - (event.clientY - box.top);
    const press = event.type === 'pointerdown';
    balloons.forEach((balloon) => {
      const dx = balloon.baseX + balloon.x - x;
      const dy = balloon.baseY + balloon.y - y;
      const proximity = Math.max(0, 1 - Math.hypot(dx, dy) / (balloon.radius * 2.5));
      const impulse = proximity * balloon.radius * (press ? 1.3 : .08);
      balloon.vx = THREE.MathUtils.clamp(balloon.vx + Math.sign(dx || 1) * impulse, -balloon.radius, balloon.radius);
      balloon.vy = THREE.MathUtils.clamp(balloon.vy + impulse * .5, -balloon.radius, balloon.radius);
    });
  }
  const resize = new ResizeObserver(layout);
  resize.observe(host);
  resize.observe(title);
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
  intersection.observe(host);
  const state = new MutationObserver(() => {
    if (!departure && root.classList.contains('is-started')) { departure = performance.now(); sync(); }
  });
  state.observe(root, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  root.addEventListener('pointermove', nudge, { passive: true });
  root.addEventListener('pointerdown', nudge, { passive: true });
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    contextLost = true;
    host.classList.remove('is-ready');
    host.dataset.renderer = 'fallback';
    sync();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    layout();
    host.classList.add('is-ready');
    host.dataset.renderer = 'webgl';
    sync();
  });
  function cleanup(event: PageTransitionEvent) {
    if (event.persisted) return;
    disposed = true;
    sync();
    resize.disconnect(); intersection.disconnect(); state.disconnect();
    document.removeEventListener('visibilitychange', sync);
    motion.removeEventListener('change', sync);
    root.removeEventListener('pointermove', nudge);
    root.removeEventListener('pointerdown', nudge);
    window.removeEventListener('pagehide', cleanup);
    balloons.forEach(({ thread }) => thread.dispose());
    materials.forEach((material) => material.dispose());
    shape.dispose(); knot.dispose(); stringMaterial.dispose(); environment.dispose(); renderer.dispose();
  }
  window.addEventListener('pagehide', cleanup);
  host.append(canvas);
  layout();
  host.dataset.renderer = 'webgl';
  host.classList.add('is-ready');
  sync();
}
