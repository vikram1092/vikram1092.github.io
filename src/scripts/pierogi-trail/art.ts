import { CAVES, type Game, type Cave, type Obstacle } from "./model";

type Ctx = CanvasRenderingContext2D;
export const clamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const noise = (n: number) => {
  const a = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return a - Math.floor(a);
};
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
function poly(c: Ctx, color: string, points: number[]) {
  c.fillStyle = color;
  c.beginPath();
  for (let i = 0; i < points.length; i += 2) {
    if (!i) c.moveTo(Math.round(points[i]), Math.round(points[i + 1]));
    else c.lineTo(Math.round(points[i]), Math.round(points[i + 1]));
  }
  c.closePath();
  c.fill();
}
function line(c: Ctx, color: string, points: number[], width = 2) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineJoin = "miter";
  c.beginPath();
  for (let i = 0; i < points.length; i += 2) {
    if (!i) c.moveTo(Math.round(points[i]), Math.round(points[i + 1]));
    else c.lineTo(Math.round(points[i]), Math.round(points[i + 1]));
  }
  c.stroke();
}
function label(
  c: Ctx,
  text: string,
  x: number,
  y: number,
  color: string,
  size = 8,
) {
  c.fillStyle = color;
  c.font = `bold ${size}px monospace`;
  c.textAlign = "center";
  c.fillText(text, Math.round(x), Math.round(y));
}
function mix(a: string, b: string, t: number) {
  const aa = parseInt(a.slice(1), 16),
    bb = parseInt(b.slice(1), 16);
  const rgb = [16, 8, 0].map((s) =>
    Math.round(((aa >> s) & 255) * (1 - t) + ((bb >> s) & 255) * t),
  );
  return `rgb(${rgb.join(",")})`;
}
function cloud(c: Ctx, x: number, y: number, s: number) {
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.scale(s, s);
  rect(c, "#e6e9d9", 0, 8, 65, 13);
  rect(c, "#f7f3de", 8, 2, 44, 17);
  rect(c, "#f7f3de", 18, -4, 18, 6);
  rect(c, "#fffae8", 19, -4, 16, 3);
  rect(c, "#f7f3de", -8, 13, 15, 6);
  c.restore();
}
function tree(c: Ctx, x: number, y: number, s = 1, dry = false) {
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.scale(s, s);
  poly(
    c,
    "#766547",
    [
      -5, 0, -4, -39, -17, -52, -13, -56, 1, -44, 13, -58, 16, -55, 5, -35, 5,
      0,
    ],
  );
  const dark = dry ? "#76835c" : "#4d7961",
    light = dry ? "#a2a875" : "#799b70";
  rect(c, dark, -32, -57, 60, 20);
  rect(c, dark, -22, -67, 43, 13);
  rect(c, dark, -39, -51, 76, 10);
  rect(c, light, -26, -59, 24, 11);
  rect(c, light, -17, -67, 25, 8);
  rect(c, light, 11, -58, 17, 9);
  rect(c, "#96b27b", -31, -51, 13, 5);
  c.restore();
}
function cactus(c: Ctx, x: number, y: number, s = 1) {
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.scale(s, s);
  rect(c, "#45664b", -3, -25, 7, 25);
  rect(c, "#45664b", -12, -24, 9, 14);
  rect(c, "#45664b", 5, -34, 10, 18);
  rect(c, "#45664b", -9, -34, 8, 13);
  rect(c, "#789060", -10, -25, 5, 10);
  rect(c, "#8da66d", -7, -33, 4, 10);
  rect(c, "#88a16b", 7, -33, 5, 14);
  rect(c, "#718d5a", -1, -24, 3, 21);
  rect(c, "#c88a67", 8, -37, 3, 4);
  rect(c, "#dab691", -6, -36, 3, 4);
  rect(c, "#d3d4a1", 8, -28, 1, 2);
  rect(c, "#cbd19c", -6, -21, 1, 2);
  c.restore();
}
function windmill(c: Ctx, x: number, y: number, t: number) {
  line(c, "#6b765b", [x - 15, y, x, y - 98, x + 15, y], 3);
  line(
    c,
    "#7a8061",
    [x - 10, y - 28, x + 10, y - 28, x - 6, y - 56, x + 6, y - 56],
    2,
  );
  c.save();
  c.translate(Math.round(x), Math.round(y - 97));
  c.rotate(t * 0.4);
  for (let i = 0; i < 8; i++) {
    c.rotate(Math.PI / 4);
    poly(c, "#d5d2b0", [3, -2, 20, -7, 24, 0, 5, 3]);
    line(c, "#6b765b", [0, 0, 24, 0], 1);
  }
  c.restore();
  rect(c, "#5c6b52", x - 3, y - 100, 6, 6);
}
function nasa(c: Ctx, x: number, y: number) {
  rect(c, "#8b9b86", x + 23, y - 33, 165, 33);
  rect(c, "#d4d5b6", x + 13, y - 40, 180, 9);
  rect(c, "#e5e0c4", x + 25, y - 31, 161, 24);
  for (let i = 0; i < 10; i++)
    rect(c, "#6e9691", x + 30 + i * 15, y - 28, 9, 15);
  rect(c, "#809b91", x + 140, y - 52, 48, 11);
  label(c, "JOHNSON SPACE CENTER", x + 102, y - 43, "#355d56", 6);
  // Saturn V in the rocket garden, with its familiar black roll pattern.
  rect(c, "#f7f0d5", x + 52, y - 117, 13, 73);
  poly(c, "#f9f3dd", [x + 52, y - 117, x + 58, y - 131, x + 65, y - 117]);
  rect(c, "#d8d7c4", x + 60, y - 117, 5, 73);
  rect(c, "#475b54", x + 52, y - 104, 13, 9);
  rect(c, "#475b54", x + 52, y - 66, 13, 8);
  rect(c, "#475b54", x + 57, y - 92, 4, 19);
  poly(c, "#f9f2dc", [x + 52, y - 57, x + 45, y - 43, x + 52, y - 43]);
  poly(c, "#e1dfc8", [x + 65, y - 57, x + 71, y - 43, x + 65, y - 43]);
  // Neighborhood water tower and homes.
  line(c, "#8b9c83", [x - 48, y, x - 44, y - 72, x - 20, y - 72, x - 15, y], 3);
  rect(c, "#e1dfc1", x - 51, y - 89, 36, 21);
  rect(c, "#f1e8ca", x - 47, y - 94, 28, 7);
  label(c, "WEBSTER", x - 33, y - 77, "#547767", 6);
  rect(c, "#7a8e71", x - 92, y - 36, 74, 21);
  rect(c, "#e0e2bc", x - 89, y - 33, 68, 15);
  label(c, "NASA ROAD 1", x - 55, y - 23, "#3f6558", 7);
  rect(c, "#7d8264", x - 86, y - 15, 3, 15);
  rect(c, "#7d8264", x - 26, y - 15, 3, 15);
}
function skyline(c: Ctx, x: number, y: number) {
  const heights = [51, 74, 43, 113, 65, 92, 142, 87, 58, 117, 68, 47];
  for (let i = 0; i < heights.length; i++) {
    const bx = x + i * 33,
      h = heights[i];
    rect(c, i % 3 === 0 ? "#658e87" : "#7b9e91", bx, y - h, 28, h);
    if (i === 6) {
      poly(c, "#aac0aa", [bx, y - h, bx + 14, y - h - 14, bx + 28, y - h]);
      rect(c, "#547f78", bx + 20, y - h, 5, h);
    }
    if (i === 3)
      poly(c, "#8ba995", [bx, y - h, bx + 28, y - h - 22, bx + 28, y - h]);
    if (i === 9) {
      rect(c, "#668d80", bx + 3, y - h - 8, 22, 8);
      rect(c, "#668d80", bx + 8, y - h - 16, 12, 8);
    }
    for (let row = 8; row < h - 5; row += 10)
      for (let col = 5; col < 24; col += 8)
        rect(
          c,
          (row + col) % 3 === 0 ? "#d9d5a8" : "#9eb8a2",
          bx + col,
          y - h + row,
          3,
          4,
        );
  }
  rect(c, "#96ab8a", x - 13, y - 10, 430, 10);
}
export function pierogi(c: Ctx, x: number, y: number, t = 0, scale = 1) {
  c.save();
  c.translate(Math.round(x), Math.round(y + Math.sin(t) * 2));
  c.scale(scale, scale);
  poly(
    c,
    "#9a6c37",
    [-9, -3, -6, -6, 5, -6, 9, -3, 11, 1, 8, 5, 4, 7, -5, 7, -10, 3, -11, 0],
  );
  poly(
    c,
    "#f6cf7b",
    [-8, -2, -5, -4, 5, -4, 8, -2, 9, 1, 6, 4, 2, 5, -5, 4, -8, 2],
  );
  rect(c, "#fff0b8", -5, -3, 10, 3);
  rect(c, "#ffe7a3", -8, 0, 3, 2);
  rect(c, "#fff0b8", -4, 2, 2, 2);
  rect(c, "#fff0b8", 1, 3, 2, 2);
  rect(c, "#fff0b8", 6, 0, 2, 2);
  c.restore();
}
export function rider(
  c: Ctx,
  x: number,
  feet: number,
  t: number,
  airborne: boolean,
  running = true,
) {
  const p = running ? t * 12 : 0,
    bob = airborne ? 0 : Math.sin(p * 2) * 1.2;
  c.save();
  c.translate(Math.round(x - 51), Math.round(feet - 102 + bob));
  c.scale(2, 2);
  // Tail and the two far legs, drawn before the horse's body.
  poly(c, "#533e32", [
    11,
    31,
    5,
    30,
    1,
    33,
    -2 + Math.sin(p) * 2,
    42,
    3,
    43,
    5,
    37,
    12,
    36,
  ]);
  const leg = (hip: number, phase: number, far: boolean) => {
    const swing = airborne ? (hip > 30 ? -8 : 7) : Math.sin(p + phase) * 7;
    const knee = airborne ? 45 : 46 - Math.max(0, Math.cos(p + phase)) * 3;
    line(
      c,
      far ? "#745035" : "#513c30",
      [hip, 38, hip + swing * 0.6, knee, hip + swing, 50 - bob / 2],
      4,
    );
    line(c, far ? "#ad7947" : "#c88a50", [hip, 38, hip + swing * 0.6, knee], 2);
    rect(c, "#342f2b", hip + swing - 2, 49 - bob / 2, 5, 2);
  };
  leg(15, Math.PI, true);
  leg(38, 0, true);
  poly(
    c,
    "#563e2e",
    [
      10, 29, 18, 27, 37, 27, 43, 22, 45, 16, 51, 16, 54, 21, 59, 23, 59, 29,
      54, 31, 47, 29, 45, 37, 39, 42, 16, 42, 10, 38,
    ],
  );
  poly(
    c,
    "#b77b45",
    [
      11, 31, 20, 29, 38, 29, 45, 24, 46, 19, 50, 18, 52, 23, 57, 25, 57, 28,
      51, 28, 46, 27, 44, 36, 37, 40, 17, 40, 12, 37,
    ],
  );
  poly(c, "#cf9759", [12, 31, 20, 29, 37, 29, 39, 32, 33, 36, 17, 36, 12, 34]);
  poly(c, "#dca866", [44, 26, 47, 20, 50, 19, 51, 23, 49, 25, 46, 32, 43, 35]);
  rect(c, "#9b613c", 17, 38, 20, 2);
  // Ears, mane, white blaze, muzzle, and a bright pixel eye.
  poly(c, "#553e31", [45, 18, 45, 12, 48, 14, 49, 18, 51, 13, 53, 13, 52, 21]);
  poly(c, "#694330", [44, 18, 42, 23, 41, 29, 38, 32, 42, 32, 46, 23, 47, 19]);
  poly(c, "#fff1cc", [51, 22, 54, 24, 55, 27, 52, 28, 51, 26]);
  rect(c, "#2c3430", 51, 21, 2, 2);
  rect(c, "#e4b67a", 52, 21, 1, 1);
  rect(c, "#6d4a34", 56, 27, 2, 1);
  leg(17, 0, false);
  leg(37, Math.PI, false);
  // Woven green saddle blanket, stitched edging, leather saddle and stirrup.
  rect(c, "#304e43", 20, 29, 16, 8);
  rect(c, "#78977a", 21, 30, 14, 4);
  rect(c, "#dfc18a", 22, 35, 12, 1);
  rect(c, "#d0a562", 24, 31, 2, 2);
  rect(c, "#d0a562", 30, 31, 2, 2);
  rect(c, "#6a432f", 19, 27, 17, 3);
  rect(c, "#8c6040", 20, 26, 14, 2);
  rect(c, "#583e2c", 33, 24, 2, 4);
  // Rider: loose dark-green jacket and long golden-blonde hair from the photo.
  poly(c, "#263f36", [24, 16, 30, 15, 34, 18, 34, 26, 30, 29, 23, 27, 22, 22]);
  poly(c, "#416553", [25, 17, 30, 17, 31, 25, 24, 25]);
  rect(c, "#4c725d", 24, 19, 2, 5);
  poly(c, "#27413b", [27, 27, 35, 28, 34, 33, 30, 37, 27, 36, 29, 31, 25, 31]);
  rect(c, "#3d302b", 27, 35, 4, 5);
  rect(c, "#3d302b", 29, 38, 5, 2);
  line(c, "#c7ae71", [32, 32, 32, 39, 27, 39], 1);
  poly(
    c,
    "#a77d4d",
    [23, 3, 29, 2, 34, 4, 36, 10, 33, 18, 23, 22, 18, 20, 20, 11, 20, 7],
  );
  poly(
    c,
    "#d4af73",
    [23, 5, 28, 3, 32, 4, 34, 7, 32, 12, 30, 17, 24, 21, 20, 20, 23, 12],
  );
  poly(
    c,
    "#efcb94",
    [27, 6, 33, 6, 34, 9, 36, 10, 34, 12, 33, 15, 29, 15, 26, 12],
  );
  rect(c, "#dba275", 29, 13, 4, 3);
  rect(c, "#4b4d39", 32, 9, 1, 1);
  rect(c, "#a86851", 32, 12, 2, 1);
  rect(c, "#fff0c6", 32, 12, 1, 1);
  poly(c, "#b28a51", [
    22,
    5,
    27,
    3,
    31,
    4,
    34,
    6,
    28,
    6,
    26,
    9,
    25,
    17,
    21,
    22,
    18 + Math.sin(p) * 2,
    21,
    21,
    16,
  ]);
  line(c, "#e5c584", [24, 6, 23, 11, 24, 15, 21, 20], 1);
  line(c, "#e9cd91", [26, 6, 25, 11, 26, 16, 23, 19], 1);
  // Sleeve, hand and reins keep the rider visibly connected to her horse.
  poly(c, "#315044", [31, 18, 34, 19, 36, 23, 41, 23, 41, 25, 34, 25, 31, 22]);
  rect(c, "#e6b88b", 40, 23, 3, 2);
  line(c, "#493c2e", [42, 24, 47, 28, 56, 26], 1);
  line(c, "#ddd0a3", [54, 24, 54, 29], 1);
  c.restore();
}

