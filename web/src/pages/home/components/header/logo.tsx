import Link from "next/link";
import { SafaLogo } from "@/components/shared/safa-logo";
import WordRotate from "@/components/shared/word-rotate";

const Logo = () => {
  return (
    <Link href="/" className="flex gap-2 items-center">
      <SafaLogo size={18} />
      <WordRotate label="Safar" label2="Travel" style="font-medium uppercase" />
    </Link>
  );
};

export default Logo;
