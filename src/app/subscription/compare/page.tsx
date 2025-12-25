'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, X, Star, ArrowRight, Zap, Crown, Building } from 'lucide-react'

const plans = [
  {
    id: 'trial',
    name: 'Trial',
    price: 'Free',
    duration: '15 Days',
    description: 'Perfect for getting started and exploring our platform',
    icon: Zap,
    color: 'gray',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    gradient: 'from-gray-500 to-gray-600',
    recommended: false,
    features: [
      { name: 'Basic Features', included: true, description: 'Access to core society management tools' },
      { name: 'User Limit', included: true, description: 'Up to 3 users' },
      { name: 'Trial Period', included: true, description: '15 days free access' },
      { name: 'Advanced Analytics', included: false, description: 'Detailed insights and reports' },
      { name: 'Real-time Collaboration', included: false, description: 'Live updates and teamwork' },
      { name: 'API Access', included: false, description: 'Programmatic access to features' },
      { name: 'Priority Support', included: false, description: '24/7 dedicated support' },
      { name: 'Custom Integrations', included: false, description: 'Connect with your existing tools' }
    ]
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '₹4,000',
    duration: 'per month',
    description: 'Great for small societies and growing organizations',
    icon: Crown,
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    gradient: 'from-blue-500 to-cyan-500',
    recommended: true,
    features: [
      { name: 'Basic Features', included: true, description: 'Access to core society management tools' },
      { name: 'User Limit', included: true, description: 'Up to 10 users' },
      { name: 'Trial Period', included: false, description: 'N/A - Paid plan' },
      { name: 'Advanced Analytics', included: true, description: 'Detailed insights and reports' },
      { name: 'Real-time Collaboration', included: false, description: 'Live updates and teamwork' },
      { name: 'API Access', included: false, description: 'Programmatic access to features' },
      { name: 'Priority Support', included: true, description: 'Email and chat support' },
      { name: 'Custom Integrations', included: false, description: 'Connect with your existing tools' }
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹7,000',
    duration: 'per month',
    description: 'Advanced features for larger societies',
    icon: Building,
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    gradient: 'from-purple-500 to-pink-500',
    recommended: false,
    features: [
      { name: 'Basic Features', included: true, description: 'Access to core society management tools' },
      { name: 'User Limit', included: true, description: 'Unlimited users' },
      { name: 'Trial Period', included: false, description: 'N/A - Paid plan' },
      { name: 'Advanced Analytics', included: true, description: 'Detailed insights and reports' },
      { name: 'Real-time Collaboration', included: true, description: 'Live updates and teamwork' },
      { name: 'API Access', included: true, description: 'Programmatic access to features' },
      { name: 'Priority Support', included: true, description: '24/7 dedicated support' },
      { name: 'Custom Integrations', included: true, description: 'Connect with your existing tools' }
    ]
  }
]

const featureCategories = [
  {
    title: 'Core Features',
    features: ['Basic Features', 'User Limit', 'Trial Period']
  },
  {
    title: 'Advanced Features',
    features: ['Advanced Analytics', 'Real-time Collaboration', 'API Access']
  },
  {
    title: 'Support & Services',
    features: ['Priority Support', 'Custom Integrations']
  }
]

export default function PlanComparisonPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
  }

  const handleContinue = (planId: string) => {
    if (planId === 'trial') {
      router.push(`/auth/signup?plan=${planId}`)
    } else {
      router.push(`/subscription/payment-upload?plan=${planId}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Saanify</span>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/subscription">
                <Button variant="outline" size="sm">
                  Back to Plans
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm" className="border-blue-200 hover:border-blue-300 hover:bg-blue-50">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge className="mb-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
            <Star className="w-4 h-4 mr-1" />
            Plan Overview
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
            Compare Our
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Subscription Plans</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Find the perfect plan for your society. Compare features side by side to make an informed decision.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-4 border-b border-slate-200">
            <div className="p-6 bg-slate-50">
              <h3 className="font-semibold text-slate-900">Features</h3>
            </div>
            {plans.map((plan) => {
              const Icon = plan.icon
              return (
                <div key={plan.id} className={`p-6 text-center ${plan.bgColor} ${plan.borderColor} border-l`}>
                  {plan.recommended && (
                    <Badge className="mb-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                      Most Popular
                    </Badge>
                  )}
                  <div className={`mx-auto mb-3 h-12 w-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h3>
                  <div className="text-2xl font-bold text-slate-900 mb-1">{plan.price}</div>
                  {plan.price !== 'Free' && (
                    <div className="text-sm text-slate-600">{plan.duration}</div>
                  )}
                  {plan.price === 'Free' && (
                    <div className="text-sm text-slate-600">{plan.duration}</div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Feature Rows */}
          {featureCategories.map((category, categoryIndex) => (
            <div key={category.title} className={categoryIndex > 0 ? 'border-t border-slate-100' : ''}>
              {/* Category Header */}
              <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-100">
                <div className="p-4">
                  <h4 className="font-semibold text-slate-900">{category.title}</h4>
                </div>
                {plans.map((plan) => (
                  <div key={plan.id} className="p-4 text-center border-l border-slate-100"></div>
                ))}
              </div>

              {/* Feature Rows */}
              {category.features.map((featureName) => (
                <div key={featureName} className="grid grid-cols-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="p-4">
                    <div className="font-medium text-slate-900">{featureName}</div>
                    <div className="text-sm text-slate-600 mt-1">
                      {plans[0].features.find(f => f.name === featureName)?.description}
                    </div>
                  </div>
                  {plans.map((plan) => {
                    const feature = plan.features.find(f => f.name === featureName)
                    return (
                      <div key={plan.id} className="p-4 text-center border-l border-slate-100">
                        {feature?.included ? (
                          <div className="flex items-center justify-center">
                            <Check className="h-5 w-5 text-green-500" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <X className="h-5 w-5 text-slate-300" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          ))}

          {/* CTA Row */}
          <div className="grid grid-cols-4 bg-slate-50">
            <div className="p-6">
              <div className="text-sm text-slate-600">Ready to get started?</div>
            </div>
            {plans.map((plan) => (
              <div key={plan.id} className="p-4 text-center border-l border-slate-100">
                <Button 
                  className={`w-full ${
                    plan.recommended 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg' 
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                  onClick={() => handleContinue(plan.id)}
                >
                  {plan.id === 'trial' ? 'Start Free Trial' : `Choose ${plan.name}`}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-16 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Still have questions?</h2>
            <p className="text-slate-600 mb-8">
              Our support team is here to help you choose the right plan for your society.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" size="lg" className="border-blue-200 hover:border-blue-300 hover:bg-blue-50">
                Contact Support
              </Button>
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
                Schedule a Demo
              </Button>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 border-t border-slate-200 pt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-2">15+</div>
              <div className="text-sm text-slate-600">Days Free Trial</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-2">1000+</div>
              <div className="text-sm text-slate-600">Happy Societies</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-2">24/7</div>
              <div className="text-sm text-slate-600">Customer Support</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-2">99.9%</div>
              <div className="text-sm text-slate-600">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}