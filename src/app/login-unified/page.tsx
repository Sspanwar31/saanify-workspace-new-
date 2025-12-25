'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff, Mail, Lock, Shield, Users, AlertCircle, CheckCircle, Sparkles, Zap, Crown, Database, ArrowRight, Github, Chrome } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

export default function UnifiedLoginPage() {
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [useSupabase, setUseSupabase] = useState(false)
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')

  // Demo credentials
  const demoCredentials = {
    admin: {
      email: 'ADMIN@saanify.com',
      password: 'admin123'
    },
    client: {
      email: 'client@saanify.com', 
      password: 'client123'
    }
  }

  // Check Supabase connection on mount
  useEffect(() => {
    checkSupabaseConnection()
  }, [])

  const checkSupabaseConnection = async () => {
    try {
      const response = await fetch('/api/integrations/supabase/status')
      const data = await response.json()
      
      console.log('Supabase status response:', data)
      
      if (data.connectionType === 'local') {
        setSupabaseStatus('disconnected')
        setUseSupabase(false)
      } else if (data.connected) {
        setSupabaseStatus('connected')
        setUseSupabase(true)
      } else {
        setSupabaseStatus('disconnected')
        setUseSupabase(false)
      }
    } catch (error) {
      console.error('Failed to check Supabase status:', error)
      setSupabaseStatus('disconnected')
      setUseSupabase(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!loginData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!loginData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      console.log('🔐 Attempting unified login with:', loginData.email)
      
      const loginEndpoint = useSupabase ? '/api/auth/supabase-signin' : '/api/auth/unified-login'
      
      const response = await fetch(loginEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
          rememberMe: loginData.rememberMe
        }),
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }
      
      // Success toast based on user type
      if (data.userType === 'admin') {
        toast.success('👑 Admin Access Granted!', {
          description: `Welcome back, ${data.user.name}! Redirecting to admin panel...`,
          duration: 3000,
        })
      } else {
        toast.success('🎉 Welcome Back!', {
          description: `Welcome back, ${data.user.name}! Redirecting to your dashboard...`,
          duration: 3000,
        })
      }

      // Redirect to the appropriate URL
      setTimeout(() => {
        window.location.href = data.redirectUrl
      }, 1500)

    } catch (error: any) {
      console.error('Login error:', error)
      toast.error('❌ Login Failed', {
        description: error.message || 'Invalid email or password. Please try again.',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setLoginData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Quick demo login functions
  const handleQuickAdminLogin = () => {
    setLoginData({
      email: demoCredentials.admin.email,
      password: demoCredentials.admin.password,
      rememberMe: false
    })
    toast.info('👑 Admin Demo Credentials', {
      description: 'Admin credentials filled. Click Sign In to continue.',
      duration: 2000,
    })
  }

  const handleQuickClientLogin = () => {
    setLoginData({
      email: demoCredentials.client.email,
      password: demoCredentials.client.password,
      rememberMe: false
    })
    toast.info('👤 Client Demo Credentials', {
      description: 'Client credentials filled. Click Sign In to continue.',
      duration: 2000,
    })
  }

  const handleGitHubLogin = () => {
    toast.info('🔗 GitHub Authentication', {
      description: 'GitHub authentication coming soon!',
      duration: 2000,
    })
  }

  const handleGoogleLogin = () => {
    toast.info('🔍 Google Authentication', {
      description: 'Google authentication coming soon!',
      duration: 2000,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Back to Home Button - Bottom Left */}
      <Link href="/" className="absolute bottom-6 left-6 z-20">
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
            Back to Home
          </Button>
        </motion.div>
      </Link>

      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

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
        className="w-full max-w-4xl relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Branding & Info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center lg:text-left text-white"
          >
            <div className="mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4, type: "spring" }}
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-6 shadow-2xl"
              >
                <span className="text-2xl font-bold text-white">S</span>
              </motion.div>
              
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Welcome Back to Saanify
              </h1>
              
              <p className="text-xl text-purple-200 mb-6 leading-relaxed">
                Enter your email address and password to access your personalized dashboard.
              </p>

              <div className="flex items-center gap-2 text-purple-200 mb-4">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-sm">Smart authentication redirects you to the right panel</span>
              </div>
            </div>

            {/* Supabase Status */}
            <div className="mb-6">
              <Alert className={`bg-white/10 backdrop-blur-sm border-white/20 ${
                supabaseStatus === 'connected' ? 'border-green-500/50' : 
                supabaseStatus === 'disconnected' ? 'border-blue-500/50' : 
                'border-yellow-500/50'
              }`}>
                <Database className="h-4 w-4" />
                <AlertDescription className="text-white">
                  <div className="flex items-center justify-between">
                    <span>
                      {supabaseStatus === 'connected' ? 'Supabase: Connected' : 
                       supabaseStatus === 'disconnected' ? 'Local Database: Ready' : 
                       'Checking...'}
                    </span>
                    {supabaseStatus === 'connected' && (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    )}
                    {supabaseStatus === 'disconnected' && (
                      <CheckCircle className="h-4 w-4 text-blue-400" />
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </div>

            {/* Features List */}
            <div className="space-y-4 mb-8">
              {[
                { icon: Shield, text: "Unified authentication system" },
                { icon: Users, text: "Automatic role-based redirects" },
                { icon: Zap, text: "One-click access to your panel" }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-3 text-purple-200"
                >
                  <feature.icon className="w-5 h-5 text-purple-400" />
                  <span>{feature.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Quick Demo Access */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Quick Demo Access
              </h3>
              <div className="space-y-3">
                <Button
                  onClick={handleQuickAdminLogin}
                  variant="outline"
                  className="w-full bg-amber-500/20 border-amber-500/30 text-amber-200 hover:bg-amber-500/30 hover:border-amber-500/50 transition-all duration-300"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Admin Demo (ADMIN@saanify.com)
                </Button>
                <Button
                  onClick={handleQuickClientLogin}
                  variant="outline"
                  className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all duration-300"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Client Demo (client@saanify.com)
                </Button>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Unified Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="bg-white/10 backdrop-blur-xl border-0 shadow-2xl">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-3xl font-bold text-white">
                  Sign In
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Access your Saanify account {useSupabase ? '(Supabase)' : '(Local Database)'}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleLogin} className="space-y-6">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-purple-300" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        value={loginData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder-purple-300 focus:border-purple-400 focus:ring-purple-400"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-400 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-purple-300" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder-purple-300 focus:border-purple-400 focus:ring-purple-400"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-0 h-full px-3 text-purple-300 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-red-400 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={loginData.rememberMe}
                      onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                      className="h-4 w-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <Label htmlFor="rememberMe" className="text-purple-200 text-sm">
                      Remember me for 7 days
                    </Label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 transition-all duration-300 transform hover:scale-105"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Signing in...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        Sign In
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full border-white/20" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-transparent text-purple-200">Or continue with</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={handleGitHubLogin}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                    >
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleGoogleLogin}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                    >
                      <Chrome className="w-4 h-4 mr-2" />
                      Google
                    </Button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="text-center">
                <p className="text-purple-200 text-sm">
                  Don't have an account?{' '}
                  <Link href="/signup" className="text-purple-400 hover:text-purple-300 underline">
                    Sign up
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