function obstacle(c: Ctx, o: Obstacle, x: number, y: number, t: number) {
  if (o.kind === "creek") {
    poly(c, "#696d50", [x - 44, y, x - 32, y + 9, x + 31, y + 9, x + 44, y]);
    rect(c, "#73afa9", x - 36, y + 2, 72, 5);
    for (let i = 0; i < 5; i++)
      rect(
        c,
        "#c0e0cf",
        x - 31 + i * 13 + Math.sin(t * 2 + i) * 2,
        y + 3 + (i % 2) * 2,
        7,
        1,
      );
  } else if (o.kind === "log") {
    rect(c, "#503e2d", x - 24, y - 23, 47, 24);
    rect(c, "#8f633c", x - 22, y - 21, 43, 19);
    rect(c, "#bc8e53", x - 23, y - 19, 9, 15);
    rect(c, "#e0bb7a", x - 22, y - 16, 6, 9);
    rect(c, "#997046", x - 21, y - 14, 3, 5);
    rect(c, "#ab7b45", x - 12, y - 19, 31, 3);
    rect(c, "#66482e", x - 12, y - 9, 29, 2);
    rect(c, "#ce9e60", x - 4, y - 15, 14, 2);
    poly(c, "#6d5034", [
      x + 9,
      y - 23,
      x + 15,
      y - 30,
      x + 18,
      y - 28,
      x + 15,
      y - 22,
    ]);
  } else if (o.kind === "hay") {
    rect(c, "#9e7f3d", x - 21, y - 26, 42, 26);
    rect(c, "#d8b461", x - 19, y - 24, 38, 22);
    rect(c, "#efd28a", x - 18, y - 23, 36, 5);
    for (let i = 0; i < 4; i++)
      rect(c, "#bd954a", x - 17, y - 17 + i * 4, 34, 1);
    rect(c, "#7b7349", x - 11, y - 25, 3, 25);
    rect(c, "#7b7349", x + 8, y - 25, 3, 25);
  } else if (o.kind === "rock") {
    poly(c, "#796e53", [
      x - 24,
      y,
      x - 20,
      y - 14,
      x - 10,
      y - 24,
      x + 12,
      y - 25,
      x + 24,
      y - 10,
      x + 24,
      y,
    ]);
    poly(c, "#b6ac86", [
      x - 18,
      y - 13,
      x - 9,
      y - 22,
      x + 11,
      y - 23,
      x + 19,
      y - 13,
      x + 1,
      y - 8,
    ]);
    poly(c, "#d3c8a1", [
      x - 17,
      y - 14,
      x - 8,
      y - 21,
      x + 9,
      y - 22,
      x + 2,
      y - 16,
    ]);
    rect(c, "#918568", x - 8, y - 7, 15, 3);
  } else cactus(c, x, y, 1.05);
}
function cave(
  c: Ctx,
  cv: Cave,
  x: number,
  ground: number,
  H: number,
  t: number,
) {
  const width = 690,
    top = 25;
  poly(c, "#8c8970", [
    x - 60,
    ground,
    x - 40,
    ground - 70,
    x - 15,
    ground - 110,
    x + 15,
    top + 25,
    x + 65,
    top,
    x + width - 80,
    top,
    x + width - 15,
    top + 33,
    x + width + 25,
    ground - 60,
    x + width + 40,
    ground,
  ]);
  poly(c, "#b4a686", [
    x - 28,
    ground,
    x - 5,
    ground - 105,
    x + 37,
    top + 38,
    x + 77,
    top + 14,
    x + width - 90,
    top + 14,
    x + width - 32,
    top + 48,
    x + width + 9,
    ground,
    x + width - 30,
    ground,
    x + width - 68,
    top + 69,
    x + 80,
    top + 65,
    x + 39,
    ground,
  ]);
  poly(c, "#374b48", [
    x + 34,
    ground,
    x + 50,
    ground - 129,
    x + 91,
    top + 59,
    x + width - 95,
    top + 59,
    x + width - 50,
    ground - 120,
    x + width - 32,
    ground,
  ]);
  poly(c, "#253e3c", [
    x + 66,
    ground,
    x + 90,
    top + 89,
    x + width - 115,
    top + 89,
    x + width - 66,
    ground,
  ]);
  rect(c, "#42615a", x + 98, ground - 15, width - 218, 15);
  for (let i = 0; i < 13; i++) {
    const xx = x + 80 + i * 41,
      l = 20 + noise(i + cv.x) * 70;
    poly(c, "#637d69", [
      xx,
      top + 60,
      xx + 23,
      top + 60,
      xx + 12,
      top + 60 + l,
    ]);
    poly(c, cv.color, [
      xx + 1,
      top + 61,
      xx + 8,
      top + 61,
      xx + 12,
      top + 56 + l,
    ]);
    const h = 18 + noise(i * 2 + cv.x) * 34;
    poly(c, "#56745e", [xx + 8, ground, xx + 20, ground - h, xx + 33, ground]);
    line(c, cv.color, [xx + 20, ground - h, xx + 25, ground - 4], 2);
  }
  if (cv.feature === "columns" || cv.feature === "cathedral")
    for (let i = 0; i < 3; i++) {
      const xx = x + 160 + i * 150;
      poly(c, "#688471", [
        xx - 14,
        top + 59,
        xx + 13,
        top + 59,
        xx + 3,
        ground - 59,
        xx + 18,
        ground,
        xx - 20,
        ground,
        xx - 4,
        ground - 65,
      ]);
      line(
        c,
        cv.color,
        [xx - 5, top + 62, xx - 1, ground - 60, xx - 9, ground],
        3,
      );
    }
  if (cv.feature === "fault")
    poly(c, "#172f30", [
      x + 230,
      top + 60,
      x + 275,
      top + 60,
      x + 230,
      top + 115,
      x + 290,
      top + 178,
      x + 238,
      ground,
      x + 214,
      ground,
      x + 267,
      top + 178,
      x + 212,
      top + 113,
    ]);
  if (cv.feature === "bridge") {
    rect(c, "#bbae87", x + 40, top + 36, width - 90, 18);
    for (let i = 0; i < 6; i++)
      rect(c, "#8a896b", x + 80 + i * 95, top + 42, 35, 4);
  }
  if (cv.feature === "river")
    for (let i = 0; i < 3; i++)
      poly(c, "#597e71", [
        x + 95,
        ground - 22 + i * 4,
        x + 280,
        ground - 36 + i * 4,
        x + 460,
        ground - 20 + i * 4,
        x + 610,
        ground - 25 + i * 4,
        x + 610,
        ground - 20 + i * 4,
        x + 95,
        ground - 17 + i * 4,
      ]);
  if (cv.feature === "waterfall") {
    rect(c, "#69a5a0", x + 420, top + 67, 46, ground - top - 70);
    for (let i = 0; i < 9; i++)
      rect(
        c,
        i % 2 ? "#b3e0cb" : "#85bbb0",
        x + 422 + i * 5,
        top + 72 + ((t * 70 + i * 19) % 100),
        2,
        45,
      );
    rect(c, "#8fcbb9", x + 399, ground - 12, 90, 6);
    rect(c, "#c6e0cb", x + 408, ground - 15, 66, 4);
  }
  if (cv.feature === "crystals")
    for (let i = 0; i < 8; i++) {
      const xx = x + 140 + i * 58,
        yy = ground - 28 - noise(i) * 45;
      poly(c, cv.color, [
        xx,
        yy,
        xx + 5,
        yy - 25,
        xx + 11,
        yy - 12,
        xx + 7,
        yy + 14,
        xx - 8,
        yy + 20,
      ]);
      line(c, "#fff2d3", [xx + 2, yy - 17, xx + 3, yy + 9], 2);
    }
  for (let i = 0; i < 12; i++) {
    const xx = x + 100 + noise(i * 3 + 1) * 480,
      yy = top + 110 + noise(i * 5) * 90;
    if (Math.sin(t * 2 + i) > 0.55) {
      rect(c, "#e6e1ad", xx, yy, 3, 1);
      rect(c, "#e6e1ad", xx + 1, yy - 1, 1, 3);
    }
  }
  rect(c, "#c8b68e", x - 30, ground - 58, 117, 29);
  rect(c, "#80795b", x - 23, ground - 29, 4, 29);
  rect(c, "#80795b", x + 75, ground - 29, 4, 29);
  label(c, cv.short.toUpperCase(), x + 28, ground - 46, "#344c43", 7);
  label(
    c,
    "CAVE " + (CAVES.indexOf(cv) + 1) + " OF 7",
    x + 28,
    ground - 36,
    "#6d7456",
    6,
  );
  // Tiny lamps and their warm reflections on the tunnel floor.
  for (let i = 0; i < 5; i++) {
    const xx = x + 108 + i * 113;
    rect(c, "#ccad6b", xx, ground - 27, 3, 27);
    rect(c, "#ffe2a2", xx - 2, ground - 29, 7, 5);
    rect(c, "#a8a176", xx - 5, ground - 3, 12, 2);
  }
  void H;
}

