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
import { TrailAudio } from "./audio";
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
const audio = new TrailAudio(get<HTMLAudioElement>("trail-music"));
function syncMode() {
  stage.dataset.mode = game.mode;
  redraw = true;
  audio.setMode(game.mode);
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
  audio.restart();
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
  audio.unlock();
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
// Safari needs playback directly in the native touchend/click handler. Pointer
// events alone can leave an apparently running AudioContext inaudible on iPhone.
window.addEventListener("touchend", () => audio.unlock(), { passive: true });
window.addEventListener("click", () => audio.unlock());
window.addEventListener("pointerup", (event) => {
  if (event.isPrimary && event.pointerType !== "mouse") audio.unlock();
});
window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "Space", "KeyW", "Enter"].includes(event.code)) {
    event.preventDefault();
    if (!event.repeat) act();
  } else if (["KeyP", "Escape"].includes(event.code)) {
    event.preventDefault();
    if (event.repeat) return;
    if (game.mode === "playing") pause();
    else { audio.unlock(); resume(); }
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pause();
    audio.setMode("paused");
  }
  last = performance.now();
  accumulator = 0;
});
window.addEventListener("pagehide", () => { pause(); audio.setMode("paused"); });
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
  }
  if (e.type === "land") burst(game.x, 3, "#dfbd7b", 7);
  if (e.type === "bump") {
    burst(game.x, 10, "#e8cc91", 9);
  }
  if (e.type === "cave") {
    const cave = CAVES[e.index!];
    message = { title: cave.name, until: game.time + 3 };
    burst(game.x, 125, "#ffe8b1", 24);
    get("announcement").textContent =
      `${game.visited} of 7 caves: ${cave.name}. ${cave.fact}`;
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
  audio.play(e.type);
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
