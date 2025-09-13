"use client";

import Link from "next/link";
import config from "@/config";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

export function MarketingHeader() {
  return (
    <header className="w-full">
      <div className="mx-auto flex items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8 max-w-7xl">
        <Link href="/" className="font-semibold tracking-tight text-foreground">
          {config.appName}
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/community"
            className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors md:inline"
          >
            Community
          </Link>
          <Link
            href="/blog"
            className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors md:inline"
          >
            Blog
          </Link>
          <ThemeToggle />
          <Button asChild>
            <Link href="/signin">Login</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default MarketingHeader;

