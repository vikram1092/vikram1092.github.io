/** One continuous, forgiving ride. All coordinates are logical canvas pixels. */
export const SPEED = 155;
export const FINISH = 26700;
export const GRAVITY = 1000;
export const JUMP_SPEED = 500;

export const CAVES = [
  {
    name: "Inner Space Cavern",
    short: "Inner Space",
    place: "Georgetown",
    miles: 150,
    x: 4100,
    color: "#8dc9b7",
    fact: "A hidden world discovered by a highway drilling crew.",
    feature: "columns",
    url: "https://innerspacecavern.com/",
  },
  {
    name: "Wonder World Cave",
    short: "Wonder World",
    place: "San Marcos",
    miles: 155,
    x: 7500,
    color: "#dfb88f",
    fact: "A passage through the great Balcones Fault.",
    feature: "fault",
    url: "https://www.wonderworldpark.com/",
  },
  {
    name: "Natural Bridge Caverns",
    short: "Natural Bridge",
    place: "New Braunfels area",
    miles: 179,
    x: 10800,
    color: "#dbb563",
    fact: "A limestone bridge shelters a whole world below.",
    feature: "bridge",
    url: "https://naturalbridgecaverns.com/",
  },
  {
    name: "Longhorn Cavern",
    short: "Longhorn",
    place: "Burnet",
    miles: 189,
    x: 14100,
    color: "#a5b9cc",
    fact: "Ancient water carved these sweeping limestone halls.",
    feature: "river",
    url: "https://tpwd.texas.gov/state-parks/longhorn-cavern",
  },
  {
    name: "Cave Without a Name",
    short: "Without a Name",
    place: "Boerne",
    miles: 195,
    x: 17400,
    color: "#ceaae2",
    fact: "An underground cathedral, too lovely for just one name.",
    feature: "cathedral",
    url: "https://www.cavewithoutaname.com/",
  },
  {
    name: "Cascade Caverns",
    short: "Cascade",
    place: "Boerne",
    miles: 198,
    x: 20700,
    color: "#81bec3",
    fact: "Follow the sparkle to an underground waterfall.",
    feature: "waterfall",
    url: "https://www.cascadecaverns.com/",
  },
  {
    name: "Caverns of Sonora",
    short: "Sonora",
    place: "Sonora",
    miles: 330,
    x: 25800,
    color: "#efb8c3",
    fact: "A glittering finale among delicate crystal formations.",
    feature: "crystals",
    url: "https://www.cavernsofsonora.com/",
  },
] as const;
export type Cave = (typeof CAVES)[number];
export type Obstacle = {
  x: number;
  width: number;
  height: number;
  kind: "log" | "creek" | "rock" | "cactus" | "hay";
  bumped: boolean;
  cleared: boolean;
};
export type Pierogi = { x: number; y: number; collected: boolean };
export type GameEvent = {
  type: "jump" | "land" | "collect" | "bump" | "clear" | "cave" | "finish";
  index?: number;
  x?: number;
  y?: number;
};
export type Game = {
  mode: "ready" | "playing" | "paused" | "finished";
  x: number;
  y: number;
  vy: number;
  time: number;
  count: number;
  visited: number;
  jumps: number;
  clears: number;
  bumps: number;
  slow: number;
  grace: number;
  buffer: number;
  obstacles: Obstacle[];
  pierogi: Pierogi[];
  events: GameEvent[];
};
export function makeGame(): Game {
  const obstacles: Obstacle[] = [];
  const kinds: Obstacle["kind"][] = ["log", "creek", "hay", "rock", "cactus"];
  for (let x = 1450, i = 0; x < FINISH - 1200; x += 640 + (i++ % 3) * 95) {
    if (CAVES.some((c) => Math.abs(c.x - x) < 470)) continue;
    const kind = kinds[i % kinds.length];
    obstacles.push({
      x,
      kind,
      width: kind === "creek" ? 76 : 38,
      height: kind === "creek" ? 9 : kind === "cactus" ? 35 : 25,
      bumped: false,
      cleared: false,
    });
  }
  const pierogi: Pierogi[] = [];
  for (let x = 320; x < FINISH - 140; x += 115) {
    if (!obstacles.some((o) => Math.abs(x - o.x) < 175))
      pierogi.push({ x, y: 42, collected: false });
  }
  for (const o of obstacles) {
    for (let i = 0; i < 5; i++)
      pierogi.push({
        x: o.x - 100 + i * 48,
        y: 65 + Math.sin((i / 4) * Math.PI) * 90,
        collected: false,
      });
  }
  pierogi.sort((a, b) => a.x - b.x);
  return {
    mode: "ready",
    x: 0,
    y: 0,
    vy: 0,
    time: 0,
    count: 0,
    visited: 0,
    jumps: 0,
    clears: 0,
    bumps: 0,
    slow: 0,
    grace: 0,
    buffer: 0,
    obstacles,
    pierogi,
    events: [],
  };
}
export function jump(g: Game) {
  if (g.mode === "playing") g.buffer = 0.18;
}
export function step(g: Game, dt: number) {
  g.events.length = 0;
  if (g.mode !== "playing") return;
  g.time += dt;
  g.buffer = Math.max(0, g.buffer - dt);
  g.slow = Math.max(0, g.slow - dt);
  g.grace = Math.max(0, g.grace - dt);
  if (g.buffer > 0 && g.y <= 0) {
    g.vy = JUMP_SPEED;
    g.buffer = 0;
    g.jumps++;
    g.events.push({ type: "jump" });
  }
  const wasAirborne = g.y > 0;
  g.vy -= GRAVITY * dt;
  g.y = Math.max(0, g.y + g.vy * dt);
  if (g.y === 0) {
    if (wasAirborne) g.events.push({ type: "land" });
    g.vy = 0;
  }
  g.x += SPEED * (g.slow > 0 ? 0.52 : 1) * dt;
  for (const o of g.obstacles) {
    if (
      !o.bumped &&
      !o.cleared &&
      Math.abs(g.x - o.x) < o.width / 2 + 20 &&
      g.y < o.height + 6
    ) {
      o.bumped = true;
      g.bumps++;
      g.slow = 0.65;
      g.grace = 1.1;
      // The horse gently steps over a missed obstacle. No damage, lost food, or reset.
      g.vy = 260;
      g.y = Math.max(g.y, 8);
      g.events.push({ type: "bump" });
    }
    if (!o.cleared && g.x > o.x + o.width / 2 + 25) {
      o.cleared = true;
      if (!o.bumped) {
        g.clears++;
        g.events.push({ type: "clear" });
      }
    }
  }
  for (const p of g.pierogi) {
    if (
      !p.collected &&
      Math.abs(p.x - g.x) < 48 &&
      Math.abs(p.y - (g.y + 43)) < 62
    ) {
      p.collected = true;
      g.count++;
      g.events.push({ type: "collect", x: p.x, y: p.y });
    }
  }
  if (g.visited < CAVES.length && g.x >= CAVES[g.visited].x) {
    g.events.push({ type: "cave", index: g.visited });
    g.visited++;
  }
  if (g.x >= FINISH) {
    g.x = FINISH;
    g.mode = "finished";
    g.events.push({ type: "finish" });
  }
}

export function region(x: number): string {
  if (x < 1250) return "Webster · NASA neighborhood";
  if (x < 3100) return "Houston · the bayou city";
  if (x < 10000) return "Bluebonnets & Hill Country";
  if (x < 21000) return "Limestone country";
  return "Westward · the Texas sunset";
}
