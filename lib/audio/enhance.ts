import { getAudioContext } from "./decode";
import { measureLoudness, type AudioAnalysis } from "./analyze";

/**
 * Turns an {@link AudioAnalysis} into a mastering chain and renders it.
 * Every decision is derived from what was measured, and every decision is
 * reported back as a {@link EnhanceMove} so the listener can see what changed.
 */

export type EnhanceProgress = (fraction: number) => void;

export type EnhanceIntent = "auto" | "vocal-music" | "voice" | "music";

/**
 * How much studio *production* to put on top of the corrections.
 *
 * The corrective chain fixes what is wrong with a recording. It cannot, on its
 * own, make a phone take sound like a record — that difference is mostly
 * production: harmonic saturation, a sheen on the top, density from parallel
 * compression, a double, and a room. This picks how much of that to add.
 */
export type VocalCharacter = "auto" | "natural" | "studio" | "playback";

export interface EnhanceOptions {
  intent: EnhanceIntent;
  character: VocalCharacter;
  /** 0–1 scaling for every correction; 1 = the full suggested amount */
  strength: number;
  targetLufs: number;
  modules: {
    cleanup: boolean;
    noise: boolean;
    eq: boolean;
    deEss: boolean;
    dynamics: boolean;
    polish: boolean;
    stereo: boolean;
    loudness: boolean;
  };
}

export interface EnhanceMove {
  module: keyof EnhanceOptions["modules"];
  label: string;
  detail: string;
}

export interface EqMove {
  type: "peaking" | "lowshelf" | "highshelf";
  freq: number;
  gainDb: number;
  q: number;
}

/** The production layer: what turns a corrected take into a produced one. */
export interface PolishPlan {
  character: Exclude<VocalCharacter, "auto">;
  /** Drive into the soft-clipper, in dB, before the saturated copy is blended back */
  driveDb: number;
  /** How much of the saturated copy to blend in — warmth and harmonic density */
  satMix: number;
  /** Blend of the excited top band — the "expensive" sheen on the consonants */
  exciterMix: number;
  /** Blend of a hard-compressed copy — body and presence without killing the peaks */
  parallelMix: number;
  /** Blend of a short, stereo-offset double — the widened playback vocal sound */
  doubleMix: number;
  reverb: { mix: number; decaySec: number; preDelaySec: number; toneHz: number } | null;
}

export interface EnhancePlan {
  intent: Exclude<EnhanceIntent, "auto">;
  dcOffset: number;
  highPassHz: number;
  eq: EqMove[];
  noise: { thresholdDb: number; depthDb: number } | null;
  deEss: { freqHz: number; thresholdDb: number; amount: number } | null;
  compressor: {
    thresholdDb: number;
    ratio: number;
    attack: number;
    release: number;
    knee: number;
    makeupDb: number;
  } | null;
  polish: PolishPlan | null;
  stereoWidth: number;
  targetLufs: number;
  ceilingDb: number;
  moves: EnhanceMove[];
}

export const LOUDNESS_TARGETS = [
  { value: -16, label: "Podcast / spoken", hint: "-16 LUFS" },
  { value: -14, label: "Streaming", hint: "-14 LUFS — Spotify, YouTube, Apple" },
  { value: -11, label: "Loud master", hint: "-11 LUFS" },
  { value: -9, label: "Club / reference", hint: "-9 LUFS, heavy limiting" },
];

export const CHARACTERS: {
  value: Exclude<VocalCharacter, "auto">;
  label: string;
  hint: string;
}[] = [
  {
    value: "natural",
    label: "Natural",
    hint: "Corrections only — nothing added that wasn't recorded.",
  },
  {
    value: "studio",
    label: "Studio",
    hint: "Warmth, sheen and a small room. Still sounds like the same take.",
  },
  {
    value: "playback",
    label: "Playback",
    hint: "The full film-song treatment: saturated, doubled, dense and up front.",
  },
];

/**
 * Recipes for the production layer. These are the only hand-tuned numbers in
 * the file — everything else is derived from the measurement — because taste
 * is not something you can measure off a waveform.
 */
const CHARACTER_PRESETS: Record<Exclude<VocalCharacter, "auto">, Omit<PolishPlan, "character">> = {
  natural: {
    driveDb: 0,
    satMix: 0,
    exciterMix: 0,
    parallelMix: 0,
    doubleMix: 0,
    reverb: null,
  },
  studio: {
    driveDb: 4,
    satMix: 0.18,
    exciterMix: 0.12,
    parallelMix: 0.18,
    doubleMix: 0.08,
    reverb: { mix: 0.08, decaySec: 1.1, preDelaySec: 0.018, toneHz: 7000 },
  },
  playback: {
    // A film playback vocal is deliberately larger than life: more harmonics,
    // a wide double, and a bright plate sitting just behind the words.
    driveDb: 7,
    satMix: 0.32,
    exciterMix: 0.22,
    parallelMix: 0.3,
    doubleMix: 0.2,
    reverb: { mix: 0.16, decaySec: 1.6, preDelaySec: 0.028, toneHz: 8500 },
  },
};

