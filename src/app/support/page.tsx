'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MessageSquare, Clock, CheckCircle, ArrowRight, Send, HelpCircle, FileText, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function Support() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success("📝 Support Request Submitted!", {
        description: "We'll get back to you within 24 hours.",
        duration: 5000,
      })
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        type: 'general'
      })
    } catch (error) {
      toast.error("❌ Submission Failed", {
        description: "Please try again or contact us directly.",
        duration: 3000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const supportCategories = [
    {
      icon: <HelpCircle className="h-6 w-6" />,
      title: "General Help",
      description: "Basic questions and guidance",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Account Issues",
      description: "Login, registration, and profile problems",
      color: "from-green-500 to-green-600"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Billing & Payments",
      description: "Subscription, invoices, and payment issues",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Technical Support",
      description: "Bug reports and technical assistance",
      color: "from-orange-500 to-orange-600"
    }
  ]

  const faqItems = [
    {
      question: "How do I reset my password?",
      answer: "Click on 'Forgot Password' on the login page and follow the instructions sent to your email."
    },
    {
      question: "Can I change my subscription plan?",
      answer: "Yes! Go to Settings > Billing > Change Plan to upgrade or downgrade your subscription."
    },
    {
      question: "How do I export my data?",
      answer: "Navigate to Settings > Data Export to download your data in various formats."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely! We use industry-standard encryption and regular security audits."
    }
  ]

  const contactMethods = [
    {
      icon: <Mail className="h-5 w-5" />,
      title: "Email Support",
      value: "support@saanify.com",
      description: "Get response within 24 hours"
    },
    {
      icon: <Phone className="h-5 w-5" />,
      title: "Phone Support",
      value: "+91 98765 43210",
      description: "Mon-Fri, 9 AM - 6 PM IST"
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: "Live Chat",
      value: "Available 24/7",
      description: "Instant help with our support team"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-sky-50/10 to-sky-100/10 dark:from-background dark:via-sky-950/50 dark:to-sky-900/50">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-lg font-bold text-foreground">Saanify</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/'}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back to Home
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            How Can We <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">Help You?</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Our dedicated support team is here to assist you with any questions or issues you may have.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Support Categories */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Contact Form */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Name</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Email</label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Subject</label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder="How can we help?"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="technical">Technical Issue</option>
                      <option value="billing">Billing Question</option>
                      <option value="feature">Feature Request</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Message</label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Please describe your issue in detail..."
                      rows={4}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Support Categories */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Support Categories</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supportCategories.map((category, index) => (
                  <motion.div
                    key={category.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="cursor-pointer"
                  >
                    <Card className="h-full p-6 hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-muted/20">
                      <CardContent className="p-0">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center text-white mb-4`}>
                          {category.icon}
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">{category.title}</h3>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-8"
          >
            {/* Quick Contact */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Quick Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactMethods.map((method, index) => (
                  <motion.div
                    key={method.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                    whileHover={{ x: 5 }}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${method.title.includes('Email') ? 'from-blue-500 to-blue-600' : method.title.includes('Phone') ? 'from-green-500 to-green-600' : 'from-purple-500 to-purple-600'} text-white flex-shrink-0`}>
                      {method.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{method.title}</h4>
                      <p className="text-xs text-primary font-medium">{method.value}</p>
                      <p className="text-xs text-muted-foreground">{method.description}</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {faqItems.map((faq, index) => (
                  <motion.div
                    key={faq.question}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                    whileHover={{ y: -2 }}
                    className="p-4 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  >
                    <h4 className="text-sm font-semibold text-foreground mb-2">{faq.question}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Response Time Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Response Time Guarantee</h3>
              <p className="text-muted-foreground mb-4">
                We're committed to responding to all support requests within 24 hours during business days.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                  <Clock className="h-3 w-3 mr-1" />
                  24 Hour Response
                </Badge>
                <Badge variant="secondary" className="bg-green-500/20 text-green-600 border-green-500/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Expert Support
                </Badge>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-600 border-blue-500/30">
                  <Users className="h-3 w-3 mr-1" />
                  Dedicated Team
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}