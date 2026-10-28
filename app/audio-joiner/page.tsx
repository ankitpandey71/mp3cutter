import AudioJoiner from "@/components/joiner/AudioJoiner";
import ToolPageShell from "@/components/tools/ToolPageShell";
import { pageMetadata } from "@/lib/site";
import { audioJoiner } from "@/lib/tools";

export const metadata = pageMetadata({
  title: audioJoiner.metaTitle,
  description: audioJoiner.description,
  path: audioJoiner.path,
  keywords: audioJoiner.keywords,
});

const AudioJoinerPage = () => {
  return (
    <ToolPageShell tool={audioJoiner}>
      <AudioJoiner />
    </ToolPageShell>
  );
};

export default AudioJoinerPage;
