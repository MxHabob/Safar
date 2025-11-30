import { MarqueeCard } from "./marquee-card";
import {
  CodeIcon,
  GlobeIcon,
  WindIcon,
  SuperscriptIcon,
  TruckIcon,
  DatabaseIcon,
  CameraIcon,
} from "lucide-react";

const technologies = [
  {
    icon: CodeIcon,
    name: "React",
  },
  {
    icon: GlobeIcon,
    name: "Next.js",
  },
  {
    icon: WindIcon,
    name: "Tailwind CSS",
  },
  {
    icon: DatabaseIcon,
    name: "Drizzle ORM",
  },
  {
    icon: SuperscriptIcon,
    name: "TypeScript",
  },
  {
    icon: TruckIcon,
    name: "tRPC",
  },
  {
    icon: DatabaseIcon,
    name: "React Query",
  },
  {
    icon: CodeIcon,
    name: "Shadcn UI",
  },
  {
    icon: GlobeIcon,
    name: "Vercel",
  },
  {
    icon: GlobeIcon,
    name: "Cloudflare",
  },
  {
    icon: CameraIcon,
    name: "Lightroom Classic",
  },
];

const TechMarquee = () => {
  return (
    <div className="bg-muted flex items-center gap-12 p-8 rounded-xl">
      <h2 className="text-lg font-light">Built with</h2>

      <div className="relative flex-1 overflow-hidden">
        <MarqueeCard pauseOnHover className="[--duration:30s]">
          {technologies.map((tech) => (
            <div key={tech.name} className="flex items-center gap-4">
              <tech.icon className="size-8" />
              <span className="select-none">{tech.name}</span>
            </div>
          ))}
        </MarqueeCard>

        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-muted"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-linear-to-l from-muted"></div>
      </div>
    </div>
  );
};

export default TechMarquee;
