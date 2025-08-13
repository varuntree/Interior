import { ReactNode } from "react";
import { cn } from "@/libs/utils";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
}

export function DashboardHeader({ 
  title, 
  subtitle, 
  children, 
  className 
}: DashboardHeaderProps) {
  return (
    <div className={cn("border-b bg-background px-6 py-4", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        
        {children && (
          <div className="flex items-center gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}