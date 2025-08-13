import { ReactNode } from "react";
import { cn } from "@/libs/utils";

interface ResponsiveGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  className?: string;
}

export function ResponsiveGrid({ 
  children, 
  columns = 3, 
  gap = "md", 
  className 
}: ResponsiveGridProps) {
  const columnClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  };

  const gapClasses = {
    sm: "gap-3",
    md: "gap-6", 
    lg: "gap-8"
  };

  return (
    <div className={cn(
      "grid",
      columnClasses[columns],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}

// Pre-configured grid variants for common use cases
export function RenderGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ResponsiveGrid columns={3} gap="md" className={className}>
      {children}
    </ResponsiveGrid>
  );
}

export function CollectionGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ResponsiveGrid columns={2} gap="lg" className={className}>
      {children}
    </ResponsiveGrid>
  );
}

export function QuickActionGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ResponsiveGrid columns={3} gap="md" className={className}>
      {children}
    </ResponsiveGrid>
  );
}

export function StatsGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ResponsiveGrid columns={4} gap="sm" className={className}>
      {children}
    </ResponsiveGrid>
  );
}