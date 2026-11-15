import {
  CAVES,
  FINISH,
  makeGame,
  jump,
  step,
  region,
  type GameEvent,
} from "./model";
import { scene, loading, loadArt, type Art, type Message } from "./art";
const get = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const canvas = get<HTMLCanvasElement>("trail"),
  stage = get("stage");
const ctx = canvas.getContext("2d", { alpha: false });
let game = makeGame(),
  art: Art | undefined,
  failed = false,
  loadingAssets = false,
  pendingJump = false;
let W = 960,
  H = 600,
  last = 0,
  accumulator = 0,
  uiTime = 0,
  finishAt = 0;
let message: Message | null = null,
  redraw = true;
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let particles: {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}[] = [];
let sound = false,
  audioContext: AudioContext | undefined,
  master: GainNode | undefined;
function initAudio() {
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
      master = audioContext.createGain();
      master.gain.value = 0.13;
      master.connect(audioContext.destination);
    }
    if (audioContext.state === "suspended")
      void audioContext.resume().catch(() => {});
  } catch {
    sound = false;
  }
}
function tone(frequency: number, duration: number, delay = 0) {
  if (!sound || !audioContext || !master) return;
  const osc = audioContext.createOscillator(),
    gain = audioContext.createGain(),
    t = audioContext.currentTime + delay;
  osc.type = "triangle";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.17, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t);
  osc.stop(t + duration + 0.02);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
}
function syncMode() {
  stage.dataset.mode = game.mode;
  redraw = true;
  if (master && audioContext)
    master.gain.setTargetAtTime(
      sound && game.mode === "playing" ? 0.13 : 0,
      audioContext.currentTime,
      0.04,
    );
}
function updateUI() {
  get("score").textContent = String(game.count);
  get("cave-count").textContent = `${game.visited} / 7`;
  get("region").textContent = region(game.x);
  get("progress").style.width = `${(game.x / FINISH) * 100}%`;
  document.querySelectorAll<HTMLElement>("[data-cave]").forEach((el, i) => {
    el.classList.toggle("found", i < game.visited);
    el.classList.toggle("next", i === game.visited);
    el.setAttribute(
      "aria-label",
      `${CAVES[i].name}, ${i < game.visited ? "visited" : "ahead"}`,
    );
  });
  canvas.dataset.distance = String(Math.round(game.x));
  canvas.dataset.height = String(Math.round(game.y));
  canvas.dataset.jumps = String(game.jumps);
}
function begin() {
  game = makeGame();
  game.mode = document.hidden ? "paused" : "playing";
  accumulator = 0;
  particles = [];
  message = null;
  syncMode();
  updateUI();
  get("announcement").textContent =
    "The ride has started. Tap anywhere or press Arrow Up to jump.";
}
function pause() {
  if (game.mode !== "playing") return;
  game.mode = "paused";
  syncMode();
  get("announcement").textContent = "Ride paused. Tap anywhere to resume.";
}
function resume() {
  if (game.mode !== "paused") return;
  game.mode = "playing";
  accumulator = 0;
  last = performance.now();
  syncMode();
  if (sound) initAudio();
}
async function prepare() {
  if (loadingAssets) return;
  loadingAssets = true;
  failed = false;
  stage.dataset.assets = "loading";
  redraw = true;
  try {
    art = await loadArt();
    stage.dataset.assets = "ready";
    begin();
    if (pendingJump) {
      jump(game);
      pendingJump = false;
    }
  } catch {
    failed = true;
    stage.dataset.assets = "error";
    get("announcement").textContent =
      "Game art could not load. Tap anywhere to retry.";
  } finally {
    loadingAssets = false;
    redraw = true;
  }
}
function act() {
  if (failed) {
    void prepare();
    return;
  }
  if (!art) {
    pendingJump = true;
    return;
  }
  if (game.mode === "paused") {
    resume();
    return;
  }
  if (game.mode === "finished") {
    if (performance.now() - finishAt > 650) begin();
    return;
  }
  jump(game);
}
// The complete viewport is the input surface, including the read-only cave tracker.
window.addEventListener(
  "pointerdown",
  (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    act();
  },
  { passive: false },
);
window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "Space", "KeyW", "Enter"].includes(event.code)) {
    event.preventDefault();
    if (!event.repeat) act();
  } else if (["KeyP", "Escape"].includes(event.code)) {
    event.preventDefault();
    if (game.mode === "playing") pause();
    else resume();
  } else if (event.code === "KeyM") {
    sound = !sound;
    if (sound) initAudio();
    syncMode();
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
  last = performance.now();
  accumulator = 0;
});
reduced.addEventListener("change", () => {
  redraw = true;
});
function burst(x: number, y: number, color: string, count: number) {
  if (reduced.matches) return;
  for (let i = 0; i < count; i++)
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 170,
      vy: 40 + Math.random() * 160,
      life: 0.4 + Math.random() * 0.4,
      color,
    });
}
function handle(e: GameEvent) {
  if (e.type === "collect") {
    burst(e.x!, e.y!, "#ffe0a0", 4);
    tone(740, 0.09);
  }
  if (e.type === "jump") {
    tone(330, 0.09);
    tone(490, 0.12, 0.05);
  }
  if (e.type === "land") burst(game.x, 3, "#dfbd7b", 7);
  if (e.type === "bump") {
    burst(game.x, 10, "#e8cc91", 9);
    tone(165, 0.1);
  }
  if (e.type === "cave") {
    const cave = CAVES[e.index!];
    message = { title: cave.name, until: game.time + 3 };
    burst(game.x, 125, "#ffe8b1", 24);
    get("announcement").textContent =
      `${game.visited} of 7 caves: ${cave.name}. ${cave.fact}`;
    [440, 554, 659, 880].forEach((n, i) => tone(n, 0.25, i * 0.08));
    updateUI();
  }
  if (e.type === "finish") {
    finishAt = performance.now();
    message = null;
    syncMode();
    updateUI();
    get("announcement").textContent =
      `All seven caves explored, with ${game.count} pierogi. Tap anywhere to ride again.`;
  }
}
function resize() {
  const box = stage.getBoundingClientRect();
  W = Math.min(1700, Math.max(680, Math.round(box.width * 0.9)));
  H = Math.round((box.height / box.width) * W);
  if (H < 450) {
    H = 450;
    W = Math.round((H * box.width) / box.height);
  }
  canvas.width = W;
  canvas.height = H;
  redraw = true;
}
new ResizeObserver(resize).observe(stage);
resize();
syncMode();
updateUI();
function frame(now: number) {
  if (!ctx) return;
  const dt = Math.min(0.08, Math.max(0, (now - (last || now)) / 1000));
  last = now;
  if (!document.hidden) {
    if (art && game.mode === "playing") {
      accumulator += dt;
      while (accumulator >= 1 / 120) {
        step(game, 1 / 120);
        for (const e of game.events) handle(e);
        accumulator -= 1 / 120;
      }
      uiTime += dt;
      if (uiTime > 0.09) {
        updateUI();
        uiTime = 0;
      }
      for (const p of particles) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy -= 330 * dt;
      }
      particles = particles.filter((p) => p.life > 0);
      redraw = true;
    }
    if (redraw) {
      if (art) {
        const { ground, playerX } = scene(
          ctx,
          W,
          H,
          game,
          art,
          message,
          reduced.matches,
        );
        for (const p of particles) {
          ctx.globalAlpha = Math.min(1, p.life * 2);
          ctx.fillStyle = p.color;
          ctx.fillRect(
            Math.round(p.x - game.x + playerX),
            Math.round(ground - p.y),
            3,
            3,
          );
        }
        ctx.globalAlpha = 1;
      } else loading(ctx, W, H, failed);
      redraw = false;
    }
  }
  requestAnimationFrame(frame);
}
if (ctx) {
  void prepare();
  requestAnimationFrame(frame);
} else
  get("announcement").textContent = "This browser cannot display the game.";