export const DEFAULT_OPTIONS: EnhanceOptions = {
  intent: "auto",
  character: "auto",
  strength: 0.8,
  targetLufs: -14,
  modules: {
    cleanup: true,
    noise: true,
    eq: true,
    deEss: true,
    dynamics: true,
    polish: true,
    stereo: true,
    loudness: true,
  },
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const signed = (value: number, digits = 1): string =>
  `${value > 0 ? "+" : ""}${value.toFixed(digits)}`;

const hz = (value: number): string =>
  value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)} kHz` : `${Math.round(value)} Hz`;

/* ------------------------------------------------------------------ plan */

export const resolveIntent = (analysis: AudioAnalysis): Exclude<EnhanceIntent, "auto"> => {
  if (analysis.vocalLikelihood > 0.5 && analysis.musicLikelihood > 0.45) return "vocal-music";
  if (analysis.vocalLikelihood > 0.5) return "voice";
  return "music";
};

/**
 * A sung take over music is what people want to sound like a record, so it
 * gets the full treatment.
 *
 * A lone voice is the ambiguous one: we cannot tell a sung a cappella from a
 * podcast off the spectrum, and they want opposite things. "Studio" is the
 * safe middle — a dry vocal gains warmth and a believable room, while a spoken
 * take is only lightly flattered rather than drowned. The Finish buttons sit
 * on the result card precisely so this call can be overridden in one click.
 *
 * An instrumental is left alone: saturating someone's backing track is not
 * what they asked for.
 */
export const resolveCharacter = (
  intent: Exclude<EnhanceIntent, "auto">
): Exclude<VocalCharacter, "auto"> => {
  if (intent === "vocal-music") return "playback";
  if (intent === "voice") return "studio";
  return "natural";
};

/**
 * Picks the corrections this particular recording needs. Nothing is applied
 * blindly: each branch only fires when the measurement says it should.
 */
export const planEnhancement = (
  analysis: AudioAnalysis,
  options: EnhanceOptions
): EnhancePlan => {
  const intent = options.intent === "auto" ? resolveIntent(analysis) : options.intent;
  const s = clamp(options.strength, 0, 1);
  const { modules } = options;
  const moves: EnhanceMove[] = [];
  const eq: EqMove[] = [];

  /* Cleanup — DC offset and sub-sonic rumble that only eats headroom */
  const dcOffset = modules.cleanup && Math.abs(analysis.dcOffset) > 0.0005 ? analysis.dcOffset : 0;
  if (dcOffset !== 0) {
    moves.push({
      module: "cleanup",
      label: "Removed DC offset",
      detail: `The waveform sat ${(dcOffset * 100).toFixed(2)}% off centre, costing headroom.`,
    });
  }

  let highPassHz = 0;
  if (modules.cleanup) {
    const rumble = analysis.bands.sub - analysis.bands.bass;
    if (intent === "voice") highPassHz = 85;
    else if (rumble > 2 || analysis.bands.sub > 4) highPassHz = 45;
    else if (analysis.bands.sub > 0) highPassHz = 30;
    if (highPassHz > 0) {
      moves.push({
        module: "cleanup",
        label: `High-pass at ${hz(highPassHz)}`,
        detail:
          intent === "voice"
            ? "Clears handling noise and room rumble under the voice."
            : "Trims inaudible sub energy so the limiter works on music, not rumble.",
      });
    }
  }

  /* Noise — only when the gaps are genuinely empty. With a backing track the
     "quiet" parts are still music, and expanding them would pump the song. */
  let noise: EnhancePlan["noise"] = null;
  const gapsAreSilence = analysis.hasQuietGaps && intent === "voice";
  if (modules.noise && gapsAreSilence && analysis.noiseFloorDb > -52) {
    const depthDb = clamp((analysis.noiseFloorDb + 52) * 0.9, 3, 14) * s;
    noise = { thresholdDb: analysis.noiseFloorDb + 6, depthDb };
    moves.push({
      module: "noise",
      label: `Noise reduction −${depthDb.toFixed(1)} dB`,
      detail: `Background sat at ${analysis.noiseFloorDb.toFixed(1)} dBFS; quiet gaps are pulled down gently.`,
    });
  }

  /* Tonal balance — corrections are the inverse of what was measured */
  if (modules.eq) {
    if (analysis.muddinessDb > 1.5) {
      const gainDb = -clamp((analysis.muddinessDb - 1) * 0.8, 0.5, 5) * s;
      eq.push({ type: "peaking", freq: 300, gainDb, q: 1.1 });
      moves.push({
        module: "eq",
        label: `${signed(gainDb)} dB at 300 Hz`,
        detail: "Low mids were boxy — clearing them uncovers the vocal.",
      });
    }

    if (analysis.bands.bass < -3 && intent !== "voice") {
      const gainDb = clamp((-3 - analysis.bands.bass) * 0.6, 0.5, 4) * s;
      eq.push({ type: "lowshelf", freq: 120, gainDb, q: 0.7 });
      moves.push({
        module: "eq",
        label: `${signed(gainDb)} dB low shelf at 120 Hz`,
        detail: "The low end was thin; the shelf restores weight without mud.",
      });
    } else if (analysis.bands.bass > 4) {
      const gainDb = -clamp((analysis.bands.bass - 3) * 0.5, 0.5, 4) * s;
      eq.push({ type: "lowshelf", freq: 110, gainDb, q: 0.7 });
      moves.push({
        module: "eq",
        label: `${signed(gainDb)} dB low shelf at 110 Hz`,
        detail: "Bass was masking everything above it.",
      });
    }

    // Vocal intelligibility: a gentle lift where consonants live
    const presenceTarget = intent === "music" ? -1 : 0.5;
    if (analysis.bands.highMid < presenceTarget && analysis.sibilanceDb < 4) {
      const gainDb = clamp((presenceTarget - analysis.bands.highMid) * 0.5, 0.5, 4) * s;
      eq.push({ type: "peaking", freq: intent === "music" ? 3000 : 2600, gainDb, q: 0.9 });
      moves.push({
        module: "eq",
        label: `${signed(gainDb)} dB at ${hz(intent === "music" ? 3000 : 2600)}`,
        detail:
          intent === "music"
            ? "Adds bite so the mix cuts through on phone speakers."
            : "Lifts consonants so the words sit in front of the music.",
      });
    }

    // Air only helps when the source actually has content up there
    if (analysis.bandwidthHz > 15000 && analysis.bands.air < -3) {
      const gainDb = clamp((-3 - analysis.bands.air) * 0.4, 0.5, 3.5) * s;
      eq.push({ type: "highshelf", freq: 11000, gainDb, q: 0.7 });
      moves.push({
        module: "eq",
        label: `${signed(gainDb)} dB air shelf at 11 kHz`,
        detail: "Opens up a dull top end.",
      });
    } else if (analysis.bandwidthHz <= 15000) {
      moves.push({
        module: "eq",
        label: "Air boost skipped",
        detail: `Nothing above ${hz(analysis.bandwidthHz)} — the source is band-limited, so a shelf would only raise hiss.`,
      });
    }

    const hasTopEnd = analysis.bandwidthHz > 9000 && analysis.bands.presence > -3;
    if (hasTopEnd && (analysis.bands.air > 5 || analysis.centroidHz > 4200)) {
      const gainDb = -clamp((analysis.bands.air - 3) * 0.4, 0.5, 3) * s;
      eq.push({ type: "highshelf", freq: 9000, gainDb, q: 0.7 });
      moves.push({
        module: "eq",
        label: `${signed(gainDb)} dB at 9 kHz`,
        detail: "Tames a brittle, fatiguing top end.",
      });
    }
  }

  /* De-esser — dynamic, so it only works on the "s" sounds */
  let deEss: EnhancePlan["deEss"] = null;
  if (modules.deEss && analysis.sibilanceDb > 1 && intent !== "music") {
    const amount = clamp((analysis.sibilanceDb - 0.5) * 0.18, 0.1, 0.8) * s;
    deEss = { freqHz: analysis.centroidHz > 3500 ? 7000 : 6200, thresholdDb: -26, amount };
    moves.push({
      module: "deEss",
      label: "De-essed the vocal",
      detail: `Sibilance measured ${signed(analysis.sibilanceDb)} dB above the mids; only the harsh moments are reduced.`,
    });
  }

  /* Dynamics — ratio comes straight from the crest factor */
  let compressor: EnhancePlan["compressor"] = null;
  if (modules.dynamics && analysis.crestDb > 9) {
    const excess = analysis.crestDb - 9;
    const ratio = clamp(1 + excess * 0.28, 1.4, 5) * (intent === "voice" ? 1.15 : 1);
    const thresholdDb = clamp(analysis.loudnessLufs + 4, -32, -6);
    compressor = {
      thresholdDb,
      ratio: clamp(1 + (ratio - 1) * s, 1, 6),
      attack: intent === "music" ? 0.012 : 0.006,
      release: intent === "music" ? 0.22 : 0.14,
      knee: 8,
      makeupDb: clamp(excess * 0.25 * s, 0, 5),
    };
    moves.push({
      module: "dynamics",
      label: `Compression ${compressor.ratio.toFixed(1)}:1`,
      detail: `Crest factor was ${analysis.crestDb.toFixed(1)} dB — levelling it keeps quiet lines audible.`,
    });
  } else if (modules.dynamics) {
    moves.push({
      module: "dynamics",
      label: "Compression skipped",
      detail: `Already level at ${analysis.crestDb.toFixed(1)} dB crest — squashing it further would flatten the performance.`,
    });
  }

  /* Production — the layer that makes a corrected take sound *produced*.
     The preset sets the taste; the measurements decide how much of it the
     recording can actually take without falling apart. */
  let polish: PolishPlan | null = null;
  const character = options.character === "auto" ? resolveCharacter(intent) : options.character;
  if (modules.polish && character !== "natural") {
    const preset = CHARACTER_PRESETS[character];

    // Saturation multiplies whatever distortion is already there, so a take
    // that is already clipped gets a far gentler drive.
    const clipGuard = analysis.clippedPercent > 0.05 ? 0.45 : 1;
    // A dense, already-reverberant mix needs far less room added than a dry
    // bedroom take. Quiet gaps that fall away are the sign of a dry recording.
    const dryness = analysis.hasQuietGaps ? 1 : 0.5;
    // Excitement only has somewhere to go if the source has top end at all.
    const canExcite = analysis.bandwidthHz > 11000;
    // Doubling a mono dry vocal is the single biggest part of the sound; on an
    // already-wide mix it just smears the image.
    const widthRoom = clamp(1 - analysis.stereoWidth * 1.5, 0.2, 1);

    polish = {
      character,
      driveDb: preset.driveDb * s * clipGuard,
      satMix: preset.satMix * s * clipGuard,
      exciterMix: canExcite ? preset.exciterMix * s : 0,
      parallelMix: preset.parallelMix * s,
      doubleMix: preset.doubleMix * s * widthRoom,
      reverb: preset.reverb
        ? { ...preset.reverb, mix: preset.reverb.mix * s * dryness }
        : null,
    };

    const parts: string[] = [];
    if (polish.satMix > 0.02) parts.push("harmonic warmth");
    if (polish.exciterMix > 0.02) parts.push("top-end sheen");
    if (polish.parallelMix > 0.02) parts.push("parallel density");
    if (polish.doubleMix > 0.02) parts.push("a stereo double");
    if (polish.reverb && polish.reverb.mix > 0.01) parts.push("a plate room");
    moves.push({
      module: "polish",
      label: `${character === "playback" ? "Playback" : "Studio"} character`,
      detail:
        parts.length > 0
          ? `Added ${parts.join(", ")}. This is production, not correction — it puts the voice in a record rather than a room.`
          : "The recording was already dense and wide, so nothing was layered on top.",
    });
    if (!canExcite) {
      moves.push({
        module: "polish",
        label: "Sheen skipped",
        detail: `The source stops at ${hz(analysis.bandwidthHz)}; exciting that edge would only sharpen the codec, not the voice.`,
      });
    }
  }

  /* Stereo — widen a narrow mix, never a mono or out-of-phase one */
  let stereoWidth = 1;
  if (
    modules.stereo &&
    analysis.isStereo &&
    analysis.stereoWidth < 0.35 &&
    analysis.stereoCorrelation > 0.3
  ) {
    stereoWidth = 1 + clamp((0.35 - analysis.stereoWidth) * 1.6, 0.05, 0.5) * s;
    moves.push({
      module: "stereo",
      label: `Stereo width ×${stereoWidth.toFixed(2)}`,
      detail: "The mix was nearly mono; the sides are lifted while the vocal stays centred.",
    });
  }

  /* Loudness */
  const ceilingDb = analysis.clippedPercent > 0.05 ? -1.5 : -1;
  if (modules.loudness) {
    moves.push({
      module: "loudness",
      label: `Loudness ${analysis.loudnessLufs.toFixed(1)} LUFS → target ${options.targetLufs}`,
      detail: `Peak ceiling ${ceilingDb} dBFS, held by a look-ahead limiter rather than hard clipping. Very dynamic material may land short of the target — we stop rather than crush the performance to reach it.`,
    });
  }
  if (analysis.clippedPercent > 0.05) {
    moves.push({
      module: "cleanup",
      label: "Clipping detected",
      detail: `${analysis.clippedPercent.toFixed(2)}% of samples were already at full scale. We leave extra headroom, but the distortion baked into the recording can't be undone.`,
    });
  }

  return {
    intent,
    dcOffset,
    highPassHz,
    eq,
    noise,
    deEss,
    compressor,
    polish,
    stereoWidth,
    targetLufs: options.targetLufs,
    ceilingDb,
    moves,
  };
};

