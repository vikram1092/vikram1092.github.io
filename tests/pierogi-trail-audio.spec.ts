import { test, expect, type Page } from "@playwright/test";

type Probe = {
  context: AudioContext;
  analyser: AnalyserNode;
  effects: { time: number; frequency: number }[];
};
declare global { interface Window { trailAudioProbe: Probe[] } }

async function observeAudio(page: Page) {
  await page.addInitScript(() => {
    window.trailAudioProbe = [];
    window.AudioContext = class extends AudioContext {
      constructor(options?: AudioContextOptions) {
        super(options);
        const analyser = this.createAnalyser();
        const probe: Probe = { context: this, analyser, effects: [] };
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
const playingMusic = (page: Page) => page.locator("#trail-music").evaluate((element: HTMLAudioElement) =>
  !element.paused && !element.muted && element.readyState >= 2 && element.currentTime > 0,
);
const musicTime = (page: Page) => page.locator("#trail-music").evaluate((element: HTMLAudioElement) => element.currentTime);

test("native music has audible samples and pauses/resumes without restarting", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await observeAudio(page);
  await page.goto("/pierogi-trail/");
  await expect(page.locator("#stage")).toHaveAttribute("data-assets", "ready");
  await page.mouse.click(300, 300);
  await expect.poll(() => playingMusic(page)).toBe(true);
  const song = await page.evaluate(async () => {
    const element = document.querySelector<HTMLAudioElement>("#trail-music")!;
    const context = new OfflineAudioContext(1, 1, 44100);
    const buffer = await context.decodeAudioData(await (await fetch(element.src)).arrayBuffer());
    const samples = buffer.getChannelData(0);
    let peak = 0, squares = 0;
    for (const sample of samples) { peak = Math.max(peak, Math.abs(sample)); squares += sample * sample; }
    return { src: element.currentSrc, channels: buffer.numberOfChannels, duration: buffer.duration, peak, rms: Math.sqrt(squares / samples.length), loop: element.loop };
  });
  expect(song.src).toContain("/pierogi-trail/audio/cowboy-country-v1.mp3");
  expect(song.channels).toBe(2);
  expect(song.duration).toBeCloseTo(106.667, 1);
  expect(song.peak).toBeLessThan(0.8);
  expect(song.rms).toBeGreaterThan(0.045);
  expect(song.rms).toBeLessThan(0.15);
  expect(song.loop).toBe(true);
  await page.keyboard.press("KeyP");
  await expect.poll(() => state(page)).toBe("suspended");
  expect(await playingMusic(page)).toBe(false);
  const position = await musicTime(page);
  await page.waitForTimeout(200);
  expect(await musicTime(page)).toBeCloseTo(position, 2);
  await page.keyboard.press("KeyP");
  await expect.poll(() => musicTime(page)).toBeGreaterThan(position);
  await expect(page.locator("audio")).toHaveCount(1);
  await expect.poll(() => state(page)).toBe("running");
  // Recover a media/audio interruption on the next game gesture as well.
  await page.evaluate(async () => {
    document.querySelector<HTMLAudioElement>("#trail-music")!.pause();
    await window.trailAudioProbe[0].context.suspend();
  });
  await page.keyboard.press("ArrowUp");
  await expect.poll(() => playingMusic(page)).toBe(true);
  await expect.poll(() => state(page)).toBe("running");
  expect(errors).toEqual([]);
});

test("audio stays enabled with no buttons, old mute preferences, or M shortcut", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("pierogi-trail-audio-v1", JSON.stringify({ music: false, sfx: false })));
  await observeAudio(page);
  await page.goto("/pierogi-trail/");
  await expect(page.locator("#stage")).toHaveAttribute("data-assets", "ready");
  await expect(page.getByRole("button")).toHaveCount(0);
  await page.mouse.click(300, 300);
  await expect.poll(() => playingMusic(page)).toBe(true);
  await page.keyboard.press("KeyM");
  expect(await playingMusic(page)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.trailAudioProbe[0].effects.length)).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator("#stage")).toHaveAttribute("data-assets", "ready");
  await page.mouse.click(300, 300);
  await expect.poll(() => playingMusic(page)).toBe(true);
});

test("a tap during slow artwork loading also starts native music", async ({ page }) => {
  await observeAudio(page);
  let release!: () => void;
  const artworkGate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/rider-gallop-v2.webp", async route => { await artworkGate; await route.continue(); });
  await page.goto("/pierogi-trail/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#stage")).toHaveAttribute("data-assets", "loading");
  await page.mouse.click(300, 300);
  await expect.poll(() => playingMusic(page)).toBe(true);
  await expect.poll(() => state(page)).toBe("suspended");
  release();
  await expect(page.locator("#stage")).toHaveAttribute("data-assets", "ready");
  await expect.poll(() => state(page)).toBe("running");
  await expect.poll(() => playingMusic(page)).toBe(true);
});

