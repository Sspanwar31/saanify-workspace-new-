'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  GitPullRequest, 
  MessageSquare, 
  Star, 
  Eye, 
  GitBranch,
  Clock,
  CheckCircle,
  AlertCircle,
  Code,
  FileText,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Contributor {
  name: string
  avatar: string
  commits: number
  role: string
}

interface PullRequest {
  id: number
  title: string
  author: string
  status: 'open' | 'merged' | 'closed'
  timestamp: string
  changes: number
}

interface Activity {
  type: 'commit' | 'pr' | 'issue' | 'merge'
  message: string
  author: string
  timestamp: string
}

export default function OpenSourceCollaboration() {
  const [activeView, setActiveView] = useState<'overview' | 'prs' | 'activity'>('overview')

  // Mock data
  const contributors: Contributor[] = [
    { name: 'Admin', avatar: '/avatars/admin.jpg', commits: 45, role: 'Owner' },
    { name: 'John Doe', avatar: '/avatars/john.jpg', commits: 23, role: 'Maintainer' },
    { name: 'Jane Smith', avatar: '/avatars/jane.jpg', commits: 15, role: 'Contributor' },
    { name: 'Bob Wilson', avatar: '/avatars/bob.jpg', commits: 8, role: 'Contributor' }
  ]

  const pullRequests: PullRequest[] = [
    { id: 1, title: 'Add GitHub backup integration', author: 'John Doe', status: 'open', timestamp: '2 hours ago', changes: 45 },
    { id: 2, title: 'Fix responsive design issues', author: 'Jane Smith', status: 'merged', timestamp: '1 day ago', changes: 12 },
    { id: 3, title: 'Update dependencies', author: 'Bob Wilson', status: 'closed', timestamp: '3 days ago', changes: 8 }
  ]

  const activities: Activity[] = [
    { type: 'commit', message: 'feat: Add GitHub toggle component', author: 'Admin', timestamp: '10 minutes ago' },
    { type: 'pr', message: 'Opened PR #1: Add GitHub backup integration', author: 'John Doe', timestamp: '2 hours ago' },
    { type: 'merge', message: 'Merged PR #2: Fix responsive design', author: 'Jane Smith', timestamp: '1 day ago' },
    { type: 'issue', message: 'Issue #5 reported: Mobile navigation bug', author: 'Bob Wilson', timestamp: '2 days ago' }
  ]

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'commit': return <Code className="h-4 w-4" />
      case 'pr': return <GitPullRequest className="h-4 w-4" />
      case 'merge': return <GitBranch className="h-4 w-4" />
      case 'issue': return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: PullRequest['status']) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800'
      case 'merged': return 'bg-purple-100 text-purple-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Star className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold">127</div>
            <div className="text-xs text-gray-500">Stars</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <GitPullRequest className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">23</div>
            <div className="text-xs text-gray-500">Pull Requests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold">8</div>
            <div className="text-xs text-gray-500">Contributors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Eye className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold">1.2k</div>
            <div className="text-xs text-gray-500">Views</div>
          </CardContent>
        </Card>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <Button
          variant={activeView === 'overview' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveView('overview')}
          className="flex-1"
        >
          Overview
        </Button>
        <Button
          variant={activeView === 'prs' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveView('prs')}
          className="flex-1"
        >
          Pull Requests
        </Button>
        <Button
          variant={activeView === 'activity' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveView('activity')}
          className="flex-1"
        >
          Activity
        </Button>
      </div>

      {/* Overview View */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Contributors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Contributors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contributors.map((contributor, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={contributor.avatar} />
                        <AvatarFallback>{contributor.name?.charAt(0) ?? ""}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{contributor.name}</div>
                        <div className="text-xs text-gray-500">{contributor.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">{contributor.commits}</div>
                      <div className="text-xs text-gray-500">commits</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col gap-1">
                  <GitPullRequest className="h-4 w-4" />
                  <span className="text-xs">New Pull Request</span>
                </Button>
                <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs">New Issue</span>
                </Button>
                <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col gap-1">
                  <Code className="h-4 w-4" />
                  <span className="text-xs">View Code</span>
                </Button>
                <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col gap-1">
                  <FileText className="h-4 w-4" />
                  <span className="text-xs">Documentation</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pull Requests View */}
      {activeView === 'prs' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GitPullRequest className="h-5 w-5" />
              Pull Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pullRequests.map((pr) => (
                <div key={pr.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-sm">{pr.title}</h4>
                        <Badge className={`text-xs ${getStatusColor(pr.status)}`}>
                          {pr.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>#{pr.id}</span>
                        <span>by {pr.author}</span>
                        <span>{pr.changes} changes</span>
                        <span>{pr.timestamp}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity View */}
      {activeView === 'activity' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.message}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span>{activity.author}</span>
                      <span>•</span>
                      <span>{activity.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}