/**
 * Listens to a decoded buffer and describes it: loudness, dynamics, tonal balance,
 * noise floor, stereo image and how likely it is to be a human vocal over music.
 * Everything here is read-only — the enhancer turns these numbers into decisions.
 */

export type BandKey = "sub" | "bass" | "lowMid" | "mid" | "highMid" | "presence" | "air";

export interface Band {
  key: BandKey;
  label: string;
  loHz: number;
  hiHz: number;
}

/** Musical bands, measured against a pink-noise reference so 0 dB reads as "balanced". */
export const BANDS: Band[] = [
  { key: "sub", label: "Sub", loHz: 20, hiHz: 60 },
  { key: "bass", label: "Bass", loHz: 60, hiHz: 250 },
  { key: "lowMid", label: "Low mids", loHz: 250, hiHz: 500 },
  { key: "mid", label: "Mids", loHz: 500, hiHz: 2000 },
  { key: "highMid", label: "Upper mids", loHz: 2000, hiHz: 6000 },
  { key: "presence", label: "Presence", loHz: 6000, hiHz: 10000 },
  { key: "air", label: "Air", loHz: 10000, hiHz: 20000 },
];

export interface AudioAnalysis {
  durationSec: number;
  sampleRate: number;
  channels: number;
  /** Sample peak in dBFS */
  peakDb: number;
  /** Gated loudness, ITU-R BS.1770 style */
  loudnessLufs: number;
  /** Peak minus loudness — high means dynamic, low means already squashed */
  crestDb: number;
  /** Quiet-passage level in dBFS; a high floor means hiss, hum or room tone */
  noiseFloorDb: number;
  /** Loud passages minus quiet passages */
  dynamicRangeDb: number;
  /**
   * Whether the track ever drops to near-silence. Without a gap there is no
   * background to measure, so {@link noiseFloorDb} describes the music itself
   * and must not be treated as noise.
   */
  hasQuietGaps: boolean;
  /** Share of samples sitting at full scale (already distorted) */
  clippedPercent: number;
  dcOffset: number;
  /** Per-band level relative to a pink reference, in dB */
  bands: Record<BandKey, number>;
  centroidHz: number;
  /** Where the spectrum stops — ~16 kHz means a low-bitrate source */
  bandwidthHz: number;
  /** 5–9 kHz energy relative to the upper mids: high means harsh "s" sounds */
  sibilanceDb: number;
  /** 200–400 Hz build-up relative to the mids */
  muddinessDb: number;
  isStereo: boolean;
  /** -1 (out of phase) … 1 (mono) */
  stereoCorrelation: number;
  /** 0 = mono, 1 = very wide */
  stereoWidth: number;
  /** 0–1 confidence that a human voice is present */
  vocalLikelihood: number;
  /** 0–1 confidence that instrumental backing is present */
  musicLikelihood: number;
  tags: string[];
}

export type AnalyzeProgress = (fraction: number) => void;

const yieldToUi = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const toDb = (amplitude: number): number => 20 * Math.log10(Math.max(amplitude, 1e-9));
const powerDb = (power: number): number => 10 * Math.log10(Math.max(power, 1e-12));

const mixToMono = (buffer: AudioBuffer): Float32Array => {
  const mono = new Float32Array(buffer.length);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) mono[i] += data[i] / buffer.numberOfChannels;
  }
  return mono;
};

const percentile = (sorted: number[], p: number): number =>
  sorted.length === 0 ? -90 : sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];

/* ---------------------------------------------------------------- loudness */

interface BiquadCoeffs {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

const filterInPlace = (data: Float32Array, { b0, b1, b2, a1, a2 }: BiquadCoeffs): void => {
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < data.length; i++) {
    const x0 = data[i];
    const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
    data[i] = y0;
  }
};

/** RBJ high shelf, used for the +4 dB head model of K-weighting. */
const highShelfCoeffs = (
  sampleRate: number,
  freq: number,
  gainDb: number,
  q: number
): BiquadCoeffs => {
  const A = Math.pow(10, gainDb / 40);
  const w0 = (2 * Math.PI * freq) / sampleRate;
  const cos = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * q);
  const sqrtA = 2 * Math.sqrt(A) * alpha;
  const a0 = A + 1 - (A - 1) * cos + sqrtA;
  return {
    b0: (A * (A + 1 + (A - 1) * cos + sqrtA)) / a0,
    b1: (-2 * A * (A - 1 + (A + 1) * cos)) / a0,
    b2: (A * (A + 1 + (A - 1) * cos - sqrtA)) / a0,
    a1: (2 * (A - 1 - (A + 1) * cos)) / a0,
    a2: (A + 1 - (A - 1) * cos - sqrtA) / a0,
  };
};

