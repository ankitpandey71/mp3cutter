import MP3Cutter from "@/components/cutter/MP3Cutter";
import AdSlot from "@/components/ads/AdSlot";

const features = [
  {
    title: "Private by design",
    body: "Decoding, trimming and encoding all run in your browser tab. Nothing is uploaded.",
    icon: "M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z",
  },
  {
    title: "Studio-grade export",
    body: "MP3 up to 320 kbps or lossless WAV, with smooth fade in and fade out.",
    icon: "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z",
  },
  {
    title: "Instant & free",
    body: "No signup, no watermark, no waiting in a queue. Drop a file and go.",
    icon: "m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z",
  },
];

const steps = [
  { title: "Drop your file", body: "MP3, WAV, OGG, M4A, AAC or FLAC." },
  { title: "Select the part", body: "Drag the handles on the waveform." },
  { title: "Preview & polish", body: "Play the clip and add fades." },
  { title: "Download", body: "Export as MP3 or WAV in one click." },
];

const Home = () => {
  return (
    <div className="flex flex-1 flex-col items-center gap-16 px-4 pt-14 pb-10 sm:px-6 sm:pt-20">
      <div className="animate-float-up max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
          </span>
          Runs 100% in your browser
        </span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-6xl dark:text-white">
          Cut audio with <span className="text-gradient">studio precision</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
          Trim intros, remove silence, or craft the perfect ringtone. Free,
          private, and fast — your audio is never uploaded anywhere.
        </p>
      </div>

      <div className="animate-float-up w-full [animation-delay:120ms]">
        <MP3Cutter />
      </div>

      <section className="grid w-full max-w-5xl gap-4 sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="glass-card p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-violet-500/15 to-fuchsia-500/15 text-violet-600 ring-1 ring-violet-500/20 dark:text-violet-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
              </svg>
            </span>
            <p className="mt-4 font-semibold text-zinc-900 dark:text-white">{f.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{f.body}</p>
          </div>
        ))}
      </section>

      <div className="w-full max-w-5xl">
        <AdSlot slot="cutter-footer" />
      </div>

      <section className="w-full max-w-5xl">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          How to cut an MP3 online
        </h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="glass-card p-5">
              <span className="font-mono text-xs font-medium text-violet-600 dark:text-violet-400">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-2 font-semibold text-zinc-900 dark:text-white">{s.title}</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};

export default Home;
