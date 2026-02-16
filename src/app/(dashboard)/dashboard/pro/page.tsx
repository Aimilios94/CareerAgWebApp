'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Crown, Check, ExternalLink, Loader2 } from 'lucide-react'
import { PLANS } from '@/lib/stripe/plans'
import { useToast } from '@/hooks/use-toast'

export default function ProPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    }>
      <ProPageContent />
    </Suspense>
  )
}

function ProPageContent() {
  const { isPro, subscription, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  const success = searchParams.get('success') === 'true'
  const canceled = searchParams.get('canceled') === 'true'

  const handleUpgrade = async () => {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Checkout failed. Please try again.')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      toast({
        title: 'Checkout failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Portal unavailable. Please try again.')
      }
    } catch (err) {
      console.error('Portal error:', err)
      toast({
        title: 'Portal unavailable',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setPortalLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="relative">
        <h1 className="font-heading text-3xl font-bold text-white tracking-tight">
          {isPro ? 'Your Subscription' : 'Upgrade to Pro'}
        </h1>
        <p className="text-zinc-400 font-body mt-2 text-lg">
          {isPro
            ? 'Manage your Pro subscription and billing.'
            : 'Unlock powerful AI tools to supercharge your job search.'}
        </p>
      </div>

      {/* Success / Canceled banners */}
      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">
          Welcome to Pro! Your subscription is now active. Enjoy all premium features.
        </div>
      )}
      {canceled && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-300">
          Checkout was canceled. No charges were made. You can upgrade anytime.
        </div>
      )}

      {isPro ? (
        /* ===== PRO STATE: Subscription status ===== */
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Crown className="w-5 h-5 text-black" />
              </div>
              Pro Member
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Plan</span>
                <span className="text-white font-medium">Pro — ${PLANS.pro.price}/month</span>
              </div>
              {subscription?.current_period_end && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Renews on</span>
                  <span className="text-white font-medium">
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <Button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              variant="outline"
              className="gap-2 w-full"
            >
              {portalLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              Manage Subscription
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* ===== FREE STATE: Pricing comparison ===== */
        <div className="grid md:grid-cols-2 gap-6">
          {/* Free Plan Card */}
          <Card className="border-zinc-700/50">
            <CardHeader>
              <CardTitle className="text-white">Free</CardTitle>
              <p className="text-3xl font-bold text-white">
                $0<span className="text-sm font-normal text-zinc-400">/month</span>
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {PLANS.free.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-zinc-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full mt-6" disabled>
                Current Plan
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan Card */}
          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full text-xs font-semibold text-black">
              RECOMMENDED
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Crown className="w-5 h-5 text-amber-400" />
                Pro
              </CardTitle>
              <p className="text-3xl font-bold text-white">
                ${PLANS.pro.price}<span className="text-sm font-normal text-zinc-400">/month</span>
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {PLANS.pro.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                className="w-full mt-6 bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:from-amber-500 hover:to-orange-600 gap-2"
              >
                {checkoutLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Crown className="w-4 h-4" />
                )}
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
