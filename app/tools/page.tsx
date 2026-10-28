import { ToolCard } from "@/components/tools/ToolPageShell";
import { pageMetadata } from "@/lib/site";
import { tools } from "@/lib/tools";

export const metadata = pageMetadata({
  title: "All Free Online Audio Tools",
  description:
    "Every SnipAudio tool in one place: cut MP3s, make ringtones, join audio files and more — free, no signup, and processed entirely in your browser.",
  path: "/tools",
});

const ToolsPage = () => {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 pt-14 pb-10 sm:px-6 sm:pt-20">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
          Every audio tool you need, <span className="text-gradient">free</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-zinc-600 dark:text-zinc-400">
          All tools run locally in your browser — no uploads, no signup, no watermark.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <ToolCard key={tool.path} tool={tool} />
        ))}
      </div>
    </div>
  );
};

export default ToolsPage;
