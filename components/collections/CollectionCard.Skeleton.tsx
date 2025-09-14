import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/libs/utils";

export function CollectionCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        <div className="relative aspect-square">
          <div className="absolute inset-0 rounded-lg border bg-muted/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-10 rounded bg-muted animate-pulse" />
          </div>
          <div className="absolute inset-x-2 bottom-2 rounded-md bg-muted/50 h-6 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export default CollectionCardSkeleton;