const MATERIAL_WORDS: Record<EnhancePlan["intent"], string> = {
  "vocal-music": "a vocal over music",
  voice: "a voice recording",
  music: "an instrumental",
};

/** One plain sentence, for people who don't want to read meters. */
export const summarizeEnhancement = (analysis: AudioAnalysis, plan: EnhancePlan): string => {
  const issues: string[] = [];
  const quietBy = Math.round(plan.targetLufs - analysis.loudnessLufs);
  if (quietBy >= 3) issues.push(`about ${quietBy} dB too quiet`);
  else if (quietBy <= -3) issues.push("louder than the target");
  if (analysis.muddinessDb > 1.5) issues.push("a little muddy");
  if (plan.deEss) issues.push("harsh on the S sounds");
  if (analysis.crestDb > 14) issues.push("uneven between quiet and loud parts");
  if (plan.noise) issues.push("noisy in the gaps");
  if (analysis.bands.air < -3 && analysis.bandwidthHz > 15000) issues.push("dull up top");
  if (analysis.clippedPercent > 0.05) issues.push("already clipped in places");

  const changes = plan.moves.filter((move) => !move.label.includes("skipped")).length;
  const applied = `${changes} ${changes === 1 ? "correction" : "corrections"}`;
  const material = MATERIAL_WORDS[plan.intent];
  const finish =
    plan.polish?.character === "playback"
      ? " Then we gave it the playback finish — saturated, doubled and sat in a plate — so it carries like a film song rather than a home recording."
      : plan.polish?.character === "studio"
        ? " Then we added a studio finish: a little warmth, sheen and room."
        : "";

  if (issues.length === 0) {
    return `This sounds like ${material} that already measures well, so we kept it light — ${applied}, matched to ${plan.targetLufs} LUFS.${finish}`;
  }
  const list =
    issues.length === 1
      ? issues[0]
      : `${issues.slice(0, -1).join(", ")} and ${issues[issues.length - 1]}`;
  return `This sounds like ${material} that was ${list}. We applied ${applied} and brought it to ${plan.targetLufs} LUFS.${finish}`;
};

