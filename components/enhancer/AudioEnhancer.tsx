"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import AdSlot from "@/components/ads/AdSlot";
import ExportPanel from "@/components/cutter/ExportPanel";
import FileDropzone from "@/components/cutter/FileDropzone";
import FileInfoCard from "@/components/cutter/FileInfoCard";
import PremiumGate, { PremiumBadge } from "@/components/premium/PremiumGate";
import AnalysisReport from "./AnalysisReport";
import { analyzeAudio, type AudioAnalysis } from "@/lib/audio/analyze";
import { decodeAudioFile, sliceAudioBuffer } from "@/lib/audio/decode";
import { encodeWav, exportAudioBuffer, type ExportFormat } from "@/lib/audio/encode";
import {
  applyEnhancement,
  CHARACTERS,
  DEFAULT_OPTIONS,
  LOUDNESS_TARGETS,
  planEnhancement,
  reportFor,
  summarizeEnhancement,
  type EnhanceIntent,
  type EnhanceOptions,
  type EnhancePlan,
  type VocalCharacter,
} from "@/lib/audio/enhance";
import { FREE_PREVIEW_SECONDS, usePremium } from "@/lib/premium";
import { baseName, downloadBlob } from "@/lib/utils/download";

const INTENTS: { value: EnhanceIntent; label: string; hint: string }[] = [
  { value: "auto", label: "Auto-detect", hint: "Let the analysis decide" },
  { value: "vocal-music", label: "Vocal + music", hint: "A sung or spoken take over a backing track" },
  { value: "voice", label: "Voice only", hint: "Spoken word, podcast, dry vocal" },
  { value: "music", label: "Instrumental", hint: "No lead vocal" },
];

const MODULES: { key: keyof EnhanceOptions["modules"]; label: string; hint: string }[] = [
  { key: "cleanup", label: "Cleanup", hint: "DC offset and sub-sonic rumble" },
  { key: "noise", label: "Noise reduction", hint: "Pulls down hiss and room tone in the gaps" },
  { key: "eq", label: "Tonal balance", hint: "Corrective EQ from the measured spectrum" },
  { key: "deEss", label: "De-esser", hint: "Softens harsh S sounds on the vocal" },
  { key: "dynamics", label: "Dynamics", hint: "Levels quiet and loud passages" },
  { key: "polish", label: "Studio character", hint: "Warmth, sheen, double and room" },
  { key: "stereo", label: "Stereo width", hint: "Widens a narrow mix, centre untouched" },
  { key: "loudness", label: "Loudness & limiting", hint: "Hits the target LUFS safely" },
];

interface RenderedPreview {
  url: string;
  lufs: number;
  /** Set when the peak ceiling stopped us reaching the loudness target */
  shortOfTarget: string | null;
  full: boolean;
  /** The plan this came from; a different plan makes it stale */
  signature: string;
}

const labelClass =
  "mb-2.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400";

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
      checked ? "bg-linear-to-r from-violet-500 to-fuchsia-500" : "bg-zinc-900/10 dark:bg-white/10"
    }`}
  >
    <span
      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
        checked ? "translate-x-5" : ""
      }`}
    />
  </button>
);

