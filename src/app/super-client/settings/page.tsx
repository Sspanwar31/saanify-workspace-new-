'use client'

import { useState } from 'react'
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Shield, 
  Bell,
  Database,
  Palette,
  Globe,
  Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useSuperClientStore } from '@/lib/super-client/store'

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    societyName: 'Saanify Society',
    interestRate: 8,
    maxLoanPercentage: 80,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    emailNotifications: true,
    smsNotifications: false,
    autoBackup: true,
    darkMode: false,
    language: 'en'
  })

  const { logout } = useSuperClientStore()

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate saving settings
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSaving(false)
  }

  const handleReset = () => {
    setSettings({
      societyName: 'Saanify Society',
      interestRate: 8,
      maxLoanPercentage: 80,
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      emailNotifications: true,
      smsNotifications: false,
      autoBackup: true,
      darkMode: false,
      language: 'en'
    })
  }

  const settingCategories = [
    {
      title: 'General Settings',
      icon: <Settings className="h-5 w-5" />,
      settings: [
        {
          key: 'societyName',
          label: 'Society Name',
          type: 'input',
          value: settings.societyName,
          onChange: (value: string) => setSettings(prev => ({ ...prev, societyName: value }))
        },
        {
          key: 'currency',
          label: 'Currency',
          type: 'select',
          value: settings.currency,
          options: [
            { value: 'INR', label: 'Indian Rupee (₹)' },
            { value: 'USD', label: 'US Dollar ($)' },
            { value: 'EUR', label: 'Euro (€)' }
          ],
          onChange: (value: string) => setSettings(prev => ({ ...prev, currency: value }))
        },
        {
          key: 'timezone',
          label: 'Timezone',
          type: 'select',
          value: settings.timezone,
          options: [
            { value: 'Asia/Kolkata', label: 'India Time (IST)' },
            { value: 'UTC', label: 'UTC' },
            { value: 'America/New_York', label: 'Eastern Time (ET)' }
          ],
          onChange: (value: string) => setSettings(prev => ({ ...prev, timezone: value }))
        },
        {
          key: 'language',
          label: 'Language',
          type: 'select',
          value: settings.language,
          options: [
            { value: 'en', label: 'English' },
            { value: 'hi', label: 'हिंदी' },
            { value: 'gu', label: 'ગુજરાતી' }
          ],
          onChange: (value: string) => setSettings(prev => ({ ...prev, language: value }))
        }
      ]
    },
    {
      title: 'Financial Settings',
      icon: <Database className="h-5 w-5" />,
      settings: [
        {
          key: 'interestRate',
          label: 'Default Interest Rate (%)',
          type: 'input',
          value: settings.interestRate,
          onChange: (value: number) => setSettings(prev => ({ ...prev, interestRate: value }))
        },
        {
          key: 'maxLoanPercentage',
          label: 'Maximum Loan Percentage (%)',
          type: 'input',
          value: settings.maxLoanPercentage,
          onChange: (value: number) => setSettings(prev => ({ ...prev, maxLoanPercentage: value }))
        }
      ]
    },
    {
      title: 'Notifications',
      icon: <Bell className="h-5 w-5" />,
      settings: [
        {
          key: 'emailNotifications',
          label: 'Email Notifications',
          type: 'switch',
          value: settings.emailNotifications,
          onChange: (value: boolean) => setSettings(prev => ({ ...prev, emailNotifications: value }))
        },
        {
          key: 'smsNotifications',
          label: 'SMS Notifications',
          type: 'switch',
          value: settings.smsNotifications,
          onChange: (value: boolean) => setSettings(prev => ({ ...prev, smsNotifications: value }))
        },
        {
          key: 'autoBackup',
          label: 'Auto Backup',
          type: 'switch',
          value: settings.autoBackup,
          onChange: (value: boolean) => setSettings(prev => ({ ...prev, autoBackup: value }))
        }
      ]
    },
    {
      title: 'Appearance',
      icon: <Palette className="h-5 w-5" />,
      settings: [
        {
          key: 'darkMode',
          label: 'Dark Mode',
          type: 'switch',
          value: settings.darkMode,
          onChange: (value: boolean) => setSettings(prev => ({ ...prev, darkMode: value }))
        }
      ]
    }
  ]

  const renderSettingInput = (setting: any) => {
    switch (setting.type) {
      case 'input':
        return (
          <Input
            value={setting.value}
            onChange={(e) => setting.onChange(e.target.value)}
            type={setting.key === 'interestRate' || setting.key === 'maxLoanPercentage' ? 'number' : 'text'}
            className="mt-1"
          />
        )
      case 'select':
        return (
          <Select value={setting.value} onValueChange={setting.onChange}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {setting.options?.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'switch':
        return (
          <div className="flex items-center mt-3">
            <Switch
              checked={setting.value}
              onCheckedChange={setting.onChange}
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {setting.label}
            </span>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configure your Super Client preferences and system settings
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Settings Categories */}
      <div className="grid gap-6 lg:grid-cols-2">
        {settingCategories.map((category, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {category.icon}
                {category.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {category.settings.map((setting: any, settingIndex: number) => (
                <div key={settingIndex}>
                  <Label htmlFor={setting.key}>{setting.label}</Label>
                  {renderSettingInput(setting)}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" placeholder="Enter current password" />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" placeholder="Enter new password" />
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" placeholder="Confirm new password" />
            </div>
            <div className="space-y-2">
              <Label>Two-Factor Auth</Label>
              <Button variant="outline" className="w-full">
                <Lock className="h-4 w-4 mr-2" />
                Enable 2FA
              </Button>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Session Management</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage your active sessions and devices
              </p>
            </div>
            <Button variant="outline">
              <Globe className="h-4 w-4 mr-2" />
              View Sessions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Shield className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200 mb-3">
              <strong>Warning:</strong> These actions are irreversible and will permanently delete data.
            </p>
            <div className="space-y-2">
              <Button variant="outline" className="w-full text-red-600 border-red-300 hover:bg-red-50">
                Clear All Data
              </Button>
              <Button variant="outline" className="w-full text-red-600 border-red-300 hover:bg-red-50">
                Reset System
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Logout</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sign out from Super Client
              </p>
            </div>
            <Button 
              onClick={logout}
              variant="outline" 
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Lock className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}