/* --------------------------------------------------------------- rendering */

const createOffline = (buffer: AudioBuffer, channels = buffer.numberOfChannels): OfflineAudioContext =>
  new OfflineAudioContext(channels, buffer.length, buffer.sampleRate);

const copyBuffer = (buffer: AudioBuffer): AudioBuffer => {
  const copy = getAudioContext().createBuffer(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    copy.getChannelData(ch).set(buffer.getChannelData(ch));
  }
  return copy;
};

const removeDcOffset = (buffer: AudioBuffer): AudioBuffer => {
  const result = copyBuffer(buffer);
  for (let ch = 0; ch < result.numberOfChannels; ch++) {
    const data = result.getChannelData(ch);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    const offset = sum / data.length;
    if (Math.abs(offset) < 1e-5) continue;
    for (let i = 0; i < data.length; i++) data[i] -= offset;
  }
  return result;
};

/** High-pass + peaking/shelving EQ, rendered by the browser's own biquads. */
const renderEq = async (
  buffer: AudioBuffer,
  highPassHz: number,
  eq: EqMove[]
): Promise<AudioBuffer> => {
  if (highPassHz <= 0 && eq.length === 0) return buffer;
  const ctx = createOffline(buffer);
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  let node: AudioNode = source;
  if (highPassHz > 0) {
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = highPassHz;
    hp.Q.value = 0.7;
    node.connect(hp);
    node = hp;
  }
  for (const move of eq) {
    const filter = ctx.createBiquadFilter();
    filter.type = move.type;
    filter.frequency.value = move.freq;
    filter.Q.value = move.q;
    filter.gain.value = move.gainDb;
    node.connect(filter);
    node = filter;
  }
  node.connect(ctx.destination);
  source.start();
  return ctx.startRendering();
};

