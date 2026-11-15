import {
  CAVES,
  FINISH,
  makeGame,
  jump,
  step,
  region,
  type GameEvent,
} from "./model";
import { scene } from "./art";

const get = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const canvas = get<HTMLCanvasElement>("trail");
const ctx = canvas.getContext("2d", { alpha: false });
const stage = get("stage");
const shell = document.querySelector<HTMLElement>(".game-shell")!;
const startButton = get<HTMLButtonElement>("start");
const pauseButton = get<HTMLButtonElement>("pause");
const jumpButton = get<HTMLButtonElement>("jump");
const soundButton = get<HTMLButtonElement>("sound");
const fullscreenButton = get<HTMLButtonElement>("fullscreen");
const routeDialog = get<HTMLDialogElement>("route-dialog");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const score = get("score"),
  caveCount = get("cave-count"),
  regionLabel = get("region");
let game = makeGame();
let W = 768,
  H = 360,
  last = 0,
  accumulator = 0,
  ambient = 0,
  uiTime = 0;
let toastEnd = 0,
  toastPersistent = false,
  dialogWasPlaying = false;
let sound = false,
  audioContext: AudioContext | undefined,
  master: GainNode | undefined;
let nextNote = 0,
  nextHoof = 0,
  noteIndex = 0;
let particles: {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}[] = [];
const melody = [
  293.66, 369.99, 440, 369.99, 493.88, 440, 369.99, 293.66, 246.94, 293.66,
  369.99, 440, 369.99, 293.66, 246.94, 220,
];

function initAudio() {
  try {
    if (!audioContext) {
      const Audio =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Audio) return;
      audioContext = new Audio();
      master = audioContext.createGain();
      master.gain.value = 0.22;
      master.connect(audioContext.destination);
    }
    if (audioContext.state === "suspended")
      void audioContext.resume().catch(() => {});
  } catch {
    sound = false;
    syncSound();
  }
}
function tone(
  freq: number,
  duration: number,
  volume = 0.15,
  type: OscillatorType = "triangle",
  delay = 0,
) {
  if (!sound || !audioContext || !master || audioContext.state !== "running")
    return;
  const time = audioContext.currentTime + delay,
    osc = audioContext.createOscillator(),
    gain = audioContext.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(volume, time + 0.009);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
  osc.connect(gain);
  gain.connect(master);
  osc.start(time);
  osc.stop(time + duration + 0.02);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
}
function syncSound() {
  soundButton.setAttribute("aria-pressed", String(sound));
  soundButton.setAttribute("aria-label", `Turn sound ${sound ? "off" : "on"}`);
  soundButton.querySelector("span")!.textContent = sound
    ? "Sound on"
    : "Sound off";
  soundButton
    .querySelector("path")!
    .setAttribute(
      "d",
      sound
        ? "M11 5 6 9H3v6h3l5 4V5Zm5 3c3 2 3 6 0 8m3-11c5 4 5 10 0 14"
        : "M11 5 6 9H3v6h3l5 4V5Zm5 4 5 6m0-6-5 6",
    );
  if (master && audioContext)
    master.gain.setTargetAtTime(
      sound ? 0.22 : 0,
      audioContext.currentTime,
      0.03,
    );
}
soundButton.addEventListener("click", () => {
  sound = !sound;
  if (sound) {
    initAudio();
    tone(440, 0.2);
  }
  syncSound();
});

