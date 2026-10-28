import VoiceRecorder from "@/components/recorder/VoiceRecorder";
import ToolPageShell from "@/components/tools/ToolPageShell";
import { pageMetadata } from "@/lib/site";
import { voiceRecorder } from "@/lib/tools";

export const metadata = pageMetadata({
  title: voiceRecorder.metaTitle,
  description: voiceRecorder.description,
  path: voiceRecorder.path,
  keywords: voiceRecorder.keywords,
});

const VoiceRecorderPage = () => {
  return (
    <ToolPageShell tool={voiceRecorder}>
      <VoiceRecorder />
    </ToolPageShell>
  );
};

export default VoiceRecorderPage;
