import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderHeart, Plus, Heart, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  return (
    <div className="space-y-6 p-6">
      <DashboardHeader 
        title="Collections" 
        subtitle="Organize and manage your favorite interior designs"
      >
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Phase 6 Feature
          </Badge>
          <Button size="sm" disabled>
            <Plus className="h-4 w-4 mr-2" />
            New Collection
          </Button>
        </div>
      </DashboardHeader>

      {/* Default Favorites Collection (Always Present) */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  My Favorites
                  <Badge variant="outline" className="text-xs">Default</Badge>
                </CardTitle>
                <CardDescription>Your automatically saved favorite designs</CardDescription>
              </div>
            </div>
            <Badge variant="secondary">0 items</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Designs you mark as favorites will automatically appear here. This collection cannot be deleted.
          </p>
        </CardContent>
      </Card>

      {/* Empty State for Additional Collections */}
      <div className="border-t pt-6">
        <EmptyState
          icon={<FolderHeart className="h-12 w-12" />}
          title="No custom collections yet"
          description="Create collections to organize your designs by project, room, or style. Each render can be added to multiple collections."
          action={{
            label: "Create First Collection",
            onClick: () => {} // Will be implemented in Phase 6
          }}
        />
      </div>
    </div>
  );
}