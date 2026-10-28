"use client";

import { useEffect, useRef, useState } from "react";
import AudioProcessor from "@/components/processor/AudioProcessor";
import AdSlot from "@/components/ads/AdSlot";
import { getAudioContext } from "@/lib/audio/decode";
import { formatTime } from "@/lib/utils/formatTime";

const METER_BARS = 32;

const extensionFor = (mimeType: string): string => {
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4")) return "m4a";
  return "webm";
};

const VoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(METER_BARS).fill(0));
  const [recording, setRecording] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number>(0);

  const stopStream = (): void => {
    cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => stopStream, []);

  const startRecording = async (): Promise<void> => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        stopStream();
        const type = recorder.mimeType || "audio/webm";
        const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
        setRecording(new File(chunks, `recording-${stamp}.${extensionFor(type)}`, { type }));
        setIsRecording(false);
      };
      recorderRef.current = recorder;

      // Live level meter + timer, driven by one animation loop
      const ctx = getAudioContext();
      await ctx.resume();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const startedAt = performance.now();
      const tick = (): void => {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (const v of data) peak = Math.max(peak, Math.abs(v - 128) / 128);
        setLevels((prev) => [...prev.slice(1), Math.min(1, peak * 1.8)]);
        setElapsed((performance.now() - startedAt) / 1000);
        frameRef.current = requestAnimationFrame(tick);
      };
      tick();

      recorder.start();
      setIsRecording(true);
    } catch {
      stopStream();
      setError(
        "We couldn't access your microphone. Allow microphone access in your browser's address bar and try again."
      );
    }
  };

  const stopRecording = (): void => {
    recorderRef.current?.stop();
  };

  if (recording) {
    return (
      <AudioProcessor
        effect="convert"
        initialFile={recording}
        onReset={() => {
          setRecording(null);
          setElapsed(0);
          setLevels(Array(METER_BARS).fill(0));
        }}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="glass-card flex flex-col items-center gap-8 rounded-[2rem]! p-10 sm:p-16">
        <div aria-hidden className="flex h-20 w-full max-w-md items-center justify-center gap-1">
          {levels.map((level, i) => (
            <span
              key={i}
              className="w-1.5 rounded-full bg-linear-to-t from-violet-600 to-fuchsia-400 transition-[height] duration-75"
              style={{ height: `${Math.max(6, level * 100)}%`, opacity: isRecording ? 1 : 0.35 }}
            />
          ))}
        </div>

        <p className="font-mono text-4xl font-semibold tabular-nums text-zinc-900 dark:text-white">
          {formatTime(elapsed)}
        </p>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
          className={`relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-xl transition active:scale-95 ${
            isRecording
              ? "bg-red-500 shadow-red-500/40 hover:bg-red-600"
              : "bg-linear-to-br from-violet-500 to-fuchsia-600 shadow-violet-600/40 hover:brightness-110"
          }`}
        >
          {isRecording && <span className="absolute inset-0 animate-ping rounded-full bg-red-500/40" />}
          {isRecording ? (
            <span className="relative h-7 w-7 rounded-md bg-white" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="relative h-9 w-9">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          )}
        </button>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {isRecording ? "Recording… click to stop" : "Click the mic to start recording"}
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      <AdSlot slot="recorder-empty-state" />
    </div>
  );
};

export default VoiceRecorder;
