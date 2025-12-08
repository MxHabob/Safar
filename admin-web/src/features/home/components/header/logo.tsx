import Link from "next/link";
import { SafarLogo } from "@/components/shared/safar-logo";
import WordRotate from "@/components/shared/word-rotate";

const Logo = () => {
  return (
    <Link href="/" className="flex gap-2 items-center">
      <SafarLogo size={18} />
      <WordRotate label="Safar" label2="Travel" style="font-medium uppercase" />
    </Link>
  );
};

export default Logo;
