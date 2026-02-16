import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  const body = await request.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    const supabase = createAdminClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as unknown as {
          customer: string
          subscription: string
          metadata: { userId: string }
        }

        const { error } = await supabase
          .from('subscriptions')
          .update({
            plan_type: 'pro',
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
          })
          .eq('user_id', session.metadata.userId)

        if (error) throw error
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as unknown as {
          id: string
          customer: string
          status: string
          current_period_end: number
          metadata: { userId: string }
        }

        const planType = subscription.status === 'active' ? 'pro' : 'free'

        const { error } = await supabase
          .from('subscriptions')
          .update({
            plan_type: planType,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('user_id', subscription.metadata.userId)

        if (error) throw error
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as unknown as {
          id: string
          customer: string
          metadata: { userId: string }
        }

        const { error } = await supabase
          .from('subscriptions')
          .update({
            plan_type: 'free',
            stripe_subscription_id: null,
            current_period_end: null,
          })
          .eq('user_id', subscription.metadata.userId)

        if (error) throw error
        break
      }

      case 'invoice.payment_failed':
        console.warn('Payment failed for customer:', (event.data.object as { customer: string }).customer)
        break

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
