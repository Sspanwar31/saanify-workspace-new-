'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, Eye, EyeOff, UserPlus, LogIn, ArrowRight, Check, Shield, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'

interface LoginModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export default function LoginModal({ isOpen, onOpenChange }: LoginModalProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('signin')
  const [userType, setUserType] = useState<'client' | 'admin'>('client')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Super Client Secret Entry
    if (email === 'super@saanify.com' && password === 'super123') {
      toast.success("🚀 Super Client Access Granted!", {
        description: "Welcome to the Saanify Super Client V2",
        duration: 3000,
      })
      window.location.href = '/super-client/dashboard'
      onOpenChange(false)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, userType })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("🎉 Welcome Back!", {
          description: `Successfully signed in as ${data.user.role === 'ADMIN' ? 'Administrator' : 'Client'}.`,
          duration: 3000,
        })
        
        // Store tokens using the enhanced auth utility
        if (data.accessToken && data.refreshToken) {
          const { setAuthTokens } = await import('@/lib/auth')
          setAuthTokens({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken
          })
        }
        
        // Redirect based on user role
        if (data.user.role === 'ADMIN') {
          window.location.href = '/ADMIN'
        } else {
          window.location.href = '/client'
        }
        
        onOpenChange(false)
      } else {
        toast.error(data.error || "Login failed", {
          description: "Please check your credentials and try again.",
          duration: 3000,
        })
      }
    } catch (error) {
      toast.error("Login failed", {
        description: "An error occurred. Please try again.",
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("🎉 Account Created!", {
          description: "Your account has been created successfully.",
          duration: 3000,
        })
        
        // Switch to sign in tab
        setActiveTab('signin')
      } else {
        toast.error(data.error || "Signup failed", {
          description: "Please check your information and try again.",
          duration: 3000,
        })
      }
    } catch (error) {
      toast.error("Signup failed", {
        description: "An error occurred. Please try again.",
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTrial = () => {
    toast.success("🚀 Trial Started!", {
      description: "Your 15-day free trial has begun.",
      duration: 3000,
    })
    onOpenChange(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => onOpenChange(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ 
                duration: 0.3,
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-4 text-white/80 hover:text-white hover:bg-white/20"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
                
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                    className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <User className="h-6 w-6" />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2">Welcome to Saanify</h2>
                  <p className="text-white/90 text-sm">Sign in to your account or create a new one</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="signin" className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                  {/* Sign In Form */}
                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      {/* User Type Selection */}
                      <div className="space-y-2">
                        <Label>Account Type</Label>
                        <RadioGroup 
                          value={userType} 
                          onValueChange={(value) => setUserType(value as 'client' | 'admin')}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="client" id="client" />
                            <Label htmlFor="client" className="flex items-center gap-2 cursor-pointer">
                              <Users className="h-4 w-4" />
                              Client
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="admin" id="admin" />
                            <Label htmlFor="admin" className="flex items-center gap-2 cursor-pointer">
                              <Shield className="h-4 w-4" />
                              Admin
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="signin-email"
                            name="email"
                            type="email"
                            placeholder="Enter your email"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="signin-password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="pl-10 pr-10"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1 h-8 w-8 p-0"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-gray-600 dark:text-gray-400">Remember me</span>
                        </label>
                        <Button variant="link" className="p-0 h-auto text-emerald-600 hover:text-emerald-700">
                          Forgot password?
                        </Button>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Signing in...
                          </div>
                        ) : (
                          <>
                            Sign In as {userType === 'admin' ? 'Administrator' : 'Client'}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* Sign Up Form */}
                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="signup-name"
                            name="name"
                            type="text"
                            placeholder="Enter your full name"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="signup-email"
                            name="email"
                            type="email"
                            placeholder="Enter your email"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="signup-password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password"
                            className="pl-10 pr-10"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1 h-8 w-8 p-0"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p className="flex items-center gap-1 mb-1">
                          <Check className="h-3 w-3 text-emerald-600" />
                          At least 8 characters
                        </p>
                        <p className="flex items-center gap-1">
                          <Check className="h-3 w-3 text-emerald-600" />
                          Include numbers and letters
                        </p>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Creating account...
                          </div>
                        ) : (
                          <>
                            Create Account
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                {/* Trial Option */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Want to try before you buy?
                    </p>
                    <Button
                      variant="outline"
                      className="w-full border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                      onClick={handleTrial}
                    >
                      Start 15-Day Free Trial
                    </Button>
                  </div>
                </div>

                {/* GitHub Login Option */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Or continue with
                    </p>
                    <Button
                      variant="outline"
                      className="w-full border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/30"
                      onClick={() => {
                        toast.info("GitHub Login", {
                          description: "GitHub authentication coming soon!",
                          duration: 3000,
                        })
                      }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      Continue with GitHub
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}