test("pickup effects stay sparse alongside the music", async ({ page }) => {
  await observeAudio(page);
  await page.goto("/pierogi-trail/");
  await expect(page.locator("#stage")).toHaveAttribute("data-assets", "ready");
  await page.mouse.click(300, 300);
  await expect.poll(() => playingMusic(page)).toBe(true);
  await page.waitForTimeout(4100);
  const pickups = await page.evaluate(() => window.trailAudioProbe[0].effects.filter(effect => effect.frequency > 300));
  expect(pickups.length).toBeGreaterThanOrEqual(2);
  expect(pickups.length).toBeLessThanOrEqual(5);
  for (let i = 1; i < pickups.length; i++) expect(pickups[i].time - pickups[i - 1].time).toBeGreaterThanOrEqual(0.85);
});

test("hiding the page pauses both native music and effects until the ride resumes", async ({ page }) => {
  await observeAudio(page);
  await page.goto("/pierogi-trail/");
  await expect(page.locator("#stage")).toHaveAttribute("data-assets", "ready");
  await page.mouse.click(300, 300);
  await expect.poll(() => playingMusic(page)).toBe(true);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator("#stage")).toHaveAttribute("data-mode", "paused");
  await expect.poll(() => state(page)).toBe("suspended");
  expect(await playingMusic(page)).toBe(false);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(await playingMusic(page)).toBe(false);
  await page.mouse.click(300, 300);
  await expect.poll(() => playingMusic(page)).toBe(true);
});

test("native touchend unlocks music when pointer events and autoplay are rejected", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await observeAudio(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "audioSession", { value: { type: "auto" } });
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (window.event?.type !== "touchend") return Promise.reject(new DOMException("Touch required", "NotAllowedError"));
      return play.call(this);
    };
  });
  await page.goto("/pierogi-trail/");
  await expect(page.locator("#stage")).toHaveAttribute("data-assets", "ready");
  expect(await playingMusic(page)).toBe(false);
  await page.touchscreen.tap(195, 300);
  await expect.poll(() => playingMusic(page)).toBe(true);
  expect(await page.evaluate(() => (navigator as Navigator & { audioSession: { type: string } }).audioSession.type)).toBe("playback");
  await expect(page.getByRole("button")).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveAttribute("data-jumps", "1");
  await context.close();
});

test("unavailable Web Audio and storage do not silence native music or stop the ride", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new Error("Storage blocked"); } });
    window.AudioContext = class { constructor() { throw new Error("Web Audio unavailable"); } } as unknown as typeof AudioContext;
  });
  await page.goto("/pierogi-trail/");
  await expect(page.locator("#stage")).toHaveAttribute("data-assets", "ready");
  await page.mouse.click(300, 300);
  await expect(page.locator("canvas")).toHaveAttribute("data-jumps", "1");
  await expect.poll(() => playingMusic(page)).toBe(true);
  await page.keyboard.press("KeyP");
  await page.mouse.click(300, 300);
  await expect(page.locator("#stage")).toHaveAttribute("data-mode", "playing");
  await expect.poll(() => playingMusic(page)).toBe(true);
  expect(errors).toEqual([]);
});

test("completion goes quiet after the finale and replay restarts the soundtrack", async ({ page }) => {
  test.setTimeout(120000);
  await observeAudio(page);
  await page.clock.install();
  await page.goto("/pierogi-trail/");
  await expect(page.locator("#stage")).toHaveAttribute("data-assets", "ready");
  await page.mouse.click(300, 300);
  await expect.poll(() => playingMusic(page)).toBe(true);
  await page.evaluate(() => {
    const raf = requestAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => raf(t => callback(t * 4));
  });
  await page.clock.runFor(47000);
  await expect(page.locator("#stage")).toHaveAttribute("data-mode", "finished");
  expect(await playingMusic(page)).toBe(false);
  const effects = await page.evaluate(() => window.trailAudioProbe[0].effects);
  expect(effects.slice(-4).map(effect => Math.round(effect.frequency))).toEqual([392, 494, 587, 784]);
  await page.clock.runFor(1600);
  await expect.poll(() => state(page)).toBe("suspended");
  await page.mouse.click(300, 300);
  await expect(page.locator("#stage")).toHaveAttribute("data-mode", "playing");
  await expect.poll(() => playingMusic(page)).toBe(true);
  expect(await musicTime(page)).toBeLessThan(1);
});
