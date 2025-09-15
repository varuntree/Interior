"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingStates } from '@/components/dashboard/LoadingStates';
import { CreditCard, ExternalLink, Crown, Loader2 } from 'lucide-react';
import config from '@/config';

interface BillingData {
  planId: string;
  planName: string;
  monthlyGenerations: number;
  priceAudPerMonth: number;
  nextBillingDate?: string;
  isCanceled?: boolean;
}

export function BillingSection() {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch usage/billing summary (authoritative)
      const usageRes = await fetch('/api/v1/usage');
      if (!usageRes.ok) throw new Error('Failed to fetch usage/billing');
      const usageJson = await usageRes.json();
      if (!usageJson.success) throw new Error(usageJson.error?.message || 'Failed to fetch usage/billing');

      const plan = usageJson.data.plan;
      const billingPeriod = usageJson.data.billingPeriod;

      setBillingData({
        planId: plan.id,
        planName: plan.label,
        monthlyGenerations: plan.monthlyGenerations,
        priceAudPerMonth: plan.pricePerMonth,
        nextBillingDate: billingPeriod?.end,
        isCanceled: usageJson.data.billing?.subscriptionStatus === 'canceled'
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setPortalLoading(true);
      
      const response = await fetch('/api/v1/stripe/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error('Failed to create billing portal session');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to access billing portal');
      }

      // Redirect to Stripe portal
      window.location.href = result.data.url;

    } catch (err: any) {
      console.error('Billing portal error:', err);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleUpgradePlan = async () => {
    try {
      setCheckoutLoading(true);
      // Choose upgrade target plan from config (prefer featured, else last defined)
      const plans = config.stripe.plans || [];
      const featured = plans.find(p => (p as any).isFeatured) || plans[plans.length - 1] || plans[0];
      const targetPriceId = featured?.priceId;
      if (!targetPriceId) throw new Error('No plan available');

      const response = await fetch('/api/v1/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId: targetPriceId })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      window.location.href = result.data.url;

    } catch (err: any) {
      console.error('Checkout error:', err);
      alert('Failed to start upgrade process. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Billing & Plans</span>
          </CardTitle>
          <CardDescription>Manage your subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingStates.skeleton />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Billing & Plans</span>
          </CardTitle>
          <CardDescription>Manage your subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-destructive">Error loading billing information</p>
            <Button variant="outline" onClick={fetchBillingData} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!billingData) {
    return null;
  }

  const nextBillingDate = billingData.nextBillingDate 
    ? new Date(billingData.nextBillingDate).toLocaleDateString()
    : null;

  return (
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
                {billingData.planName}
              </Badge>
              {billingData.isCanceled && (
                <Badge variant="destructive">Canceled</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {billingData.monthlyGenerations} generations per month
            </p>
            {billingData.priceAudPerMonth > 0 && (
              <p className="text-sm text-muted-foreground">
                ${billingData.priceAudPerMonth} USD/month
              </p>
            )}
            {nextBillingDate && (
              <p className="text-xs text-muted-foreground">
                {billingData.isCanceled ? 'Access ends' : 'Next billing'}: {nextBillingDate}
              </p>
            )}
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full"
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
          
          {billingData.planName !== 'Monthly' && !billingData.isCanceled && (
            <Button 
              className="w-full"
              onClick={handleUpgradePlan}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Crown className="h-4 w-4 mr-2" />
              )}
              Upgrade Plan
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
