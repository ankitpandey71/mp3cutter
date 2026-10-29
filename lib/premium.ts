"use client";

import { useSyncExternalStore } from "react";

/**
 * Entitlement for the paid tools.
 *
 * Processing happens entirely in the visitor's browser, so this layer decides
 * what the UI offers — it is not a security boundary and can't be one without a
 * server. When real billing lands, replace {@link redeemCode} with a call that
 * verifies a signed licence (Stripe/LemonSqueezy webhook → signed token) and
 * keep the rest of this module as-is.
 */

const STORAGE_KEY = "snipaudio.premium";
const EVENT = "snipaudio:premium-change";

export interface PremiumState {
  active: boolean;
  plan: string | null;
  since: string | null;
}

const INACTIVE: PremiumState = { active: false, plan: null, since: null };

export interface PremiumPlan {
  id: string;
  name: string;
  price: string;
  cadence: string;
  highlight?: boolean;
  perks: string[];
}

export const PREMIUM_PLANS: PremiumPlan[] = [
  {
    id: "studio-monthly",
    name: "Studio",
    price: "$6",
    cadence: "per month",
    highlight: true,
    perks: [
      "Unlimited full-length auto-enhance exports",
      "320 kbps MP3 and lossless WAV",
      "Manual control over every enhancement module",
      "No ads on any tool",
    ],
  },
  {
    id: "studio-yearly",
    name: "Studio, yearly",
    price: "$48",
    cadence: "per year",
    perks: ["Everything in Studio", "Two months free", "Early access to new tools"],
  },
];

/** Free visitors can hear this much of the enhanced result. */
export const FREE_PREVIEW_SECONDS = 30;

const parseState = (raw: string | null): PremiumState => {
  if (!raw) return INACTIVE;
  try {
    const parsed = JSON.parse(raw) as Partial<PremiumState>;
    return parsed.active
      ? { active: true, plan: parsed.plan ?? null, since: parsed.since ?? null }
      : INACTIVE;
  } catch {
    return INACTIVE;
  }
};

// Cached so the snapshot stays referentially stable between store notifications
let cachedRaw: string | null = null;
let cachedState: PremiumState = INACTIVE;

const readState = (): PremiumState => {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedState = parseState(raw);
  }
  return cachedState;
};

const writeState = (state: PremiumState): void => {
  try {
    if (state.active) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private browsing — the session still works, it just won't be remembered
  }
  window.dispatchEvent(new CustomEvent(EVENT));
};

/** Access codes come from the environment so none are baked into the repo. */
const validCodes = (): string[] =>
  (process.env.NEXT_PUBLIC_PREMIUM_CODES ?? "")
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);

export const isCheckoutConfigured = (): boolean =>
  Boolean(process.env.NEXT_PUBLIC_PREMIUM_CHECKOUT_URL);

export const checkoutUrl = (): string | null =>
  process.env.NEXT_PUBLIC_PREMIUM_CHECKOUT_URL ?? null;

export const redeemCode = (code: string, planId: string): boolean => {
  const normalized = code.trim().toUpperCase();
  if (!normalized || !validCodes().includes(normalized)) return false;
  writeState({ active: true, plan: planId, since: new Date().toISOString() });
  return true;
};

export const clearPremium = (): void => writeState(INACTIVE);

/** Subscribes to this tab's changes and to the same account in another tab. */
const subscribe = (onChange: () => void): (() => void) => {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
};

const noopSubscribe = (): (() => void) => () => {};

/** Reads the entitlement as an external store, so server and client markup match. */
export const usePremium = (): PremiumState & { ready: boolean } => {
  const state = useSyncExternalStore(subscribe, readState, () => INACTIVE);
  // False during SSR and the first paint, so premium-only UI never flashes
  const ready = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
  return { ...state, ready };
};
