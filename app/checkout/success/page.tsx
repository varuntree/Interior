'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import config from '@/config'
import { CheckCircle, Loader2, ShieldCheck, Sparkles } from 'lucide-react'

interface SessionResponse {
  amount: number
  currency: string
  planType: string
  eventId: string
}

type Status = 'idle' | 'loading' | 'complete' | 'error'

function CheckoutSuccessContent() {
  const router = useRouter()
  const search = useSearchParams()
  const [status, setStatus] = useState<Status>('idle')
  const [summary, setSummary] = useState<SessionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const purchaseSentRef = useRef(false)
  const hasProcessedRef = useRef(false)

  useEffect(() => {
    const sessionId = search.get('session_id')

    if (!sessionId) {
      // If we've already processed a session successfully, keep the success state.
      if (hasProcessedRef.current || summary) {
        return
      }
      setError('Missing checkout session. Please contact support if this continues.')
      setStatus('error')
      return
    }

    if (hasProcessedRef.current) {
      return
    }

    const controller = new AbortController()
    setStatus('loading')

    fetch(`/api/v1/stripe/session?session_id=${encodeURIComponent(sessionId)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok || !json?.success) {
          throw new Error(json?.error?.message || 'Unable to confirm purchase')
        }
        const data = json.data as SessionResponse
        setSummary(data)
        setStatus('complete')
        hasProcessedRef.current = true
        if (typeof window !== 'undefined' && !purchaseSentRef.current) {
          const fbq = (window as any).fbq
          if (typeof fbq === 'function') {
            fbq(
            'track',
            'Purchase',
            {
              value: data.amount,
              currency: data.currency || 'AUD',
              plan_type: data.planType,
            },
            { eventID: data.eventId }
          )
          purchaseSentRef.current = true
          }
        }
      })
      .catch((err: Error) => {
        setError(err.message)
        setStatus('error')
      })

    return () => controller.abort()
  }, [search, summary])

  useEffect(() => {
    if (status === 'complete' && hasProcessedRef.current) {
      const url = new URL(window.location.href)
      url.searchParams.delete('session_id')
      window.history.replaceState({}, '', url.toString())
    }
  }, [status])

  const renderContent = () => {
    if (status === 'loading' || status === 'idle') {
      return (
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Confirming your subscription…</p>
        </div>
      )
    }

    if (status === 'error') {
      return (
        <div className="flex flex-col items-center gap-4 text-center">
          <ShieldCheck className="h-10 w-10 text-destructive" />
          <div>
            <p className="text-lg font-semibold">We couldn’t verify the payment.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {error || 'Please refresh this page or reach out to support and we will sort it out quickly.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" onClick={() => router.replace('/dashboard')}>
              Go to dashboard
            </Button>
            {config.resend.supportEmail ? (
              <Button asChild>
                <Link href={`mailto:${config.resend.supportEmail}`}>Contact support</Link>
              </Button>
            ) : null}
          </div>
        </div>
      )
    }

    if (summary) {
      return (
        <div className="flex flex-col items-center gap-6 text-center">
          <CheckCircle className="h-12 w-12 text-primary" />
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">You’re all set!</h1>
            <p className="text-muted-foreground">
              We’ve activated your subscription and sent a confirmation email. Your plan details are ready in the dashboard.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card px-6 py-5 text-left shadow-sm">
            <div className="flex items-center gap-3 text-lg font-medium">
              <Sparkles className="h-5 w-5 text-primary" />
              Purchase summary
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-6">
                <dt className="text-muted-foreground">Amount</dt>
                <dd className="font-semibold">
                  {new Intl.NumberFormat('en-AU', { style: 'currency', currency: summary.currency }).format(summary.amount)}
                </dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt className="text-muted-foreground">Plan</dt>
                <dd className="capitalize">{summary.planType.replace('_', ' ')}</dd>
              </div>
            </dl>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => router.replace('/dashboard/settings?success=true')}>
              Go to dashboard
            </Button>
            <Button variant="ghost" onClick={() => router.replace('/dashboard')}>
              Explore renders
            </Button>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <main className="min-h-[70vh] w-full px-4 py-16">
      <div className="mx-auto flex max-w-xl flex-col items-center">
        {renderContent()}
      </div>
    </main>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