/** Isolates a band so the de-esser can watch it without affecting the rest. */
const renderBand = async (buffer: AudioBuffer, freqHz: number): Promise<AudioBuffer> => {
  const ctx = createOffline(buffer);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const first = ctx.createBiquadFilter();
  first.type = "highpass";
  first.frequency.value = freqHz;
  first.Q.value = 0.7;
  const second = ctx.createBiquadFilter();
  second.type = "highpass";
  second.frequency.value = freqHz;
  second.Q.value = 0.7;
  source.connect(first);
  first.connect(second);
  second.connect(ctx.destination);
  source.start();
  return ctx.startRendering();
};

/**
 * Subtracts part of the sibilance band whenever it spikes, leaving the rest
 * of the vocal untouched — the usual split-band de-esser trick.
 */
const applyDeEss = async (
  buffer: AudioBuffer,
  { freqHz, thresholdDb, amount }: NonNullable<EnhancePlan["deEss"]>
): Promise<AudioBuffer> => {
  const band = await renderBand(buffer, freqHz);
  const result = copyBuffer(buffer);
  const { sampleRate } = buffer;
  const attack = Math.exp(-1 / (sampleRate * 0.002));
  const release = Math.exp(-1 / (sampleRate * 0.06));
  const threshold = Math.pow(10, thresholdDb / 20);

  for (let ch = 0; ch < result.numberOfChannels; ch++) {
    const dst = result.getChannelData(ch);
    const bandData = band.getChannelData(Math.min(ch, band.numberOfChannels - 1));
    let envelope = 0;
    for (let i = 0; i < dst.length; i++) {
      const level = Math.abs(bandData[i]);
      const coeff = level > envelope ? attack : release;
      envelope = level + (envelope - level) * coeff;
      if (envelope <= threshold) continue;
      // How far over threshold decides how much of the band to take away
      const over = Math.min(1, (envelope - threshold) / Math.max(threshold, 1e-6));
      dst[i] -= bandData[i] * amount * over;
    }
  }
  return result;
};

