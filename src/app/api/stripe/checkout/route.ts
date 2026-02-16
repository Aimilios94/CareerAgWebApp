import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS } from '@/lib/stripe/config'
import { isDevBypassAllowed, DEV_USER_ID } from '@/lib/auth/dev-bypass'

const DEV_USER_EMAIL = 'test@dev.com'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user && !isDevBypassAllowed()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Dev bypass
    const userId = user?.id ?? DEV_USER_ID
    const userEmail = user?.email ?? DEV_USER_EMAIL

    // Fetch subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (subError) {
      throw new Error(subError.message)
    }

    // Create or reuse Stripe customer
    let customerId = subscription?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId },
      })
      customerId = customer.id

      // Save the customer ID to subscription
      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', userId)
    }

    // Create checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: PLANS.pro.priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard/pro?success=true`,
      cancel_url: `${appUrl}/dashboard/pro?canceled=true`,
      metadata: { userId },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
