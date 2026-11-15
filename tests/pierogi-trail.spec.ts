import { test, expect } from "@playwright/test";
import {
  CAVES,
  FINISH,
  SPEED,
  makeGame,
  jump,
  step,
} from "../src/scripts/pierogi-trail/model";
import {
  backdropWeights,
  tilePositions,
} from "../src/scripts/pierogi-trail/art";

test("the faster hands-off ride still completes every cave in about three minutes", () => {
  const g = makeGame();
  g.mode = "playing";
  const stamps: number[] = [];
  let finishes = 0;
  for (let i = 0; i < 24000 && g.mode === "playing"; i++) {
    step(g, 1 / 120);
    for (const e of g.events) {
      if (e.type === "cave") stamps.push(e.index!);
      if (e.type === "finish") finishes++;
    }
  }
  expect(SPEED).toBeGreaterThanOrEqual(400);
  expect(g.mode).toBe("finished");
  expect(g.x).toBe(FINISH);
  expect(stamps).toEqual([0, 1, 2, 3, 4, 5, 6]);
  expect(finishes).toBe(1);
  expect(g.time).toBeGreaterThan(165);
  expect(g.time).toBeLessThan(185);
  expect(g.count).toBeGreaterThan(200);
  expect(g.bumps).toBe(g.obstacles.length);
});

test("every obstacle clears across a generous range of jump timings", () => {
  for (const lead of [110, 155, 210]) {
    const g = makeGame();
    g.mode = "playing";
    let maxY = 0;
    for (let i = 0; i < 23000 && g.mode === "playing"; i++) {
      const next = g.obstacles.find(
        (o) => !o.cleared && !o.bumped && o.x > g.x,
      );
      if (next && next.x - g.x < lead && g.y === 0) jump(g);
      step(g, 1 / 120);
      maxY = Math.max(maxY, g.y);
    }
    expect(g.mode).toBe("finished");
    expect(g.bumps, `jump ${lead}px before obstacle`).toBe(0);
    expect(g.clears).toBe(g.obstacles.length);
    expect(maxY).toBeGreaterThan(135);
    expect(maxY).toBeLessThan(145);
  }
});

test("scenery blends continuously and adjacent mirrored tiles never leave gaps", () => {
  for (let x = 0; x < FINISH; x += 13) {
    const a = backdropWeights(x),
      b = backdropWeights(x + 1);
    expect(a.houston + a.hills + a.desert).toBeCloseTo(1, 9);
    for (const k of ["houston", "hills", "desert"] as const)
      expect(Math.abs(a[k] - b[k])).toBeLessThan(0.001);
  }
  for (const camera of [0, 1023.9, 1024, 1024.1, 2048, 99999]) {
    const positions = tilePositions(camera, 1024, 1440);
    expect(positions[0].x).toBeLessThanOrEqual(0);
    expect(positions.at(-1)!.x + 1024).toBeGreaterThanOrEqual(1440);
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i].x - positions[i - 1].x).toBeCloseTo(1024);
      expect(positions[i].flipped).not.toBe(positions[i - 1].flipped);
    }
  }
});

test("pause freezes physics, jump buffering works, and cave order stays nearest first", () => {
  const g = makeGame();
  g.mode = "playing";
  jump(g);
  step(g, 1 / 120);
  g.mode = "paused";
  const freeze = [g.x, g.y, g.time];
  step(g, 2);
  jump(g);
  expect([g.x, g.y, g.time]).toEqual(freeze);
  g.mode = "playing";
  while (g.vy > 0 || g.y > 25) step(g, 1 / 120);
  jump(g);
  for (let i = 0; i < 20; i++) step(g, 1 / 120);
  expect(g.jumps).toBe(2);
  expect(CAVES.map((c) => c.miles)).toEqual(
    [...CAVES.map((c) => c.miles)].sort((a, b) => a - b),
  );
});

