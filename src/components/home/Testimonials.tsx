'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Star, Quote, ArrowLeft, ArrowRight, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "Society Secretary",
    society: "Green Valley Gardens",
    content: "Saanify has transformed how we manage our society. The automated features have saved us countless hours, and members love the transparency.",
    rating: 5,
    delay: 0.1
  },
  {
    name: "Priya Sharma",
    role: "Treasurer",
    society: "Sunset Apartments",
    content: "The financial tracking and reporting features are exceptional. We've improved our collection rate by 40% since implementing Saanify.",
    rating: 5,
    delay: 0.2
  },
  {
    name: "Amit Patel",
    role: "Managing Committee",
    society: "Ocean View Residency",
    content: "Best decision we made for our society management. The support team is amazing, and platform keeps getting better with new features.",
    rating: 5,
    delay: 0.3
  }
]

interface TestimonialProps {
  name: string
  role: string
  society: string
  content: string
  rating: number
  delay: number
}

function TestimonialCard({ name, role, society, content, rating, delay, isActive }: TestimonialProps & { isActive?: boolean }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ 
        opacity: isActive ? 1 : 0.7, 
        scale: isActive ? 1 : 0.95,
        y: isActive ? 0 : 10
      }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -10, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`${isActive ? 'z-10' : 'z-0'}`}
    >
      <Card className={`h-full p-6 transition-all duration-300 border-0 bg-card ${
        isActive ? 'shadow-2xl ring-2 ring-primary ring-opacity-50' : 'shadow-lg'
      } ${isHovered ? 'shadow-2xl' : ''} cursor-pointer`}>
        <CardContent className="p-0">
          <div className="flex items-center mb-4">
            <motion.div 
              className="w-12 h-12 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg mr-4"
              animate={{ rotate: isHovered ? 360 : 0, scale: isHovered ? 1.1 : 1 }}
              transition={{ duration: 0.6 }}
            >
              {(name?.charAt(0) ?? "").toUpperCase()}
            </motion.div>
            <div>
              <h4 className="font-semibold text-foreground">{name}</h4>
              <p className="text-sm text-muted-foreground">{role}</p>
              <p className="text-xs text-primary font-medium">{society}</p>
            </div>
          </div>
          
          <div className="flex mb-3">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: delay + i * 0.1 }}
              >
                <Star
                  className={`h-4 w-4 ${
                    i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              </motion.div>
            ))}
          </div>

          <div className="relative">
            <motion.div
              animate={{ rotate: isHovered ? 10 : 0 }}
              transition={{ duration: 0.6 }}
            >
              <Quote className="absolute -top-2 -left-2 h-8 w-8 text-primary/20" />
            </motion.div>
            <p className="text-muted-foreground text-sm leading-relaxed pl-6 italic">
              {content}
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 text-center"
          >
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/90">
              Read Full Story
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function Testimonials() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-rotate testimonials
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000) // Change every 5 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const handlePrevTestimonial = () => {
    setIsAutoPlaying(false)
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const handleNextTestimonial = () => {
    setIsAutoPlaying(false)
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
  }

  const handleTestimonialClick = (index: number) => {
    setIsAutoPlaying(false)
    setCurrentTestimonial(index)
    toast.success("📝 Testimonial", {
      description: "Full customer stories available in our case studies section.",
      duration: 3000,
    })
  }

  const handleSocietyClick = (societyName: string) => {
    toast.success(`🏢 ${societyName}`, {
      description: "Learn more about this society's success story.",
      duration: 3000,
    })
  }

  const trustedSocieties = [
    "Green Valley Gardens",
    "Sunset Apartments", 
    "Ocean View Residency",
    "Maple Heights",
    "Royal Palm Estates",
    "Blue Haven Society",
    "Golden Gate Community",
    "Silver Oak Residency"
  ]

  return (
    <section id="testimonials" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Testimonials Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What Our Customers Say
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Hear from society managers who have transformed their operations with Saanify
          </p>
        </motion.div>

        {/* Featured Testimonial */}
        <div className="mb-12">
          <div className="relative max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <Button
                onClick={handlePrevTestimonial}
                variant="outline"
                size="sm"
                className="rounded-full p-2 hover:bg-primary/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleTestimonialClick(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      currentTestimonial === index 
                        ? 'bg-primary w-8' 
                        : 'bg-muted hover:bg-muted-foreground'
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={handleNextTestimonial}
                variant="outline"
                size="sm"
                className="rounded-full p-2 hover:bg-primary/10"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div onClick={() => handleTestimonialClick(currentTestimonial)}>
              <TestimonialCard
                {...testimonials[currentTestimonial]}
                isActive={true}
              />
            </div>
          </div>
        </div>

        {/* All Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              onClick={() => handleTestimonialClick(index)}
              className="cursor-pointer"
            >
              <TestimonialCard
                {...testimonial}
                isActive={index === currentTestimonial}
              />
            </div>
          ))}
        </div>

        {/* Trusted By Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Trusted by 500+ Societies Worldwide
            </h3>
            <p className="text-muted-foreground">
              Join thousands of satisfied communities using Saanify
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {trustedSocieties.map((society, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, scale: 1.05 }}
                onClick={() => handleSocietyClick(society)}
                className="flex items-center justify-center p-4 bg-muted/50 rounded-lg hover:bg-muted hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <div className="text-center">
                  <motion.div 
                    className="w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xs mx-auto mb-2"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    {society.substring(0, 2).toUpperCase()}
                  </motion.div>
                  <p className="text-sm font-medium text-foreground">{society}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}