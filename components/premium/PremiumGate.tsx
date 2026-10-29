"use client";

import { useState } from "react";
import {
  PREMIUM_PLANS,
  checkoutUrl,
  clearPremium,
  isCheckoutConfigured,
  redeemCode,
  usePremium,
} from "@/lib/premium";

interface PremiumGateProps {
  /** Why the visitor is seeing this, e.g. "Export the full-length enhanced track" */
  reason: string;
  onClose?: () => void;
}

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="mt-0.5 h-4 w-4 shrink-0 text-violet-500">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);

export const PremiumBadge = () => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white uppercase">
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
      <path d="M12 2l2.6 6.3 6.8.5-5.2 4.4 1.6 6.6L12 16.3 6.2 19.8l1.6-6.6-5.2-4.4 6.8-.5L12 2z" />
    </svg>
    Premium
  </span>
);

const PremiumGate = ({ reason, onClose }: PremiumGateProps) => {
  const { active } = usePremium();
  const [planId, setPlanId] = useState(PREMIUM_PLANS[0].id);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const checkout = checkoutUrl();

  if (active) {
    return (
      <div className="glass-card flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3">
          <PremiumBadge />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Premium is active on this device — full-length exports are unlocked.
          </p>
        </div>
        <button
          type="button"
          onClick={clearPremium}
          className="text-xs font-medium text-zinc-500 underline underline-offset-4 hover:text-zinc-900 dark:hover:text-white"
        >
          Sign out of premium
        </button>
      </div>
    );
  }

  const handleRedeem = (): void => {
    if (redeemCode(code, planId)) {
      setError(null);
      setCode("");
      onClose?.();
      return;
    }
    setError("That code wasn't recognised. Check it and try again.");
  };

  return (
    <div className="glass-card overflow-hidden p-0">
      <div className="border-b border-(--surface-border) bg-linear-to-r from-violet-500/10 to-fuchsia-500/10 px-6 py-5">
        <PremiumBadge />
        <h2 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-white">{reason}</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Analysis and a {" "}
          <span className="font-medium text-zinc-900 dark:text-white">30-second preview</span> are
          always free. Premium unlocks the full-length master and every manual control.
        </p>
      </div>

      <div className="grid gap-4 p-6 sm:grid-cols-2">
        {PREMIUM_PLANS.map((plan) => {
          const selected = plan.id === planId;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setPlanId(plan.id)}
              aria-pressed={selected}
              className={`rounded-2xl border p-5 text-left transition ${
                selected
                  ? "border-violet-500/50 bg-violet-500/5 ring-1 ring-violet-500/30"
                  : "border-(--surface-border) hover:border-violet-500/30"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-zinc-900 dark:text-white">{plan.name}</span>
                {plan.highlight && (
                  <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-violet-700 uppercase dark:text-violet-300">
                    Popular
                  </span>
                )}
              </div>
              <p className="mt-2">
                <span className="text-2xl font-semibold text-zinc-900 dark:text-white">{plan.price}</span>{" "}
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{plan.cadence}</span>
              </p>
              <ul className="mt-4 flex flex-col gap-2">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <Check />
                    {perk}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 border-t border-(--surface-border) px-6 py-5">
        {isCheckoutConfigured() ? (
          <a href={checkout ?? "#"} className="btn-primary w-full justify-center px-6 py-3 text-center">
            Continue to checkout
          </a>
        ) : (
          <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
            Checkout isn&apos;t connected yet. Set{" "}
            <code className="font-mono">NEXT_PUBLIC_PREMIUM_CHECKOUT_URL</code> to your Stripe or
            LemonSqueezy link, and{" "}
            <code className="font-mono">NEXT_PUBLIC_PREMIUM_CODES</code> to the access codes you
            hand out. Until then, premium can only be unlocked with a code.
          </p>
        )}

        <div>
          <label
            htmlFor="premium-code"
            className="mb-2 block text-[11px] font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400"
          >
            Already have an access code?
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="premium-code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
              placeholder="STUDIO-XXXX"
              className="min-w-0 flex-1 rounded-xl border border-(--surface-border) bg-transparent px-4 py-2.5 font-mono text-sm text-zinc-900 outline-none focus:border-violet-500/50 dark:text-white"
            />
            <button
              type="button"
              onClick={handleRedeem}
              disabled={code.trim().length === 0}
              className="rounded-xl border border-violet-500/30 bg-violet-500/5 px-5 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-500/10 disabled:opacity-50 dark:text-violet-300"
            >
              Unlock
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">
          Your audio never leaves this device, on any plan — premium changes what the app offers,
          not where the processing happens.
        </p>
      </div>
    </div>
  );
};

export default PremiumGate;