export function starship(c: Ctx, W: number, t: number, reduced: boolean) {
  const phase = (t + 9) % 32;
  if (phase > 12) return false;
  const x = -160 + (phase / 12) * (W + 310),
    y = 64 + Math.sin((phase / 12) * Math.PI) * 15;
  if (!reduced) {
    for (let i = 0; i < 10; i++)
      rect(
        c,
        `rgba(255,244,207,${0.3 - i * 0.025})`,
        x - 18 - i * 16,
        y + 4,
        15,
        4,
      );
  }
  poly(c, "#e9b86d", [
    x - 21,
    y + 2,
    x - 44 - Math.sin(t * 20) * 6,
    y + 6,
    x - 21,
    y + 10,
  ]);
  poly(c, "#fff3c4", [x - 20, y + 4, x - 35, y + 6, x - 20, y + 8]);
  poly(c, "#4f6667", [
    x - 22,
    y,
    x + 28,
    y,
    x + 39,
    y + 5,
    x + 42,
    y + 7,
    x + 27,
    y + 13,
    x - 22,
    y + 13,
  ]);
  poly(c, "#c7d5cf", [
    x - 19,
    y + 1,
    x + 27,
    y + 1,
    x + 37,
    y + 6,
    x + 25,
    y + 11,
    x - 19,
    y + 11,
  ]);
  rect(c, "#eff0d8", x - 17, y + 2, 42, 3);
  rect(c, "#7e9290", x - 18, y + 10, 43, 2);
  poly(c, "#768e89", [
    x - 20,
    y + 1,
    x - 26,
    y - 9,
    x - 17,
    y - 6,
    x - 8,
    y + 1,
  ]);
  poly(c, "#566e6a", [
    x - 19,
    y + 10,
    x - 25,
    y + 20,
    x - 17,
    y + 17,
    x - 8,
    y + 10,
  ]);
  poly(c, "#7e9189", [
    x + 22,
    y + 1,
    x + 16,
    y - 6,
    x + 22,
    y - 5,
    x + 29,
    y + 2,
  ]);
  rect(c, "#566b66", x + 12, y + 4, 10, 2);
  return true;
}

