import { test, expect, type Page } from "@playwright/test";

type Probe = {
  context: AudioContext;
  analyser: AnalyserNode;
  music: { time: number; offset: number; stopped: boolean }[];
  effects: { time: number; frequency: number }[];
  song?: { duration: number; peak: number; rms: number; seam: number };
};
declare global { interface Window { trailAudioProbe: Probe[] } }

async function observeAudio(page: Page) {
  await page.addInitScript(() => {
    window.trailAudioProbe = [];
    window.AudioContext = class extends AudioContext {
      constructor(options?: AudioContextOptions) {
        super(options);
        const analyser = this.createAnalyser();
        const probe: Probe = { context: this, analyser, music: [], effects: [] };
        window.trailAudioProbe.push(probe);
        const createGain = this.createGain.bind(this);
        this.createGain = () => {
          const gain = createGain();
          const connect = gain.connect.bind(gain);
          gain.connect = ((destination: AudioNode) => {
            if (destination === this.destination) connect(analyser);
            return connect(destination);
          }) as typeof gain.connect;
          return gain;
        };
        const createSource = this.createBufferSource.bind(this);
        this.createBufferSource = () => {
          const source = createSource();
          const start = source.start.bind(source), stop = source.stop.bind(source);
          const record = { time: 0, offset: 0, stopped: false };
          source.start = (when = 0, offset = 0) => {
            Object.assign(record, { time: this.currentTime, offset });
            probe.music.push(record);
            if (!probe.song && source.buffer) {
              const samples = source.buffer.getChannelData(0);
              let peak = 0, squares = 0;
              for (const sample of samples) {
                peak = Math.max(peak, Math.abs(sample));
                squares += sample * sample;
              }
              probe.song = {
                duration: source.buffer.duration, peak,
                rms: Math.sqrt(squares / samples.length),
                seam: Math.abs(samples[0] - samples.at(-1)!),
              };
            }
            start(when, offset);
          };
          source.stop = (when = 0) => { record.stopped = true; stop(when); };
          return source;
        };
        const createOscillator = this.createOscillator.bind(this);
        this.createOscillator = () => {
          const oscillator = createOscillator(), start = oscillator.start.bind(oscillator);
          // AudioParam.value may still be its default until the next audio block.
          let frequency = oscillator.frequency.value;
          const setFrequency = oscillator.frequency.setValueAtTime.bind(oscillator.frequency);
          oscillator.frequency.setValueAtTime = (value, at) => {
            frequency = value;
            return setFrequency(value, at);
          };
          oscillator.start = (when = 0) => {
            probe.effects.push({ time: this.currentTime, frequency });
            start(when);
          };
          return oscillator;
        };
      }
    };
  });
}

const state = (page: Page) => page.evaluate(() => window.trailAudioProbe[0]?.context.state);
const activeMusic = (page: Page) => page.evaluate(() =>
  window.trailAudioProbe[0]?.music.filter(track => !track.stopped).length ?? 0,
);
const output = (page: Page) => page.evaluate(() => {
  const analyser = window.trailAudioProbe[0]?.analyser;
  if (!analyser) return 0;
  const samples = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(samples);
  return Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
});

