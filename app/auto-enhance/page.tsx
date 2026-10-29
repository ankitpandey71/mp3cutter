import AudioEnhancer from "@/components/enhancer/AudioEnhancer";
import ToolPageShell from "@/components/tools/ToolPageShell";
import { pageMetadata } from "@/lib/site";
import { autoEnhance } from "@/lib/tools";

export const metadata = pageMetadata({
  title: autoEnhance.metaTitle,
  description: autoEnhance.description,
  path: autoEnhance.path,
  keywords: autoEnhance.keywords,
});

const AutoEnhancePage = () => {
  return (
    <ToolPageShell tool={autoEnhance}>
      <AudioEnhancer />
    </ToolPageShell>
  );
};

export default AutoEnhancePage;
