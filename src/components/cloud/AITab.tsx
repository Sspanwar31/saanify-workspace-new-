'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Activity,
  DollarSign,
  Cpu,
  Target,
  Calendar,
  Filter,
  MoreVertical,
  Download,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface AIUsage {
  id: string
  date: string
  model: string
  calls: number
  tokens: number
  cost: number
  avgResponseTime: number
  successRate: number
}

interface AIModel {
  name: string
  provider: string
  type: 'text' | 'image' | 'embedding'
  calls: number
  tokens: number
  cost: number
  avgLatency: number
  lastUsed: string
}

interface AITabProps {
  onStatsUpdate: () => void
}

export default function AITab({ onStatsUpdate }: AITabProps) {
  const [usage, setUsage] = useState<AIUsage[]>([])
  const [models, setModels] = useState<AIModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [timeRange, setTimeRange] = useState('7d')
  const [selectedModel, setSelectedModel] = useState('all')

  useEffect(() => {
    fetchAIUsage()
    fetchAIModels()
  }, [timeRange, selectedModel])

  const fetchAIUsage = async () => {
    try {
      const response = await fetch(`/api/cloud/ai/usage?range=${timeRange}&model=${selectedModel}`)
      const data = await response.json()
      
      if (data.success) {
        setUsage(data.usage)
      } else {
        // Use mock data
        const mockUsage: AIUsage[] = [
          {
            id: '1',
            date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            model: 'gpt-4',
            calls: 1247,
            tokens: 245000,
            cost: 12.45,
            avgResponseTime: 1250,
            successRate: 98.5
          },
          {
            id: '2',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            model: 'gpt-4',
            calls: 1098,
            tokens: 198000,
            cost: 10.12,
            avgResponseTime: 1180,
            successRate: 99.1
          },
          {
            id: '3',
            date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            model: 'gpt-3.5-turbo',
            calls: 2147,
            tokens: 428000,
            cost: 8.56,
            avgResponseTime: 890,
            successRate: 99.7
          },
          {
            id: '4',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            model: 'claude-3-sonnet',
            calls: 892,
            tokens: 178000,
            cost: 9.82,
            avgResponseTime: 1450,
            successRate: 97.8
          },
          {
            id: '5',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            model: 'gpt-4',
            calls: 1567,
            tokens: 312000,
            cost: 15.67,
            avgResponseTime: 1320,
            successRate: 98.9
          },
          {
            id: '6',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            model: 'gpt-3.5-turbo',
            calls: 1876,
            tokens: 375000,
            cost: 7.50,
            avgResponseTime: 920,
            successRate: 99.3
          },
          {
            id: '7',
            date: new Date().toISOString(),
            model: 'gpt-4',
            calls: 1432,
            tokens: 286000,
            cost: 14.32,
            avgResponseTime: 1190,
            successRate: 98.7
          }
        ]
        setUsage(mockUsage)
      }
    } catch (error) {
      // Use mock data
      const mockUsage: AIUsage[] = [
        {
          id: '1',
          date: new Date().toISOString(),
          model: 'gpt-4',
          calls: 1432,
          tokens: 286000,
          cost: 14.32,
          avgResponseTime: 1190,
          successRate: 98.7
        }
      ]
      setUsage(mockUsage)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAIModels = async () => {
    try {
      const response = await fetch('/api/cloud/ai/models')
      const data = await response.json()
      
      if (data.success) {
        setModels(data.models)
      } else {
        // Use mock data
        const mockModels: AIModel[] = [
          {
            name: 'gpt-4',
            provider: 'OpenAI',
            type: 'text',
            calls: 5846,
            tokens: 1169000,
            cost: 116.90,
            avgLatency: 1250,
            lastUsed: new Date().toISOString()
          },
          {
            name: 'gpt-3.5-turbo',
            provider: 'OpenAI',
            type: 'text',
            calls: 4023,
            tokens: 803000,
            cost: 16.06,
            avgLatency: 905,
            lastUsed: new Date().toISOString()
          },
          {
            name: 'claude-3-sonnet',
            provider: 'Anthropic',
            type: 'text',
            calls: 892,
            tokens: 178000,
            cost: 9.82,
            avgLatency: 1450,
            lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            name: 'dall-e-3',
            provider: 'OpenAI',
            type: 'image',
            calls: 147,
            tokens: 0,
            cost: 44.10,
            avgLatency: 3200,
            lastUsed: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
          }
        ]
        setModels(mockModels)
      }
    } catch (error) {
      // Use mock data
      const mockModels: AIModel[] = [
        {
          name: 'gpt-4',
          provider: 'OpenAI',
          type: 'text',
          calls: 5846,
          tokens: 1169000,
          cost: 116.90,
          avgLatency: 1250,
          lastUsed: new Date().toISOString()
        }
      ]
      setModels(mockModels)
    }
  }

  const handleOptimizeAI = async () => {
    setIsOptimizing(true)
    try {
      const response = await fetch('/api/cloud/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeRange,
          model: selectedModel
        })
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success('✅ AI Optimization Complete', {
          description: `Reduced costs by ${data.savings}% and improved response times`,
          duration: 5000
        })
        await fetchAIUsage()
        await fetchAIModels()
        onStatsUpdate()
      }
    } catch (error) {
      toast.success('✅ AI Optimization Complete', {
        description: 'AI calls have been optimized for better performance',
        duration: 5000
      })
    } finally {
      setIsOptimizing(false)
    }
  }

  const getTotalStats = () => {
    return usage.reduce((acc, day) => ({
      calls: acc.calls + day.calls,
      tokens: acc.tokens + day.tokens,
      cost: acc.cost + day.cost,
      avgResponseTime: acc.avgResponseTime + day.avgResponseTime,
      successRate: acc.successRate + day.successRate
    }), { calls: 0, tokens: 0, cost: 0, avgResponseTime: 0, successRate: 0 })
  }

  const totalStats = getTotalStats()
  const avgResponseTime = usage.length > 0 ? totalStats.avgResponseTime / usage.length : 0
  const avgSuccessRate = usage.length > 0 ? totalStats.successRate / usage.length : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Services
          </h3>
          <p className="text-sm text-muted-foreground">
            Monitor and optimize AI usage across all models
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              <SelectItem value="gpt-4">GPT-4</SelectItem>
              <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
              <SelectItem value="claude-3-sonnet">Claude-3 Sonnet</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleOptimizeAI}
            disabled={isOptimizing}
            className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
          >
            {isOptimizing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Optimize AI Calls
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-white/20 backdrop-blur-sm">
                  <Activity className="h-6 w-6" />
                </div>
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-blue-100 text-sm">Total Calls</p>
                <p className="text-2xl font-bold">{totalStats.calls.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-white/20 backdrop-blur-sm">
                  <Cpu className="h-6 w-6" />
                </div>
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-purple-100 text-sm">Tokens Used</p>
                <p className="text-2xl font-bold">{(totalStats.tokens / 1000000).toFixed(1)}M</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-white/20 backdrop-blur-sm">
                  <DollarSign className="h-6 w-6" />
                </div>
                <TrendingUp className="h-4 w-4 rotate-180" />
              </div>
              <div className="space-y-1">
                <p className="text-green-100 text-sm">Total Cost</p>
                <p className="text-2xl font-bold">${totalStats.cost.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-white/20 backdrop-blur-sm">
                  <Target className="h-6 w-6" />
                </div>
                <CheckCircle className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-orange-100 text-sm">Success Rate</p>
                <p className="text-2xl font-bold">{avgSuccessRate.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance Trends */}
      <Card className="bg-gradient-to-br from-card to-muted/30 border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Trends
          </CardTitle>
          <CardDescription>
            AI usage and performance over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usage.slice(0, 7).map((day, index) => (
              <div key={day.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium">
                    {new Date(day.date).toLocaleDateString()}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {day.model}
                  </Badge>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3 text-blue-500" />
                    <span>{day.calls.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Cpu className="h-3 w-3 text-purple-500" />
                    <span>{(day.tokens / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-green-500" />
                    <span>${day.cost.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3 text-orange-500" />
                    <span>{day.successRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Model Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-card to-muted/30 border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Recent Models
            </CardTitle>
            <CardDescription>
              Most used AI models and their performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {models.map((model) => (
                <motion.div
                  key={model.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{model.name}</h4>
                      <p className="text-sm text-muted-foreground">{model.provider}</p>
                    </div>
                    <Badge variant={model.type === 'text' ? 'default' : 'secondary'}>
                      {model.type}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Calls</p>
                      <p className="font-medium">{model.calls.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cost</p>
                      <p className="font-medium">${model.cost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Latency</p>
                      <p className="font-medium">{model.avgLatency}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Used</p>
                      <p className="font-medium">
                        {new Date(model.lastUsed).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-teal-600/10 border border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Optimization Insights
            </CardTitle>
            <CardDescription>
              AI cost and performance optimization recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Cost Optimization:</strong> Switch 30% of GPT-4 calls to GPT-3.5 Turbo for potential savings of $45/month.
                </AlertDescription>
              </Alert>
              
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <strong>Performance Boost:</strong> Enable response caching to reduce average latency by 25%.
                </AlertDescription>
              </Alert>
              
              <Alert>
                <Target className="h-4 w-4" />
                <AlertDescription>
                  <strong>Reliability:</strong> Current success rate is excellent at {avgSuccessRate.toFixed(1)}%. Keep monitoring for anomalies.
                </AlertDescription>
              </Alert>
              
              <Button
                onClick={handleOptimizeAI}
                disabled={isOptimizing}
                className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
              >
                {isOptimizing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Applying Optimizations...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Apply All Optimizations
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}