function showToast(title: string, detail = "", duration = 3) {
  const toast = get("toast");
  toast.replaceChildren();
  const strong = document.createElement("strong");
  strong.textContent = title;
  toast.append(strong);
  if (detail) {
    const small = document.createElement("span");
    small.textContent = detail;
    toast.append(small);
  }
  toast.classList.add("visible");
  toastEnd = game.time + duration;
  toastPersistent = game.mode !== "playing";
}
function hideToast() {
  get("toast").classList.remove("visible");
  toastPersistent = false;
}
function syncMode() {
  stage.dataset.mode = game.mode;
  get("intro").hidden = game.mode !== "ready";
  get("paused").hidden = game.mode !== "paused";
  get("finish").hidden = game.mode !== "finished";
  jumpButton.hidden = game.mode !== "playing";
  pauseButton.disabled = game.mode === "ready" || game.mode === "finished";
  pauseButton.setAttribute(
    "aria-label",
    game.mode === "paused" ? "Resume ride" : "Pause ride",
  );
  pauseButton.querySelector("span")!.textContent =
    game.mode === "paused" ? "Resume" : "Pause";
  pauseButton
    .querySelector("path")!
    .setAttribute(
      "d",
      game.mode === "paused" ? "m7 4 13 8-13 8V4Z" : "M8 5v14M16 5v14",
    );
  if (game.mode !== "playing") get("jump-cue").hidden = true;
  if (master && audioContext)
    master.gain.setTargetAtTime(
      sound && game.mode !== "paused" ? 0.22 : 0,
      audioContext.currentTime,
      0.05,
    );
}
function updateUI() {
  score.textContent = String(game.count).padStart(3, "0");
  caveCount.textContent = `${game.visited} / 7`;
  regionLabel.textContent = region(game.x);
  get("passport-progress").textContent =
    game.visited === 7
      ? "A PASSPORT FULL OF MEMORIES"
      : game.visited
        ? `${game.visited} STAMPED · ${7 - game.visited} WONDERS AHEAD`
        : "SEVEN LITTLE WONDERS AHEAD";
  document.querySelectorAll<HTMLElement>("[data-cave]").forEach((el, i) => {
    el.classList.toggle("found", i < game.visited);
    el.setAttribute(
      "aria-label",
      `${CAVES[i].name}${i < game.visited ? ", visited" : ", ahead"}`,
    );
  });
  if (game.mode === "playing")
    get("ride-note").textContent =
      `${Math.round((game.x / FINISH) * 100)}% of a lovely little ride`;
  canvas.dataset.distance = String(Math.round(game.x));
  canvas.dataset.height = String(Math.round(game.y));
  canvas.dataset.jumps = String(game.jumps);
  const underground = CAVES.some(
    (c) => game.x > c.x - 180 && game.x < c.x + 350,
  );
  stage.classList.toggle("underground", underground);
  const next = game.obstacles.find(
    (o) => !o.cleared && !o.bumped && o.x > game.x,
  );
  get("jump-cue").hidden = !(
    game.mode === "playing" &&
    next &&
    next.x - game.x < 195 &&
    next.x - game.x > 45 &&
    game.y < 10 &&
    game.jumps < 3
  );
}
function begin() {
  game = makeGame();
  game.mode = "playing";
  particles = [];
  toastEnd = 0;
  accumulator = 0;
  nextNote = 0;
  nextHoof = 0;
  noteIndex = 0;
  hideToast();
  syncMode();
  updateUI();
  if (sound) initAudio();
  canvas.focus({ preventScroll: true });
  showToast(
    "Happy trails!",
    "↑ / Space or tap to jump. Your horse does the galloping.",
    5,
  );
}
function pause() {
  if (game.mode !== "playing") return;
  game.mode = "paused";
  syncMode();
  get("resume").focus({ preventScroll: true });
}
function resume() {
  if (game.mode !== "paused") return;
  game.mode = "playing";
  accumulator = 0;
  last = performance.now();
  syncMode();
  if (sound) initAudio();
  canvas.focus({ preventScroll: true });
}
startButton.addEventListener("click", begin);
get("replay").addEventListener("click", begin);
get("resume").addEventListener("click", resume);
pauseButton.addEventListener("click", () => {
  if (game.mode === "playing") pause();
  else resume();
});
const doJump = () => {
  if (game.mode === "playing") jump(game);
};
canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  canvas.focus({ preventScroll: true });
  doJump();
});
jumpButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  doJump();
});
// Keyboard activation of the touch button still gets exactly one jump.
jumpButton.addEventListener("click", (event) => {
  if (event.detail === 0) doJump();
});
document.addEventListener("keydown", (event) => {
  if (routeDialog.open) return;
  if (event.code === "Escape" || event.code === "KeyP") {
    if (game.mode === "playing") {
      event.preventDefault();
      pause();
    } else if (game.mode === "paused") {
      event.preventDefault();
      resume();
    }
    return;
  }
  if (
    event.code !== "ArrowUp" &&
    event.code !== "Space" &&
    event.code !== "KeyW"
  )
    return;
  const target = event.target as HTMLElement;
  if (target.closest("button,a,input,textarea,select")) return;
  if (game.mode === "playing") {
    event.preventDefault();
    if (!event.repeat) doJump();
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
  last = performance.now();
  accumulator = 0;
});
get("route-info").addEventListener("click", () => {
  dialogWasPlaying = game.mode === "playing";
  if (dialogWasPlaying) pause();
  routeDialog.showModal();
});
get("close-route").addEventListener("click", () => routeDialog.close());
routeDialog.addEventListener("close", () => {
  if (dialogWasPlaying && !document.hidden) resume();
  dialogWasPlaying = false;
});
routeDialog.addEventListener("click", (event) => {
  if (event.target !== routeDialog) return;
  const r = routeDialog.getBoundingClientRect();
  if (
    event.clientX < r.left ||
    event.clientX > r.right ||
    event.clientY < r.top ||
    event.clientY > r.bottom
  )
    routeDialog.close();
});
if (!document.fullscreenEnabled) fullscreenButton.hidden = true;
fullscreenButton.addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await shell.requestFullscreen();
  } catch {
    showToast(
      "Fullscreen is unavailable",
      "You can keep riding right here.",
      3,
    );
  }
});
document.addEventListener("fullscreenchange", () => {
  fullscreenButton.setAttribute(
    "aria-label",
    document.fullscreenElement ? "Exit fullscreen" : "Enter fullscreen",
  );
  resize();
});

