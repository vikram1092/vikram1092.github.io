/** Original country instrumental: Saddle Up the Pierogi Trail.
 * 48 bars: guitar intro, fiddle verse, slide-guitar break, full-band choruses,
 * and a looping turnaround. GeneralUser GS sampled instruments; SFX separate.
 */
export const BPM = 108;
export const BARS = 48;
export const SECONDS = BARS * 4 * 60 / BPM;
const PPQ = 960;
type Event = { tick: number; bytes: number[]; priority: number };
type Phrase = [number, number][];
type Chord = { root: number; fifth: number; guitar: number[]; high: number[] };
const CHORDS: Record<string, Chord> = {
  G: { root: 43, fifth: 38, guitar: [43, 50, 55, 59, 62, 67], high: [67, 71, 74] },
  C: { root: 36, fifth: 43, guitar: [48, 52, 55, 60, 64], high: [67, 72, 76] },
  D: { root: 38, fifth: 45, guitar: [50, 57, 62, 66], high: [69, 74, 78] },
  D7: { root: 38, fifth: 45, guitar: [50, 57, 60, 66], high: [66, 69, 72] },
  Em: { root: 40, fifth: 47, guitar: [40, 47, 52, 55, 59, 64], high: [67, 71, 76] },
};
const VERSE_CHORDS = ['G','G','C','G','D','C','G','D7','G','C','G','D','Em','C','D7','G'];
const CHORUS_CHORDS = ['C','G','D','G','C','G','D7','G'];
// Each pair is [MIDI pitch (zero for rest), beats]. All phrases fill four beats.
const VERSE: Phrase[] = [
  [[74,.5],[71,.5],[67,1],[69,.5],[71,.5],[74,1]],
  [[71,1],[67,.5],[71,.5],[74,1],[0,1]],
  [[76,.5],[74,.5],[72,1],[67,.5],[69,.5],[72,1]],
  [[71,1.5],[69,.5],[67,1],[0,1]],
  [[69,.5],[71,.5],[74,1],[78,.5],[76,.5],[74,1]],
  [[76,1],[74,.5],[72,.5],[69,1],[67,1]],
  [[71,.5],[74,.5],[79,1],[78,.5],[76,.5],[74,1]],
  [[69,1],[66,.5],[69,.5],[74,1],[72,1]],
  [[71,.5],[74,.5],[79,1],[76,.5],[74,.5],[71,1]],
  [[72,1.5],[76,.5],[79,1],[0,1]],
  [[74,.5],[71,.5],[69,.5],[67,.5],[71,1],[74,1]],
  [[78,1],[76,.5],[74,.5],[69,1],[0,1]],
  [[71,.5],[76,.5],[79,1],[78,.5],[76,.5],[71,1]],
  [[72,1],[76,.5],[74,.5],[72,.5],[69,.5],[67,1]],
  [[69,.5],[71,.5],[72,1],[71,.5],[69,.5],[66,1]],
  [[67,2],[0,.5],[74,.5],[71,.5],[69,.5]],
];
const CHORUS: Phrase[] = [
  [[76,.5],[79,.5],[81,1],[79,.5],[76,.5],[74,1]],
  [[74,1],[71,.5],[74,.5],[79,1],[0,1]],
  [[78,.5],[81,.5],[79,1],[78,.5],[76,.5],[74,1]],
  [[71,1.5],[69,.5],[67,1],[0,1]],
  [[76,.5],[74,.5],[72,1],[76,1],[79,1]],
  [[71,.5],[74,.5],[79,1],[74,.5],[71,.5],[67,1]],
  [[69,.5],[74,.5],[78,.5],[81,.5],[79,.5],[78,.5],[76,.5],[74,.5]],
  [[71,1],[69,.5],[71,.5],[67,2]],
];
const SLIDE: Phrase[] = [
  [[67,1.5],[71,.5],[74,1.5],[0,.5]],
  [[74,1],[71,1],[67,1],[0,1]],
  [[72,1.5],[76,.5],[79,1],[76,1]],
  [[74,1],[71,1],[67,1.5],[0,.5]],
  [[69,1],[74,1],[78,1.5],[0,.5]],
  [[76,1],[74,1],[72,1],[69,1]],
  [[71,1],[74,1],[79,1],[74,1]],
  [[72,1],[69,1],[66,1],[0,1]],
];
const INTRO: Phrase[] = [
  [[67,.5],[71,.5],[74,.5],[79,.5],[74,1],[71,1]],
  [[72,.5],[76,.5],[79,1],[76,.5],[74,.5],[72,1]],
  [[71,.5],[74,.5],[67,1],[69,.5],[71,.5],[74,1]],
  [[78,1],[76,.5],[74,.5],[69,.5],[66,.5],[69,1]],
];
const OUTRO: Phrase[] = [
  [[79,1],[74,.5],[71,.5],[67,1],[0,1]],
  [[76,1],[71,.5],[67,.5],[64,1],[0,1]],
  [[72,.5],[76,.5],[79,1],[76,.5],[74,.5],[72,1]],
  [[69,1],[72,.5],[69,.5],[66,.5],[69,.5],[74,1]],
];
const harmony = ['G','C','G','D', ...VERSE_CHORDS, ...VERSE_CHORDS.slice(0,8), ...CHORUS_CHORDS, ...CHORUS_CHORDS, 'G','Em','C','D7'];
const INSTRUMENTS = [
  { ch: 0, bank: 0, program: 25, name: 'Acoustic rhythm guitar', volume: 100, pan: 43, reverb: 22 },
  { ch: 1, bank: 0, program: 32, name: 'Upright bass', volume: 106, pan: 64, reverb: 10 },
  { ch: 2, bank: 0, program: 110, name: 'Fiddle', volume: 89, pan: 72, reverb: 33 },
  { ch: 3, bank: 0, program: 105, name: 'Banjo', volume: 63, pan: 86, reverb: 18 },
  { ch: 4, bank: 8, program: 26, name: 'Hawaiian slide guitar', volume: 91, pan: 60, reverb: 39 },
  { ch: 5, bank: 16, program: 25, name: 'Mandolin', volume: 73, pan: 34, reverb: 20 },
  { ch: 6, bank: 0, program: 110, name: 'Fiddle harmony', volume: 59, pan: 87, reverb: 35 },
  { ch: 7, bank: 0, program: 25, name: 'Acoustic lead guitar', volume: 110, pan: 67, reverb: 29 },
  { ch: 9, bank: 0, program: 40, name: 'Brushed drum kit', volume: 83, pan: 64, reverb: 15 },
];
function variable(value: number) {
  const bytes = [value & 127];
  while ((value >>= 7)) bytes.unshift((value & 127) | 128);
  return bytes;
}
function uint(value: number, bytes: number) {
  return Array.from({ length: bytes }, (_, i) => value >>> ((bytes - i - 1) * 8) & 255);
}
const text = (value: string) => Array.from(new TextEncoder().encode(value));
const swing = (beat: number) => Math.floor(beat) + (beat % 1 === .5 ? .58 : beat % 1);

