import { test, expect } from "@playwright/test";
import {
  CAVES,
  FINISH,
  makeGame,
  jump,
  step,
} from "../src/scripts/pierogi-trail/model";

test("a completely hands-off ride reaches every cave in about three minutes", () => {
  const game = makeGame();
  game.mode = "playing";
  const stamps: number[] = [];
  let finishes = 0;
  for (let i = 0; i < 24000 && game.mode === "playing"; i++) {
    step(game, 1 / 120);
    for (const event of game.events) {
      if (event.type === "cave") stamps.push(event.index!);
      if (event.type === "finish") finishes++;
    }
  }
  expect(game.mode).toBe("finished");
  expect(game.x).toBe(FINISH);
  expect(stamps).toEqual([0, 1, 2, 3, 4, 5, 6]);
  expect(finishes).toBe(1);
  expect(game.time).toBeGreaterThan(170);
  expect(game.time).toBeLessThan(190);
  expect(game.count).toBeGreaterThan(100);
  expect(game.bumps).toBe(game.obstacles.length);
  const score = game.count;
  step(game, 1);
  expect(game.count).toBe(score);
  expect(game.events).toHaveLength(0);
});

test("every obstacle can be cleared with a simple jump and no score is lost", () => {
  const game = makeGame();
  game.mode = "playing";
  let maxY = 0,
    lastCount = 0;
  for (let i = 0; i < 23000 && game.mode === "playing"; i++) {
    const next = game.obstacles.find(
      (o) => !o.cleared && !o.bumped && o.x > game.x,
    );
    if (next && next.x - game.x < 88 && game.y === 0) jump(game);
    step(game, 1 / 120);
    maxY = Math.max(maxY, game.y);
    expect(game.count).toBeGreaterThanOrEqual(lastCount);
    lastCount = game.count;
  }
  expect(game.mode).toBe("finished");
  expect(game.bumps).toBe(0);
  expect(game.clears).toBe(game.obstacles.length);
  expect(maxY).toBeGreaterThan(120);
  expect(maxY).toBeLessThan(130);
});

test("pause freezes the ride and a buffered landing jump works", () => {
  const game = makeGame();
  game.mode = "playing";
  jump(game);
  step(game, 1 / 120);
  expect(game.y).toBeGreaterThan(0);
  game.mode = "paused";
  const frozen = { x: game.x, y: game.y, time: game.time };
  step(game, 2);
  jump(game);
  expect({ x: game.x, y: game.y, time: game.time }).toEqual(frozen);
  game.mode = "playing";
  while (game.vy > 0 || game.y > 25) step(game, 1 / 120);
  jump(game);
  for (let i = 0; i < 20; i++) step(game, 1 / 120);
  expect(game.jumps).toBe(2);
  expect(CAVES.map((c) => c.miles)).toEqual(
    [...CAVES.map((c) => c.miles)].sort((a, b) => a - b),
  );
});

test("desktop keyboard, pause, route guide, sound and first cave work in the browser", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install();
  await page.goto("/pierogi-trail/");
  await expect(
    page.getByRole("heading", { name: "The Pierogi Trail." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Saddle up" }).click();
  await expect(page.locator("#stage")).toHaveAttribute("data-mode", "playing");
  await page.keyboard.press("ArrowUp");
  await page.clock.runFor(200);
  await expect(page.locator("canvas")).toHaveAttribute("data-jumps", "1");
  expect(
    Number(await page.locator("canvas").getAttribute("data-height")),
  ).toBeGreaterThan(40);
  await page.getByRole("button", { name: "Pause ride" }).click();
  const x = await page.locator("canvas").getAttribute("data-distance");
  await page.clock.runFor(2000);
  expect(await page.locator("canvas").getAttribute("data-distance")).toBe(x);
  await expect(page.locator("#paused")).toBeVisible();
  await page.getByRole("button", { name: "Keep riding" }).click();
  await page.getByRole("button", { name: "Turn sound on" }).click();
  await expect(page.locator("#sound")).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Turn sound off" }).click();
  await page
    .getByRole("button", { name: "The route & little details" })
    .click();
  await expect(page.locator("dialog")).toBeVisible();
  await expect(page.locator("#stage")).toHaveAttribute("data-mode", "paused");
  await page.keyboard.press("Escape");
  await expect(page.locator("#stage")).toHaveAttribute("data-mode", "playing");
  await page.clock.runFor(29000);
  await expect(page.locator('[data-cave="0"]')).toHaveClass("found");
  await expect(page.locator("#cave-count")).toHaveText("1 / 7");
  expect(Number(await page.locator("#score").textContent())).toBeGreaterThan(
    10,
  );
  expect(errors).toEqual([]);
});

test("mobile taps jump, portrait and landscape fit, and the rider is visible before starting", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("/pierogi-trail/");
  const intro = await page.locator("#intro").boundingBox(),
    canvas = await page.locator("canvas").boundingBox();
  const logicalHeight = await page
    .locator("canvas")
    .evaluate((c: HTMLCanvasElement) => c.height);
  const horseTop =
    canvas!.y + ((logicalHeight - 155) / logicalHeight) * canvas!.height;
  expect(intro!.y + intro!.height).toBeLessThan(horseTop + 4);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Saddle up" }).tap();
  await page.locator("canvas").tap({ position: { x: 180, y: 200 } });
  await expect(page.locator("canvas")).toHaveAttribute("data-jumps", "1");
  await page.waitForTimeout(1100);
  await page.getByRole("button", { name: "Jump horse" }).tap();
  await expect(page.locator("canvas")).toHaveAttribute("data-jumps", "2");
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByRole("button", { name: "Jump horse" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await context.close();
});

test("the full browser ride completes, stamps all caves, and replay resets the passport", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/pierogi-trail/");
  // Render every frame, at 4x timestamp speed. Each ~64 ms delta is below the
  // engine's 80 ms cap, so all 120 Hz physics steps and UI events still run.
  await page.evaluate(() => {
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) =>
      raf((time) => callback(time * 4));
  });
  await page.getByRole("button", { name: "Saddle up" }).click();
  await page.clock.runFor(48000);
  await expect(page.locator("#stage")).toHaveAttribute("data-mode", "finished");
  await expect(
    page.getByRole("heading", { name: "What a lovely ride." }),
  ).toBeVisible();
  await expect(page.locator("[data-cave].found")).toHaveCount(7);
  expect(
    Number(await page.locator("#final-pierogi").textContent()),
  ).toBeGreaterThan(100);
  await page.getByRole("button", { name: "One more ride" }).click();
  await expect(page.locator("[data-cave].found")).toHaveCount(0);
  await expect(page.locator("#cave-count")).toHaveText("0 / 7");
  await expect(page.locator("#score")).toHaveText("000");
  expect(errors).toEqual([]);
});