const highPassCoeffs = (sampleRate: number, freq: number, q: number): BiquadCoeffs => {
  const w0 = (2 * Math.PI * freq) / sampleRate;
  const cos = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * q);
  const a0 = 1 + alpha;
  return {
    b0: (1 + cos) / 2 / a0,
    b1: -(1 + cos) / a0,
    b2: (1 + cos) / 2 / a0,
    a1: (-2 * cos) / a0,
    a2: (1 - alpha) / a0,
  };
};

/**
 * Gated loudness in LUFS (BS.1770-4): K-weight every channel, average 400 ms blocks,
 * then drop blocks below the absolute (-70 LUFS) and relative (-10 LU) gates.
 */
export const measureLoudness = (buffer: AudioBuffer): number => {
  const { sampleRate, length } = buffer;
  const shelf = highShelfCoeffs(sampleRate, 1681.97, 3.999, 0.7071752);
  const hp = highPassCoeffs(sampleRate, 38.13, 0.5003);

  const blockSize = Math.round(sampleRate * 0.4);
  if (length < blockSize) return -70;
  const hop = Math.round(blockSize / 4);
  const blockCount = Math.floor((length - blockSize) / hop) + 1;
  const sums = new Float64Array(blockCount);

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const weighted = Float32Array.from(buffer.getChannelData(ch));
    filterInPlace(weighted, shelf);
    filterInPlace(weighted, hp);
    // Sliding sum of squares, so each extra block costs O(hop) not O(blockSize)
    let window = 0;
    for (let i = 0; i < blockSize; i++) window += weighted[i] * weighted[i];
    sums[0] += window / blockSize;
    for (let b = 1; b < blockCount; b++) {
      const start = b * hop;
      for (let i = start - hop; i < start; i++) window -= weighted[i] * weighted[i];
      for (let i = start + blockSize - hop; i < start + blockSize; i++) {
        window += weighted[i] * weighted[i];
      }
      sums[b] += window / blockSize;
    }
  }

  const loudnessOf = (meanSquare: number): number => -0.691 + powerDb(meanSquare);
  const mean = (values: number[]): number => values.reduce((sum, v) => sum + v, 0) / values.length;

  const aboveAbsolute: number[] = [];
  for (let b = 0; b < blockCount; b++) if (loudnessOf(sums[b]) > -70) aboveAbsolute.push(sums[b]);
  if (aboveAbsolute.length === 0) return -70;

  const relativeGate = loudnessOf(mean(aboveAbsolute)) - 10;
  const gated = aboveAbsolute.filter((ms) => loudnessOf(ms) > relativeGate);
  return loudnessOf(mean(gated.length > 0 ? gated : aboveAbsolute));
};

/* -------------------------------------------------------------------- fft */

const fftInPlace = (re: Float32Array, im: Float32Array): void => {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i];
      re[i] = re[j];
      re[j] = tr;
      const ti = im[i];
      im[i] = im[j];
      im[j] = ti;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len;
    const wr = Math.cos(angle);
    const wi = Math.sin(angle);
    const half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < half; k++) {
        const ar = re[i + k];
        const ai = im[i + k];
        const br = re[i + k + half] * cr - im[i + k + half] * ci;
        const bi = re[i + k + half] * ci + im[i + k + half] * cr;
        re[i + k] = ar + br;
        im[i + k] = ai + bi;
        re[i + k + half] = ar - br;
        im[i + k + half] = ai - bi;
        const nr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nr;
      }
    }
  }
};

const FFT_SIZE = 2048;
const MAX_ANALYSIS_SEC = 45;

interface SpectralResult {
  /** Average power per bin */
  spectrum: Float64Array;
  /** 200–4000 Hz energy per window, for syllable detection */
  vocalEnvelope: Float32Array;
  /** Total energy per window */
  totalEnvelope: Float32Array;
  binHz: number;
  windowRateHz: number;
}

