import config from "@/config";

const Footer = () => {
  const year = new Date().getFullYear();
  const appName = config.appName;
  return (
    <footer className="py-8 text-center text-muted-foreground text-sm border-t border-border bg-background">
      <p>© {year} {appName}. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