/** Downward expander: audible material passes, quiet gaps are pushed further down. */
const applyNoiseReduction = (
  buffer: AudioBuffer,
  { thresholdDb, depthDb }: NonNullable<EnhancePlan["noise"]>
): AudioBuffer => {
  const result = copyBuffer(buffer);
  const { sampleRate } = buffer;
  const threshold = Math.pow(10, thresholdDb / 20);
  const floor = Math.pow(10, -depthDb / 20);
  const attack = Math.exp(-1 / (sampleRate * 0.005));
  const release = Math.exp(-1 / (sampleRate * 0.15));
  const channels = result.numberOfChannels;

  // One shared envelope keeps the stereo image stable while gating
  const envelopeGain = new Float32Array(result.length);
  let envelope = 0;
  let gain = 1;
  for (let i = 0; i < result.length; i++) {
    let level = 0;
    for (let ch = 0; ch < channels; ch++) level += Math.abs(result.getChannelData(ch)[i]);
    level /= channels;
    const coeff = level > envelope ? attack : release;
    envelope = level + (envelope - level) * coeff;
    const target = envelope >= threshold ? 1 : Math.max(floor, envelope / threshold);
    gain = target < gain ? target + (gain - target) * release : target + (gain - target) * attack;
    envelopeGain[i] = gain;
  }
  for (let ch = 0; ch < channels; ch++) {
    const data = result.getChannelData(ch);
    for (let i = 0; i < data.length; i++) data[i] *= envelopeGain[i];
  }
  return result;
};

const renderCompressor = async (
  buffer: AudioBuffer,
  settings: NonNullable<EnhancePlan["compressor"]>
): Promise<AudioBuffer> => {
  const ctx = createOffline(buffer);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = settings.thresholdDb;
  comp.ratio.value = settings.ratio;
  comp.attack.value = settings.attack;
  comp.release.value = settings.release;
  comp.knee.value = settings.knee;
  const makeup = ctx.createGain();
  makeup.gain.value = Math.pow(10, settings.makeupDb / 20);
  source.connect(comp);
  comp.connect(makeup);
  makeup.connect(ctx.destination);
  source.start();
  return ctx.startRendering();
};

/**
 * A soft-clipping curve. `tanh` rounds peaks off rather than cutting them,
 * which is what generates the even/odd harmonics we hear as "warmth" instead
 * of the buzz you get from hard clipping.
 */
const saturationCurve = (steepness: number): Float32Array<ArrayBuffer> => {
  const n = 2048;
  const curve = new Float32Array(new ArrayBuffer(n * 4));
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * steepness) / Math.tanh(steepness);
  }
  return curve;
};

/**
 * A plate-style impulse: decaying noise, decorrelated per channel, with a
 * short build-up so it reads as a room rather than a click.
 */
const plateImpulse = (ctx: OfflineAudioContext, decaySec: number): AudioBuffer => {
  const { sampleRate } = ctx;
  const length = Math.max(1, Math.floor(sampleRate * Math.min(decaySec, 3)));
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const build = Math.max(1, Math.floor(sampleRate * 0.006));
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const decay = Math.pow(1 - i / length, 2.2);
      const onset = i < build ? i / build : 1;
      data[i] = (Math.random() * 2 - 1) * decay * onset;
    }
  }
  return impulse;
};

/**
 * The production layer. Everything here is *added* to the dry signal in
 * parallel, so the original performance is never replaced — only surrounded.
 *
 * Rendered as one graph rather than a chain of passes, so the blends stay
 * sample-accurate and the whole thing costs a single offline render.
 */