test("music unlocks on a gesture, produces quiet audio, and resumes without duplicate loops", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await observeAudio(page);
  await page.goto("/pierogi-trail/");
  await expect(page.locator("#stage")).toHaveAttribute("data-assets", "ready");
  expect(await page.evaluate(() => window.trailAudioProbe.length)).toBe(0);
  await page.mouse.click(300, 300);
  await expect.poll(() => activeMusic(page)).toBe(1);
  await expect.poll(() => output(page)).toBeGreaterThan(0.002);
  const song = await page.evaluate(() => window.trailAudioProbe[0].song!);
  expect(song.duration).toBeGreaterThan(70);
  expect(song.peak).toBeLessThan(0.5);
  expect(song.rms).toBeGreaterThan(0.015);
  expect(song.rms).toBeLessThan(0.15);
  expect(song.seam).toBeLessThan(0.0001);
  await page.keyboard.press("KeyP");
  await expect.poll(() => state(page)).toBe("suspended");
  expect(await activeMusic(page)).toBe(0);
  await page.keyboard.press("KeyP");
  await expect.poll(() => activeMusic(page)).toBe(1);
  expect(await page.evaluate(() => window.trailAudioProbe[0].music.at(-1)!.offset)).toBeGreaterThan(0);
  // Repeated gestures and fast pause/resume must not leave extra music sources running.
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("KeyP");
  await page.keyboard.press("KeyP");
  await page.waitForTimeout(200);
  expect(await activeMusic(page)).toBe(1);
  expect(await state(page)).toBe("running");
  expect(await page.evaluate(() => window.trailAudioProbe.length)).toBe(1);
  expect(errors).toEqual([]);
});

test("independent sound controls persist, support the keyboard, and never jump", async ({ page }) => {
  await observeAudio(page);
  await page.goto("/pierogi-trail/");
  await expect(page.locator("#stage")).toHaveAttribute("data-assets", "ready");
  const music = page.getByRole("button", { name: "Music", exact: true });
  const sfx = page.getByRole("button", { name: "Sound effects" });
  await sfx.click();
  await music.focus();
  await page.keyboard.press("Space");
  await expect(music).toHaveAttribute("aria-pressed", "false");
  await expect(sfx).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("canvas")).toHaveAttribute("data-jumps", "0");
  await page.reload();
  await expect(page.locator("#stage")).toHaveAttribute("data-assets", "ready");
  await expect(music).toHaveAttribute("aria-pressed", "false");
  await expect(sfx).toHaveAttribute("aria-pressed", "false");
  await music.click();
  await expect.poll(() => activeMusic(page)).toBe(1);
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => window.trailAudioProbe[0].effects.length)).toBe(0);
  await page.keyboard.press("KeyM");
  await expect.poll(() => state(page)).toBe("suspended");
  await page.keyboard.press("KeyM");
  await expect.poll(() => activeMusic(page)).toBe(1);
  await expect(music).toHaveAttribute("aria-pressed", "true");
  await expect(sfx).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("canvas")).toHaveAttribute("data-jumps", "0");
});

test("a tap during slow artwork loading starts audio once the ride is ready", async ({ page }) => {
  await observeAudio(page);
  let release!: () => void;
  const artworkGate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/rider-gallop-v2.webp", async route => {
    await artworkGate;
    await route.continue();
  });
  await page.goto("/pierogi-trail/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#stage")).toHaveAttribute("data-assets", "loading");
  await page.mouse.click(300, 300);
  await expect.poll(() => state(page)).toBe("suspended");
  release();
  await expect(page.locator("#stage")).toHaveAttribute("data-assets", "ready");
  await expect.poll(() => activeMusic(page)).toBe(1);
  await expect.poll(() => output(page)).toBeGreaterThan(0.002);
});

test("pickup effects stay sparse and the music and SFX can each play alone", async ({ page }) => {
  await observeAudio(page);
  await page.goto("/pierogi-trail/");
  await expect(page.locator("#stage")).toHaveAttribute("data-assets", "ready");
  await page.mouse.click(300, 300);
  await expect.poll(() => activeMusic(page)).toBe(1);
  await page.waitForTimeout(4100);
  const pickups = await page.evaluate(() => window.trailAudioProbe[0].effects.filter(effect => effect.frequency > 300));
  expect(pickups.length).toBeGreaterThanOrEqual(2);
  expect(pickups.length).toBeLessThanOrEqual(5);
  for (let i = 1; i < pickups.length; i++) expect(pickups[i].time - pickups[i - 1].time).toBeGreaterThanOrEqual(0.85);
  await page.getByRole("button", { name: "Music", exact: true }).click();
  expect(await activeMusic(page)).toBe(0);
  const before = await page.evaluate(() => window.trailAudioProbe[0].effects.length);
  await page.waitForTimeout(2000);
  expect(await page.evaluate(() => window.trailAudioProbe[0].effects.length)).toBeGreaterThan(before);
  await page.getByRole("button", { name: "Sound effects" }).click();
  await expect.poll(() => state(page)).toBe("suspended");
});

