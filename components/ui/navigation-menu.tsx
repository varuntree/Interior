"use client"

import * as React from "react"
import Link from "next/link"
import { cva } from "class-variance-authority"
import { ChevronDown } from "lucide-react"

import { cn } from "@/libs/utils"

// Minimal, dependency-free navigation menu primitives matching shadcn API surface

const NavigationMenuContext = React.createContext<{ openKey: string | null; setOpenKey: (k: string | null) => void } | null>(null)

function useMenuCtx() {
  const ctx = React.useContext(NavigationMenuContext)
  if (!ctx) throw new Error("NavigationMenu components must be used inside <NavigationMenu>")
  return ctx
}

const NavigationMenu = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => {
  const [openKey, setOpenKey] = React.useState<string | null>(null)
  return (
    <NavigationMenuContext.Provider value={{ openKey, setOpenKey }}>
      <div ref={ref} className={cn("relative", className)} {...props}>
        {children}
      </div>
    </NavigationMenuContext.Provider>
  )
})
NavigationMenu.displayName = "NavigationMenu"

const NavigationMenuList = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn("group flex list-none items-center justify-center space-x-1", className)} {...props} />
))
NavigationMenuList.displayName = "NavigationMenuList"

const ItemContext = React.createContext<{ id: string } | null>(null)

const NavigationMenuItem = React.forwardRef<HTMLLIElement, React.LiHTMLAttributes<HTMLLIElement> & { id?: string }>(({ className, id, children, ...props }, ref) => {
  const autoId = React.useId()
  const value = React.useMemo(() => ({ id: id ?? autoId }), [id, autoId])
  return (
    <ItemContext.Provider value={value}>
      <li ref={ref} className={cn("relative", className)} {...props}>
        {children}
      </li>
    </ItemContext.Provider>
  )
})
NavigationMenuItem.displayName = "NavigationMenuItem"

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
)

const NavigationMenuTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(({ className, children, onClick, ...props }, ref) => {
  const { openKey, setOpenKey } = useMenuCtx()
  const item = React.useContext(ItemContext)
  if (!item) throw new Error("NavigationMenuTrigger must be used within NavigationMenuItem")
  const isOpen = openKey === item.id

  return (
    <button
      ref={ref}
      className={cn(navigationMenuTriggerStyle(), "gap-1", className)}
      aria-expanded={isOpen}
      onClick={(e) => {
        setOpenKey(isOpen ? null : item.id)
        onClick?.(e)
      }}
      {...props}
    >
      {children}
      <ChevronDown className={cn("relative top-px ml-1 size-4 transition duration-200", isOpen && "rotate-180")} aria-hidden="true" />
    </button>
  )
})
NavigationMenuTrigger.displayName = "NavigationMenuTrigger"

const NavigationMenuContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => {
  const { openKey, setOpenKey } = useMenuCtx()
  const item = React.useContext(ItemContext)
  if (!item) throw new Error("NavigationMenuContent must be used within NavigationMenuItem")
  const isOpen = openKey === item.id

  // Close on outside click
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) setOpenKey(null)
    }
    if (isOpen) document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [isOpen, setOpenKey])

  if (!isOpen) return null
  return (
    <div ref={(el) => { containerRef.current = el; if (typeof ref === "function") ref(el); else if (ref) (ref as any).current = el }}
         className={cn("left-0 top-full z-40 mt-2 w-screen md:absolute md:w-auto", "rounded-md border bg-popover text-popover-foreground shadow-md", className)}
         {...props}
    >
      {children}
    </div>
  )
})
NavigationMenuContent.displayName = "NavigationMenuContent"

type NavLinkProps = React.ComponentProps<typeof Link> & { className?: string }
const NavigationMenuLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(({ className, href, children, ...props }, ref) => (
  <Link ref={ref as any} href={href ?? "#"} className={className} {...props}>
    {children}
  </Link>
))
NavigationMenuLink.displayName = "NavigationMenuLink"

// Viewport/Indicator placeholders (not used but exported for API parity)
const NavigationMenuViewport = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("hidden", className)} {...props} />
))
NavigationMenuViewport.displayName = "NavigationMenuViewport"

const NavigationMenuIndicator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("hidden", className)} {...props} />
))
NavigationMenuIndicator.displayName = "NavigationMenuIndicator"

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuViewport,
  NavigationMenuIndicator,
  navigationMenuTriggerStyle,
}
