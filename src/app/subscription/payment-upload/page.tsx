"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Upload, CheckCircle, AlertCircle, ArrowLeft, Crown, Building2, Zap } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface PlanDetails {
  id: string
  name: string
  price: number
  period: string
  icon: React.ReactNode
}

const planDetails: Record<string, PlanDetails> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 4000,
    period: 'per month',
    icon: <Building2 className="h-5 w-5" />
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 7000,
    period: 'per month',
    icon: <Zap className="h-5 w-5" />
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 10000,
    period: 'per month',
    icon: <Crown className="h-5 w-5" />
  }
}

export default function PaymentUpload() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan') || 'basic'
  
  const [selectedPlan, setSelectedPlan] = useState<PlanDetails>(planDetails[planId] || planDetails.basic)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [formData, setFormData] = useState({
    transactionId: '',
    paymentDate: '',
    notes: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (planId && planDetails[planId]) {
      setSelectedPlan(planDetails[planId])
    }
  }, [planId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!allowedTypes.includes(selectedFile.type)) {
        setErrors({ file: 'Please upload a valid image (JPG, PNG) or PDF file' })
        return
      }
      
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setErrors({ file: 'File size should be less than 5MB' })
        return
      }
      
      setFile(selectedFile)
      setErrors({ ...errors, file: '' })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!file) {
      newErrors.file = 'Please upload payment proof'
    }
    
    if (!formData.transactionId.trim()) {
      newErrors.transactionId = 'Transaction ID is required'
    }
    
    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Payment date is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setUploading(true)
    setUploadProgress(0)
    
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('file', file!)
      formDataToSend.append('planId', selectedPlan.id)
      formDataToSend.append('planName', selectedPlan.name)
      formDataToSend.append('amount', selectedPlan.price.toString())
      formDataToSend.append('transactionId', formData.transactionId)
      formDataToSend.append('paymentDate', formData.paymentDate)
      formDataToSend.append('notes', formData.notes)
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)
      
      const response = await fetch('/api/subscription/submit-payment', {
        method: 'POST',
        body: formDataToSend
      })
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      if (response.ok) {
        setUploadComplete(true)
        setTimeout(() => {
          router.push('/subscription/waiting')
        }, 2000)
      } else {
        const error = await response.json()
        setErrors({ submit: error.message || 'Failed to submit payment proof' })
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' })
    } finally {
      setUploading(false)
    }
  }

  if (uploadComplete) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <h2 className="text-2xl font-bold text-green-700">Payment Proof Submitted!</h2>
                <p className="text-muted-foreground">
                  Your payment proof has been successfully submitted. We will verify your payment within 24-48 hours.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    You will be notified via email once your subscription is activated.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Complete Your Subscription</h1>
            <p className="text-muted-foreground">Upload payment proof to activate your plan</p>
          </div>
        </div>

        {/* Selected Plan Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedPlan.icon}
              {selectedPlan.name} Plan
            </CardTitle>
            <CardDescription>Plan you're upgrading to</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">₹{selectedPlan.price.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">{selectedPlan.period}</div>
              </div>
              <Badge variant="secondary">{selectedPlan.id}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Payment Instructions */}
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Payment Instructions:</strong> Please transfer the amount to our bank account and upload the payment proof below.
            <div className="mt-2 p-3 bg-muted rounded text-sm">
              <div><strong>Bank Name:</strong> State Bank of India</div>
              <div><strong>Account Name:</strong> Saanify Technologies Pvt Ltd</div>
              <div><strong>Account Number:</strong> 1234567890123456</div>
              <div><strong>IFSC Code:</strong> SBIN0001234</div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Payment Proof</CardTitle>
            <CardDescription>
              Please upload a screenshot or PDF of your payment confirmation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file">Payment Proof *</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <input
                    id="file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploading}
                  />
                  {file ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('file')?.click()}
                        disabled={uploading}
                      >
                        Change File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, PDF up to 5MB
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('file')?.click()}
                        disabled={uploading}
                      >
                        Select File
                      </Button>
                    </div>
                  )}
                </div>
                {errors.file && (
                  <p className="text-sm text-destructive">{errors.file}</p>
                )}
              </div>

              {/* Transaction ID */}
              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID *</Label>
                <Input
                  id="transactionId"
                  placeholder="Enter transaction ID from your payment"
                  value={formData.transactionId}
                  onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                  disabled={uploading}
                />
                {errors.transactionId && (
                  <p className="text-sm text-destructive">{errors.transactionId}</p>
                )}
              </div>

              {/* Payment Date */}
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  disabled={uploading}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.paymentDate && (
                  <p className="text-sm text-destructive">{errors.paymentDate}</p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information about your payment"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={uploading}
                  rows={3}
                />
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading payment proof...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Error Message */}
              {errors.submit && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.submit}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={uploading || !file}
              >
                {uploading ? 'Uploading...' : 'Submit Payment Proof'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <p><strong>• Payment verification takes 24-48 hours</strong></p>
              <p><strong>• You'll receive an email confirmation once approved</strong></p>
              <p><strong>• For urgent assistance, contact our support team</strong></p>
              <div className="pt-3">
                <Button variant="outline" size="sm" onClick={() => router.push('/support')}>
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}