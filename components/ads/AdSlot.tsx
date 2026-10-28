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
      className={`flex items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/50 ${
        isVertical ? "h-64 w-full" : "h-24 w-full"
      }`}
    >
      Ad space
    </div>
  );
};

export default AdSlot;
