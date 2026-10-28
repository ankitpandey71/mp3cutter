import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "About",
  description:
    "Learn how SnipAudio's free, browser-based MP3 cutter trims audio privately on your own device — no uploads, no signup, no watermark.",
  path: "/about",
});

const AboutPage = () => {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-14 leading-relaxed sm:px-6">
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">About SnipAudio</h1>
      <p className="text-zinc-600 dark:text-zinc-300">
        SnipAudio is a free, browser-based audio cutter built for anyone who
        needs a quick, no-fuss way to trim a song, podcast, or voice memo.
        Unlike most online cutters, nothing is ever uploaded to a server —
        your file is decoded, edited, and exported entirely on your own
        device using the Web Audio API.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { title: "Private by design", body: "Files never leave your browser tab." },
          { title: "No signup", body: "No account, no email, no watermark." },
          { title: "Free forever", body: "Supported by optional ads and donations." },
        ].map((item) => (
          <div key={item.title} className="glass-card p-5">
            <p className="font-semibold text-zinc-900 dark:text-white">{item.title}</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{item.body}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Why we built it</h2>
      <p className="text-zinc-600 dark:text-zinc-300">
        Most online audio cutters require an upload-wait-download cycle and
        bury the tool behind ads or paywalls. We wanted something instant,
        transparent about how it earns money (see our{" "}
        <a href="/monetization" className="text-violet-600 hover:underline">
          Support Us
        </a>{" "}
        page), and safe enough to use with sensitive recordings.
      </p>
    </div>
  );
};

export default AboutPage;