const renderPolish = async (buffer: AudioBuffer, polish: PolishPlan): Promise<AudioBuffer> => {
  // Always render to stereo: the double and the plate are what create the
  // width, and a mono take is exactly the case that needs them most.
  const ctx = createOffline(buffer, 2);
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const out = ctx.createGain();
  // Parallel blends add level. The loudness stage would pull it back anyway,
  // but keeping the sum near unity stops the limiter doing it instead.
  const added = polish.satMix + polish.exciterMix * 0.6 + polish.parallelMix + polish.doubleMix;
  out.gain.value = 1 / (1 + added * 0.7);
  out.connect(ctx.destination);

  const dry = ctx.createGain();
  dry.gain.value = 1;
  source.connect(dry);
  dry.connect(out);

  if (polish.satMix > 0.005) {
    const drive = ctx.createGain();
    drive.gain.value = Math.pow(10, polish.driveDb / 20);
    const shaper = ctx.createWaveShaper();
    shaper.curve = saturationCurve(2.2);
    shaper.oversample = "4x";
    const level = ctx.createGain();
    level.gain.value = polish.satMix;
    source.connect(drive);
    drive.connect(shaper);
    shaper.connect(level);
    level.connect(out);
  }

  if (polish.exciterMix > 0.005) {
    // Only the band above the vocal fundamentals is excited, so the harmonics
    // land as air on the consonants instead of grit on the vowels.
    const band = ctx.createBiquadFilter();
    band.type = "highpass";
    band.frequency.value = 5000;
    band.Q.value = 0.7;
    const shaper = ctx.createWaveShaper();
    shaper.curve = saturationCurve(4);
    shaper.oversample = "4x";
    const level = ctx.createGain();
    level.gain.value = polish.exciterMix * 0.6;
    source.connect(band);
    band.connect(shaper);
    shaper.connect(level);
    level.connect(out);
  }

  if (polish.parallelMix > 0.005) {
    // Crushed hard on purpose: blended under the dry signal it adds body and
    // keeps the quiet syllables present, without flattening the transients.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -34;
    comp.ratio.value = 8;
    comp.attack.value = 0.003;
    comp.release.value = 0.12;
    comp.knee.value = 4;
    const level = ctx.createGain();
    level.gain.value = polish.parallelMix;
    source.connect(comp);
    comp.connect(level);
    level.connect(out);
  }

  if (polish.doubleMix > 0.005) {
    // Two short, unequal delays hard-panned: the ear reads this as two takes
    // rather than an echo, which is the widened playback-vocal sound.
    for (const [delaySec, pan] of [
      [0.017, -1],
      [0.029, 1],
    ] as const) {
      const delay = ctx.createDelay(0.1);
      delay.delayTime.value = delaySec;
      // Keep the low end mono — doubled bass just smears.
      const trim = ctx.createBiquadFilter();
      trim.type = "highpass";
      trim.frequency.value = 220;
      trim.Q.value = 0.7;
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      const level = ctx.createGain();
      level.gain.value = polish.doubleMix;
      source.connect(delay);
      delay.connect(trim);
      trim.connect(panner);
      panner.connect(level);
      level.connect(out);
    }
  }

  if (polish.reverb && polish.reverb.mix > 0.005) {
    const { mix, decaySec, preDelaySec, toneHz } = polish.reverb;
    const preDelay = ctx.createDelay(0.2);
    preDelay.delayTime.value = preDelaySec;
    // The pre-delay is what keeps the words intelligible: the tail starts
    // after the consonant has already landed.
    const convolver = ctx.createConvolver();
    convolver.normalize = true;
    convolver.buffer = plateImpulse(ctx, decaySec);
    const lowCut = ctx.createBiquadFilter();
    lowCut.type = "highpass";
    lowCut.frequency.value = 300;
    lowCut.Q.value = 0.7;
    const highCut = ctx.createBiquadFilter();
    highCut.type = "lowpass";
    highCut.frequency.value = toneHz;
    highCut.Q.value = 0.7;
    const level = ctx.createGain();
    level.gain.value = mix;
    source.connect(preDelay);
    preDelay.connect(convolver);
    convolver.connect(lowCut);
    lowCut.connect(highCut);
    highCut.connect(level);
    level.connect(out);
  }

  source.start();
  return ctx.startRendering();
};

/** Mid/side widening that leaves the centre (where the voice lives) alone. */
const applyStereoWidth = (buffer: AudioBuffer, width: number): AudioBuffer => {
  if (buffer.numberOfChannels < 2 || Math.abs(width - 1) < 0.01) return buffer;
  const result = copyBuffer(buffer);
  const left = result.getChannelData(0);
  const right = result.getChannelData(1);
  for (let i = 0; i < left.length; i++) {
    const mid = (left[i] + right[i]) / 2;
    const side = ((left[i] - right[i]) / 2) * width;
    left[i] = mid + side;
    right[i] = mid - side;
  }
  return result;
};

/**
 * Applies a fixed gain, then a look-ahead peak limiter so transients are held
 * under the ceiling without the crunch of hard clipping.
 */
