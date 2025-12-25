"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Database, 
  Globe,
  Mail,
  Lock,
  Key,
  Smartphone,
  Monitor,
  Palette,
  Zap,
  Archive,
  Trash2,
  Save,
  RefreshCw,
  Download,
  Upload,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general')
  const [showPasswords, setShowPasswords] = useState({})
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'Saanify Admin',
    siteUrl: 'https://admin.saanify.com',
    adminEmail: 'admin@saanify.com',
    timezone: 'UTC',
    language: 'en',
    
    // Security Settings
    twoFactorAuth: true,
    sessionTimeout: 30,
    passwordMinLength: 8,
    requireStrongPassword: true,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    notificationEmail: 'notifications@saanify.com',
    
    // Backup Settings
    autoBackup: true,
    backupFrequency: 'daily',
    backupRetention: 30,
    backupLocation: 'cloud',
    
    // API Settings
    apiEnabled: true,
    apiRateLimit: 1000,
    corsOrigins: ['https://saanify.com'],
    webhookUrl: '',
    
    // Appearance Settings
    theme: 'dark',
    primaryColor: 'cyan',
    sidebarCollapsed: false,
    compactMode: false,
    
    // System Settings
    debugMode: false,
    maintenanceMode: false,
    logLevel: 'info',
    cacheEnabled: true,
    cacheTTL: 3600
  })

  const handleSettingChange = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
    
    toast({
      title: "Setting Updated",
      description: `${key} has been updated successfully`,
    })
  }

  const handleSaveSettings = () => {
    // Simulate saving settings
    toast({
      title: "Settings Saved",
      description: "All settings have been saved successfully",
    })
  }

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'admin-settings.json'
    link.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: "Settings Exported",
      description: "Settings have been exported to admin-settings.json",
    })
  }

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string)
          setSettings(prev => ({ ...prev, ...importedSettings }))
          toast({
            title: "Settings Imported",
            description: "Settings have been imported successfully",
          })
        } catch (error) {
          toast({
            title: "Import Failed",
            description: "Invalid settings file format",
            variant: "destructive"
          })
        }
      }
      reader.readAsText(file)
    }
  }

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to Clipboard",
      description: "Text has been copied to clipboard",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-cyan-400" />
            Admin Settings
          </h2>
          <p className="text-gray-400">Configure system settings and preferences</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportSettings}
            className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Import Settings</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Upload a settings file to import configuration
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleImportSettings}
                  className="bg-slate-700 border-slate-600 text-gray-300"
                />
              </div>
            </DialogContent>
          </Dialog>
          <Button 
            onClick={handleSaveSettings}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            Save All
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-slate-800/50 border-slate-700/50">
          <TabsTrigger value="general" className="data-[state=active]:bg-slate-700 text-gray-300">
            <Globe className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-slate-700 text-gray-300">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-slate-700 text-gray-300">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-slate-700 text-gray-300">
            <Database className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="h-5 w-5 text-cyan-400" />
                  Site Configuration
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Basic site information and URLs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName" className="text-gray-300">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => handleSettingChange('general', 'siteName', e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl" className="text-gray-300">Site URL</Label>
                  <Input
                    id="siteUrl"
                    value={settings.siteUrl}
                    onChange={(e) => handleSettingChange('general', 'siteUrl', e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail" className="text-gray-300">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={settings.adminEmail}
                    onChange={(e) => handleSettingChange('general', 'adminEmail', e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-gray-300">Timezone</Label>
                    <Select value={settings.timezone} onValueChange={(value) => handleSettingChange('general', 'timezone', value)}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="EST">EST</SelectItem>
                        <SelectItem value="PST">PST</SelectItem>
                        <SelectItem value="IST">IST</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-gray-300">Language</Label>
                    <Select value={settings.language} onValueChange={(value) => handleSettingChange('general', 'language', value)}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Palette className="h-5 w-5 text-cyan-400" />
                  Appearance
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Customize the look and feel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme" className="text-gray-300">Theme</Label>
                  <Select value={settings.theme} onValueChange={(value) => handleSettingChange('general', 'theme', value)}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryColor" className="text-gray-300">Primary Color</Label>
                  <Select value={settings.primaryColor} onValueChange={(value) => handleSettingChange('general', 'primaryColor', value)}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="cyan">Cyan</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sidebarCollapsed" className="text-gray-300">Collapse Sidebar</Label>
                  <Switch
                    id="sidebarCollapsed"
                    checked={settings.sidebarCollapsed}
                    onCheckedChange={(checked) => handleSettingChange('general', 'sidebarCollapsed', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="compactMode" className="text-gray-300">Compact Mode</Label>
                  <Switch
                    id="compactMode"
                    checked={settings.compactMode}
                    onCheckedChange={(checked) => handleSettingChange('general', 'compactMode', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-cyan-400" />
                  Authentication
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Security and authentication settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="twoFactorAuth" className="text-gray-300">Two-Factor Authentication</Label>
                    <p className="text-xs text-gray-400">Require 2FA for all admin accounts</p>
                  </div>
                  <Switch
                    id="twoFactorAuth"
                    checked={settings.twoFactorAuth}
                    onCheckedChange={(checked) => handleSettingChange('security', 'twoFactorAuth', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout" className="text-gray-300">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength" className="text-gray-300">Minimum Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={settings.passwordMinLength}
                    onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="requireStrongPassword" className="text-gray-300">Strong Password Required</Label>
                    <p className="text-xs text-gray-400">Require uppercase, lowercase, numbers, and symbols</p>
                  </div>
                  <Switch
                    id="requireStrongPassword"
                    checked={settings.requireStrongPassword}
                    onCheckedChange={(checked) => handleSettingChange('security', 'requireStrongPassword', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lock className="h-5 w-5 text-cyan-400" />
                  Login Protection
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Protect against brute force attacks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts" className="text-gray-300">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lockoutDuration" className="text-gray-300">Lockout Duration (minutes)</Label>
                  <Input
                    id="lockoutDuration"
                    type="number"
                    value={settings.lockoutDuration}
                    onChange={(e) => handleSettingChange('security', 'lockoutDuration', parseInt(e.target.value))}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm text-yellow-300">Security Tip</p>
                      <p className="text-xs text-gray-400">
                        Enable two-factor authentication and use strong passwords for maximum security.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="h-5 w-5 text-cyan-400" />
                  Notification Channels
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Configure how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="emailNotifications" className="text-gray-300">Email Notifications</Label>
                    <p className="text-xs text-gray-400">Receive notifications via email</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'emailNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="pushNotifications" className="text-gray-300">Push Notifications</Label>
                    <p className="text-xs text-gray-400">Browser push notifications</p>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'pushNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="smsNotifications" className="text-gray-300">SMS Notifications</Label>
                    <p className="text-xs text-gray-400">Receive SMS alerts</p>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'smsNotifications', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notificationEmail" className="text-gray-300">Notification Email</Label>
                  <Input
                    id="notificationEmail"
                    type="email"
                    value={settings.notificationEmail}
                    onChange={(e) => handleSettingChange('notifications', 'notificationEmail', e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mail className="h-5 w-5 text-cyan-400" />
                  Email Templates
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Customize email notification templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="welcomeSubject" className="text-gray-300">Welcome Email Subject</Label>
                  <Input
                    id="welcomeSubject"
                    placeholder="Welcome to Saanify Admin"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alertSubject" className="text-gray-300">Alert Email Subject</Label>
                  <Input
                    id="alertSubject"
                    placeholder="Security Alert - Action Required"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <Button variant="outline" className="w-full border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Templates
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="h-5 w-5 text-cyan-400" />
                  Backup Configuration
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Automated backup settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="autoBackup" className="text-gray-300">Auto Backup</Label>
                    <p className="text-xs text-gray-400">Enable automatic backups</p>
                  </div>
                  <Switch
                    id="autoBackup"
                    checked={settings.autoBackup}
                    onCheckedChange={(checked) => handleSettingChange('system', 'autoBackup', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backupFrequency" className="text-gray-300">Backup Frequency</Label>
                  <Select value={settings.backupFrequency} onValueChange={(value) => handleSettingChange('system', 'backupFrequency', value)}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backupRetention" className="text-gray-300">Retention Period (days)</Label>
                  <Input
                    id="backupRetention"
                    type="number"
                    value={settings.backupRetention}
                    onChange={(e) => handleSettingChange('system', 'backupRetention', parseInt(e.target.value))}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backupLocation" className="text-gray-300">Backup Location</Label>
                  <Select value={settings.backupLocation} onValueChange={(value) => handleSettingChange('system', 'backupLocation', value)}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="local">Local Storage</SelectItem>
                      <SelectItem value="cloud">Cloud Storage</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-cyan-400" />
                  System Performance
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Performance and debugging options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="debugMode" className="text-gray-300">Debug Mode</Label>
                    <p className="text-xs text-gray-400">Enable detailed logging</p>
                  </div>
                  <Switch
                    id="debugMode"
                    checked={settings.debugMode}
                    onCheckedChange={(checked) => handleSettingChange('system', 'debugMode', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="maintenanceMode" className="text-gray-300">Maintenance Mode</Label>
                    <p className="text-xs text-gray-400">Temporarily disable access</p>
                  </div>
                  <Switch
                    id="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => handleSettingChange('system', 'maintenanceMode', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logLevel" className="text-gray-300">Log Level</Label>
                  <Select value={settings.logLevel} onValueChange={(value) => handleSettingChange('system', 'logLevel', value)}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="cacheEnabled" className="text-gray-300">Enable Caching</Label>
                    <p className="text-xs text-gray-400">Improve performance with caching</p>
                  </div>
                  <Switch
                    id="cacheEnabled"
                    checked={settings.cacheEnabled}
                    onCheckedChange={(checked) => handleSettingChange('system', 'cacheEnabled', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cacheTTL" className="text-gray-300">Cache TTL (seconds)</Label>
                  <Input
                    id="cacheTTL"
                    type="number"
                    value={settings.cacheTTL}
                    onChange={(e) => handleSettingChange('system', 'cacheTTL', parseInt(e.target.value))}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Danger Zone */}
      <Card className="bg-red-900/20 border-red-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-gray-400">
            Irreversible actions that affect your entire system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
              <Archive className="h-4 w-4 mr-2" />
              Archive All Data
            </Button>
            <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset All Settings
            </Button>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}