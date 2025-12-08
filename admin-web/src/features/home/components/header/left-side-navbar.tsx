import Logo from "./logo";
import FlipLink from "@/components/shared/flip-link";
import Graphic from "@/components/shared/graphic";
import { ThemeSwitch } from "@/components/shared/theme-toggle";

export const LeftSideNavbar = () => {
  return (
    <nav>
      <div className="flex items-center gap-5 pb-3 px-4 relative">
        <Logo />
        <div className="hidden lg:flex gap-4">
          <FlipLink href="/travel">Travel</FlipLink>
          <FlipLink href="/discover">Discover</FlipLink>
        </div>
        <ThemeSwitch />
      </div>
    </nav>
  );
};

