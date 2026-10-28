import MP3Cutter from "@/components/cutter/MP3Cutter";
import AdSlot from "@/components/ads/AdSlot";

const Home = () => {
  return (
    <div className="flex flex-1 flex-col items-center gap-10 px-4 py-10 sm:px-6 sm:py-16">
      <div className="max-w-2xl text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
          Cut your MP3 in seconds — free &amp; private
        </h1>
        <p className="mt-3 text-base text-zinc-500 dark:text-zinc-400">
          Trim intros, remove silence, or grab the perfect ringtone. Everything
          runs locally in your browser — your audio is never uploaded anywhere.
        </p>
      </div>

      <MP3Cutter />

      <div className="w-full max-w-5xl">
        <AdSlot slot="cutter-footer" />
      </div>

      <section className="w-full max-w-3xl rounded-2xl border border-violet-100 bg-white p-6 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-white">
          How to cut an MP3 online
        </h2>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>Drop or select your audio file (MP3, WAV, OGG, M4A, AAC, FLAC).</li>
          <li>Drag the handles on the waveform to select the part you want to keep.</li>
          <li>Press play to preview your selection, and add fade in/out if you like.</li>
          <li>Choose MP3 or WAV and hit “Cut &amp; Download”.</li>
        </ol>
      </section>
    </div>
  );
};

export default Home;