function burst(
  x: number,
  y: number,
  colors: string[],
  count: number,
  gentle = false,
) {
  if (reduced.matches) return;
  for (let i = 0; i < count; i++)
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * (gentle ? 35 : 125),
      vy: Math.random() * (gentle ? 30 : 125) + 20,
      life: 0.4 + Math.random() * 0.4,
      color: colors[i % colors.length],
      size: gentle ? 2 : 2 + Math.floor(Math.random() * 3),
    });
}
function event(e: GameEvent) {
  if (e.type === "collect") {
    burst(e.x!, e.y!, ["#fff0af", "#dfb56c", "#f8dd8d"], 4, true);
    tone(659.25, 0.1, 0.085);
  }
  if (e.type === "jump") {
    tone(293.66, 0.09, 0.12);
    tone(440, 0.12, 0.08, "triangle", 0.06);
    burst(game.x, 3, ["#d9c28c", "#b1ab76"], 6, true);
  }
  if (e.type === "land") {
    burst(game.x, 3, ["#d9c28c", "#c2b083"], 6, true);
  }
  if (e.type === "bump") {
    burst(game.x, 12, ["#e9d7a3", "#b3a177"], 7);
    tone(146.83, 0.12, 0.08);
    if (game.bumps < 3)
      showToast(
        "Whoops-a-daisy!",
        "Just a little stumble. Keep your pierogi, keep riding.",
        2.5,
      );
  }
  if (e.type === "clear" && game.clears <= 2)
    showToast("Lovely little leap!", "This horse has excellent manners.", 1.8);
  if (e.type === "cave") {
    const cv = CAVES[e.index!];
    showToast(`${e.index! + 1}/7 · ${cv.name}`, cv.fact, 4.5);
    burst(game.x, 100, ["#f5d789", cv.color, "#ffedc2"], 25);
    [440, 554.37, 659.25, 880].forEach((f, i) =>
      tone(f, 0.3, 0.15, "triangle", i * 0.1),
    );
    updateUI();
  }
  if (e.type === "finish") {
    syncMode();
    updateUI();
    hideToast();
    get("final-pierogi").textContent = String(game.count);
    const seconds = Math.round(game.time);
    get("final-time").textContent =
      `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    get("finish-message").textContent =
      `${game.clears} lovely leaps. A saddlebag of snacks. Texas looks good on you.`;
    get("ride-note").textContent = "Trail complete. Happy horse, happy heart.";
    get("replay").focus({ preventScroll: true });
    [293.66, 369.99, 440, 587.33, 739.99, 880].forEach((f, i) =>
      tone(f, 0.5, 0.14, "triangle", i * 0.12),
    );
  }
}
function resize() {
  const box = stage.getBoundingClientRect();
  W = Math.max(400, Math.round(box.width / 1.55));
  H = Math.round((box.height / box.width) * W);
  canvas.width = W;
  canvas.height = H;
  if (ctx) ctx.imageSmoothingEnabled = false;
}
const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(stage);
resize();
syncMode();
updateUI();
function frame(now: number) {
  if (!ctx) return;
  const dt = Math.min(0.08, Math.max(0, (now - (last || now)) / 1000));
  last = now;
  if (!document.hidden) {
    if (game.mode === "playing") {
      accumulator += dt;
      while (accumulator >= 1 / 120) {
        step(game, 1 / 120);
        for (const e of game.events) event(e);
        accumulator -= 1 / 120;
      }
      if (game.time > nextNote) {
        tone(melody[noteIndex++ % melody.length], 0.32, 0.055);
        if (noteIndex % 4 === 0)
          tone(melody[(noteIndex - 1) % melody.length] / 2, 0.45, 0.04);
        nextNote = game.time + 0.42;
      }
      if (game.time > nextHoof && game.y === 0) {
        tone(85, 0.035, 0.12, "triangle");
        nextHoof = game.time + 0.19;
      }
      if (!toastPersistent && game.time > toastEnd) hideToast();
      uiTime += dt;
      if (uiTime > 0.1) {
        updateUI();
        uiTime = 0;
      }
      for (const p of particles) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy -= 260 * dt;
      }
      particles = particles.filter((p) => p.life > 0);
    } else if (game.mode === "ready" && !reduced.matches) ambient += dt;
    const t = game.mode === "ready" ? ambient : game.time;
    const { ground, playerX } = scene(ctx, W, H, game, t, reduced.matches);
    for (const p of particles) {
      ctx.globalAlpha = Math.min(1, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.fillRect(
        Math.round(p.x - game.x + playerX),
        Math.round(ground - p.y),
        p.size,
        p.size,
      );
    }
    ctx.globalAlpha = 1;
  }
  requestAnimationFrame(frame);
}
if (ctx) requestAnimationFrame(frame);
else {
  startButton.disabled = true;
  startButton.textContent = "Canvas is unavailable";
  get("intro").querySelector("p")!.textContent =
    "Try opening this little adventure in a browser with Canvas support.";
}
