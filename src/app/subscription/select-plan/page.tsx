"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, Crown, Users, Building2, Zap, Shield, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Plan {
  id: string
  name: string
  price: number
  period: string
  description: string
  icon: React.ReactNode
  badge?: string
  features: string[]
  limits: {
    users: number
    storage: string
    societies: number
  }
  popular?: boolean
}

const plans: Plan[] = [
  {
    id: 'trial',
    name: 'Trial',
    price: 0,
    period: '15 days',
    description: 'Perfect for exploring the platform',
    icon: <Shield className="h-6 w-6" />,
    features: [
      'Basic society management',
      'Member management (up to 3)',
      'Basic financial tracking',
      'Limited support',
      '1 GB storage'
    ],
    limits: {
      users: 3,
      storage: '1 GB',
      societies: 1
    }
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 4000,
    period: 'per month',
    description: 'Perfect for small communities',
    icon: <Users className="h-6 w-6" />,
    features: [
      'All trial features',
      'Member management (up to 10)',
      'Advanced financial tracking',
      'Basic reports & analytics',
      'Email support',
      '5 GB storage',
      'Up to 3 societies'
    ],
    limits: {
      users: 10,
      storage: '5 GB',
      societies: 3
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 7000,
    period: 'per month',
    description: 'Most popular choice for large communities',
    icon: <Zap className="h-6 w-6" />,
    badge: 'Most Popular',
    features: [
      'All basic features',
      'Unlimited members',
      'Advanced analytics dashboard',
      'Real-time collaboration',
      'Priority support',
      '20 GB storage',
      'Up to 10 societies',
      'Custom reports',
      'API access'
    ],
    limits: {
      users: 25,
      storage: '20 GB',
      societies: 10
    },
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 10000,
    period: 'per month',
    description: 'Complete solution for large organizations',
    icon: <Building2 className="h-6 w-6" />,
    badge: 'Complete Solution',
    features: [
      'All pro features',
      'Unlimited everything',
      'Dedicated account manager',
      '24/7 phone support',
      '100 GB storage',
      'Custom integrations',
      'Advanced security features',
      'Training & onboarding',
      'SLA guarantee'
    ],
    limits: {
      users: -1, // unlimited
      storage: '100 GB',
      societies: -1 // unlimited
    }
  }
]

export default function SubscriptionSelectPlan() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId)
  }

  const handleUpgrade = (planId: string) => {
    if (planId === 'trial') {
      router.push('/subscription')
      return
    }
    router.push(`/subscription/payment-upload?plan=${planId}`)
  }

  const getAnnualPrice = (monthlyPrice: number) => {
    return Math.round(monthlyPrice * 12 * 0.9) // 10% discount for annual
  }

  const getDisplayPrice = (plan: Plan) => {
    if (plan.price === 0) return 'Free'
    if (billingCycle === 'yearly') {
      const annualPrice = getAnnualPrice(plan.price)
      return `₹${annualPrice.toLocaleString()}/year`
    }
    return `₹${plan.price.toLocaleString()}/${plan.period}`
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Choose Your Perfect Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select the plan that best fits your society management needs
          </p>
        </div>

        {/* Current Subscription Alert */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-orange-800">
            <Shield className="h-5 w-5" />
            <span className="font-medium">Current Subscription: Trial expired</span>
          </div>
        </div>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as 'monthly' | 'yearly')}>
          <TabsList>
            <TabsTrigger value="monthly">Monthly Billing</TabsTrigger>
            <TabsTrigger value="yearly">
              Yearly Billing 
              <Badge variant="secondary" className="ml-2">Save 10%</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-8 lg:grid-cols-4 md:grid-cols-2">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative transition-all duration-200 hover:shadow-lg ${
              selectedPlan === plan.id ? 'ring-2 ring-primary shadow-lg' : ''
            } ${plan.popular ? 'border-primary' : ''}`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  {plan.badge}
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-2">
                {plan.icon}
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="pt-4">
                <div className="text-3xl font-bold">
                  {getDisplayPrice(plan)}
                </div>
                {plan.price > 0 && billingCycle === 'yearly' && (
                  <div className="text-sm text-muted-foreground">
                    Save ₹{(plan.price * 12 * 0.1).toLocaleString()} per year
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Features List */}
              <div className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Plan Limits */}
              <div className="border-t pt-4">
                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="flex justify-between">
                    <span>Users:</span>
                    <span className="font-medium">
                      {plan.limits.users === -1 ? 'Unlimited' : plan.limits.users}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage:</span>
                    <span className="font-medium">{plan.limits.storage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Societies:</span>
                    <span className="font-medium">
                      {plan.limits.societies === -1 ? 'Unlimited' : plan.limits.societies}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button 
                className={`w-full ${
                  plan.popular 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                    : ''
                }`}
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => handleUpgrade(plan.id)}
              >
                {plan.id === 'trial' ? 'Current Plan' : 'Select Plan'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Overview</CardTitle>
          <CardDescription>Detailed comparison of all available plans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Features</th>
                  <th className="text-center p-4">Trial</th>
                  <th className="text-center p-4">Basic</th>
                  <th className="text-center p-4">Pro</th>
                  <th className="text-center p-4">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 font-medium">Price</td>
                  <td className="text-center p-4">Free</td>
                  <td className="text-center p-4">₹4,000/month</td>
                  <td className="text-center p-4">₹7,000/month</td>
                  <td className="text-center p-4">₹10,000/month</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Duration</td>
                  <td className="text-center p-4">15 days</td>
                  <td className="text-center p-4">Monthly</td>
                  <td className="text-center p-4">Monthly</td>
                  <td className="text-center p-4">Monthly</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Users</td>
                  <td className="text-center p-4">3</td>
                  <td className="text-center p-4">10</td>
                  <td className="text-center p-4">25</td>
                  <td className="text-center p-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Societies</td>
                  <td className="text-center p-4">1</td>
                  <td className="text-center p-4">3</td>
                  <td className="text-center p-4">10</td>
                  <td className="text-center p-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Storage</td>
                  <td className="text-center p-4">1 GB</td>
                  <td className="text-center p-4">5 GB</td>
                  <td className="text-center p-4">20 GB</td>
                  <td className="text-center p-4">100 GB</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Basic Features</td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Advanced Analytics</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">Real-time Collaboration</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-medium">API Access</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Priority Support</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Support Section */}
      <div className="text-center space-y-4 bg-muted/50 rounded-lg p-8">
        <h3 className="text-2xl font-semibold">Need Help Choosing?</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Our team is here to help you select the perfect plan for your society management needs. 
          Contact us for a personalized consultation.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => router.push('/support')}>
            Contact Support
          </Button>
          <Button onClick={() => router.push('/demo')}>
            Schedule Demo
          </Button>
        </div>
      </div>
    </div>
  )
}