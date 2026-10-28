import { notFound } from "next/navigation";
import AudioProcessor from "@/components/processor/AudioProcessor";
import ToolPageShell from "@/components/tools/ToolPageShell";
import { pageMetadata } from "@/lib/site";
import { getToolBySlug, tools } from "@/lib/tools";

// Only the effect-based tools live here; everything else has its own route
export const dynamicParams = false;

export const generateStaticParams = () =>
  tools.filter((tool) => tool.effect).map((tool) => ({ tool: tool.path.slice(1) }));

export const generateMetadata = async ({ params }: PageProps<"/[tool]">) => {
  const tool = getToolBySlug((await params).tool);
  if (!tool) return {};
  return pageMetadata({
    title: tool.metaTitle,
    description: tool.description,
    path: tool.path,
    keywords: tool.keywords,
  });
};

const ToolPage = async ({ params }: PageProps<"/[tool]">) => {
  const tool = getToolBySlug((await params).tool);
  if (!tool?.effect) notFound();

  return (
    <ToolPageShell tool={tool}>
      <AudioProcessor effect={tool.effect} />
    </ToolPageShell>
  );
};

export default ToolPage;
