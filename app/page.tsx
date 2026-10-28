import MP3Cutter from "@/components/cutter/MP3Cutter";
import ToolPageShell from "@/components/tools/ToolPageShell";
import { mp3Cutter } from "@/lib/tools";

const Home = () => {
  return (
    <ToolPageShell tool={mp3Cutter}>
      <MP3Cutter />
    </ToolPageShell>
  );
};

export default Home;