const Disclosure = ({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) => (
  <details className="glass-card group px-6 py-5">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
      <span>
        <span className="block font-semibold text-zinc-900 dark:text-white">{title}</span>
        <span className="block text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>
      </span>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="h-4 w-4 shrink-0 text-zinc-400 transition group-open:rotate-45"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    </summary>
    <div className="mt-5">{children}</div>
  </details>
);

const AudioEnhancer = () => {
  const { active: isPremium, ready: premiumReady } = usePremium();
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null);
  const [options, setOptions] = useState<EnhanceOptions>(DEFAULT_OPTIONS);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [rendered, setRendered] = useState<RenderedPreview | null>(null);
  const [stage, setStage] = useState<"idle" | "decoding" | "analyzing" | "rendering">("idle");
  const [stageProgress, setStageProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showGate, setShowGate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    const urls = urlsRef.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const trackUrl = useCallback((blob: Blob): string => {
    const url = URL.createObjectURL(blob);
    urlsRef.current.push(url);
    return url;
  }, []);

  const plan = useMemo(
    () => (analysis ? planEnhancement(analysis, options) : null),
    [analysis, options]
  );
  const signature = useMemo(() => (plan ? JSON.stringify(plan) : ""), [plan]);

  // A preview from an earlier plan is stale, so it simply isn't shown
  const preview = rendered && rendered.signature === signature ? rendered : null;

  /** Renders the enhanced audio. Free visitors get the opening 30 seconds. */
  const renderPreview = useCallback(
    async (source: AudioBuffer, measured: AudioAnalysis, activePlan: EnhancePlan) => {
      setStage("rendering");
      setStageProgress(0);
      try {
        const full = isPremium || source.duration <= FREE_PREVIEW_SECONDS;
        const input = full ? source : sliceAudioBuffer(source, 0, FREE_PREVIEW_SECONDS);
        const enhanced = await applyEnhancement(input, activePlan, setStageProgress);
        const report = reportFor(measured, enhanced, activePlan);
        setRendered({
          url: trackUrl(encodeWav(enhanced)),
          lufs: report.loudnessLufs,
          shortOfTarget: report.shortOfTarget,
          full,
          signature: JSON.stringify(activePlan),
        });
      } catch {
        setError("Something went wrong while enhancing. Try a shorter file or reload the page.");
      } finally {
        setStage("idle");
        setStageProgress(0);
      }
    },
    [isPremium, trackUrl]
  );

  const handleFile = useCallback(
    async (selected: File) => {
      setError(null);
      setRendered(null);
      setStage("decoding");
      setStageProgress(0);
      let decoded: AudioBuffer;
      let measured: AudioAnalysis;
      try {
        decoded = await decodeAudioFile(selected);
        setBuffer(decoded);
        setFile(selected);
        setOriginalUrl(trackUrl(selected));
        setStage("analyzing");
        measured = await analyzeAudio(decoded, setStageProgress);
        setAnalysis(measured);
      } catch {
        setError(
          "We couldn't read that file. Try a different audio file or format (MP3, WAV, OGG, M4A, FLAC)."
        );
        setFile(null);
        setBuffer(null);
        setStage("idle");
        setStageProgress(0);
        return;
      }
      // Enhance straight away, so the first thing you see is a finished result
      await renderPreview(decoded, measured, planEnhancement(measured, options));
    },
    [options, renderPreview, trackUrl]
  );

  const handleReset = (): void => {
    setFile(null);
    setBuffer(null);
    setAnalysis(null);
    setRendered(null);
    setOriginalUrl(null);
    setError(null);
    setOptions(DEFAULT_OPTIONS);
  };

  /**
   * Finish is the headline control, so picking one re-renders straight away.
   * Everything under "Sound different?" is a deliberate tweak and can wait
   * behind the play button; this one has to sound different immediately.
   */
  const chooseCharacter = (character: VocalCharacter): void => {
    const next = { ...options, character };
    setOptions(next);
    if (buffer && analysis) {
      void renderPreview(buffer, analysis, planEnhancement(analysis, next));
    }
  };

  const updateModule = (key: keyof EnhanceOptions["modules"]): void => {
    if (!isPremium) {
      setShowGate(true);
      return;
    }
    setOptions((prev) => ({ ...prev, modules: { ...prev.modules, [key]: !prev.modules[key] } }));
  };

  const handleExport = async (format: ExportFormat, bitrate: number): Promise<void> => {
    if (!file || !buffer || !plan) return;
    if (!isPremium) {
      setShowGate(true);
      return;
    }
    setIsExporting(true);
    setExportProgress(0);
    setError(null);
    try {
      const enhanced = await applyEnhancement(buffer, plan, (p) => setExportProgress(p * 0.6));
      const blob = await exportAudioBuffer(enhanced, format, bitrate, (p) =>
        setExportProgress(0.6 + p * 0.4)
      );
      downloadBlob(blob, `${baseName(file.name)}-enhanced.${format}`);
    } catch {
      setError("Something went wrong while exporting. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const errorBanner = error && (
    <div
      role="alert"
      className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
    >
      {error}
    </div>
  );

  if (!file || !buffer || !analysis || !plan) {
    const busy = stage !== "idle";
    const stageLabel =
      stage === "decoding" ? "Decoding your track…" : "Listening to your track…";
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <FileDropzone onFilesSelected={(files) => void handleFile(files[0])} isLoading={busy} />
        {busy && (
          <div className="glass-card p-5">
            <p className="text-sm font-medium text-zinc-900 dark:text-white">{stageLabel}</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Measuring loudness, dynamics, tonal balance and noise — all on this device.
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-900/5 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 transition-[width]"
                style={{ width: `${Math.round(stageProgress * 100)}%` }}
              />
            </div>
          </div>
        )}
        {errorBanner}
        <AdSlot slot="auto-enhance-empty-state" />
      </div>
    );
  }

  const isRendering = stage === "rendering";
  const strengthFill = ((options.strength - 0.2) / 0.8) * 100;
  // On "auto" the picker shows what the analysis actually chose, so the three
  // buttons always reflect the sound you are hearing.
  const activeCharacter =
    options.character === "auto" ? (plan?.polish?.character ?? "natural") : options.character;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex flex-col gap-5">
        <FileInfoCard file={file} buffer={buffer} onReset={handleReset} />

        {/* The result, first: what we found, and the before/after to judge it by */}
        <div className="glass-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-xl">
              <span className={labelClass}>Enhanced automatically</span>
              <p className="text-base leading-relaxed text-zinc-900 dark:text-white">
                {summarizeEnhancement(analysis, plan)}
              </p>
            </div>
            {preview && (
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-700 dark:text-emerald-400">
                {analysis.loudnessLufs.toFixed(1)} → {preview.lufs.toFixed(1)} LUFS
              </span>
            )}
          </div>

          <div className="mt-5">
            <span className={labelClass}>Finish</span>
            <div className="grid gap-2 sm:grid-cols-3">
              {CHARACTERS.map((character) => {
                const selected = activeCharacter === character.value;
                return (
                  <button
                    key={character.value}
                    type="button"
                    onClick={() => chooseCharacter(character.value)}
                    disabled={isRendering}
                    aria-pressed={selected}
                    className={`rounded-xl border px-4 py-3 text-left transition disabled:opacity-60 ${
                      selected
                        ? "border-violet-500/50 bg-violet-500/5 ring-1 ring-violet-500/30"
                        : "border-(--surface-border) hover:border-violet-500/30"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-zinc-900 dark:text-white">
                      {character.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                      {character.hint}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Want more control? Open <span className="font-medium">Sound different?</span> below to
              set the material, strength or loudness yourself.
            </p>
          </div>

          {preview?.shortOfTarget && (
            <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
              {preview.shortOfTarget}
            </p>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <span className={labelClass}>Before</span>
              {originalUrl && <audio controls src={originalUrl} className="w-full" />}
            </div>
            <div>
              <span className={labelClass}>
                After
                {preview && !preview.full && (
                  <span className="normal-case tracking-normal text-violet-600 dark:text-violet-400">
                    first {FREE_PREVIEW_SECONDS}s
                  </span>
                )}
              </span>
              {preview ? (
                <audio controls src={preview.url} className="w-full" />
              ) : (
                <button
                  type="button"
                  onClick={() => void renderPreview(buffer, analysis, plan)}
                  disabled={isRendering}
                  className="flex h-[54px] w-full items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/5 text-sm font-semibold text-violet-700 transition hover:bg-violet-500/10 disabled:opacity-60 dark:text-violet-300"
                >
                  {isRendering ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
                      Enhancing… {Math.round(stageProgress * 100)}%
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Hear the new version
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {premiumReady && !isPremium && showGate && (
          <PremiumGate
            reason="Export the full-length enhanced track"
            onClose={() => setShowGate(false)}
          />
        )}

        <ExportPanel
          start={0}
          end={buffer.duration}
          fileName={file.name}
          isExporting={isExporting}
          progress={exportProgress}
          onExport={(format, bitrate) => void handleExport(format, bitrate)}
          actionLabel={isPremium ? "Enhance & Download" : "Unlock full export"}
          showFades={false}
        />

        <Disclosure
          title="Sound different?"
          hint="Change the material, the strength or the loudness target"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <span className={labelClass}>Material</span>
              <div className="grid gap-1 rounded-xl bg-zinc-900/5 p-1 dark:bg-white/5">
                {INTENTS.map((intent) => (
                  <button
                    key={intent.value}
                    type="button"
                    onClick={() => setOptions((prev) => ({ ...prev, intent: intent.value }))}
                    className={`rounded-lg px-3 py-2 text-left text-sm transition ${
                      options.intent === intent.value
                        ? "bg-(--surface-strong) font-semibold text-zinc-900 shadow-sm dark:text-white"
                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    }`}
                  >
                    {intent.label}
                    <span className="block text-[11px] font-normal text-zinc-500 dark:text-zinc-500">
                      {intent.hint}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <label className="block">
                <span className={labelClass}>
                  Enhancement strength
                  <span className="font-mono normal-case tracking-normal text-zinc-900 dark:text-white">
                    {Math.round(options.strength * 100)}%
                  </span>
                </span>
                <input
                  type="range"
                  min={0.2}
                  max={1}
                  step={0.05}
                  value={options.strength}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, strength: Number(e.target.value) }))
                  }
                  className="range-premium w-full"
                  style={{ "--fill": `${strengthFill}%` } as CSSProperties}
                />
                <span className="mt-2 block text-xs text-zinc-500 dark:text-zinc-400">
                  Scales every correction. Lower keeps more of the original character.
                </span>
              </label>

              <div>
                <span className={labelClass}>Target loudness</span>
                <div className="grid gap-1 rounded-xl bg-zinc-900/5 p-1 dark:bg-white/5">
                  {LOUDNESS_TARGETS.map((target) => (
                    <button
                      key={target.value}
                      type="button"
                      onClick={() => setOptions((prev) => ({ ...prev, targetLufs: target.value }))}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                        options.targetLufs === target.value
                          ? "bg-(--surface-strong) font-semibold text-zinc-900 shadow-sm dark:text-white"
                          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                      }`}
                    >
                      {target.label}
                      <span className="font-mono text-[11px] font-normal text-zinc-500">
                        {target.hint}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <span className={labelClass}>
              Individual modules
              {premiumReady && !isPremium && (
                <span className="normal-case tracking-normal">
                  <PremiumBadge />
                </span>
              )}
            </span>
            <div className="grid gap-4 sm:grid-cols-2">
              {MODULES.map((module) => (
                <div key={module.key} className="flex items-start gap-3">
                  <Toggle
                    checked={options.modules[module.key]}
                    onChange={() => updateModule(module.key)}
                  />
                  <span>
                    <span className="block text-sm font-medium text-zinc-900 dark:text-white">
                      {module.label}
                    </span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      {module.hint}
                    </span>
                  </span>
                </div>
              ))}
            </div>
            {premiumReady && !isPremium && (
              <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                Auto-enhance decides all of this for you on the free plan. Premium lets you switch
                individual modules off.
              </p>
            )}
          </div>
        </Disclosure>

        <Disclosure
          title="The full measurement"
          hint="Loudness, dynamics, tonal balance and every decision we made"
        >
          <AnalysisReport analysis={analysis} plan={plan} resultLufs={preview?.lufs} />
        </Disclosure>

        {errorBanner}
      </div>

      <aside className="flex flex-col gap-4">
        {premiumReady && !isPremium && !showGate && (
          <button
            type="button"
            onClick={() => setShowGate(true)}
            className="glass-card p-5 text-left transition hover:ring-1 hover:ring-violet-500/30"
          >
            <PremiumBadge />
            <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-white">
              Export the whole track
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Full-length master, 320 kbps MP3 or lossless WAV, and manual control over every
              module.
            </p>
          </button>
        )}
        <AdSlot slot="auto-enhance-sidebar" orientation="vertical" />
      </aside>
    </div>
  );
};

export default AudioEnhancer;
