'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Building, Wrench, Calculator, Calendar, MessageSquare, Shield, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  delay: number
  onLearnMore?: (title: string) => void
}

function FeatureCard({ icon, title, description, delay, onLearnMore }: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -10, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onLearnMore?.(title)}
    >
      <Card className="h-full p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-md bg-card hover:bg-gradient-to-br hover:from-card hover:to-accent/20 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <CardContent className="p-0 text-center relative z-10">
          <div className="mb-4 flex justify-center">
            <motion.div 
              className="p-3 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              {icon}
            </motion.div>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">{description}</p>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: isHovered ? 1 : 0, height: isHovered ? 'auto' : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/90 hover:bg-primary/10">
              Learn More <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function Features() {
  const handleLearnMore = (featureTitle: string) => {
    toast.success(`Learn more about ${featureTitle}`, {
      description: "Feature details coming soon!",
      duration: 3000,
    })
  }

  const features = [
    {
      icon: <Building className="h-6 w-6" />,
      title: "Society Management",
      description: "Complete digital solution for managing society operations, residents, and daily activities.",
      delay: 0.1
    },
    {
      icon: <Wrench className="h-6 w-6" />,
      title: "Maintenance Tracking",
      description: "Streamlined maintenance request system with real-time status updates and vendor management.",
      delay: 0.2
    },
    {
      icon: <Calculator className="h-6 w-6" />,
      title: "Financial Management",
      description: "Transparent billing, automated payments, and comprehensive financial reporting.",
      delay: 0.3
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Event Management",
      description: "Organize community events, book amenities, and manage society calendars efficiently.",
      delay: 0.4
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Community Communication",
      description: "Built-in messaging system, notices, and discussion forums for better resident engagement.",
      delay: 0.5
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Security & Access",
      description: "Visitor management, access control, and security monitoring for enhanced safety.",
      delay: 0.6
    }
  ]

  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Choose Effortless Society?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover the features that make us the trusted choice for modern society management
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={feature.delay}
              onLearnMore={handleLearnMore}
            />
          ))}
        </div>
      </div>
    </section>
  )
}