test("hiding the page silences audio until the ride is explicitly resumed", async ({ page }) => {
  await observeAudio(page);
  await page.goto("/pierogi-trail/");
  await expect(page.locator("#stage")).toHaveAttribute("data-assets", "ready");
  await page.mouse.click(300, 300);
  await expect.poll(() => activeMusic(page)).toBe(1);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator("#stage")).toHaveAttribute("data-mode", "paused");
  await expect.poll(() => state(page)).toBe("suspended");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(await state(page)).toBe("suspended");
  await page.mouse.click(300, 300);
  await expect.poll(() => activeMusic(page)).toBe(1);
});

test("a phone tap unlocks music and the touch controls do not trigger jumps", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await observeAudio(page);
  await page.goto("/pierogi-trail/");
  await expect(page.locator("#stage")).toHaveAttribute("data-assets", "ready");
  await page.touchscreen.tap(195, 300);
  await expect.poll(() => activeMusic(page)).toBe(1);
  await expect.poll(() => output(page)).toBeGreaterThan(0.002);
  await page.getByRole("button", { name: "Sound effects" }).tap();
  await page.getByRole("button", { name: "Music", exact: true }).tap();
  await expect.poll(() => state(page)).toBe("suspended");
  await expect(page.locator("canvas")).toHaveAttribute("data-jumps", "1");
  await context.close();
});

test("unavailable audio and blocked storage do not prevent playing", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new Error("Storage blocked"); } });
    window.AudioContext = class { constructor() { throw new Error("Audio unavailable"); } } as unknown as typeof AudioContext;
  });
  await page.goto("/pierogi-trail/");
  await expect(page.locator("#stage")).toHaveAttribute("data-assets", "ready");
  await page.mouse.click(300, 300);
  await expect(page.locator("canvas")).toHaveAttribute("data-jumps", "1");
  await expect(page.getByRole("button", { name: "Music", exact: true })).toBeDisabled();
  await page.keyboard.press("KeyP");
  await page.mouse.click(300, 300);
  await expect(page.locator("#stage")).toHaveAttribute("data-mode", "playing");
  expect(errors).toEqual([]);
});

test("completion plays a short finale, goes quiet, and replay starts one fresh tune", async ({ page }) => {
  test.setTimeout(120000);
  await observeAudio(page);
  await page.clock.install();
  await page.goto("/pierogi-trail/");
  await expect(page.locator("#stage")).toHaveAttribute("data-assets", "ready");
  await page.mouse.click(300, 300);
  await expect.poll(() => activeMusic(page)).toBe(1);
  await page.evaluate(() => {
    const raf = requestAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => raf(t => callback(t * 4));
  });
  await page.clock.runFor(47000);
  await expect(page.locator("#stage")).toHaveAttribute("data-mode", "finished");
  expect(await activeMusic(page)).toBe(0);
  const effects = await page.evaluate(() => window.trailAudioProbe[0].effects);
  // The last four voices are the resolving G-major finale, above the cave chime.
  expect(effects.slice(-4).map(effect => Math.round(effect.frequency))).toEqual([392, 494, 587, 784]);
  await page.clock.runFor(1600);
  await expect.poll(() => state(page)).toBe("suspended");
  await page.mouse.click(300, 300);
  await expect(page.locator("#stage")).toHaveAttribute("data-mode", "playing");
  await expect.poll(() => activeMusic(page)).toBe(1);
  expect(await page.evaluate(() => window.trailAudioProbe[0].music.at(-1)!.offset)).toBe(0);
});
