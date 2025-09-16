'use client';

import { useState, useEffect } from 'react';
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingStates } from "@/components/dashboard/LoadingStates";
import { User, HelpCircle, Mail, CheckCircle, Clock, Loader2, ExternalLink } from "lucide-react";
import { apiFetch } from "@/libs/api/http";
import config from "@/config";

interface UserProfile {
  id: string;
  email: string;
  createdAt: string;
}

export default function SettingsPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    
    // Check for success parameter (from Stripe redirect)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setShowSuccessAlert(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      // Auto-hide after 5 seconds
      setTimeout(() => setShowSuccessAlert(false), 5000);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiFetch('/api/v1/auth/me');
      if (!result.success) throw new Error(result.error?.message || 'Failed to load profile');
      setUserProfile(result.data as UserProfile);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatMemberSince = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-AU', {
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  const handleManageBilling = async () => {
    try {
      setPortalLoading(true);

      const response = await fetch('/api/v1/stripe/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to create billing portal session');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to access billing portal');
      }

      window.location.href = result.data.url;
    } catch (err: any) {
      console.error('Billing portal error:', err);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <DashboardHeader 
          title="Settings" 
          subtitle="Manage your account, billing, and preferences"
        />
        <LoadingStates.skeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <DashboardHeader 
        title="Settings" 
        subtitle="Manage your account, billing, and preferences"
      />

      {/* Success Alert */}
      {showSuccessAlert && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <span className="font-medium">Payment successful!</span> Your subscription has been updated and will be active shortly.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Profile Section */}
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile</span>
              </CardTitle>
              <CardDescription>Your account information</CardDescription>
            </div>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleManageBilling}
              disabled={portalLoading}
            >
              {portalLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Manage Billing
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <div className="text-center py-4">
                <p className="text-sm text-destructive mb-2">Error loading profile</p>
                <Button variant="outline" onClick={fetchUserProfile} size="sm">
                  Try Again
                </Button>
              </div>
            ) : userProfile ? (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm mt-1">{userProfile.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Email is managed through Supabase authentication
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Member since</label>
                  <p className="text-sm mt-1">{formatMemberSince(userProfile.createdAt)}</p>
                </div>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={() => { window.location.href = "/api/auth/signout"; }}
                  >
                    Sign out
                  </Button>
                </div>
              </>
            ) : (
              <LoadingStates.skeleton />
            )}
          </CardContent>
        </Card>

      </div>

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
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => window.open(`mailto:${config.resend.supportEmail}`, '_blank')}
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </div>
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Support Hours</p>
                <p className="text-muted-foreground">
                  Monday - Friday: 9 AM - 5 PM AEST<br />
                  Response time: Within 24 hours
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
