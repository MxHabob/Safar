import Link from "next/link";
import WordRotate from "../word-rotate";
import { Camera } from "lucide-react";

const Logo = () => {
  return (
    <Link href="/" className="flex gap-2 items-center">
      <Camera size={18} />
      <WordRotate label="ECarry" label2="Photo" style="font-medium uppercase" />
    </Link>
  );
};

export default Logo;
