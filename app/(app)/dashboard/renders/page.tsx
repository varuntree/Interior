import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Image, Search, Filter, Plus, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RendersPage() {
  return (
    <div className="space-y-6 p-6">
      <DashboardHeader 
        title="My Renders" 
        subtitle="Browse and manage all your generated interior designs"
      >
        <Badge variant="secondary" className="flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Phase 6 Feature
        </Badge>
      </DashboardHeader>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search your renders..." 
            className="pl-10"
            disabled
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm" asChild>
            <a href="/dashboard/create">
              <Plus className="h-4 w-4 mr-2" />
              Create New
            </a>
          </Button>
        </div>
      </div>

      {/* Empty State */}
      <EmptyState
        icon={<Image className="h-12 w-12" />}
        title="No renders yet"
        description="Start creating beautiful interior designs to see them here. Your generated designs will appear in a searchable grid with filtering options."
        action={{
          label: "Create Your First Design",
          href: "/dashboard/create"
        }}
      />
    </div>
  );
}