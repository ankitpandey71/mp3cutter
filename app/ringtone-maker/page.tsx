import MP3Cutter from "@/components/cutter/MP3Cutter";
import ToolPageShell from "@/components/tools/ToolPageShell";
import { pageMetadata } from "@/lib/site";
import { ringtoneMaker } from "@/lib/tools";

export const metadata = pageMetadata({
  title: ringtoneMaker.metaTitle,
  description: ringtoneMaker.description,
  path: ringtoneMaker.path,
  keywords: ringtoneMaker.keywords,
});

const RingtoneMakerPage = () => {
  return (
    <ToolPageShell tool={ringtoneMaker}>
      <MP3Cutter
        preset={{ selectionLength: 30, maxSelection: 40, fadeIn: 1, fadeOut: 2, fileSuffix: "ringtone" }}
      />
    </ToolPageShell>
  );
};

export default RingtoneMakerPage;