/** Render two identical passes; retain the second so reverb carries into its start. */
export function createCountryScore() {
  if (harmony.length !== BARS) throw new Error('Country arrangement must be 48 bars');
  const tracks: Event[][] = Array.from({ length: 17 }, () => []);
  let random = 37;
  const vary = () => { random = (Math.imul(random, 1664525) + 1013904223) >>> 0; return random / 4294967296; };
  function event(ch: number, beat: number, bytes: number[], priority = 1) {
    tracks[ch + 1].push({ tick: Math.max(0, Math.round(beat * PPQ)), bytes, priority });
  }
  function cc(ch: number, ctrl: number, value: number, beat = 0) { event(ch, beat, [0xb0 + ch, ctrl, value], -1); }
  function bend(ch: number, semitones: number, beat: number) {
    const value = Math.round(8192 + semitones * 4096);
    event(ch, beat, [0xe0 + ch, value & 127, value >> 7], 0);
  }
  function note(ch: number, pitch: number, beat: number, length: number, velocity: number, loose = true) {
    const at = Math.max(0, beat + (loose ? (vary() - .5) * .025 : 0));
    const level = Math.round(Math.min(115, Math.max(1, velocity + (vary() - .5) * 9)));
    event(ch, at, [0x90 + ch, pitch, level]);
    event(ch, at + length, [0x80 + ch, pitch, 0], 0);
  }
  function strum(ch: number, pitches: number[], beat: number, length: number, velocity: number, up = false) {
    const strings = up ? [...pitches].reverse() : pitches;
    strings.forEach((pitch, i) => note(ch, pitch, beat + i * .013, length - i * .013, velocity - i * 1.6));
  }
  function phrase(ch: number, notes: Phrase, start: number, velocity: number, sliding = false) {
    let position = 0;
    for (const [pitch, length] of notes) {
      const at = start + swing(position);
      const duration = Math.max(.12, swing(position + length) - swing(position) - (ch === 7 ? .04 : .025));
      if (pitch) {
        if (sliding) {
          bend(ch, -1.4, at);
          for (let step = 1; step <= 8; step++) bend(ch, -1.4 * (1 - step / 8) ** 2, at + step * .023);
        }
        note(ch, pitch, at, duration, velocity + (position % 1 === 0 ? 3 : -5), !sliding);
      }
      position += length;
    }
    if (position !== 4) throw new Error('Each melody phrase must fill one bar');
  }
  const tempo = Math.round(60_000_000 / BPM);
  tracks[0].push({ tick: 0, bytes: [0xff, 0x51, 3, ...uint(tempo, 3)], priority: 0 });
  tracks[0].push({ tick: 0, bytes: [0xff, 0x58, 4, 4, 2, 24, 8], priority: 0 });
  for (const { ch, bank, program, name, volume, pan, reverb } of INSTRUMENTS) {
    event(ch, 0, [0xff, 3, ...variable(text(name).length), ...text(name)], -3);
    cc(ch, 0, bank); cc(ch, 32, 0); event(ch, 0, [0xc0 + ch, program], -1);
    cc(ch, 7, volume); cc(ch, 10, pan); cc(ch, 91, reverb); cc(ch, 93, 0);
    cc(ch, 101, 0); cc(ch, 100, 0); cc(ch, 6, 2); cc(ch, 38, 0); cc(ch, 101, 127); cc(ch, 100, 127);
  }
  cc(2, 1, 13); cc(6, 1, 10);
  for (let pass = 0; pass < 2; pass++) {
    random = 37;
    for (let bar = 0; bar < BARS; bar++) {
      const start = (pass * BARS + bar) * 4;
      const chord = CHORDS[harmony[bar]];
      const chorus = bar >= 28 && bar < 44;
      const guitarBreak = bar >= 20 && bar < 28;
      const energy = chorus ? 1 : bar < 4 ? .84 : .94;
      // Country boom-chuck: picked low strings and alternating down/up strums.
      note(0, chord.guitar[0], start, .7, 72 * energy);
      note(0, chord.guitar[1], start + 2, .7, 66 * energy);
      strum(0, chord.guitar.slice(1), start + 1, .68, 65 * energy);
      strum(0, chord.guitar.slice(1), start + 3, .65, 69 * energy);
      for (const beat of [1.58, 3.58]) strum(0, chord.guitar.slice(-3), start + beat, .28, 39 * energy, true);
      note(1, chord.root, start, .82, 83 * energy);
      note(1, chord.fifth, start + 2, .8, 77 * energy);
      if (bar % 4 === 3) {
        const next = CHORDS[harmony[(bar + 1) % BARS]].root;
        note(1, next - 2, start + 3, .4, 64);
        note(1, next - 1, start + 3.58, .33, 58);
      }
      for (const beat of [1, 3]) strum(5, chord.high, start + beat + .015, .19, chorus ? 61 : 44);
      for (const beat of [0, 2]) note(9, 36, start + beat, .15, 48 * energy);
      for (const beat of [1, 3]) note(9, 38, start + beat + .012, .24, 51 * energy);
      for (let eighth = 0; eighth < 8; eighth++) note(9, 42, start + swing(eighth / 2), .10, (eighth % 2 ? 21 : 29) * energy);
      if (chorus) for (const beat of [1, 3]) note(9, 54, start + beat, .13, 35);
      if (bar % 8 === 7) {
        note(9, 38, start + 3.58, .18, 34);
        note(9, 38, start + 3.82, .12, 28);
      }
      // Rolling banjo in the chorus, shorter answers in the verse.
      if (chorus || guitarBreak || (bar >= 4 && bar < 20 && bar % 2 === 1)) {
        const roll = [chord.high[0], chord.high[2], chord.high[1], 79, chord.high[0], chord.high[1], chord.high[2], 79];
        roll.forEach((pitch, eighth) => note(3, pitch, start + swing(eighth / 2) + .02, .31, chorus ? 51 : 40));
      }
      if (bar < 4) {
        phrase(7, INTRO[bar], start, 91);
        if (bar % 2 === 1) phrase(4, [[0,2],[chord.high[1],1],[chord.high[0],1]], start, 62, true);
      } else if (bar < 20) {
        phrase(2, VERSE[bar - 4], start, 79);
        if ([1,3,9,11].includes(bar - 4)) phrase(4, [[0,3],[chord.high[1],.5],[chord.high[0],.5]], start, 65, true);
      } else if (guitarBreak) {
        phrase(4, SLIDE[bar - 20], start, 86, true);
        if (bar % 2 === 1) note(2, chord.high[0], start + 2.5, 1.3, 53);
      } else if (chorus) {
        const chorusBar = (bar - 28) % 8;
        phrase(2, CHORUS[chorusBar], start, bar < 36 ? 84 : 89);
        for (const beat of [0, 2]) note(6, chord.high[1], start + beat + .025, 1.6, 53);
        if (chorusBar === 1 || chorusBar === 3) phrase(4, [[0,3],[chord.high[2],.5],[chord.high[1],.5]], start, 70, true);
      } else phrase(7, OUTRO[bar - 44], start, 89);
    }
  }
  const chunks = tracks.filter(track => track.length).map(track => {
    track.sort((a, b) => a.tick - b.tick || a.priority - b.priority);
    let last = 0;
    const bytes: number[] = [];
    for (const event of track) {
      bytes.push(...variable(event.tick - last), ...event.bytes);
      last = event.tick;
    }
    bytes.push(...variable(Math.max(0, BARS * 8 * PPQ - last)), 0xff, 0x2f, 0);
    return [...text('MTrk'), ...uint(bytes.length, 4), ...bytes];
  });
  return {
    midi: new Uint8Array([...text('MThd'), 0, 0, 0, 6, 0, 1, ...uint(chunks.length, 2), ...uint(PPQ, 2), ...chunks.flat()]),
    seconds: SECONDS,
    bpm: BPM,
    instruments: INSTRUMENTS.map(instrument => instrument.name),
  };
}
