"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import config from "@/config";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { ArrowRight, Menu, X } from "lucide-react";

// Minimal, clean menu panel with only current pages
const ExploreMenu = () => (
  <div className="p-2 w-[22rem] max-w-[90vw]">
    <nav className="grid">
      <NavigationMenuLink href="/community" className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
        <span>Community</span>
        <ArrowRight className="size-4" />
      </NavigationMenuLink>
      <NavigationMenuLink href="/blog" className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
        <span>Blog</span>
        <ArrowRight className="size-4" />
      </NavigationMenuLink>
    </nav>
  </div>
)

const navigationMenuItems = [
  { key: "explore", label: "Explore", component: ExploreMenu },
] as const

export function MarketingNavbar() {
  const pathname = usePathname();
  if (pathname?.startsWith("/blog")) {
    return null;
  }
  const [open, setOpen] = useState(false)
  const [submenu, setSubmenu] = useState<"explore" | null>(null)

  return (
    <header className="bg-background inset-x-0 top-0 z-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <NavigationMenu className="min-w-full [&>div:last-child]:left-auto">
          <div className="flex w-full justify-between gap-2 py-4">
            <Link href="/" className="flex items-center gap-2" aria-label={config.appName}>
              <Logo />
            </Link>
            <div className="flex items-center gap-2 xl:gap-8">
              <NavigationMenuList className="hidden gap-2 lg:flex">
                {navigationMenuItems.map((item) => (
                  <NavigationMenuItem key={item.key}>
                    <NavigationMenuTrigger className="text-xs xl:text-sm">
                      {item.label}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="md:left-1/2 md:-translate-x-1/2 md:w-[24rem] max-w-[90vw] p-0">
                      <item.component />
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild className="hidden md:block">
                <Link href="/signin">Login</Link>
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Main Menu"
                className="lg:hidden"
                onClick={() => {
                  if (open) {
                    setOpen(false)
                    setSubmenu(null)
                  } else {
                    setOpen(true)
                  }
                }}
              >
                {!open && <Menu className="size-4" />}
                {open && <X className="size-4" />}
              </Button>
            </div>
          </div>

          {open && (
            <div className="border-border bg-background fixed inset-0 top-[72px] flex h-[calc(100vh-72px)] w-full flex-col overflow-auto border-t lg:hidden">
              <div className="px-4 py-2">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/community">Community</Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/blog">Blog</Link>
                </Button>
              </div>
              <div className="mx-8 mt-auto flex flex-col items-center gap-8 py-16">
                <Button asChild>
                  <Link href="/signin">Login</Link>
                </Button>
              </div>
            </div>
          )}
        </NavigationMenu>
      </div>
    </header>
  )
}

export default MarketingNavbar
