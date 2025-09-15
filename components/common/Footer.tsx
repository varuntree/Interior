import Link from "next/link";
import config from "@/config";

const Footer = () => {
  const year = new Date().getFullYear();
  const appName = config.appName;
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:px-6 lg:px-8">
        <p className="order-2 md:order-1">© {year} {appName}. All rights reserved.</p>
        <nav className="order-1 flex flex-wrap items-center gap-4 md:order-2">
          <Link href="/privacy-policy" className="hover:text-foreground">Privacy Policy</Link>
          <span className="text-border">•</span>
          <Link href="/tos" className="hover:text-foreground">Terms</Link>
          <span className="text-border">•</span>
          <a href="mailto:support@quickdesignhome.com" className="hover:text-foreground">Contact</a>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
