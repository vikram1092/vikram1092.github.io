import { chromium } from 'playwright';
import ts from 'typescript';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

// Bake the original synth score into native media so iPhone Safari can use its
// music playback route. No credentials, online services, or third-party music.
const score = await readFile(new URL('./pierogi-trail-score.ts', import.meta.url), 'utf8');
const module = ts.transpileModule(score, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const browser = await chromium.launch();
let pcm;
try {
  const page = await browser.newPage();
  pcm = await page.evaluate(async source => {
    const { makeSong } = await import('data:text/javascript;base64,' + btoa(source));
    const song = await makeSong();
    const samples = song.getChannelData(0);
    const bytes = new Uint8Array(samples.length * 2);
    const view = new DataView(bytes.buffer);
    for (let i = 0; i < samples.length; i++)
      view.setInt16(i * 2, Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), true);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192)
      binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(binary);
  }, module);
} finally { await browser.close(); }

const temporary = await mkdtemp(join(tmpdir(), 'pierogi-music-'));
const output = new URL('../public/pierogi-trail/audio/trail-theme-v1.mp3', import.meta.url);
try {
  const input = join(temporary, 'score.pcm');
  await writeFile(input, Buffer.from(pcm, 'base64'));
  await mkdir(new URL('.', output), { recursive: true });
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-f', 's16le', '-ar', '22050', '-ac', '1', '-i', input,
    '-af', 'loudnorm=I=-23:TP=-3:LRA=7', '-ar', '44100', '-codec:a', 'libmp3lame', '-b:a', '96k',
    '-map_metadata', '-1', output.pathname,
  ]);
  console.log(`Rendered ${output.pathname}`);
} finally { await rm(temporary, { recursive: true, force: true }); }
