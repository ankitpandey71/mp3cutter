import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "How We Earn Money",
  description:
    "A transparent look at how SnipAudio funds free, private audio tools through ads, donations and sponsorships.",
  path: "/monetization",
});

const streams = [
  {
    title: "Display ads",
    icon: "📢",
    body:
      "Non-intrusive banner and sidebar ad slots (see AdSlot component) can be wired to Google AdSense, Ezoic, or Media.net. These render around the tool, never inside the waveform editor, so cutting audio stays uninterrupted.",
    action: "Sign up for AdSense, add your publisher ID to .env, then swap the placeholder markup in components/ads/AdSlot.tsx for the real <ins class=\"adsbygoogle\"> snippet.",
  },
  {
    title: "Voluntary donations",
    icon: "☕",
    body:
      "A 'Buy Me a Coffee' / Ko-fi / PayPal link is in the footer and navbar. Visitors who find the tool useful can tip without any obligation — no feature is ever gated behind it.",
    action: "Create accounts on buymeacoffee.com and ko-fi.com, then replace the placeholder URLs in components/layout/Footer.tsx.",
  },
  {
    title: "Affiliate recommendations",
    icon: "🔗",
    body:
      "Contextual, clearly labeled affiliate links to audio gear, DAWs, hosting, or courses (e.g. Amazon Associates, microphone brands, or software like FL Studio) can appear on the About/Blog pages — never disguised as tool features.",
    action: "Apply to relevant affiliate programs and add links to a future /blog or /resources page, disclosed per FTC guidelines.",
  },
  {
    title: "Pro tier (optional, future)",
    icon: "⭐",
    body:
      "Power users could unlock batch processing, higher-quality export presets, or cloud project sync via a lightweight subscription (Stripe/LemonSqueezy), while the core cutter always stays free.",
    action: "Wire up Stripe Checkout only if/when usage justifies the added complexity — avoid premature paywalls.",
  },
  {
    title: "Sponsorships",
    icon: "🤝",
    body:
      "A single 'Sponsored by' credit for a podcast host, VPN, or SaaS tool relevant to creators, placed in the footer, can replace generic ad networks once traffic is meaningful.",
    action: "Reach out to creator-tool brands once monthly traffic is trackable via analytics.",
  },
];

const MonetizationPage = () => {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-14 leading-relaxed sm:px-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          How SnipAudio earns money
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-300">
          Running servers, bandwidth, and development time isn&apos;t free — even
          though cutting your audio is. Here&apos;s exactly how this site is
          funded, so there are no surprises.
        </p>
      </div>

      <div className="grid gap-4">
        {streams.map((s) => (
          <div
            key={s.title}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {s.title}
              </h2>
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{s.body}</p>
            <p className="mt-2 rounded-xl border border-violet-500/15 bg-violet-500/5 p-3 text-xs leading-relaxed text-violet-700 dark:text-violet-300">
              Setup: {s.action}
            </p>
          </div>
        ))}
      </div>

      <div className="glass-card p-8 text-center">
        <p className="text-zinc-700 dark:text-zinc-200">
          Found the tool useful? The easiest way to support it costs nothing:
          share it with a friend who needs to trim an audio clip.
        </p>
        <a
          href="#donate"
          className="btn-primary mt-5 px-6 py-3"
        >
          ☕ Support SnipAudio
        </a>
      </div>
    </div>
  );
};

export default MonetizationPage;
