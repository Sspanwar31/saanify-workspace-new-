'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Github, Key, Copy, Check, ExternalLink, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function GitHubSetupGuide() {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          GitHub Setup Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Follow these steps to connect your project with GitHub for automatic backups
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-2">Step 1: Create GitHub Personal Access Token</h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li>1. Go to GitHub Settings → Developer settings → Personal access tokens</li>
              <li>2. Click "Generate new token (classic)"</li>
              <li>3. Give it a name like "Saanify Backup"</li>
              <li>4. Select expiration period</li>
              <li>5. Check the <code className="bg-gray-100 px-1 rounded">repo</code> scope</li>
              <li>6. Click "Generate token" and copy the token</li>
            </ol>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.open('https://github.com/settings/tokens/new', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-2" />
              Open GitHub Token Page
            </Button>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-2">Step 2: Create or Select Repository</h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li>1. Create a new repository on GitHub or use an existing one</li>
              <li>2. Note the repository owner (username) and repository name</li>
              <li>3. Choose the branch (main, master, or develop)</li>
            </ol>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.open('https://github.com/new', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-2" />
              Create New Repository
            </Button>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-2">Step 3: Configure in Saanify</h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li>1. Click the GitHub button in the bottom-right corner</li>
              <li>2. Enter your repository owner and name</li>
              <li>3. Paste your GitHub token</li>
              <li>4. Select the correct branch</li>
              <li>5. Click "Test Connection" to verify</li>
              <li>6. Save configuration</li>
            </ol>
          </div>

          <div className="border-l-4 border-orange-500 pl-4">
            <h3 className="font-semibold text-gray-900 mb-2">Step 4: Start Using Backups</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Click "Create Backup" to upload your entire project</li>
              <li>• View backup history to see previous versions</li>
              <li>• Restore from any previous backup when needed</li>
              <li>• Your code is automatically versioned on GitHub</li>
            </ul>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Key className="h-4 w-4" />
            Required Permissions
          </h3>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <code className="bg-white px-2 py-1 rounded border">repo</code>
              <span className="text-gray-600">Full control of private repositories</span>
            </div>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Note:</strong> Your GitHub token is stored locally in your browser and is never sent to our servers. 
            Keep it secure and never share it with others.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}