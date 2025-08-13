import React from "react";
import { cn } from "@/libs/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Loading Spinner
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <div className={cn("animate-spin rounded-full border-2 border-primary border-t-transparent", sizeClasses[size], className)} />
  );
}

// Card Skeleton
interface CardSkeletonProps {
  className?: string;
}

export function CardSkeleton({ className }: CardSkeletonProps) {
  return (
    <div className={cn("rounded-xl border bg-card p-6 space-y-4", className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </div>
  );
}

// Grid Skeleton
interface GridSkeletonProps {
  count?: number;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function GridSkeleton({ count = 6, columns = 3, className }: GridSkeletonProps) {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  };

  return (
    <div className={cn("grid gap-6", gridClasses[columns], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// List Skeleton
interface ListSkeletonProps {
  count?: number;
  className?: string;
}

export function ListSkeleton({ count = 5, className }: ListSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 rounded-lg border">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

// Shimmer Effect
interface ShimmerProps {
  className?: string;
}

export function Shimmer({ className }: ShimmerProps) {
  return (
    <div className={cn(
      "animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] rounded-md",
      className
    )} 
    style={{
      animation: "shimmer 2s ease-in-out infinite",
    }}
    />
  );
}

// Page Level Loading
interface PageLoadingProps {
  title?: string;
  description?: string;
}

export function PageLoading({ description }: PageLoadingProps) {
  return (
    <div className="space-y-6 p-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        {description && <Skeleton className="h-4 w-64" />}
      </div>
      
      {/* Content Skeleton */}
      <div className="space-y-6">
        <GridSkeleton count={6} columns={3} />
      </div>
    </div>
  );
}

// Button Loading State
interface ButtonLoadingProps {
  className?: string;
  children?: React.ReactNode;
}

export function ButtonLoading({ className, children }: ButtonLoadingProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LoadingSpinner size="sm" />
      {children && <span>{children}</span>}
    </div>
  );
}

// Image Loading Placeholder
interface ImageLoadingProps {
  aspectRatio?: "square" | "video" | "portrait";
  className?: string;
}

export function ImageLoading({ aspectRatio = "square", className }: ImageLoadingProps) {
  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video", 
    portrait: "aspect-[3/4]"
  };

  return (
    <div className={cn(
      "bg-muted rounded-lg flex items-center justify-center",
      aspectClasses[aspectRatio],
      className
    )}>
      <div className="text-muted-foreground">
        <LoadingSpinner size="md" />
      </div>
    </div>
  );
}

// Table Loading State
interface TableLoadingProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableLoading({ rows = 5, columns = 4, className }: TableLoadingProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="grid gap-4 p-4 border-b" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Form Loading State
interface FormLoadingProps {
  fields?: number;
  className?: string;
}

export function FormLoading({ fields = 4, className }: FormLoadingProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 mt-6" />
    </div>
  );
}

// Consolidated LoadingStates object for easy access
export const LoadingStates = {
  spinner: LoadingSpinner,
  skeleton: GridSkeleton,
  card: CardSkeleton,
  grid: GridSkeleton,
  list: ListSkeleton,
  shimmer: Shimmer,
  page: PageLoading,
  button: ButtonLoading,
  image: ImageLoading,
  table: TableLoading,
  form: FormLoading,
};