export function scene(
  c: Ctx,
  W: number,
  H: number,
  g: Game,
  t: number,
  reduced: boolean,
) {
  const ground = H - 53,
    playerX = W < 500 ? 94 : 145,
    x = g.x;
  const desert = clamp((x - 20500) / 3500),
    hill = clamp((x - 1800) / 2500);
  const skyTop = mix("#9ec8c6", "#d9a88f", desert),
    skyBottom = mix("#d5e1be", "#f4ce94", desert);
  const grad = c.createLinearGradient(0, 0, 0, ground);
  grad.addColorStop(0, skyTop);
  grad.addColorStop(1, skyBottom);
  rect(c, skyTop, 0, 0, W, H);
  c.fillStyle = grad;
  c.fillRect(0, 0, W, ground);
  const sunX = W * 0.76,
    sunY = desert ? H * 0.29 : 79;
  for (let sy = -22; sy < 22; sy += 2) {
    const sw = Math.floor(Math.sqrt(22 * 22 - sy * sy));
    rect(c, desert ? "#ffe1a0" : "#f6edbd", sunX - sw, sunY + sy, sw * 2, 2);
  }
  for (let i = -1; i < 5; i++)
    cloud(
      c,
      ((((i * 224 - x * 0.055 + (reduced ? 0 : t * 1.2)) % (W + 260)) +
        W +
        260) %
        (W + 260)) -
        100,
      48 + noise(i + 20) * 70,
      0.8 + noise(i + 12) * 0.5,
    );
  // Distant limestone hills become flat-topped western mesas.
  for (let layer = 0; layer < 3; layer++) {
    const step = 190,
      off = x * (0.08 + layer * 0.07),
      base = ground - 37 + layer * 15;
    for (
      let i = Math.floor(off / step) - 1;
      i < Math.floor(off / step) + W / step + 2;
      i++
    ) {
      const xx = i * step - off,
        hh = (30 + noise(i + layer * 30) * 45) * (0.45 + hill * 0.55);
      const color =
        layer === 0
          ? mix("#a8bf9d", "#b59b7d", desert)
          : layer === 1
            ? mix("#92ac84", "#ac8667", desert)
            : mix("#789b76", "#a28c64", desert);
      if (desert > 0.5)
        poly(c, color, [
          xx,
          base,
          xx + 28,
          base - hh * 0.4,
          xx + 58,
          base - hh,
          xx + 121,
          base - hh,
          xx + 144,
          base - hh * 0.4,
          xx + 210,
          base,
          xx + 210,
          ground,
          xx,
          ground,
        ]);
      else
        poly(c, color, [
          xx - 30,
          base,
          xx + 28,
          base - hh * 0.4,
          xx + 72,
          base - hh,
          xx + 113,
          base - hh * 0.9,
          xx + 153,
          base - hh * 0.35,
          xx + 210,
          base,
          xx + 210,
          ground,
          xx - 30,
          ground,
        ]);
    }
  }
  if (x < 2400) {
    skyline(c, 520 - x * 0.3, ground - 38);
    nasa(c, 184 - x * 0.48, ground - 13);
    for (let i = 0; i < 4; i++) {
      const xx = -180 + i * 109 - x * 0.48;
      rect(c, "#d9d1a7", xx, ground - 41, 59, 29);
      poly(c, "#927453", [
        xx - 5,
        ground - 41,
        xx + 30,
        ground - 63,
        xx + 64,
        ground - 41,
      ]);
      rect(c, "#6f9784", xx + 9, ground - 33, 12, 11);
      rect(c, "#6b7e66", xx + 37, ground - 32, 10, 20);
    }
  }
  if (x > 800 && x < 4000) {
    const sx = 775 - x * 0.31;
    rect(c, "#739a82", sx, ground - 42, 117, 27);
    label(c, "HOUSTON", sx + 58, ground - 24, "#f0ecd0", 12);
    rect(c, "#6f8064", sx + 9, ground - 15, 4, 15);
    rect(c, "#6f8064", sx + 103, ground - 15, 4, 15);
  }
  const decorOff = x * 0.65;
  for (
    let i = Math.floor(decorOff / 170) - 1;
    i < Math.floor(decorOff / 170) + W / 170 + 2;
    i++
  ) {
    const xx = i * 170 - decorOff,
      n = noise(i);
    if (desert > 0.5) {
      if (i % 5 === 0) windmill(c, xx, ground - 16, reduced ? 0 : t);
      else cactus(c, xx, ground - 13, 1.1 + n);
    } else if (n > 0.25) tree(c, xx, ground - 13, 0.6 + n * 0.4, hill > 0.5);
  }
  starship(c, W, t, reduced);
  // Fenced ranch pastures, bluebonnets, and a two-tone soil strip.
  const fenceOffset = x * 0.82;
  rect(c, mix("#9fac73", "#b5a378", desert), 0, ground - 13, W, 15);
  for (
    let i = Math.floor(fenceOffset / 43) - 1;
    i < Math.floor(fenceOffset / 43) + W / 43 + 2;
    i++
  ) {
    const xx = i * 43 - fenceOffset;
    if (noise(Math.floor(i / 9)) > 0.35) {
      rect(c, "#7c8863", xx, ground - 30, 4, 18);
      rect(c, "#a1a47a", xx + 1, ground - 31, 2, 16);
      rect(c, "#858f6a", xx, ground - 25, 43, 2);
      rect(c, "#858f6a", xx, ground - 19, 43, 2);
    }
  }
  for (const cv of CAVES) {
    const xx = cv.x - 245 - x + playerX;
    if (xx < W + 60 && xx + 730 > -60)
      cave(c, cv, xx, ground, H, reduced ? 0 : t);
  }
  rect(c, mix("#b7ba77", "#d7ae71", desert), 0, ground, W, 7);
  rect(c, mix("#d3c38e", "#d3aa70", desert), 0, ground + 7, W, 5);
  rect(c, mix("#aa976b", "#b78a5c", desert), 0, ground + 12, W, H - ground);
  const pathStart = Math.floor((x - playerX) / 24);
  for (let i = pathStart; i < pathStart + W / 24 + 2; i++) {
    const xx = i * 24 - x + playerX,
      n = noise(i);
    rect(
      c,
      desert ? "#d2a66a" : "#c6b180",
      xx,
      ground + 16 + n * 26,
      7 + n * 6,
      2,
    );
    if (n > 0.45) rect(c, "#907e58", xx + 9, ground + 22 + n * 20, 3, 2);
    if (n > 0.75) {
      rect(c, desert ? "#8d9560" : "#6f9258", xx, ground - 4, 2, 5);
      rect(c, desert ? "#9da168" : "#829c60", xx - 3, ground - 2, 7, 2);
    }
    if (hill > 0.2 && desert < 0.5 && n > 0.87) {
      rect(c, "#527951", xx + 8, ground - 9, 1, 9);
      rect(c, "#6676ae", xx + 6, ground - 13, 5, 7);
      rect(c, "#c5c9c3", xx + 7, ground - 15, 3, 3);
    }
  }
  for (const o of g.obstacles) {
    const xx = o.x - x + playerX;
    if (xx > -65 && xx < W + 65) obstacle(c, o, xx, ground, t);
  }
  for (const p of g.pierogi) {
    const xx = p.x - x + playerX;
    if (!p.collected && xx > -20 && xx < W + 20)
      pierogi(c, xx, ground - p.y, reduced ? 0 : t * 3 + p.x, 0.9);
  }
  // A soft pixel shadow anchors the horse even while jumping.
  const shadow = 1 - g.y / 330;
  rect(c, "#5e684d45", playerX - 40 * shadow, ground + 2, 86 * shadow, 5);
  rider(c, playerX, ground - g.y, t, g.y > 3, g.mode === "playing");
  if (g.mode === "ready") {
    rect(c, "#d9c9a0", playerX - 64, ground + 24, 130, 17);
    label(c, "HAPPY TRAILS, COWGIRL", playerX + 1, ground + 35, "#5f664e", 7);
  }
  return { ground, playerX };
}
