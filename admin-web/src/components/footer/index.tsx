import FooterNav from "./footer-nav";
import { SafarLogo } from "@/components/shared/safar-logo";

const Footer = () => {
  return (
    <div className="flex flex-col items-center lg:items-start p-16 pb-12 gap-8 lg:gap-16 rounded-xl font-light relative flex-1 bg-primary text-white dark:text-black">
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <SafarLogo
          size={60}
        />
      </div>
      <div className="grid lg:w-full grid-cols-1 lg:grid-cols-3 gap-7 lg:gap-14">
        <FooterNav
          title="Pages"
          links={[
            { title: "Home", href: "/" },
            { title: "Travel", href: "/travel" },
            { title: "Discover", href: "/discover" }
          ]}
        />
        <FooterNav
          title="CMS"
          links={[{ title: "Dashboard", href: "/dashboard" }]}
        />
        <FooterNav
          title="Utility"
          links={[{ title: "Screensaver", href: "/screensaver" }]}
        />
      </div>

      {/* Attribution */}
      <div className="text-xs md:text-sm text-center md:text-left">
        <p>
          <span className="opacity-60">Powered by </span>
          <a
            href="https://mulverse.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            Mulverse
          </a>
        </p>
      </div>
    </div>
  );
};

export default Footer;
