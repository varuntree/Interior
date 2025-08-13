import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  CreditCard, 
  HelpCircle, 
  Mail, 
  ExternalLink,
  Crown,
  BarChart3,
  Sparkles 
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <DashboardHeader 
        title="Settings" 
        subtitle="Manage your account, billing, and preferences"
      >
        <Badge variant="secondary" className="flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Phase 7 Feature
        </Badge>
      </DashboardHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile</span>
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-sm mt-1">user@example.com</p>
              <p className="text-xs text-muted-foreground mt-1">
                Email is managed through Supabase authentication
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Member since</label>
              <p className="text-sm mt-1">December 2024</p>
            </div>
          </CardContent>
        </Card>

        {/* Billing Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Billing & Plans</span>
            </CardTitle>
            <CardDescription>Manage your subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Current Plan</span>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Starter
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">150 generations per month</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Button variant="outline" className="w-full" disabled>
                <ExternalLink className="h-4 w-4 mr-2" />
                Manage Billing
              </Button>
              <Button className="w-full" disabled>
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Usage Statistics</span>
          </CardTitle>
          <CardDescription>Track your generation usage and history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">45</div>
              <div className="text-sm text-muted-foreground">Generations Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">105</div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">150</div>
              <div className="text-sm text-muted-foreground">Monthly Limit</div>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div className="w-full bg-muted rounded-full h-3">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-300" 
              style={{ width: "30%" }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Usage resets in 18 days</span>
            <span>30% used</span>
          </div>
        </CardContent>
      </Card>

      {/* Support Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HelpCircle className="h-5 w-5" />
            <span>Support</span>
          </CardTitle>
          <CardDescription>Get help and contact support</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="flex-1" disabled>
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            <Button variant="outline" className="flex-1" disabled>
              <ExternalLink className="h-4 w-4 mr-2" />
              Documentation
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Support features will be available in Phase 7 with contact forms and help documentation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}