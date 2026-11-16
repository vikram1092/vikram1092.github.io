import ts from 'typescript';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

// Offline production only. The phone downloads one stereo MP3, never the
// SoundFont, MIDI, synth, or rendering dependencies. SFX are mixed separately.
const source = await readFile(new URL('./pierogi-trail-score.ts', import.meta.url), 'utf8');
const module = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const { createCountryScore } = await import('data:text/javascript;base64,' + Buffer.from(module).toString('base64'));
const score = createCountryScore();
const cache = join(tmpdir(), 'pierogi-country');
await mkdir(cache, { recursive: true });
const soundfont = process.env.TRAIL_SOUNDFONT || join(cache, 'GeneralUser-GS.sf2');
const revision = '684543d5e5efaef08d02be50dcda8d552478fa60';
const expectedHash = '9575028c7a1f589f5770fccc8cff2734566af40cd26ed836944e9a5152688cfe';
let bank;
try { bank = await readFile(soundfont); }
catch {
  if (process.env.TRAIL_SOUNDFONT) throw new Error('TRAIL_SOUNDFONT does not exist');
  const response = await fetch(`https://raw.githubusercontent.com/mrbumpy409/GeneralUser-GS/${revision}/GeneralUser-GS.sf2`);
  if (!response.ok) throw new Error(`SoundFont download failed: ${response.status}`);
  bank = Buffer.from(await response.arrayBuffer());
  await writeFile(soundfont, bank);
}
if (createHash('sha256').update(bank).digest('hex') !== expectedHash)
  throw new Error('Use the pinned GeneralUser GS 2.0.3 SoundFont; hash mismatch');

const temporary = await mkdtemp(join(tmpdir(), 'pierogi-country-render-'));
const output = new URL('../public/pierogi-trail/audio/cowboy-country-v1.mp3', import.meta.url);
try {
  const midi = join(temporary, 'country.mid');
  const wave = join(temporary, 'band.wav');
  await writeFile(midi, score.midi);
  await mkdir(new URL('.', output), { recursive: true });
  execFileSync('fluidsynth', [
    '-ni', '-g', '0.5', '-r', '44100', '-T', 'wav', '-O', 'float', '-F', wave,
    '-o', 'synth.chorus.active=0', '-o', 'synth.reverb.room-size=0.28',
    '-o', 'synth.reverb.damp=0.55', '-o', 'synth.reverb.level=0.22',
    '-o', 'synth.reverb.width=35', soundfont, midi,
  ], { stdio: 'pipe' });
  // Keep the second pass: the opening already has the previous turnaround's
  // room/reverb tail. Tiny edge fades avoid a click without a silent lead-in.
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-ss', String(score.seconds), '-i', wave,
    '-t', String(score.seconds), '-af',
    `highpass=f=38,loudnorm=I=-20:TP=-2.5:LRA=8,afade=t=in:d=0.003,afade=t=out:st=${score.seconds - .003}:d=0.003`,
    '-ar', '44100', '-ac', '2', '-codec:a', 'libmp3lame', '-b:a', '160k',
    '-map_metadata', '-1', '-metadata', 'title=Saddle Up the Pierogi Trail',
    output.pathname,
  ]);
  console.log(JSON.stringify({ output: output.pathname, seconds: score.seconds, bpm: score.bpm, instruments: score.instruments }));
} finally { await rm(temporary, { recursive: true, force: true }); }
