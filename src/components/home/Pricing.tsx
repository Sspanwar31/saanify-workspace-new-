'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Check, Star, ArrowRight, Zap, Shield, Crown, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

interface PricingCardProps {
  title: string
  price: string
  period?: string
  description: string
  features: string[]
  highlighted?: boolean
  delay: number
  cta: string
  onSelectPlan: (plan: string) => void
}

function PricingCard({ title, price, period, description, features, highlighted, delay, cta, onSelectPlan }: PricingCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -10, scale: highlighted ? 1.02 : 1.01 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative ${highlighted ? 'scale-105' : ''}`}
    >
      {highlighted && (
        <motion.div 
          className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10"
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
            <Star className="h-4 w-4 fill-current" />
            Most Popular
          </div>
        </motion.div>
      )}
      
      <Card className={`h-full p-8 relative cursor-pointer transition-all duration-300 ${
        highlighted 
          ? 'border-2 border-primary shadow-2xl bg-gradient-to-br from-primary/5 to-primary/10' 
          : 'border-0 shadow-lg bg-card hover:shadow-xl'
      } ${isHovered ? 'transform -translate-y-2' : ''}`}>
        <CardContent className="p-0">
          <div className="text-center mb-8">
            <motion.div 
              className="mb-4 flex justify-center"
              animate={{ rotate: isHovered ? 360 : 0 }}
              transition={{ duration: 0.6 }}
            >
              {title === "Free Trial" && <Zap className="h-8 w-8 text-green-500" />}
              {title === "Basic" && <CheckCircle className="h-8 w-8 text-blue-500" />}
              {title === "Pro" && <Shield className="h-8 w-8 text-blue-500" />}
              {title === "Enterprise" && <Crown className="h-8 w-8 text-purple-500" />}
            </motion.div>
            <h3 className="text-2xl font-bold text-foreground mb-2">{title}</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-foreground">{price}</span>
              {period && <span className="text-muted-foreground ml-2">{period}</span>}
            </div>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>

          <ul className="space-y-4 mb-8">
            {features.map((feature, index) => (
              <motion.li 
                key={index} 
                className="flex items-start"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: delay + index * 0.1 }}
              >
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-foreground text-sm">{feature}</span>
              </motion.li>
            ))}
          </ul>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={() => onSelectPlan(title)}
              className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                highlighted
                  ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl'
                  : 'bg-foreground hover:bg-foreground/90 text-background hover:shadow-lg'
              }`}
            >
              {cta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function Pricing() {
  const handleSelectPlan = (planTitle: string) => {
    if (planTitle === "Free Trial") {
      toast.success("Free Trial Started!", {
        description: "Redirecting to signup for trial...",
        duration: 3000,
      })
      // Redirect to signup page for trial users
      setTimeout(() => {
        window.location.href = '/signup?plan=TRIAL'
      }, 1000)
    } else if (planTitle === "Basic") {
      toast.success("Basic Plan Selected!", {
        description: "Redirecting to payment page...",
        duration: 3000,
      })
      // Redirect to payment page for basic users
      setTimeout(() => {
        window.location.href = '/payment?plan=BASIC'
      }, 1000)
    } else if (planTitle === "Pro") {
      toast.success("Pro Plan Selected!", {
        description: "Redirecting to payment page...",
        duration: 3000,
      })
      // Redirect to payment page for pro users
      setTimeout(() => {
        window.location.href = '/payment?plan=PRO'
      }, 1000)
    } else if (planTitle === "Enterprise") {
      toast.success("Enterprise Plan Selected!", {
        description: "Redirecting to payment page...",
        duration: 3000,
      })
      // Redirect to payment page for enterprise users
      setTimeout(() => {
        window.location.href = '/payment?plan=ENTERPRISE'
      }, 1000)
    }
  }

  const pricingPlans = [
    {
      title: "Free Trial",
      price: "Free",
      period: "15 Days",
      description: "Perfect for exploring our platform",
      features: [
        "Up to 50 members",
        "Basic member management",
        "Standard support",
        "Limited analytics",
        "Mobile app access"
      ],
      highlighted: false,
      delay: 0.1,
      cta: "Start Free Trial"
    },
    {
      title: "Basic",
      price: "₹4,000",
      period: "/month",
      description: "Perfect for small societies",
      features: [
        "Up to 200 Members",
        "Daily Ledger",
        "Basic member management",
        "Standard support",
        "Mobile app access"
      ],
      highlighted: false,
      delay: 0.2,
      cta: "Get Started"
    },
    {
      title: "Pro",
      price: "₹7,000",
      period: "/month",
      description: "Best for growing societies",
      features: [
        "Up to 2,000 Members",
        "Daily Ledger",
        "Advanced member management",
        "Priority support",
        "Advanced analytics",
        "Audit Reports",
        "API access"
      ],
      highlighted: true,
      delay: 0.3,
      cta: "Start Pro"
    },
    {
      title: "Enterprise",
      price: "₹10,000",
      period: "/month",
      description: "For large communities",
      features: [
        "Unlimited Members",
        "Daily Ledger",
        "White-label solution",
        "Dedicated account manager",
        "Custom integrations",
        "Advanced security",
        "SLA guarantee",
        "API Access"
      ],
      highlighted: false,
      delay: 0.4,
      cta: "Contact Sales / Buy"
    }
  ]

  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Plans & Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the perfect plan for your society's growth journey
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <PricingCard
              key={index}
              title={plan.title}
              price={plan.price}
              period={plan.period}
              description={plan.description}
              features={plan.features}
              highlighted={plan.highlighted}
              delay={plan.delay}
              cta={plan.cta}
              onSelectPlan={handleSelectPlan}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground mb-4">
            Need a custom solution? We offer tailored plans for specific requirements.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="outline"
              className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold px-8 py-3 rounded-lg transition-all duration-300"
            >
              Talk to Sales Team
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}