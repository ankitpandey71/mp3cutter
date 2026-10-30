/**
 * The audio helpers only need `createBuffer` from an AudioContext, so the node
 * runs get a minimal stand-in instead of a full Web Audio implementation.
 */
class StubAudioBuffer {
  readonly numberOfChannels: number;
  readonly length: number;
  readonly sampleRate: number;
  private readonly channels: Float32Array[];

  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
  }

  get duration(): number {
    return this.length / this.sampleRate;
  }

  getChannelData(channel: number): Float32Array {
    return this.channels[channel];
  }
}

class StubAudioContext {
  readonly sampleRate = 44100;
  readonly state = "running";
  createBuffer(numberOfChannels: number, length: number, sampleRate: number) {
    return new StubAudioBuffer(numberOfChannels, length, sampleRate);
  }
  resume() {
    return Promise.resolve();
  }
}

Object.assign(globalThis, {
  AudioContext: StubAudioContext,
  window: { AudioContext: StubAudioContext },
});

/** Builds a test buffer whose samples come from `fill(index, channel)`. */
export const makeBuffer = (
  channels: number,
  length: number,
  sampleRate = 44100,
  fill: (i: number, channel: number) => number = () => 0
): AudioBuffer => {
  const buffer = new StubAudioBuffer(channels, length, sampleRate);
  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) data[i] = fill(i, c);
  }
  return buffer as unknown as AudioBuffer;
};