const analyzeSpectrum = async (
  mono: Float32Array,
  sampleRate: number,
  onProgress?: AnalyzeProgress
): Promise<SpectralResult> => {
  // Centred excerpt, so intros and fade-outs don't skew the picture
  const maxSamples = Math.floor(MAX_ANALYSIS_SEC * sampleRate);
  const start = mono.length > maxSamples ? Math.floor((mono.length - maxSamples) / 2) : 0;
  const end = Math.min(mono.length, start + maxSamples);
  const hop = FFT_SIZE / 2;
  const windowCount = Math.max(1, Math.floor((end - start - FFT_SIZE) / hop) + 1);

  const hann = new Float32Array(FFT_SIZE);
  for (let i = 0; i < FFT_SIZE; i++) hann[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / FFT_SIZE);

  const bins = FFT_SIZE / 2;
  const binHz = sampleRate / FFT_SIZE;
  const spectrum = new Float64Array(bins);
  const vocalEnvelope = new Float32Array(windowCount);
  const totalEnvelope = new Float32Array(windowCount);
  const re = new Float32Array(FFT_SIZE);
  const im = new Float32Array(FFT_SIZE);

  const vocalLo = Math.max(1, Math.floor(200 / binHz));
  const vocalHi = Math.min(bins - 1, Math.ceil(4000 / binHz));

  for (let w = 0; w < windowCount; w++) {
    const offset = start + w * hop;
    for (let i = 0; i < FFT_SIZE; i++) {
      re[i] = (mono[offset + i] ?? 0) * hann[i];
      im[i] = 0;
    }
    fftInPlace(re, im);

    let total = 0;
    let vocal = 0;
    for (let k = 1; k < bins; k++) {
      const power = re[k] * re[k] + im[k] * im[k];
      spectrum[k] += power;
      total += power;
      if (k >= vocalLo && k <= vocalHi) vocal += power;
    }
    totalEnvelope[w] = total;
    vocalEnvelope[w] = vocal;

    if (w % 128 === 0) {
      onProgress?.(w / windowCount);
      await yieldToUi();
    }
  }

  for (let k = 0; k < bins; k++) spectrum[k] /= windowCount;
  return { spectrum, vocalEnvelope, totalEnvelope, binHz, windowRateHz: sampleRate / hop };
};

/* ---------------------------------------------------------------- helpers */

const bandPower = (spectrum: Float64Array, binHz: number, loHz: number, hiHz: number): number => {
  const lo = Math.max(1, Math.floor(loHz / binHz));
  const hi = Math.min(spectrum.length - 1, Math.ceil(hiHz / binHz));
  let sum = 0;
  for (let k = lo; k <= hi; k++) sum += spectrum[k];
  return sum;
};

/** Share of total energy a pink-noise reference puts in this band. */
const pinkShare = (loHz: number, hiHz: number): number =>
  Math.log(hiHz / loHz) / Math.log(20000 / 20);

/**
 * How strongly an energy envelope pulses at syllable rate (2–8 Hz).
 * Sustained instruments hold steady; a sung or spoken line pulses.
 *
 * Both halves matter: the *share* of movement that happens at syllable rate,
 * and how far the level actually moves. Without the second term a dead-steady
 * pad scores as a voice, because the little movement it has is scale-free.
 */
const syllabicModulation = (envelope: Float32Array, windowRateHz: number): number => {
  if (envelope.length < 32) return 0;
  const log = new Float32Array(envelope.length);
  for (let i = 0; i < envelope.length; i++) log[i] = Math.log10(Math.max(envelope[i], 1e-12));
  const mean = log.reduce((sum, v) => sum + v, 0) / log.length;
  for (let i = 0; i < log.length; i++) log[i] -= mean;

  // Depth of the swing, in log-power units — roughly 0.35 for a sung line
  let variance = 0;
  for (let i = 0; i < log.length; i++) variance += log[i] * log[i];
  const depth = Math.min(1, Math.sqrt(variance / log.length) / 0.35);
  if (depth < 0.02) return 0;

  let inBand = 0;
  let total = 1e-12;
  for (let f = 0.5; f <= Math.min(16, windowRateHz / 2); f += 0.25) {
    const w = (2 * Math.PI * f) / windowRateHz;
    let real = 0;
    let imag = 0;
    for (let i = 0; i < log.length; i++) {
      real += log[i] * Math.cos(w * i);
      imag += log[i] * Math.sin(w * i);
    }
    const power = real * real + imag * imag;
    total += power;
    if (f >= 2 && f <= 8) inBand += power;
  }
  return (inBand / total) * depth;
};

