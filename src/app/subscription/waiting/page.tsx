"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Clock, CheckCircle, Mail, Phone, MessageCircle, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SubscriptionWaiting() {
  const router = useRouter()
  const [elapsedTime, setElapsedTime] = useState(0)
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed'>('pending')

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)

    // Simulate status changes
    const statusTimer1 = setTimeout(() => {
      setStatus('processing')
    }, 5000)

    const statusTimer2 = setTimeout(() => {
      setStatus('completed')
    }, 10000)

    return () => {
      clearInterval(timer)
      clearTimeout(statusTimer1)
      clearTimeout(statusTimer2)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5" />
      case 'processing':
        return <Mail className="h-5 w-5" />
      case 'completed':
        return <CheckCircle className="h-5 w-5" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Payment Verification Pending'
      case 'processing':
        return 'Processing Your Subscription'
      case 'completed':
        return 'Subscription Activated!'
      default:
        return 'Payment Verification Pending'
    }
  }

  const getStatusDescription = () => {
    switch (status) {
      case 'pending':
        return 'We have received your payment proof and are verifying it. This usually takes 24-48 hours.'
      case 'processing':
        return 'Your payment has been verified and we are activating your subscription.'
      case 'completed':
        return 'Your subscription has been successfully activated! You can now access all features.'
      default:
        return 'We have received your payment proof and are verifying it. This usually takes 24-48 hours.'
    }
  }

  const getProgressValue = () => {
    switch (status) {
      case 'pending':
        return 30
      case 'processing':
        return 70
      case 'completed':
        return 100
      default:
        return 30
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/subscription')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Subscription Activation</h1>
            <p className="text-muted-foreground">Track your subscription activation progress</p>
          </div>
        </div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon()}
                {getStatusText()}
              </CardTitle>
              <Badge className={getStatusColor()}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </div>
            <CardDescription>{getStatusDescription()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Activation Progress</span>
                  <span>{getProgressValue()}%</span>
                </div>
                <Progress value={getProgressValue()} className="h-3" />
              </div>

              {/* Time Elapsed */}
              <div className="text-center text-sm text-muted-foreground">
                Time elapsed: {formatTime(elapsedTime)}
              </div>

              {/* Status Steps */}
              <div className="space-y-3 pt-4">
                <div className={`flex items-center gap-3 ${status !== 'pending' ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <div className={`h-4 w-4 rounded-full border-2 ${status !== 'pending' ? 'bg-green-600 border-green-600' : 'border-muted-foreground'}`}></div>
                  <span className="text-sm">Payment proof submitted</span>
                </div>
                <div className={`flex items-center gap-3 ${status === 'processing' || status === 'completed' ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <div className={`h-4 w-4 rounded-full border-2 ${status === 'processing' || status === 'completed' ? 'bg-green-600 border-green-600' : 'border-muted-foreground'}`}></div>
                  <span className="text-sm">Payment verification</span>
                </div>
                <div className={`flex items-center gap-3 ${status === 'completed' ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <div className={`h-4 w-4 rounded-full border-2 ${status === 'completed' ? 'bg-green-600 border-green-600' : 'border-muted-foreground'}`}></div>
                  <span className="text-sm">Subscription activated</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Email Notification</p>
                  <p className="text-sm text-muted-foreground">
                    You'll receive an email at your registered address once verification is complete.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Immediate Access</p>
                  <p className="text-sm text-muted-foreground">
                    Once approved, you'll have immediate access to all features of your selected plan.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Verification Timeline</p>
                  <p className="text-sm text-muted-foreground">
                    Standard verification takes 24-48 hours during business days.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle>Need Assistance?</CardTitle>
            <CardDescription>
              If you have any questions or need urgent assistance, reach out to our support team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button variant="outline" className="justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Email Support
              </Button>
              
              <Button variant="outline" className="justify-start">
                <Phone className="h-4 w-4 mr-2" />
                Call Us
              </Button>
              
              <Button variant="outline" className="justify-start">
                <MessageCircle className="h-4 w-4 mr-2" />
                Live Chat
              </Button>
            </div>
            
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Support Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM IST
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Expected Response Time:</strong> Within 2-4 hours
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {status === 'completed' && (
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push('/subscription')}>
              View Subscription
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}