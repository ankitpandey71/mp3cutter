import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "SnipAudio processes all audio locally in your browser. Learn what data, if any, we collect and which third parties are involved.",
  path: "/privacy",
});

const PrivacyPage = () => {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-14 leading-relaxed sm:px-6 text-zinc-600 dark:text-zinc-300">
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">Privacy Policy</h1>
      <p>
        SnipAudio is designed to be private by default. Audio files you select
        are decoded and processed entirely within your browser using the Web
        Audio API — they are never uploaded to, or stored on, any server we
        control.
      </p>
      <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">What we collect</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Standard, anonymized web analytics (page views, browser type).</li>
        <li>Advertising cookies from third-party ad networks (once enabled), which follow their own privacy policies.</li>
        <li>No account data — there is no signup, so we hold no personal profiles.</li>
      </ul>
      <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Third-party services</h2>
      <p>
        Ad networks (e.g. Google AdSense) and donation platforms (Buy Me a
        Coffee, Ko-fi, PayPal) linked from this site operate under their own
        privacy policies. We recommend reviewing them directly.
      </p>
      <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Contact</h2>
      <p>Questions about this policy can be sent to the site owner via the contact details on the About page.</p>
    </div>
  );
};

export default PrivacyPage;
