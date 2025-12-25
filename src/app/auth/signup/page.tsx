'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, CheckCircle, AlertCircle, Github, Chrome, Sparkles, Zap, Shield, Crown, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const PLAN_DETAILS = {
  trial: {
    name: 'Trial',
    price: 'Free',
    duration: '15 Days',
    description: 'Perfect for getting started',
    icon: Zap,
    color: 'blue'
  },
  basic: {
    name: 'Basic',
    price: '₹4,000',
    duration: 'per month',
    description: 'Great for small societies',
    icon: Crown,
    color: 'purple'
  },
  pro: {
    name: 'Pro',
    price: '₹7,000',
    duration: 'per month',
    description: 'Advanced features for larger societies',
    icon: Sparkles,
    color: 'green'
  },
  enterprise: {
    name: 'Enterprise',
    price: '₹10,000',
    duration: 'per month',
    description: 'Complete solution for large organizations',
    icon: Shield,
    color: 'orange'
  }
}

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planParam = searchParams?.get('plan') || 'trial'
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedPlan, setSelectedPlan] = useState(planParam)

  // Get plan details
  const planDetails = PLAN_DETAILS[selectedPlan as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.trial
  const PlanIcon = planDetails.icon

  useEffect(() => {
    // Save selected plan to session storage
    sessionStorage.setItem('selectedPlan', selectedPlan)
  }, [selectedPlan])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          plan: selectedPlan
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }
      
      if (selectedPlan === 'trial') {
        toast.success('🎉 Account created successfully!', {
          description: `Welcome to Saanify! Your 15-day trial has started. Redirecting to dashboard...`,
          duration: 3000,
        })

        // Wait a bit for cookie to be set, then redirect
        setTimeout(() => {
          window.location.href = data.redirectUrl || '/client'
        }, 3000)
      } else {
        toast.success('🎉 Account created successfully!', {
          description: `Welcome to Saanify! Please complete your payment for the ${planDetails.name} plan.`,
          duration: 3000,
        })

        // Redirect to payment upload for paid plans
        setTimeout(() => {
          window.location.href = `/subscription/payment-upload?plan=${selectedPlan}`
        }, 2000)
      }

    } catch (error: any) {
      console.error('Signup error:', error)
      toast.error('❌ Registration failed', {
        description: error.message || 'Something went wrong. Please try again.',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleGoogleSignup = () => {
    toast.info('🔍 Google Sign Up', {
      description: 'Google authentication coming soon!',
      duration: 2000,
    })
  }

  const handleGitHubSignup = () => {
    toast.info('🔗 GitHub Sign Up', {
      description: 'GitHub authentication coming soon!',
      duration: 2000,
    })
  }

  const handlePlanChange = (newPlan: string) => {
    setSelectedPlan(newPlan)
    sessionStorage.setItem('selectedPlan', newPlan)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Back to Plan Selection */}
      <Link href="/subscription/select-plan" className="absolute bottom-6 left-6 z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant="outline" 
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Change Plan
          </Button>
        </motion.div>
      </Link>

      {/* Floating Elements */}
      <div className="absolute top-10 left-10">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="w-6 h-6 text-purple-400 opacity-60" />
        </motion.div>
      </div>
      <div className="absolute top-32 right-16">
        <motion.div
          animate={{ y: [0, 15, 0], rotate: [0, -5, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <Zap className="w-5 h-5 text-blue-400 opacity-60" />
        </motion.div>
      </div>
      <div className="absolute bottom-20 right-32">
        <motion.div
          animate={{ y: [0, -25, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <Crown className="w-6 h-6 text-amber-400 opacity-60" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-5xl relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Side - Selected Plan Info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center lg:text-left text-white"
          >
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-6 shadow-2xl">
                <PlanIcon className="w-8 h-8 text-white" />
              </div>
              
              <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Complete Your {planDetails.name} Registration
              </h1>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-2xl font-bold text-white">{planDetails.price}</div>
                    <div className="text-sm text-purple-200">{planDetails.duration}</div>
                  </div>
                  <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
                    {planDetails.name}
                  </Badge>
                </div>
                <p className="text-purple-200 text-sm">{planDetails.description}</p>
              </div>
            </div>

            {/* Quick Plan Switcher */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold text-purple-200 mb-3">Quick Switch Plan:</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PLAN_DETAILS).map(([key, plan]) => (
                  <Button
                    key={key}
                    variant={selectedPlan === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePlanChange(key)}
                    className={`text-xs ${
                      selectedPlan === key 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                    }`}
                  >
                    {plan.name}
                  </Button>
                ))}
              </div>
            </div>

            {selectedPlan !== 'trial' && (
              <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
                <div className="flex items-center gap-2 text-yellow-300 text-sm">
                  <CreditCard className="w-4 h-4" />
                  <span>Payment required after signup</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Right Side - Signup Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="bg-white/10 backdrop-blur-xl border-0 shadow-2xl">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-3xl font-bold text-white">
                  Create Your Account
                </CardTitle>
                <CardDescription className="text-purple-200">
                  {selectedPlan === 'trial' 
                    ? 'Start your 15-day free trial today' 
                    : `Complete signup for ${planDetails.name} plan - ${planDetails.price}`
                  }
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Full Name */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    <Label htmlFor="fullName" className="text-purple-200 font-medium">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-purple-300" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className={`pl-10 bg-white/10 border-white/20 text-white placeholder-purple-300 ${errors.fullName ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-sm text-red-400 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.fullName}
                      </p>
                    )}
                  </motion.div>

                  {/* Email */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <Label htmlFor="email" className="text-purple-200 font-medium">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-purple-300" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`pl-10 bg-white/10 border-white/20 text-white placeholder-purple-300 ${errors.email ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-400 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.email}
                      </p>
                    )}
                  </motion.div>

                  {/* Password */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <Label htmlFor="password" className="text-purple-200 font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-purple-300" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder-purple-300 ${errors.password ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-purple-300"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-400 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.password}
                      </p>
                    )}
                  </motion.div>

                  {/* Confirm Password */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <Label htmlFor="confirmPassword" className="text-purple-200 font-medium">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-purple-300" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder-purple-300 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-purple-300"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-400 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </motion.div>

                  {/* Terms and Conditions */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  >
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked as boolean)}
                        disabled={isLoading}
                        className="mt-1 border-white/20 data-[state=checked]:bg-purple-600"
                      />
                      <div className="space-y-1">
                        <Label htmlFor="agreeToTerms" className="text-purple-200 text-sm font-medium cursor-pointer">
                          I agree to the Terms and Conditions
                        </Label>
                        <p className="text-xs text-purple-300">
                          By creating an account, you agree to our{' '}
                          <Link href="/terms" className="text-purple-400 hover:text-purple-300 underline">
                            Terms of Service
                          </Link>{' '}
                          and{' '}
                          <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline">
                            Privacy Policy
                          </Link>
                        </p>
                      </div>
                    </div>
                    {errors.agreeToTerms && (
                      <p className="text-sm text-red-400 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.agreeToTerms}
                      </p>
                    )}
                  </motion.div>

                  {/* Submit Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating Account...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          {selectedPlan === 'trial' ? 'Start Free Trial' : `Create Account - ${planDetails.name}`}
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </form>

                <Separator className="my-6 bg-white/20" />

                {/* Social Signup */}
                <div className="space-y-4">
                  <div className="text-center">
                    <span className="text-purple-200 text-sm">Or continue with</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300"
                      onClick={handleGoogleSignup}
                      disabled={isLoading}
                    >
                      <Chrome className="w-4 h-4 mr-2" />
                      Google
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300"
                      onClick={handleGitHubSignup}
                      disabled={isLoading}
                    >
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                    </Button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="text-center">
                <p className="text-purple-200 text-sm">
                  Already have an account?{' '}
                  <Link href="/login" className="text-purple-400 hover:text-purple-300 underline font-medium">
                    Sign in here
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}