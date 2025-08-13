'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { LoadingStates } from '@/components/dashboard/LoadingStates';
import { BarChart3, RefreshCw, TrendingUp, Calendar } from 'lucide-react';

interface UsageData {
  generationsUsed: number;
  monthlyLimit: number;
  remaining: number;
  usagePercentage: number;
  resetDate: string;
  daysUntilReset: number;
}

interface UsageDisplayProps {
  className?: string;
}

export function UsageDisplay({ className }: UsageDisplayProps) {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch('/api/v1/usage');
      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load usage information');
      }

      // Transform the API response to match our interface
      const data = result.data;
      const usagePercentage = data.monthlyLimit > 0 
        ? Math.round((data.generationsUsed / data.monthlyLimit) * 100)
        : 0;

      // Calculate reset date (assuming monthly billing cycle)
      const now = new Date();
      const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const daysUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      setUsageData({
        generationsUsed: data.generationsUsed || 0,
        monthlyLimit: data.monthlyLimit || 0,
        remaining: data.remainingGenerations || 0,
        usagePercentage,
        resetDate: resetDate.toISOString(),
        daysUntilReset: Math.max(0, daysUntilReset)
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchUsageData(true);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Usage Statistics</span>
          </CardTitle>
          <CardDescription>Track your generation usage and history</CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingStates.skeleton />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Usage Statistics</span>
          </CardTitle>
          <CardDescription>Track your generation usage and history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-destructive mb-3">Error loading usage data</p>
            <Button variant="outline" onClick={() => fetchUsageData()} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usageData) {
    return null;
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-primary';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-primary';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Usage Statistics</span>
            </CardTitle>
            <CardDescription>Track your generation usage and history</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getUsageColor(usageData.usagePercentage)}`}>
              {usageData.generationsUsed}
            </div>
            <div className="text-sm text-muted-foreground">Generations Used</div>
            {usageData.usagePercentage >= 90 && (
              <div className="text-xs text-destructive mt-1">Limit almost reached</div>
            )}
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {usageData.remaining}
            </div>
            <div className="text-sm text-muted-foreground">Remaining</div>
            {usageData.remaining === 0 && (
              <div className="text-xs text-destructive mt-1">No generations left</div>
            )}
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">
              {usageData.monthlyLimit}
            </div>
            <div className="text-sm text-muted-foreground">Monthly Limit</div>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Progress Bar */}
        <div className="space-y-3">
          <Progress 
            value={usageData.usagePercentage} 
            className="w-full h-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                Usage resets in {usageData.daysUntilReset} day{usageData.daysUntilReset !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>{usageData.usagePercentage}% used</span>
            </div>
          </div>
        </div>

        {/* Usage Tips */}
        {usageData.usagePercentage >= 75 && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-yellow-600" />
              <div className="text-sm">
                <span className="font-medium">High usage detected.</span>{' '}
                {usageData.remaining > 0 
                  ? `You have ${usageData.remaining} generations remaining this month.`
                  : 'Consider upgrading your plan for more generations.'
                }
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}