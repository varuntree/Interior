import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Star, TrendingUp, Palette, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  return (
    <div className="space-y-6 p-6">
      <DashboardHeader 
        title="Community Gallery" 
        subtitle="Discover inspiring interior designs curated by our team"
      >
        <Badge variant="secondary" className="flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Phase 7 Feature
        </Badge>
      </DashboardHeader>

      {/* Featured Collections Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Featured Collections
                  <Badge variant="outline">Coming Soon</Badge>
                </CardTitle>
                <CardDescription>Admin-curated design inspiration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Explore professionally curated collections showcasing the best Australian interior design styles.
            </p>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                • Coastal Australian Homes
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                • Modern Minimalist Spaces
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                • Hamptons-Inspired Interiors
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <CardTitle>Trending Styles</CardTitle>
                <CardDescription>Popular design trends this month</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Coastal AU</span>
                <Badge variant="secondary">+24%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Japandi</span>
                <Badge variant="secondary">+18%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Industrial AU</span>
                <Badge variant="secondary">+15%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Try This Look Feature */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>&ldquo;Try This Look&rdquo; Feature</span>
          </CardTitle>
          <CardDescription>
            Apply community design settings to your own spaces
          </CardDescription>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Coming in Phase 7</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Browse community galleries and click &ldquo;Try this look&rdquo; to automatically 
                apply the same settings (room type, style, prompt) to your generation.
              </p>
            </div>
            <Button disabled>
              Explore Community
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}