const applyGainAndLimit = (buffer: AudioBuffer, gainDb: number, ceilingDb: number): AudioBuffer => {
  const result = copyBuffer(buffer);
  const { sampleRate, numberOfChannels: channels } = result;
  const gain = Math.pow(10, gainDb / 20);
  const ceiling = Math.pow(10, ceilingDb / 20);
  const lookahead = Math.max(1, Math.floor(sampleRate * 0.003));
  const release = Math.exp(-1 / (sampleRate * 0.12));

  const data = Array.from({ length: channels }, (_, ch) => result.getChannelData(ch));
  for (const channel of data) {
    for (let i = 0; i < channel.length; i++) channel[i] *= gain;
  }

  // Sliding max over the look-ahead window, so gain is reduced before the peak lands
  const length = result.length;
  const reduction = new Float32Array(length);
  let envelope = 1;
  for (let i = 0; i < length; i++) {
    let peak = 0;
    for (let j = i; j < Math.min(length, i + lookahead); j++) {
      for (const channel of data) {
        const abs = Math.abs(channel[j]);
        if (abs > peak) peak = abs;
      }
      j += 7; // sample the window sparsely; 8-sample steps are inaudible here
    }
    const target = peak > ceiling ? ceiling / peak : 1;
    envelope = target < envelope ? target : target + (envelope - target) * release;
    reduction[i] = envelope;
  }

  for (const channel of data) {
    for (let i = 0; i < length; i++) {
      const v = channel[i] * reduction[i];
      channel[i] = Math.max(-ceiling, Math.min(ceiling, v));
    }
  }
  return result;
};

/** Runs the whole plan. Progress is split across the stages that actually run. */
export const applyEnhancement = async (
  buffer: AudioBuffer,
  plan: EnhancePlan,
  onProgress?: EnhanceProgress
): Promise<AudioBuffer> => {
  const stages: (() => AudioBuffer | Promise<AudioBuffer>)[] = [];
  let current = buffer;

  if (plan.dcOffset !== 0) stages.push(() => removeDcOffset(current));
  if (plan.noise) stages.push(() => applyNoiseReduction(current, plan.noise!));
  if (plan.highPassHz > 0 || plan.eq.length > 0) {
    stages.push(() => renderEq(current, plan.highPassHz, plan.eq));
  }
  if (plan.deEss) stages.push(() => applyDeEss(current, plan.deEss!));
  if (plan.compressor) stages.push(() => renderCompressor(current, plan.compressor!));
  // Production sits after the corrections: saturate and reverb a *fixed* take,
  // not a muddy one, or the added harmonics follow the problems.
  if (plan.polish) stages.push(() => renderPolish(current, plan.polish!));
  if (plan.stereoWidth !== 1) stages.push(() => applyStereoWidth(current, plan.stereoWidth));

  const total = stages.length + 1;
  for (let i = 0; i < stages.length; i++) {
    current = await stages[i]();
    onProgress?.((i + 1) / total);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  // Loudness is measured on the processed audio, so every earlier stage counts.
  // Limiting then pulls peaky material back down, so the result is re-measured
  // and corrected — one pass alone lands 2–3 LU short on a dynamic vocal.
  let measured = measureLoudness(current);
  if (measured > -50) {
    current = applyGainAndLimit(current, clamp(plan.targetLufs - measured, -24, 24), plan.ceilingDb);
    for (let pass = 0; pass < 4; pass++) {
      measured = measureLoudness(current);
      const error = plan.targetLufs - measured;
      if (Math.abs(error) < 0.3) break;
      current = applyGainAndLimit(current, clamp(error, -6, 6), plan.ceilingDb);
    }
  }
  onProgress?.(1);
  return current;
};

/** What the enhanced result actually measures, for the before/after readout. */
export interface EnhanceReport {
  loudnessLufs: number;
  gainAppliedDb: number;
  /** Set when the peak ceiling stopped us reaching the target loudness */
  shortOfTarget: string | null;
}

export const reportFor = (
  input: AudioAnalysis,
  output: AudioBuffer,
  plan: EnhancePlan
): EnhanceReport => {
  const loudnessLufs = measureLoudness(output);
  // A peaky performance can't reach a loud target under a peak ceiling. Say so
  // instead of silently missing it — or crushing the dynamics to hide it.
  const shortfall = plan.targetLufs - loudnessLufs;
  return {
    loudnessLufs,
    gainAppliedDb: loudnessLufs - input.loudnessLufs,
    shortOfTarget:
      shortfall > 1
        ? `Held at ${loudnessLufs.toFixed(1)} LUFS instead of ${plan.targetLufs}: this performance is too dynamic to go louder without squashing it. Pick a quieter target, or raise the strength to compress more.`
        : null,
  };
};
