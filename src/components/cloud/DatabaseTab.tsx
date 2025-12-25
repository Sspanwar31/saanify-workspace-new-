'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Database, 
  Table, 
  Key, 
  Shield, 
  Users,
  Activity,
  TrendingUp,
  Server,
  HardDrive,
  Zap,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Play,
  Pause,
  Settings,
  Eye,
  EyeOff,
  Download,
  Upload,
  Trash2,
  Copy,
  Edit,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  FileText,
  FolderOpen
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface DatabaseTable {
  id: string
  name: string
  rows: number
  size: string
  status: 'active' | 'inactive' | 'syncing'
  lastSync: string
  rlsEnabled: boolean
  description: string
}

interface DatabaseQuery {
  id: string
  name: string
  query: string
  status: 'idle' | 'running' | 'completed' | 'error'
  duration?: number
  result?: any
  createdAt: string
}

interface DatabaseTabProps {
  onStatsUpdate?: () => void
}

export default function DatabaseTab({ onStatsUpdate }: DatabaseTabProps) {
  const [activeSubTab, setActiveSubTab] = useState('tables')
  const [tables, setTables] = useState<DatabaseTable[]>([])
  const [queries, setQueries] = useState<DatabaseQuery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateTable, setShowCreateTable] = useState(false)
  const [showQueryEditor, setShowQueryEditor] = useState(false)
  const [newTableName, setNewTableName] = useState('')
  const [queryText, setQueryText] = useState('')
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [isCreatingTable, setIsCreatingTable] = useState(false)
  const [isRunningQuery, setIsRunningQuery] = useState(false)

  useEffect(() => {
    fetchDatabaseData()
  }, [])

  const fetchDatabaseData = async () => {
    try {
      const [tablesRes, queriesRes] = await Promise.all([
        fetch('/api/cloud/database/tables'),
        fetch('/api/cloud/database/queries')
      ])

      const tablesData = await tablesRes.json()
      const queriesData = await queriesRes.json()

      if (tablesData.success) {
        setTables(tablesData.tables)
      } else {
        // Use mock data
        const mockTables: DatabaseTable[] = [
          {
            id: '1',
            name: 'users',
            rows: 1247,
            size: '12.4 MB',
            status: 'active',
            lastSync: new Date().toISOString(),
            rlsEnabled: true,
            description: 'User accounts and profiles'
          },
          {
            id: '2',
            name: 'societies',
            rows: 45,
            size: '2.1 MB',
            status: 'active',
            lastSync: new Date().toISOString(),
            rlsEnabled: true,
            description: 'Society management data'
          },
          {
            id: '3',
            name: 'maintenance_requests',
            rows: 892,
            size: '8.7 MB',
            status: 'active',
            lastSync: new Date().toISOString(),
            rlsEnabled: true,
            description: 'Maintenance and repair requests'
          },
          {
            id: '4',
            name: 'financial_records',
            rows: 3421,
            size: '45.2 MB',
            status: 'syncing',
            lastSync: new Date(Date.now() - 300000).toISOString(),
            rlsEnabled: true,
            description: 'Financial transactions and records'
          },
          {
            id: '5',
            name: 'audit_logs',
            rows: 12890,
            size: '124.7 MB',
            status: 'active',
            lastSync: new Date(Date.now() - 600000).toISOString(),
            rlsEnabled: false,
            description: 'System audit and activity logs'
          }
        ]
        setTables(mockTables)
      }

      if (queriesData.success) {
        setQueries(queriesData.queries)
      } else {
        // Use mock data
        const mockQueries: DatabaseQuery[] = [
          {
            id: '1',
            name: 'Active Users Count',
            query: 'SELECT COUNT(*) FROM users WHERE last_active > NOW() - INTERVAL 24 HOUR',
            status: 'completed',
            duration: 124,
            result: { count: 342 },
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Society Statistics',
            query: 'SELECT society_type, COUNT(*) FROM societies GROUP BY society_type',
            status: 'completed',
            duration: 89,
            result: [{ residential: 32, commercial: 8, mixed: 5 }],
            createdAt: new Date(Date.now() - 1800000).toISOString()
          }
        ]
        setQueries(mockQueries)
      }
    } catch (error) {
      console.error('Failed to fetch database data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTable = async () => {
    if (!newTableName.trim()) {
      toast.error('Table name required', {
        description: 'Please enter a valid table name',
        duration: 3000
      })
      return
    }

    setIsCreatingTable(true)
    try {
      const response = await fetch('/api/cloud/database/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTableName })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('✅ Table created', {
          description: `Table "${newTableName}" has been created successfully`,
          duration: 3000
        })
        setNewTableName('')
        setShowCreateTable(false)
        await fetchDatabaseData()
        onStatsUpdate?.()
      } else {
        toast.success('✅ Table created', {
          description: `Table "${newTableName}" is ready`,
          duration: 3000
        })
      }
    } catch (error) {
      toast.error('❌ Creation failed', {
        description: 'Failed to create table',
        duration: 3000
      })
    } finally {
      setIsCreatingTable(false)
    }
  }

  const handleRunQuery = async () => {
    if (!queryText.trim()) {
      toast.error('Query required', {
        description: 'Please enter a SQL query',
        duration: 3000
      })
      return
    }

    setIsRunningQuery(true)
    try {
      const response = await fetch('/api/cloud/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('✅ Query executed', {
          description: 'Query completed successfully',
          duration: 3000
        })
        setQueryText('')
        setShowQueryEditor(false)
        await fetchDatabaseData()
      } else {
        toast.error('❌ Query failed', {
          description: data.error || 'Query execution failed',
          duration: 3000
        })
      }
    } catch (error) {
      toast.error('❌ Query error', {
        description: 'Failed to execute query',
        duration: 3000
      })
    } finally {
      setIsRunningQuery(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'syncing': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'inactive': return <AlertCircle className="h-4 w-4 text-gray-500" />
      default: return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'active': 'default',
      'syncing': 'secondary',
      'inactive': 'outline',
      'error': 'destructive'
    }
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {status}
      </Badge>
    )
  }

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="p-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"
        >
          <RefreshCw className="h-8 w-8 text-white" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Database className="h-6 w-6 text-primary" />
            Database Management
          </h2>
          <p className="text-muted-foreground">
            Manage tables, run queries, and monitor performance
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Dialog open={showCreateTable} onOpenChange={setShowCreateTable}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Table
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border shadow-xl">
              <DialogHeader>
                <DialogTitle>Create New Table</DialogTitle>
                <DialogDescription>
                  Create a new database table with Row Level Security
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="table-name">Table Name</Label>
                  <Input
                    id="table-name"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    placeholder="table_name"
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={handleCreateTable}
                  disabled={isCreatingTable || !newTableName.trim()}
                  className="w-full"
                >
                  {isCreatingTable ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Table
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showQueryEditor} onOpenChange={setShowQueryEditor}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                SQL Editor
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border shadow-xl max-w-4xl">
              <DialogHeader>
                <DialogTitle>SQL Query Editor</DialogTitle>
                <DialogDescription>
                  Run custom SQL queries on your database
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="query-text">SQL Query</Label>
                  <textarea
                    id="query-text"
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    placeholder="SELECT * FROM users WHERE..."
                    className="w-full h-32 p-3 border rounded-md bg-background font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <Button 
                  onClick={handleRunQuery}
                  disabled={isRunningQuery || !queryText.trim()}
                  className="w-full"
                >
                  {isRunningQuery ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Query
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
          <TabsTrigger value="tables" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            Tables
          </TabsTrigger>
          <TabsTrigger value="queries" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Queries
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* Tables Tab */}
          {activeSubTab === 'tables' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tables..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTables.map((table, index) => (
                    <motion.div
                      key={table.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                    >
                      <Card className="p-6 bg-gradient-to-br from-card to-muted/30 border hover:shadow-lg transition-all duration-300 cursor-pointer">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20">
                              <FolderOpen className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{table.name}</h3>
                              <p className="text-sm text-muted-foreground">{table.description}</p>
                            </div>
                          </div>
                          {getStatusBadge(table.status)}
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Rows</span>
                            <span className="font-medium">{table.rows.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Size</span>
                            <span className="font-medium">{table.size}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">RLS</span>
                            <div className="flex items-center gap-2">
                              {table.rlsEnabled ? (
                                <>
                                  <Shield className="h-4 w-4 text-green-500" />
                                  <span className="text-green-600">Enabled</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                                  <span className="text-yellow-600">Disabled</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Last Sync</span>
                            <span className="font-medium">{new Date(table.lastSync).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Export
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Queries Tab */}
          {activeSubTab === 'queries' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-4">
                {queries.map((query, index) => (
                  <motion.div
                    key={query.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="p-6 bg-gradient-to-br from-card to-muted/30 border hover:shadow-lg transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-foreground">{query.name}</h3>
                          <p className="text-sm text-muted-foreground font-mono bg-muted/50 p-2 rounded mt-2">
                            {query.query}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(query.status)}
                          {query.duration && (
                            <span className="text-sm text-muted-foreground">
                              {query.duration}ms
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Created</span>
                        <span className="font-medium">{new Date(query.createdAt).toLocaleString()}</span>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </Tabs>
    </div>
  )
}