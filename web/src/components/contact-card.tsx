import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowUpRightIcon, MailIcon } from "lucide-react";
import {
  InstagramIcon,
  GithubIcon,
  XIcon,
} from "lucide-react";
import { ShuffleIcon } from "lucide-react";

// icon map
const iconMap = {
  Instagram: <InstagramIcon size={18} />,
  GitHub: <GithubIcon size={18} />,
  X: <XIcon size={18} />,
  Xiaohongshu: <ShuffleIcon size={18} />,
  "Contact me": <MailIcon size={18} />,
};

interface Props {
  title: keyof typeof iconMap;
  href?: string;
  className?: string;
}

const ContactCard = ({ title, href, className }: Props) => {
  return (
    <Link
      href={href || " "}
      target="_blank"
      className={cn(
        "w-full h-full p-3 lg:p-5 bg-muted hover:bg-muted-foreground/10 rounded-xl flex justify-between items-center cursor-pointer group transition-all duration-150 ease-[cubic-bezier(0.22, 1, 0.36, 1)]",
        className
      )}
    >
      <p className="text-sm">{title}</p>

      <div className="relative inline-block overflow-hidden size-[18px]">
        <div className="relative inline-block group font-light text-sm h-full w-full">
          {/* Default Text (visible initially, moves down on hover) */}
          <span className="block transform transition-transform duration-200 ease-in-out group-hover:-translate-y-full">
            {iconMap[title]}
          </span>

          {/* Hover Text (hidden initially, moves up on hover) */}
          <span className="absolute inset-0 transform translate-y-full transition-transform duration-200 ease-in-out group-hover:translate-y-0">
            <ArrowUpRightIcon size={18} />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ContactCard;