const measureStereo = (buffer: AudioBuffer): { correlation: number; width: number } => {
  if (buffer.numberOfChannels < 2) return { correlation: 1, width: 0 };
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const step = Math.max(1, Math.floor(left.length / 400000));
  let ll = 0;
  let rr = 0;
  let lr = 0;
  let mid = 0;
  let side = 0;
  for (let i = 0; i < left.length; i += step) {
    const l = left[i];
    const r = right[i];
    ll += l * l;
    rr += r * r;
    lr += l * r;
    const m = (l + r) / 2;
    const s = (l - r) / 2;
    mid += m * m;
    side += s * s;
  }
  return {
    correlation: lr / Math.max(1e-12, Math.sqrt(ll * rr)),
    width: Math.min(1, 2 * Math.sqrt(side / Math.max(1e-12, side + mid))),
  };
};

/* --------------------------------------------------------------- analysis */

export const analyzeAudio = async (
  buffer: AudioBuffer,
  onProgress?: AnalyzeProgress
): Promise<AudioAnalysis> => {
  const { sampleRate, numberOfChannels: channels, duration } = buffer;
  const mono = mixToMono(buffer);

  let peak = 0;
  let dcSum = 0;
  let clipped = 0;
  for (let i = 0; i < mono.length; i++) {
    const v = mono[i];
    dcSum += v;
    const abs = Math.abs(v);
    if (abs > peak) peak = abs;
    if (abs >= 0.9985) clipped++;
  }
  onProgress?.(0.15);
  await yieldToUi();

  // Short-block levels give the noise floor and the loud-to-quiet spread
  const blockSize = Math.max(1, Math.floor(sampleRate * 0.05));
  const blockDbs: number[] = [];
  for (let start = 0; start + blockSize <= mono.length; start += blockSize) {
    let sum = 0;
    for (let i = start; i < start + blockSize; i++) sum += mono[i] * mono[i];
    blockDbs.push(toDb(Math.sqrt(sum / blockSize)));
  }
  blockDbs.sort((a, b) => a - b);
  const noiseFloorDb = percentile(blockDbs, 0.1);
  const loudPassageDb = percentile(blockDbs, 0.95);

  const loudnessLufs = measureLoudness(buffer);
  onProgress?.(0.35);
  await yieldToUi();

  const { spectrum, vocalEnvelope, totalEnvelope, binHz, windowRateHz } = await analyzeSpectrum(
    mono,
    sampleRate,
    (f) => onProgress?.(0.35 + f * 0.6)
  );

  const nyquist = sampleRate / 2;
  const totalPower = bandPower(spectrum, binHz, 20, Math.min(20000, nyquist));
  const bandDb = (loHz: number, hiHz: number): number => {
    const hi = Math.min(hiHz, nyquist);
    if (hi <= loHz) return -60;
    const share = bandPower(spectrum, binHz, loHz, hi) / Math.max(1e-12, totalPower);
    // Floored: an empty band is "nothing there", not -118 dB of useful detail
    return Math.max(-24, powerDb(share / pinkShare(loHz, hi)));
  };

  const bands = Object.fromEntries(BANDS.map((b) => [b.key, bandDb(b.loHz, b.hiHz)])) as Record<
    BandKey,
    number
  >;

  let weighted = 0;
  let magnitude = 0;
  for (let k = 1; k < spectrum.length; k++) {
    const m = Math.sqrt(spectrum[k]);
    weighted += m * k * binHz;
    magnitude += m;
  }
  const centroidHz = weighted / Math.max(1e-12, magnitude);

  // Energy roll-off point — exposes the hard cutoff of a low-bitrate source
  let cumulative = 0;
  let bandwidthHz = nyquist;
  for (let k = 1; k < spectrum.length; k++) {
    cumulative += spectrum[k];
    if (cumulative >= totalPower * 0.999) {
      bandwidthHz = k * binHz;
      break;
    }
  }

  const sibilanceDb = bandDb(5000, 9000) - bandDb(1000, 5000);
  const muddinessDb = bandDb(200, 400) - bandDb(800, 3000);

  const { correlation, width } = measureStereo(buffer);
  const modulation = syllabicModulation(vocalEnvelope, windowRateHz);
  const vocalShare =
    bandPower(spectrum, binHz, 200, 4000) / Math.max(1e-12, totalPower) / pinkShare(200, 4000);

  // A voice is strong, syllable-paced midrange. Backing music adds sustained
  // energy outside that band and a wider image than a dry vocal take.
  const vocalLikelihood = Math.min(
    1,
    Math.max(0, 0.55 * Math.min(1, modulation / 0.35) + 0.45 * Math.min(1, vocalShare / 1.2))
  );
  // Deliberately below and above the voice: a 130 Hz speaker fills 100–200 Hz
  // on their own, so counting that as "backing" turns every mono take into a song.
  const backingShare =
    (bandPower(spectrum, binHz, 20, 80) + bandPower(spectrum, binHz, 5000, 16000)) /
    Math.max(1e-12, totalPower);
  const sustain = 1 - Math.min(1, syllabicModulation(totalEnvelope, windowRateHz) / 0.35);

  // The clearest sign of a backing track: between the sung phrases, something
  // is still playing. A dry take drops to near-silence in those gaps.
  const sortedEnvelope = Array.from(totalEnvelope).sort((a, b) => a - b);
  const envelopeAt = (p: number): number =>
    sortedEnvelope[Math.min(sortedEnvelope.length - 1, Math.floor(sortedEnvelope.length * p))] ?? 0;
  const gapFill = envelopeAt(0.15) / Math.max(1e-12, envelopeAt(0.5));

  const musicLikelihood = Math.min(
    1,
    Math.max(
      0,
      0.3 * Math.min(1, backingShare / 0.3) +
        0.25 * sustain +
        0.2 * width +
        0.25 * Math.min(1, gapFill / 0.25)
    )
  );

  const peakDb = toDb(peak);
  const analysis: AudioAnalysis = {
    durationSec: duration,
    sampleRate,
    channels,
    peakDb,
    loudnessLufs,
    crestDb: peakDb - loudnessLufs,
    noiseFloorDb,
    dynamicRangeDb: loudPassageDb - noiseFloorDb,
    hasQuietGaps: loudPassageDb - noiseFloorDb > 10,
    clippedPercent: (clipped / mono.length) * 100,
    dcOffset: dcSum / mono.length,
    bands,
    centroidHz,
    bandwidthHz,
    sibilanceDb,
    muddinessDb,
    isStereo: channels > 1 && correlation < 0.999,
    stereoCorrelation: correlation,
    stereoWidth: width,
    vocalLikelihood,
    musicLikelihood,
    tags: [],
  };
  analysis.tags = describeAudio(analysis);
  onProgress?.(1);
  return analysis;
};

