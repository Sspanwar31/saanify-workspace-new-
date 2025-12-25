'use client'

import { useState, useRef } from 'react'
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Shield, 
  Download,
  Upload,
  AlertTriangle,
  Building2,
  Calculator,
  Database,
  Moon,
  Sun,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useClientStore } from '@/lib/client/store'

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  
  const { 
    settings, 
    updateSettings, 
    resetSettings, 
    exportData, 
    importData, 
    factoryReset,
    logout 
  } = useClientStore()

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully.",
    })
  }

  const handleBackup = () => {
    try {
      const data = exportData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `saanify-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Backup Created",
        description: "Your data has been backed up successfully.",
      })
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to create backup. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsRestoring(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const result = importData(content)
      
      if (result.success) {
        toast({
          title: "Data Restored",
          description: result.message,
        })
      } else {
        toast({
          title: "Restore Failed",
          description: result.message,
          variant: "destructive"
        })
      }
      setIsRestoring(false)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    reader.onerror = () => {
      toast({
        title: "Restore Failed",
        description: "Failed to read the backup file.",
        variant: "destructive"
      })
      setIsRestoring(false)
    }
    reader.readAsText(file)
  }

  const handleFactoryReset = () => {
    if (confirm("⚠️ WARNING: This will permanently delete ALL data and reset the system to factory defaults. This action cannot be undone.\n\nType 'RESET' to confirm:")) {
      const confirmation = prompt("Type 'RESET' to confirm factory reset:")
      if (confirmation === 'RESET') {
        factoryReset()
        toast({
          title: "System Reset",
          description: "All data has been cleared. System reset to factory defaults.",
        })
      }
    }
  }

  const handleThemeToggle = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light'
    updateSettings({ theme: newTheme })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Control Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your society settings, financial rules, and data backup
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={resetSettings}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
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

      {/* Card 1: Society Profile (Branding) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Society Profile
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This information will be used in print headers and PDFs
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="societyName">Society Name</Label>
              <Input
                id="societyName"
                value={settings.societyName}
                onChange={(e) => updateSettings({ societyName: e.target.value })}
                placeholder="Enter society name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Registration Number</Label>
              <Input
                id="registrationNumber"
                value={settings.registrationNumber}
                onChange={(e) => updateSettings({ registrationNumber: e.target.value })}
                placeholder="Enter registration number"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="societyAddress">Society Address</Label>
            <Input
              id="societyAddress"
              value={settings.societyAddress}
              onChange={(e) => updateSettings({ societyAddress: e.target.value })}
              placeholder="Enter complete society address"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={settings.contactEmail}
              onChange={(e) => updateSettings({ contactEmail: e.target.value })}
              placeholder="society@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={settings.currency} onValueChange={(value) => updateSettings({ currency: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                <SelectItem value="USD">US Dollar ($)</SelectItem>
                <SelectItem value="EUR">Euro (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Financial Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-green-600" />
            Financial Configuration
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure the financial rules for loans and payments
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="interestRate">Interest Rate (%)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={settings.interestRate}
                onChange={(e) => updateSettings({ interestRate: parseFloat(e.target.value) || 0 })}
                placeholder="12"
              />
              <p className="text-xs text-gray-500">Annual interest rate for loans</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="loanLimitPercent">Loan Limit (%)</Label>
              <Input
                id="loanLimitPercent"
                type="number"
                step="1"
                min="0"
                max="100"
                value={settings.loanLimitPercent}
                onChange={(e) => updateSettings({ loanLimitPercent: parseInt(e.target.value) || 0 })}
                placeholder="80"
              />
              <p className="text-xs text-gray-500">Maximum loan as % of deposit</p>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fineAmount">Late Fine (₹)</Label>
              <Input
                id="fineAmount"
                type="number"
                step="1"
                min="0"
                value={settings.fineAmount}
                onChange={(e) => updateSettings({ fineAmount: parseInt(e.target.value) || 0 })}
                placeholder="10"
              />
              <p className="text-xs text-gray-500">Fine amount per day/month</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gracePeriodDay">Payment Due Date</Label>
              <Select 
                value={settings.gracePeriodDay.toString()} 
                onValueChange={(value) => updateSettings({ gracePeriodDay: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of month
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">After this date, fine applies</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-600" />
            💾 Data Management
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Backup and restore your society data
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Backup Data</Label>
              <Button 
                onClick={handleBackup}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Backup
              </Button>
              <p className="text-xs text-gray-500">
                Downloads all data as saanify-backup-YYYY-MM-DD.json
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Restore Data</Label>
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleRestore}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isRestoring}
                />
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={isRestoring}
                >
                  {isRestoring ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-red-600 rounded-full animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {isRestoring ? 'Restoring...' : 'Upload Backup'}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Upload and restore from backup file
              </p>
            </div>
          </div>
          
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Important Warning
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Restoring data will overwrite all current information including members, loans, transactions, and settings. 
                  This action cannot be undone. Please create a backup before restoring.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Security & System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-600" />
            Security & System
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage system preferences and security settings
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Dark Mode</Label>
                <p className="text-xs text-gray-500">Toggle dark/light theme</p>
              </div>
              <div className="flex items-center gap-2">
                {settings.theme === 'light' ? (
                  <Sun className="h-4 w-4 text-yellow-500" />
                ) : (
                  <Moon className="h-4 w-4 text-blue-500" />
                )}
                <Switch
                  checked={settings.theme === 'dark'}
                  onCheckedChange={handleThemeToggle}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Auto Backup</Label>
                <p className="text-xs text-gray-500">Automatic daily backups</p>
              </div>
              <Switch
                checked={settings.autoBackup}
                onCheckedChange={(checked) => updateSettings({ autoBackup: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Email Notifications</Label>
                <p className="text-xs text-gray-500">Receive email alerts</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSettings({ emailNotifications: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>SMS Notifications</Label>
                <p className="text-xs text-gray-500">Receive SMS alerts</p>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => updateSettings({ smsNotifications: checked })}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Password Change</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <Input type="password" placeholder="Current password" />
                <Input type="password" placeholder="New password" />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={logout}>
                <Shield className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          
          <Separator />
          
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Danger Zone
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1 mb-3">
                  This action will permanently delete ALL data and cannot be undone.
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleFactoryReset}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Factory Reset
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}