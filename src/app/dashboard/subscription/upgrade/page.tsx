'use client'

import Link from 'next/link'
import { Check, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Mock current plan - will be replaced with database subscription later
const currentPlan = {
  name: 'Basic',
  price: 299
}

const plans = [
  {
    name: 'Basic',
    price: 299,
    duration: 'per month',
    description: 'Perfect for small societies getting started',
    features: [
      'Up to 50 members',
      'Basic transaction tracking',
      'Monthly reports',
      'Email support',
      'Mobile app access'
    ],
    notIncluded: [
      'Advanced analytics',
      'Custom branding',
      'API access'
    ]
  },
  {
    name: 'Professional',
    price: 599,
    duration: 'per month',
    description: 'Ideal for growing societies with more needs',
    features: [
      'Up to 200 members',
      'Advanced transaction tracking',
      'Weekly & monthly reports',
      'Priority email support',
      'Mobile app access',
      'Advanced analytics dashboard',
      'Custom branding options'
    ],
    notIncluded: [
      'API access',
      'Dedicated account manager'
    ],
    popular: true
  },
  {
    name: 'Enterprise',
    price: 999,
    duration: 'per month',
    description: 'Complete solution for large societies',
    features: [
      'Unlimited members',
      'Complete transaction management',
      'Real-time reporting & analytics',
      '24/7 phone & email support',
      'Mobile app with white-labeling',
      'Advanced analytics & insights',
      'Full custom branding',
      'API access for integrations',
      'Dedicated account manager',
      'On-site training & setup'
    ]
  }
]

function PlanButton({ plan, currentPlan }: { plan: typeof plans[0]; currentPlan: { name: string; price: number } }) {
  const isCurrentPlan = plan.name === currentPlan.name
  const isUpgrade = plan.price > currentPlan.price
  const isDowngrade = plan.price < currentPlan.price

  if (isCurrentPlan) {
    return (
      <Button className="w-full" variant="outline">
        Renew Current Plan
      </Button>
    )
  }

  if (isUpgrade) {
    return (
      <Button className="w-full">
        Upgrade Plan
      </Button>
    )
  }

  if (isDowngrade) {
    return (
      <Button className="w-full" variant="outline" disabled>
        Not Available
      </Button>
    )
  }

  return null
}

export default function SubscriptionUpgrade() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto py-8">
        {/* Back to Dashboard Button */}
        <div className="mb-8">
          <Link href="/dashboard/client">
            <Button variant="ghost" className="pl-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Client Dashboard
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Upgrade Your Subscription
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Choose the perfect plan for your society's needs
          </p>
        </div>

        {/* Current Plan Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-center">
          <span className="text-blue-800 font-medium">Your current plan: </span>
          <Badge variant="default" className="ml-2 bg-blue-600 hover:bg-blue-700">
            {currentPlan.name} - ₹{currentPlan.price}/month
          </Badge>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = plan.name === currentPlan.name
            const isUpgrade = plan.price > currentPlan.price
            
            return (
              <Card
                key={plan.name}
                className={cn(
                  "relative flex flex-col h-full",
                  plan.popular && "border-blue-500 shadow-lg",
                  isCurrentPlan && "ring-2 ring-blue-500 bg-blue-50"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 hover:bg-blue-700">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">₹{plan.price}</span>
                    <span className="text-gray-500 ml-1">{plan.duration}</span>
                  </div>
                  <CardDescription className="mt-2">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {plan.notIncluded?.map((feature) => (
                      <li key={feature} className="flex items-start text-gray-400">
                        <Check className="h-5 w-5 text-gray-300 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-4">
                  <PlanButton plan={plan} currentPlan={currentPlan} />
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* Help Section */}
        <div className="mt-16 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Need help choosing a plan?
          </h3>
          <p className="text-gray-600 mb-4">
            Our support team is here to help you make the right choice for your society.
          </p>
          <Button variant="outline">
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  )
}
