"use client";

import { BANDS, type AudioAnalysis } from "@/lib/audio/analyze";
import type { EnhancePlan } from "@/lib/audio/enhance";

interface AnalysisReportProps {
  analysis: AudioAnalysis;
  plan: EnhancePlan;
  /** Loudness of the enhanced result, once it has been rendered */
  resultLufs?: number;
}

const labelClass =
  "text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400";

const INTENT_LABEL: Record<EnhancePlan["intent"], string> = {
  "vocal-music": "Human vocal over music",
  voice: "Voice only",
  music: "Instrumental",
};

const Metric = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="rounded-xl border border-(--surface-border) px-4 py-3">
    <span className={labelClass}>{label}</span>
    <p className="mt-1 font-mono text-lg text-zinc-900 dark:text-white">{value}</p>
    {hint && <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
  </div>
);

/** Band meter: a centre line with the measured tilt pushing left or right. */
const BandMeter = ({ label, db }: { label: string; db: number }) => {
  const clamped = Math.max(-12, Math.min(12, db));
  const width = (Math.abs(clamped) / 12) * 50;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="relative h-2 flex-1 rounded-full bg-zinc-900/5 dark:bg-white/5">
        <span className="absolute inset-y-0 left-1/2 w-px bg-zinc-900/15 dark:bg-white/15" />
        <span
          className="absolute inset-y-0 rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500"
          style={
            clamped >= 0
              ? { left: "50%", width: `${width}%` }
              : { right: "50%", width: `${width}%` }
          }
        />
      </span>
      <span className="w-14 shrink-0 text-right font-mono text-xs text-zinc-600 dark:text-zinc-400">
        {clamped > 0 ? "+" : ""}
        {clamped.toFixed(1)} dB
      </span>
    </div>
  );
};

const AnalysisReport = ({ analysis, plan, resultLufs }: AnalysisReportProps) => {
  const confidence = Math.round(
    (plan.intent === "music" ? analysis.musicLikelihood : analysis.vocalLikelihood) * 100
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="glass-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className={labelClass}>What we heard</span>
            <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">
              {INTENT_LABEL[plan.intent]}
            </p>
          </div>
          <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 font-mono text-xs text-violet-700 dark:text-violet-300">
            {confidence}% confidence
          </span>
        </div>

        {analysis.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {analysis.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-(--surface-border) px-3 py-1 text-xs text-zinc-600 dark:text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Loudness"
            value={`${analysis.loudnessLufs.toFixed(1)} LUFS`}
            hint={
              resultLufs === undefined
                ? `target ${plan.targetLufs} LUFS`
                : `now ${resultLufs.toFixed(1)} LUFS`
            }
          />
          <Metric label="Peak" value={`${analysis.peakDb.toFixed(1)} dBFS`} hint={`ceiling ${plan.ceilingDb} dBFS`} />
          <Metric
            label="Dynamics"
            value={`${analysis.crestDb.toFixed(1)} dB`}
            hint={analysis.crestDb > 14 ? "wide — needs levelling" : "already even"}
          />
          <Metric
            label="Noise floor"
            value={`${analysis.noiseFloorDb.toFixed(1)} dBFS`}
            hint={analysis.noiseFloorDb > -48 ? "audible background" : "clean"}
          />
        </div>
      </div>

      <div className="glass-card p-6">
        <span className={labelClass}>Tonal balance (vs. a balanced reference)</span>
        <div className="mt-4 flex flex-col gap-2.5">
          {BANDS.map((band) => (
            <BandMeter key={band.key} label={band.label} db={analysis.bands[band.key]} />
          ))}
        </div>
        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
          Content reaches {(analysis.bandwidthHz / 1000).toFixed(1)} kHz · brightness centred at{" "}
          {Math.round(analysis.centroidHz)} Hz ·{" "}
          {analysis.isStereo
            ? `stereo width ${Math.round(analysis.stereoWidth * 100)}%`
            : "mono source"}
        </p>
      </div>

      <div className="glass-card p-6">
        <span className={labelClass}>What we changed, and why</span>
        <ul className="mt-4 flex flex-col gap-3">
          {plan.moves.length === 0 && (
            <li className="text-sm text-zinc-600 dark:text-zinc-400">
              Nothing needed fixing at this strength — the recording already measures well.
            </li>
          )}
          {plan.moves.map((move) => (
            <li key={`${move.module}-${move.label}`} className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500" />
              <span>
                <span className="block text-sm font-medium text-zinc-900 dark:text-white">
                  {move.label}
                </span>
                <span className="block text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {move.detail}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AnalysisReport;