/** Short human-readable characteristics, shown before anything is changed. */
export const describeAudio = (a: AudioAnalysis): string[] => {
  const tags: string[] = [];
  if (a.vocalLikelihood > 0.55 && a.musicLikelihood > 0.5) tags.push("Vocal over music");
  else if (a.vocalLikelihood > 0.55) tags.push("Mostly voice");
  else if (a.musicLikelihood > 0.55) tags.push("Instrumental");

  if (a.loudnessLufs < -20) tags.push("Very quiet");
  else if (a.loudnessLufs > -9) tags.push("Already loud");
  if (a.crestDb > 20) tags.push("Wide dynamics");
  else if (a.crestDb < 8) tags.push("Heavily compressed");
  if (a.clippedPercent > 0.05) tags.push("Clipping");
  // Between vocal phrases a backing track is not "background noise"
  if (a.hasQuietGaps && a.musicLikelihood < 0.5 && a.noiseFloorDb > -48) {
    tags.push("Noisy background");
  }
  if (Math.abs(a.dcOffset) > 0.002) tags.push("DC offset");
  if (a.muddinessDb > 3) tags.push("Muddy low mids");
  if (a.sibilanceDb > 2.5) tags.push("Harsh sibilance");
  if (a.bands.air < -6 && a.bandwidthHz > 15000) tags.push("Dull top end");
  if (a.bands.bass > 5) tags.push("Bass heavy");
  else if (a.bands.bass < -5) tags.push("Thin low end");
  if (a.bandwidthHz < 16500) {
    tags.push(`Limited bandwidth (${(Math.round(a.bandwidthHz / 100) / 10).toFixed(1)} kHz)`);
  }
  if (a.isStereo && a.stereoWidth < 0.15) tags.push("Narrow stereo");
  if (a.stereoCorrelation < -0.2) tags.push("Phase issues");
  return tags;
};
