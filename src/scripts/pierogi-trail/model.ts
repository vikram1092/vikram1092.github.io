/** One continuous, forgiving ride. All coordinates are logical canvas pixels. */
export const SPEED = 420;
export const FINISH = 72000;
export const GRAVITY = 1500;
export const JUMP_SPEED = 650;

export const CAVES = [
  {
    id: "inner-space",
    name: "Inner Space Cavern",
    short: "Inner Space",
    place: "Georgetown",
    miles: 150,
    x: 11070,
    color: "#8dc9b7",
    fact: "A hidden world discovered by a highway drilling crew.",
    feature: "columns",
    url: "https://innerspacecavern.com/",
  },
  {
    id: "wonder-world",
    name: "Wonder World Cave",
    short: "Wonder World",
    place: "San Marcos",
    miles: 155,
    x: 20250,
    color: "#dfb88f",
    fact: "A passage through the great Balcones Fault.",
    feature: "fault",
    url: "https://www.wonderworldpark.com/",
  },
  {
    id: "natural-bridge",
    name: "Natural Bridge Caverns",
    short: "Natural Bridge",
    place: "New Braunfels area",
    miles: 179,
    x: 29160,
    color: "#dbb563",
    fact: "A limestone bridge shelters a whole world below.",
    feature: "bridge",
    url: "https://naturalbridgecaverns.com/",
  },
  {
    id: "longhorn",
    name: "Longhorn Cavern",
    short: "Longhorn",
    place: "Burnet",
    miles: 189,
    x: 38070,
    color: "#a5b9cc",
    fact: "Ancient water carved these sweeping limestone halls.",
    feature: "river",
    url: "https://tpwd.texas.gov/state-parks/longhorn-cavern",
  },
  {
    id: "without-a-name",
    name: "Cave Without a Name",
    short: "Without a Name",
    place: "Boerne",
    miles: 195,
    x: 46980,
    color: "#ceaae2",
    fact: "An underground cathedral, too lovely for just one name.",
    feature: "cathedral",
    url: "https://www.cavewithoutaname.com/",
  },
  {
    id: "cascade",
    name: "Cascade Caverns",
    short: "Cascade",
    place: "Boerne",
    miles: 198,
    x: 55890,
    color: "#81bec3",
    fact: "Follow the sparkle to an underground waterfall.",
    feature: "waterfall",
    url: "https://www.cascadecaverns.com/",
  },
  {
    id: "sonora",
    name: "Caverns of Sonora",
    short: "Sonora",
    place: "Sonora",
    miles: 330,
    x: 69660,
    color: "#efb8c3",
    fact: "A glittering finale among delicate crystal formations.",
    feature: "crystals",
    url: "https://www.cavernsofsonora.com/",
  },
] as const;
export type Cave = (typeof CAVES)[number];
export type CaveId = Cave["id"];
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
  for (let x = 2300, i = 0; x < FINISH - 2500; x += 1550 + (i++ % 3) * 165) {
    if (CAVES.some((c) => Math.abs(c.x - x) < 1150)) continue;
    const kind = kinds[i % kinds.length];
    obstacles.push({
      x,
      kind,
      width: kind === "creek" ? 110 : 58,
      height: kind === "creek" ? 10 : kind === "cactus" ? 48 : 35,
      bumped: false,
      cleared: false,
    });
  }
  const pierogi: Pierogi[] = [];
  for (let x = 400; x < FINISH - 140; x += 190) {
    if (!obstacles.some((o) => Math.abs(x - o.x) < 270))
      pierogi.push({ x, y: 64, collected: false });
  }
  for (const o of obstacles) {
    for (let i = 0; i < 5; i++)
      pierogi.push({
        x: o.x - 160 + i * 80,
        y: 85 + Math.sin((i / 4) * Math.PI) * 115,
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
  g.x += SPEED * (g.slow > 0 ? 0.78 : 1) * dt;
  for (const o of g.obstacles) {
    if (
      !o.bumped &&
      !o.cleared &&
      Math.abs(g.x - o.x) < o.width / 2 + 20 &&
      g.y < o.height + 6
    ) {
      o.bumped = true;
      g.bumps++;
      g.slow = 0.32;
      g.grace = 1.1;
      // The horse gently steps over a missed obstacle. No damage, lost food, or reset.
      g.vy = 340;
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
      Math.abs(p.x - g.x) < 65 &&
      Math.abs(p.y - (g.y + 64)) < 78
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
  if (x < 3200) return "Webster · NASA neighborhood";
  if (x < 9000) return "Houston · the bayou city";
  if (x < 29000) return "Bluebonnets & Hill Country";
  if (x < 56000) return "Limestone country";
  return "Westward · the Texas sunset";
}
