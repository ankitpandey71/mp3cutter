import AudioInserter from "@/components/inserter/AudioInserter";
import ToolPageShell from "@/components/tools/ToolPageShell";
import { pageMetadata } from "@/lib/site";
import { addAudioToSong } from "@/lib/tools";

export const metadata = pageMetadata({
  title: addAudioToSong.metaTitle,
  description: addAudioToSong.description,
  path: addAudioToSong.path,
  keywords: addAudioToSong.keywords,
});

const AddAudioToSongPage = () => {
  return (
    <ToolPageShell tool={addAudioToSong}>
      <AudioInserter />
    </ToolPageShell>
  );
};

export default AddAudioToSongPage;
