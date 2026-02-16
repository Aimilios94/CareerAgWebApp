// Client-safe plan configuration — no Stripe SDK or secrets here

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      'Upload & parse CV',
      'Job search (5 per day)',
      'Basic match scores',
      'Skill gap analysis',
    ],
  },
  pro: {
    name: 'Pro',
    price: 19.99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? '',
    features: [
      'Everything in Free',
      'Unlimited job searches',
      'Auto-Fix CV for each job',
      'AI cover letter drafts',
      'Interview prep questions',
      'Priority support',
    ],
  },
} as const

export type PlanType = keyof typeof PLANS
