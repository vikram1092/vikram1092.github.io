// Original Pierogi Trail score. Render with render-pierogi-trail-music.mjs.
const EIGHTH = 60 / 104 / 2;
const BAR = EIGHTH * 8;
const SONG_LENGTH = BAR * 32;
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

// An original, unhurried G-major trail tune. Zeroes leave room between phrases.
const MELODY = [
  [71, 0, 74, 76, 74, 0, 71, 69],
  [67, 0, 69, 71, 69, 0, 0, 0],
  [67, 0, 71, 74, 76, 0, 74, 71],
  [69, 0, 66, 69, 74, 0, 0, 0],
  [71, 0, 74, 76, 79, 0, 76, 74],
  [76, 0, 74, 71, 69, 0, 67, 0],
  [69, 0, 71, 69, 66, 0, 69, 0],
  [67, 0, 0, 0, 0, 0, 0, 0],
  [76, 0, 79, 0, 78, 76, 74, 0],
  [76, 0, 74, 71, 67, 0, 0, 0],
  [71, 0, 74, 0, 71, 69, 67, 0],
  [69, 0, 74, 0, 78, 0, 0, 0],
  [76, 0, 74, 71, 69, 0, 67, 0],
  [71, 0, 69, 67, 64, 0, 67, 0],
  [69, 0, 71, 74, 69, 0, 66, 0],
  [67, 0, 0, 0, 0, 0, 0, 0],
];
const CHORDS = [
  [43, 55, 59, 62], [48, 55, 60, 64], [40, 55, 59, 64], [38, 54, 57, 62],
  [43, 55, 59, 62], [48, 55, 60, 64], [38, 54, 57, 62], [43, 55, 59, 62],
  [40, 55, 59, 64], [48, 55, 60, 64], [43, 55, 59, 62], [38, 54, 57, 62],
  [48, 55, 60, 64], [40, 55, 59, 64], [38, 54, 57, 62], [43, 55, 59, 62],
];

/** Render once, then use sample-accurate looping without a timer per note. */
export async function makeSong() {
  const context = new OfflineAudioContext(1, Math.ceil(SONG_LENGTH * 22050), 22050);
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 2100;
  filter.Q.value = 0.45;
  filter.connect(context.destination);
  const pulse = context.createPeriodicWave(
    new Float32Array(6), new Float32Array([0, 1, 0, 0.22, 0, 0.08]),
  );
  function note(midi: number, at: number, length: number, volume: number, lead = false) {
    const oscillator = context.createOscillator(), gain = context.createGain();
    if (lead) oscillator.setPeriodicWave(pulse);
    else oscillator.type = "triangle";
    oscillator.frequency.value = hz(midi);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
    gain.gain.linearRampToValueAtTime(0, at + length + 0.02);
    oscillator.connect(gain).connect(filter);
    oscillator.start(at);
    oscillator.stop(at + length + 0.025);
  }
  for (let bar = 0; bar < 32; bar++) {
    const chord = CHORDS[bar % 16];
    const start = bar * BAR;
    MELODY[bar % 16].forEach((midi, beat) => {
      if (midi) note(midi, start + beat * EIGHTH, EIGHTH * 1.35, 0.12, true);
    });
    // Soft triangle bass and offbeat plucks give a galloping, handheld-game feel.
    for (const beat of [0, 4])
      note(chord[0] + (beat === 4 ? 7 : 0), start + beat * EIGHTH, EIGHTH * 1.7, 0.105);
    for (const beat of [2, 6]) {
      note(chord[1], start + beat * EIGHTH, EIGHTH * 0.8, 0.035);
      note(chord[2], start + beat * EIGHTH, EIGHTH * 0.8, 0.028);
    }
    // A lighter second pass makes the loop a full 74-second arrangement.
    if (bar >= 16 && bar % 4 !== 3)
      note(chord[3] + 12, start + 7 * EIGHTH, EIGHTH * 0.65, 0.026);
  }
  return context.startRendering();
}

