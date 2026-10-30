export const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00.00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds - mins * 60;
  const secsStr = secs.toFixed(2).padStart(5, "0");
  return `${mins.toString().padStart(2, "0")}:${secsStr}`;
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
};

/** `mm:ss.mmm` — the editable, millisecond-accurate form used by the time inputs. */
export const formatPrecise = (seconds: number): string => {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const mins = Math.floor(safe / 60);
  const secs = safe - mins * 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toFixed(3).padStart(6, "0")}`;
};

/**
 * Parses what someone can reasonably type into a time field:
 * `1:23.456`, `01:23`, `83.456`, `83`, and `1:02:03` for long recordings.
 * Returns null when the text isn't a time, so the caller can reject the edit.
 */
export const parseTime = (input: string): number | null => {
  const trimmed = input.trim().replace(",", ".");
  if (!trimmed) return null;

  const parts = trimmed.split(":");
  if (parts.length > 3) return null;

  // Only the last part may carry a fraction; the others must be whole numbers
  for (let i = 0; i < parts.length - 1; i++) {
    if (!/^\d+$/.test(parts[i])) return null;
  }
  const last = parts[parts.length - 1];
  if (!/^\d+(\.\d+)?$/.test(last)) return null;

  // Minutes and seconds beyond the first unit must stay inside their range
  if (parts.length > 1 && Number(last) >= 60) return null;
  if (parts.length === 3 && Number(parts[1]) >= 60) return null;

  const seconds = parts.reduce((total, part) => total * 60 + Number(part), 0);
  return Number.isFinite(seconds) ? seconds : null;
};
