import { CAVES, type Game, type Obstacle } from "./model";

type Ctx = CanvasRenderingContext2D;
export type Art = {
  rider: HTMLImageElement;
  props: HTMLImageElement;
  houston: HTMLImageElement;
  hills: HTMLImageElement;
  desert: HTMLImageElement;
  cave: HTMLImageElement;
};
export const clamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n));
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const noise = (n: number) => {
  const f = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return f - Math.floor(f);
};
export async function loadArt(): Promise<Art> {
  const names = {
    rider: "rider-gallop-v2",
    props: "props-v2",
    houston: "houston-v2",
    hills: "hill-country-v2",
    desert: "desert-v2",
    cave: "cave-v2",
  };
  const result = await Promise.all(
    Object.entries(names).map(async ([key, name]) => {
      const image = new Image();
      image.src = `/pierogi-trail/art/${name}.webp`;
      await image.decode();
      return [key, image];
    }),
  );
  return Object.fromEntries(result) as Art;
}
export function backdropWeights(x: number) {
  const hill = smooth(4500, 11500, x),
    desert = smooth(53500, 61000, x);
  return {
    houston: 1 - hill,
    hills: hill * (1 - desert),
    desert: hill * desert,
  };
}
// Fixed world coordinates, mirrored edge-to-edge tiles, and continuous opacity.
// A landmark never disappears because an arbitrary region threshold was crossed.
export function tilePositions(
  camera: number,
  tileWidth: number,
  width: number,
) {
  const first = Math.floor(camera / tileWidth);
  return Array.from({ length: Math.ceil(width / tileWidth) + 2 }, (_, n) => {
    const i = first + n;
    return {
      x: i * tileWidth - camera,
      flipped: Math.abs(i % 2) === 1,
      index: i,
    };
  });
}
function panorama(
  c: Ctx,
  image: HTMLImageElement,
  W: number,
  ground: number,
  camera: number,
  alpha = 1,
) {
  if (alpha <= 0) return;
  const height = Math.ceil(Math.max(ground + 25, W * 0.6)),
    width = Math.ceil((height * image.width) / image.height),
    painted = scaledArtwork(image, width, height);
  c.save();
  c.globalAlpha = alpha;
  for (const tile of tilePositions(camera, width, W)) {
    if (tile.x >= W || tile.x + width <= 0) continue;
    c.save();
    c.translate(tile.x + (tile.flipped ? width : 0), ground - height + 18);
    if (tile.flipped) c.scale(-1, 1);
    c.drawImage(painted, 0, 0, width + 1, height);
    c.restore();
  }
  c.restore();
}
// Resample the paintings once per viewport size, rather than every animation
// frame. Each image retains only its current size, including after rotation.
type Painted = { key: string; canvas: HTMLCanvasElement };
const paintedCache = new WeakMap<HTMLImageElement, Painted>(),
  terrainCache = new WeakMap<HTMLImageElement, Painted>();
