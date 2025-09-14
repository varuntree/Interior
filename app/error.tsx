"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Home, AlertTriangle, Mail, Bug } from "lucide-react";
import config from "@/config";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    // Log error for monitoring (in production, this would go to an error tracking service)
    console.error('Application error:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
    });
  }, [error]);

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      reset();
    }
  };

  const handleReportError = () => {
    const errorReport = {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
    };
    
    const subject = encodeURIComponent(`Error Report - ${config.appName}`);
    const body = encodeURIComponent(`
Error Details:
- Message: ${errorReport.message}
- Digest: ${errorReport.digest || 'N/A'}
- Timestamp: ${errorReport.timestamp}
- URL: ${errorReport.url}

Please describe what you were doing when this error occurred:
[Please describe your actions here]
    `);
    
    window.open(`mailto:${config.resend.supportEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-lg space-y-6">
        <Card className="border-destructive/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-xl">Something went wrong</CardTitle>
            <CardDescription>
              An unexpected error occurred while processing your request
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Error Details */}
            <Alert variant="destructive">
              <Bug className="h-4 w-4" />
              <AlertDescription className="font-mono text-sm">
                {error.message}
                {error.digest && (
                  <div className="mt-2 text-xs opacity-75">
                    Error ID: {error.digest}
                  </div>
                )}
              </AlertDescription>
            </Alert>

            {/* Retry Information */}
            {retryCount > 0 && (
              <Alert>
                <AlertDescription>
                  Retry attempts: {retryCount} of {maxRetries}
                  {retryCount >= maxRetries && (
                    <span className="block mt-1 text-destructive">
                      Maximum retries reached. Please report this error or contact support.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleRetry}
                  disabled={retryCount >= maxRetries}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {retryCount >= maxRetries ? 'Max Retries' : 'Try Again'}
                </Button>
                
                <Button asChild variant="default" className="w-full">
                  <Link href="/dashboard">
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              </div>

              <Button 
                variant="outline" 
                onClick={handleReportError}
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                Report Error
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center text-sm text-muted-foreground">
              <p>If this problem persists, please contact our support team.</p>
              <p className="mt-1">We apologize for the inconvenience.</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Quick actions:</p>
          <div className="flex justify-center gap-4 text-sm">
            <Link href="/dashboard" className="text-primary hover:underline">
              Create Design
            </Link>
            <Link href="/dashboard/renders" className="text-primary hover:underline">
              My Renders
            </Link>
            <Link href="/dashboard/settings" className="text-primary hover:underline">
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
