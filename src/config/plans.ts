export const SUBSCRIPTION_PLANS = {
  TRIAL: {
    id: 'TRIAL',
    name: 'Free Trial',
    price: 0,
    duration: 15, // days
    features: [
      'Up to 50 members',
      'Basic member management',
      'Standard support',
      'Limited analytics',
      'Mobile app access'
    ],
    description: 'Perfect for exploring our platform',
    highlighted: false
  },
  BASIC: {
    id: 'BASIC',
    name: 'Basic',
    price: 4000,
    duration: 30, // days
    features: [
      'Up to 200 Members',
      'Daily Ledger',
      'Basic member management',
      'Standard support',
      'Mobile app access'
    ],
    description: 'Perfect for small societies',
    highlighted: false
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    price: 7000,
    duration: 30, // days
    features: [
      'Up to 2,000 Members',
      'Daily Ledger',
      'Advanced member management',
      'Priority support',
      'Advanced analytics',
      'Audit Reports',
      'API access'
    ],
    description: 'Best for growing societies',
    highlighted: true
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 10000,
    duration: 30, // days
    features: [
      'Unlimited Members',
      'Daily Ledger',
      'White-label solution',
      'Dedicated account manager',
      'Custom integrations',
      'Advanced security',
      'SLA guarantee',
      'API Access'
    ],
    description: 'For large communities',
    highlighted: false
  }
} as const;

export type PlanId = keyof typeof SUBSCRIPTION_PLANS;
export type Plan = typeof SUBSCRIPTION_PLANS[PlanId];