function scaledArtwork(
  image: HTMLImageElement,
  width: number,
  height: number,
  sourceY = 0,
  sourceHeight = image.height,
) {
  const key = `${width}/${height}/${sourceY}/${sourceHeight}`,
    cache = sourceY === 0 ? paintedCache : terrainCache,
    cached = cache.get(image);
  if (cached?.key === key) return cached.canvas;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d")!;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image, 0, sourceY, image.width, sourceHeight, 0, 0, width, height,
  );
  cache.set(image, { key, canvas });
  return canvas;
}
function rect(
  c: Ctx,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h));
}
function poly(c: Ctx, color: string, p: number[]) {
  c.fillStyle = color;
  c.beginPath();
  for (let i = 0; i < p.length; i += 2) {
    if (!i) c.moveTo(p[i], p[i + 1]);
    else c.lineTo(p[i], p[i + 1]);
  }
  c.closePath();
  c.fill();
}
function line(c: Ctx, color: string, p: number[], w = 2) {
  c.strokeStyle = color;
  c.lineWidth = w;
  c.beginPath();
  for (let i = 0; i < p.length; i += 2) {
    if (!i) c.moveTo(p[i], p[i + 1]);
    else c.lineTo(p[i], p[i + 1]);
  }
  c.stroke();
}
function text(
  c: Ctx,
  value: string,
  x: number,
  y: number,
  size = 16,
  color = "#fff2cf",
  align: CanvasTextAlign = "center",
) {
  c.save();
  c.textAlign = align;
  c.font = `bold ${size}px Georgia, serif`;
  c.lineJoin = "round";
  c.strokeStyle = "#2e372ce0";
  c.lineWidth = 3;
  c.strokeText(value, x, y);
  c.fillStyle = color;
  c.fillText(value, x, y);
  c.restore();
}
function sign(c: Ctx, x: number, ground: number, label: string, small: string) {
  const w = Math.max(160, label.length * 10);
  rect(c, "#4e3425", x - 64, ground - 107, 8, 109);
  rect(c, "#a57b46", x - 62, ground - 105, 2, 104);
  rect(c, "#4e3425", x + 57, ground - 107, 8, 109);
  rect(c, "#a57b46", x + 59, ground - 105, 2, 104);
  poly(c, "#4b3325", [
    x - w / 2 - 4,
    ground - 143,
    x + w / 2 - 4,
    ground - 143,
    x + w / 2 + 10,
    ground - 129,
    x + w / 2 - 4,
    ground - 80,
    x - w / 2 - 4,
    ground - 80,
  ]);
  rect(c, "#ad7946", x - w / 2, ground - 140, w, 56);
  rect(c, "#d0a065", x - w / 2 + 2, ground - 137, w - 4, 4);
  rect(c, "#775033", x - w / 2, ground - 115, w, 2);
  for (let i = 0; i < 11; i++)
    rect(
      c,
      i % 2 ? "#b7854b" : "#956439",
      x - w / 2 + noise(i) * w,
      ground - 132 + noise(i + 2) * 43,
      15 + noise(i + 5) * 26,
      1,
    );
  text(c, label, x, ground - 116, 15, "#fff0bf");
  text(c, small, x, ground - 94, 10, "#e9d1a1");
}
const PROP_RECTS = [
  [9, 191, 498, 160],
  [534, 140, 452, 278],
  [1030, 156, 496, 244],
  [14, 643, 476, 288],
  [517, 668, 483, 264],
  [1044, 566, 482, 374],
];
function prop(
  c: Ctx,
  art: Art,
  index: number,
  x: number,
  bottom: number,
  width: number,
) {
  const [sx, sy, sw, sh] = PROP_RECTS[index],
    height = (width * sh) / sw;
  c.drawImage(
    art.props,
    sx,
    sy,
    sw,
    sh,
    Math.round(x - width / 2),
    Math.round(bottom - height),
    width,
    height,
  );
}
function pierogi(c: Ctx, art: Art, x: number, y: number, t: number) {
  prop(c, art, 1, x, y + 10 + Math.sin(t) * 2, 34);
}
function obstacle(
  c: Ctx,
  art: Art,
  o: Obstacle,
  x: number,
  ground: number,
  t: number,
) {
  if (o.kind === "creek") {
    poly(c, "#6d5236", [
      x - 65,
      ground,
      x - 46,
      ground + 12,
      x + 40,
      ground + 12,
      x + 66,
      ground,
    ]);
    poly(c, "#3f8481", [
      x - 55,
      ground + 3,
      x - 42,
      ground + 10,
      x + 40,
      ground + 10,
      x + 56,
      ground + 3,
    ]);
    for (let i = 0; i < 11; i++)
      rect(
        c,
        i % 2 ? "#bbd1aa" : "#72b4a4",
        x - 46 + i * 9 + Math.sin(t * 3 + i) * 3,
        ground + 4 + (i % 3) * 2,
        7,
        1,
      );
  } else {
    const frames = { log: 2, hay: 3, rock: 4, cactus: 5 };
    const widths = { log: 80, hay: 72, rock: 77, cactus: 68 };
    prop(c, art, frames[o.kind], x, ground + 2, widths[o.kind]);
  }
}
function starship(c: Ctx, art: Art, W: number, H: number, t: number) {
  const phase = (t + 3) % 29;
  if (phase > 10) return;
  const x = -150 + ((W + 320) * phase) / 10,
    y = Math.max(150, H * 0.21) - phase * 2;
  const exhaust = c.createLinearGradient(x - 180, 0, x - 65, 0);
  exhaust.addColorStop(0, "#fff2c300");
  exhaust.addColorStop(1, "#f9d57a70");
  c.fillStyle = exhaust;
  c.fillRect(x - 180, y - 2, 115, 4);
  prop(c, art, 0, x, y + 22, 145);
}
function groundLayer(
  c: Ctx,
  art: Art,
  W: number,
  H: number,
  ground: number,
  x: number,
  desert: number,
) {
  const source = art.desert;
  // Sample actual painted terrain instead of a broad flat-color floor.
  const tw = 900,
    sy = source.height * 0.82,
    sh = source.height * 0.18,
    terrain = scaledArtwork(source, tw, H - ground + 10, sy, sh);
  for (const tile of tilePositions(x, tw, W)) {
    if (tile.x >= W || tile.x + tw <= 0) continue;
    c.save();
    c.translate(tile.x + (tile.flipped ? tw : 0), ground - 7);
    if (tile.flipped) c.scale(-1, 1);
    c.drawImage(terrain, 0, 0);
    c.restore();
  }
  const shadow = c.createLinearGradient(0, ground, 0, ground + 48);
  shadow.addColorStop(0, "#493b2d60");
  shadow.addColorStop(1, "#493b2d00");
  c.fillStyle = shadow;
  c.fillRect(0, ground, W, 48);
  for (let i = Math.floor(x / 38) - 1; i < (x + W) / 38 + 1; i++) {
    const xx = i * 38 - x,
      n = noise(i);
    if (n > 0.4) {
      const color = desert > 0.5 ? "#c3974b" : "#9da45a";
      line(
        c,
        "#485d34",
        [
          xx - 7,
          ground + 2,
          xx - 4,
          ground - 8,
          xx,
          ground + 1,
          xx + 5,
          ground - 10,
          xx + 7,
          ground,
        ],
        2,
      );
      line(c, color, [xx - 4, ground - 7, xx, ground, xx + 5, ground - 9], 1);
    }
  }
}
function horse(
  c: Ctx,
  image: HTMLImageElement,
  x: number,
  feet: number,
  t: number,
  air: boolean,
  playing: boolean,
  H: number,
) {
  const frame = air ? 5 : playing ? Math.floor(t * 12) % 6 : 2;
  const size = Math.min(245, Math.max(175, H * 0.33));
  const bob = playing && !air ? Math.sin(t * 24) * 2 : 0;
  // Same 512-square atlas cell and fixed saddle anchor throughout the cycle.
  c.drawImage(
    image,
    (frame % 3) * 512,
    Math.floor(frame / 3) * 512,
    512,
    512,
    Math.round(x - size * 0.48),
    Math.round(feet - size * 0.925 + bob),
    size,
    size,
  );
}
export type Message = { title: string; detail?: string; until: number };
export function scene(
  c: Ctx,
  W: number,
  H: number,
  g: Game,
  art: Art,
  message: Message | null,
  reduced: boolean,
) {
  const ground = Math.round(H * (H > W ? 0.81 : 0.84)),
    playerX = Math.min(235, W * 0.23),
    weights = backdropWeights(g.x);
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = "high";
  rect(c, "#278d9b", 0, 0, W, H);
  if (weights.houston > 0)
    panorama(c, art.houston, W, ground, g.x * 0.19, 1);
  if (weights.desert < 1)
    panorama(c, art.hills, W, ground, g.x * 0.19, 1 - weights.houston);
  panorama(c, art.desert, W, ground, g.x * 0.19, weights.desert);
  starship(c, art, W, H, g.time);
  const cv = CAVES.find((cv) => Math.abs(g.x - cv.x) < 1550);
  let caveAlpha = 0;
  if (cv) {
    caveAlpha =
      smooth(cv.x - 1550, cv.x - 700, g.x) *
      (1 - smooth(cv.x + 650, cv.x + 1550, g.x));
    panorama(
      c,
      art.cave,
      W,
      ground,
      (g.x - cv.x) * 0.48 + CAVES.indexOf(cv) * 230,
      caveAlpha,
    );
  }
  groundLayer(c, art, W, H, ground, g.x, weights.desert);
  // Physical signs leave the camera naturally; never culled by region changes.
  const signs = [
    { x: 650, title: "NASA ROAD 1", small: "WEBSTER · TEXAS" },
    { x: 4100, title: "HOUSTON", small: "THE BAYOU CITY" },
    ...CAVES.map((cv) => ({
      x: cv.x - 1100,
      title: cv.short.toUpperCase(),
      small: "TEXAS CAVE TRAIL",
    })),
  ];
  for (const s of signs) {
    const xx = s.x - g.x + playerX;
    if (xx > -250 && xx < W + 250) sign(c, xx, ground - 9, s.title, s.small);
  }
  for (const o of g.obstacles) {
    const xx = o.x - g.x + playerX;
    if (xx > -100 && xx < W + 100) obstacle(c, art, o, xx, ground, g.time);
  }
  for (const p of g.pierogi) {
    const xx = p.x - g.x + playerX;
    if (!p.collected && xx > -25 && xx < W + 25)
      pierogi(c, art, xx, ground - p.y, reduced ? 0 : g.time * 4 + p.x);
  }
  c.save();
  c.globalAlpha = 0.23;
  c.fillStyle = "#262b24";
  c.beginPath();
  c.ellipse(playerX, ground + 5, 75 - g.y * 0.12, 8, 0, 0, 7);
  c.fill();
  c.restore();
  horse(
    c,
    art.rider,
    playerX,
    ground - g.y,
    g.time,
    g.y > 5,
    g.mode === "playing",
    H,
  );
  if (!reduced && g.mode === "playing" && g.y < 5) {
    for (let i = 0; i < 7; i++) {
      const age = (g.time * 3 + i * 0.15) % 1;
      rect(
        c,
        `rgba(223,188,126,${(1 - age) * 0.4})`,
        playerX - 70 - age * 100,
        ground - 5 - age * 18,
        3 + age * 7,
        2 + age * 5,
      );
    }
  }
  if (g.mode === "playing" && g.time < 5) {
    text(
      c,
      "↑  /  SPACE  /  TAP ANYWHERE TO JUMP",
      W / 2,
      H - 26,
      Math.min(17, W / 39),
    );
  }
  if (message && g.time < message.until) {
    const opacity = clamp((message.until - g.time) * 2);
    c.save();
    c.globalAlpha = opacity;
    text(
      c,
      message.title,
      W / 2,
      Math.max(145, H * 0.19),
      Math.min(30, W / 22),
    );
    c.restore();
  }
  if (g.mode === "paused") {
    rect(c, "#172d3c55", 0, 0, W, H);
    text(c, "Trail paused", W / 2, H * 0.43, Math.min(40, W / 14));
    text(
      c,
      "Tap anywhere to keep riding",
      W / 2,
      H * 0.43 + 39,
      Math.min(21, W / 29),
    );
  }
  if (g.mode === "finished") {
    text(
      c,
      "All seven caves. What a ride!",
      W / 2,
      H * 0.35,
      Math.min(42, W / 19),
    );
    text(
      c,
      `${g.count} pierogi in the saddlebag`,
      W / 2,
      H * 0.35 + 44,
      Math.min(25, W / 27),
    );
    text(
      c,
      "Tap anywhere to ride again",
      W / 2,
      H * 0.35 + 85,
      Math.min(19, W / 31),
    );
  }
  return { ground, playerX, caveAlpha, weights };
}
export function loading(c: Ctx, W: number, H: number, failed = false) {
  rect(c, "#263e3d", 0, 0, W, H);
  text(
    c,
    failed ? "The trail could not load. Tap to retry." : "Saddling up…",
    W / 2,
    H / 2,
    Math.min(24, W / 26),
  );
}