test("only the game fills the viewport and play starts automatically", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/pierogi-trail/");
  await expect(page.locator("#stage")).toHaveAttribute("data-assets", "ready");
  await expect(page.locator("#stage")).toHaveAttribute("data-mode", "playing");
  await expect(page.getByRole("button")).toHaveCount(0);
  await expect(page.locator("header,footer,dialog,h1")).toHaveCount(0);
  const box = await page.locator("canvas").boundingBox();
  expect(box!.x).toBe(0);
  expect(box!.y).toBe(0);
  expect(box!.width).toBe(1440);
  expect(box!.height).toBe(960);
  await page.keyboard.press("ArrowUp");
  await expect(page.locator("canvas")).toHaveAttribute("data-jumps", "1");
  await page.keyboard.press("KeyP");
  await expect(page.locator("#stage")).toHaveAttribute("data-mode", "paused");
  const x = await page.locator("canvas").getAttribute("data-distance");
  await page.waitForTimeout(200);
  expect(await page.locator("canvas").getAttribute("data-distance")).toBe(x);
  await page.mouse.click(15, 15);
  await expect(page.locator("#stage")).toHaveAttribute("data-mode", "playing");
  expect(errors).toEqual([]);
});

test("mobile taps anywhere, including the top tracker, jump with no button or scrolling", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("/pierogi-trail/");
  await expect(page.locator("#stage")).toHaveAttribute("data-assets", "ready");
  await expect(page.getByRole("button")).toHaveCount(0);
  await page.touchscreen.tap(195, 26);
  await expect(page.locator("canvas")).toHaveAttribute("data-jumps", "1");
  await page.waitForTimeout(950);
  await page.touchscreen.tap(365, 810);
  await expect(page.locator("canvas")).toHaveAttribute("data-jumps", "2");
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollHeight <= innerHeight &&
        document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const hud = await page.locator(".trail-hud").boundingBox();
  expect(hud!.y).toBe(0);
  expect(hud!.height).toBeLessThan(110);
  await page.setViewportSize({ width: 844, height: 390 });
  const canvas = await page.locator("canvas").boundingBox();
  expect(canvas!.width).toBe(844);
  expect(canvas!.height).toBe(390);
  await context.close();
});

test("generated rider has real transparent margins and all six artwork assets decode", async ({
  page,
}) => {
  await page.goto("/pierogi-trail/");
  await expect(page.locator("#stage")).toHaveAttribute("data-assets", "ready");
  const result = await page.evaluate(async () => {
    const image = new Image();
    image.src = "/pierogi-trail/art/rider-gallop-v2.webp";
    await image.decode();
    const c = document.createElement("canvas");
    c.width = image.width;
    c.height = image.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    let clear = 0,
      opaque = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] === 0) clear++;
      if (data[i] > 200) opaque++;
    }
    return {
      width: image.width,
      height: image.height,
      corner: data[3],
      clear: clear / (c.width * c.height),
      opaque: opaque / (c.width * c.height),
    };
  });
  expect(result.width).toBe(1536);
  expect(result.height).toBe(1024);
  expect(result.corner).toBe(0);
  expect(result.clear).toBeGreaterThan(0.5);
  expect(result.opaque).toBeGreaterThan(0.2);
});

test("a full ride reaches the ending and a screen tap resets all seven stamps", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install();
  await page.goto("/pierogi-trail/");
  await expect(page.locator("#stage")).toHaveAttribute("data-assets", "ready");
  // Every RAF is rendered and each scaled delta stays below the engine's 80 ms cap.
  await page.evaluate(() => {
    const raf = requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) => raf((t) => callback(t * 4));
  });
  await page.clock.runFor(47000);
  await expect(page.locator("#stage")).toHaveAttribute("data-mode", "finished");
  await expect(page.locator("[data-cave].found")).toHaveCount(7);
  expect(Number(await page.locator("#score").textContent())).toBeGreaterThan(
    200,
  );
  await page.clock.runFor(800);
  await page.mouse.click(720, 500);
  await expect(page.locator("#stage")).toHaveAttribute("data-mode", "playing");
  await expect(page.locator("[data-cave].found")).toHaveCount(0);
  await expect(page.locator("#cave-count")).toHaveText("0 / 7");
  expect(errors).toEqual([]);
});
