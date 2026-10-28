"use client";

/**
 * Placeholder ad container. Swap the inner markup for a real
 * <ins class="adsbygoogle"> tag (see /monetization for setup notes)
 * once an AdSense/Ezoic publisher ID is available.
 */
interface AdSlotProps {
  slot: string;
  orientation?: "horizontal" | "vertical";
}

const AdSlot = ({ slot, orientation = "horizontal" }: AdSlotProps) => {
  const isVertical = orientation === "vertical";
  return (
    <div
      data-ad-slot={slot}
      className={`flex items-center justify-center rounded-2xl border border-dashed border-zinc-900/10 bg-white/30 text-[11px] font-medium uppercase tracking-wider text-zinc-400 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.02] dark:text-zinc-600 ${
        isVertical ? "h-64 w-full" : "h-24 w-full"
      }`}
    >
      Advertisement
    </div>
  );
};

export default AdSlot;
