'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Key, 
  Plus, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Trash2, 
  Shield, 
  AlertCircle,
  CheckCircle,
  Copy,
  Edit2,
  Save,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Secret {
  id: string
  name: string
  value: string
  description?: string
  lastRotated?: string
}

interface EditingSecret {
  id: string
  name: string
  value: string
  description?: string
}

export default function SecretsTab() {
  const [secrets, setSecrets] = useState<Secret[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})
  const [newSecret, setNewSecret] = useState({ name: '', value: '', description: '' })
  const [isAddingSecret, setIsAddingSecret] = useState(false)
  const [editingSecret, setEditingSecret] = useState<EditingSecret | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    fetchSecrets()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSecrets, 30000)
    return () => clearInterval(interval)
  }, [])

  // Initialize visibility state for new secrets
  useEffect(() => {
    const newVisibilityState: Record<string, boolean> = {}
    
    secrets.forEach(secret => {
      if (!(secret.name in showSecret)) {
        newVisibilityState[secret.name] = false
      }
    })
    
    if (Object.keys(newVisibilityState).length > 0) {
      setShowSecret(prev => ({ ...prev, ...newVisibilityState }))
    }
  }, [secrets, showSecret])

  const fetchSecrets = async () => {
    try {
      const response = await fetch('/api/cloud/secrets')
      const data = await response.json()
      if (data.success) {
        setSecrets(data.secrets)
      }
    } catch (error) {
      console.error('Failed to fetch secrets:', error)
    }
  }

  

  const toggleVisibility = (key: string) => {
    setShowSecret(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const rotateSecret = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/cloud/secrets/${id}/rotate`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success('🔄 Secret Rotated', {
          description: `Secret ${data.secret.name} has been rotated successfully`,
          duration: 3000,
        })
        fetchSecrets()
      } else {
        toast.error('❌ Rotation Failed', {
          description: data.error || 'Failed to rotate secret',
          duration: 3000,
        })
      }
    } catch (error) {
      toast.error('❌ Rotation Error', {
        description: 'Network error occurred while rotating secret',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteSecret = async (id: string) => {
    if (!confirm('Are you sure you want to delete this secret? This action cannot be undone.')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/cloud/secrets/${id}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success('🗑️ Secret Deleted', {
          description: 'Secret has been deleted successfully',
          duration: 3000,
        })
        fetchSecrets()
      } else {
        toast.error('❌ Deletion Failed', {
          description: data.error || 'Failed to delete secret',
          duration: 3000,
        })
      }
    } catch (error) {
      toast.error('❌ Deletion Error', {
        description: 'Network error occurred while deleting secret',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addSecret = async () => {
    if (!newSecret.name || !newSecret.value) {
      toast.error('❌ Validation Error', {
        description: 'Name and value are required',
        duration: 3000,
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/cloud/secrets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSecret)
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success('🔑 Secret Added', {
          description: `Secret ${data.secret.name} has been added successfully`,
          duration: 3000,
        })
        setNewSecret({ name: '', value: '', description: '' })
        setIsAddingSecret(false)
        fetchSecrets()
      } else {
        toast.error('❌ Addition Failed', {
          description: data.error || 'Failed to add secret',
          duration: 3000,
        })
      }
    } catch (error) {
      toast.error('❌ Addition Error', {
        description: 'Network error occurred while adding secret',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateSecret = async (id: string, updates: Partial<Secret>) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/cloud/secrets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })
      const data = await response.json()
      
      if (data.success) {
        // Update state immediately without refetching
        setSecrets(prev => prev.map(secret => 
          secret.id === id ? { ...secret, ...data.secret } : secret
        ))
        
        toast.success('✅ Secret updated successfully', {
          description: `Secret ${data.secret.name} has been updated`,
          duration: 3000,
        })
      } else {
        toast.error('❌ Update Failed', {
          description: data.error || 'Failed to update secret',
          duration: 3000,
        })
      }
    } catch (error) {
      toast.error('❌ Update Error', {
        description: 'Network error occurred while updating secret',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (value: string, isMasked: boolean = false) => {
    navigator.clipboard.writeText(value)
    if (isMasked) {
      toast.info('📋 Copied Masked Value', {
        description: 'Masked secret value has been copied to clipboard',
        duration: 2000,
      })
    } else {
      toast.success('📋 Copied to Clipboard', {
        description: 'Secret value has been copied securely',
        duration: 2000,
      })
    }
  }

  const openEditModal = (secret: Secret) => {
    setEditingSecret({
      id: secret.id,
      name: secret.name,
      value: secret.value,
      description: secret.description || ''
    })
    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    setEditingSecret(null)
    setIsEditModalOpen(false)
  }

  const saveEditedSecret = async () => {
    if (!editingSecret) return
    
    await updateSecret(editingSecret.id, {
      value: editingSecret.value,
      description: editingSecret.description
    })
    
    closeEditModal()
  }

  

  return (
    <div className="space-y-6">
      {/* Supabase Setup Guide */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <strong>🚀 Supabase Setup:</strong> 
          <ol className="mt-2 ml-4 list-decimal text-sm space-y-1">
            <li>Create a <a href="https://supabase.com" target="_blank" rel="noopener" className="underline hover:text-blue-600">Supabase project</a></li>
            <li>Go to Settings → API in your Supabase dashboard</li>
            <li>Copy your Project URL and keys below</li>
            <li>Use the quick template buttons to add required secrets</li>
          </ol>
        </AlertDescription>
      </Alert>

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>🔒 Security First:</strong> All secrets are encrypted and stored securely. 
          Values are masked by default and never exposed in logs.
        </AlertDescription>
      </Alert>

      {/* Add Secret Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Environment Variables</h3>
        <Button
          onClick={() => setIsAddingSecret(!isAddingSecret)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Secret
        </Button>
      </div>

      {/* Add Secret Form */}
      <AnimatePresence>
        {isAddingSecret && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add New Secret</CardTitle>
                <CardDescription>
                  Create a new environment variable for your Supabase project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick Templates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewSecret({ 
                      name: 'SUPABASE_URL', 
                      value: 'https://your-project.supabase.co', 
                      description: 'Supabase project URL - Your project endpoint' 
                    })}
                    className="text-xs h-8"
                  >
                    📡 SUPABASE_URL
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewSecret({ 
                      name: 'SUPABASE_ANON_KEY', 
                      value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 
                      description: 'Supabase anonymous/public key for client-side access' 
                    })}
                    className="text-xs h-8"
                  >
                    🔑 SUPABASE_ANON_KEY
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewSecret({ 
                      name: 'SUPABASE_SERVICE_KEY', 
                      value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 
                      description: 'Supabase service role key for admin access' 
                    })}
                    className="text-xs h-8"
                  >
                    🛡️ SUPABASE_SERVICE_KEY
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewSecret({ 
                      name: 'SUPABASE_DB_URL', 
                      value: 'postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres', 
                      description: 'Direct database connection URL' 
                    })}
                    className="text-xs h-8"
                  >
                    🗄️ SUPABASE_DB_URL
                  </Button>
                </div>
                
                <div>
                  <Label htmlFor="secret-name">Name</Label>
                  <Input
                    id="secret-name"
                    placeholder="SUPABASE_URL"
                    value={newSecret.name}
                    onChange={(e) => setNewSecret(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="secret-value">Value</Label>
                  <Textarea
                    id="secret-value"
                    placeholder="https://your-project.supabase.co"
                    value={newSecret.value}
                    onChange={(e) => setNewSecret(prev => ({ ...prev, value: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="secret-description">Description (Optional)</Label>
                  <Input
                    id="secret-description"
                    placeholder="Database connection URL"
                    value={newSecret.description}
                    onChange={(e) => setNewSecret(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={addSecret} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Secret
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddingSecret(false)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Secrets List */}
      <div className="grid gap-4">
        {secrets.map((secret, index) => (
          <motion.div
            key={secret.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold">{secret.name}</h4>
                      {secret.lastRotated && (
                        <Badge variant="outline" className="text-xs">
                          Rotated: {new Date(secret.lastRotated).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                    
                    {secret.description && (
                      <p className="text-sm text-muted-foreground mb-2">{secret.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      {showSecret[secret.name] ? (
                        <span className="flex-1 font-mono text-sm text-foreground break-all bg-muted p-2 rounded-md inline-block">
                          {secret.value}
                        </span>
                      ) : (
                        <span className="flex-1 tracking-widest text-muted-foreground bg-muted p-2 rounded-md inline-block break-all">
                          ••••••••••••••••••••
                        </span>
                      )}
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleVisibility(secret.name)}
                          className="text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          aria-label={showSecret[secret.name] ? "Hide secret" : "Show secret"}
                        >
                          {showSecret[secret.name] ? (
                            <EyeOff className="h-4 w-4 cursor-pointer" />
                          ) : (
                            <Eye className="h-4 w-4 cursor-pointer" />
                          )}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(secret.value, false)}
                          className="hover:bg-muted transition-colors"
                          aria-label="Copy secret"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(secret)}
                          className="hover:bg-muted transition-colors"
                          aria-label="Edit secret"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => rotateSecret(secret.id)}
                          disabled={isLoading}
                          className="hover:bg-muted transition-colors"
                          aria-label="Rotate secret"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSecret(secret.id)}
                          disabled={isLoading}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                          aria-label="Delete secret"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {secrets.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Secrets Found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first environment variable
            </p>
            <Button onClick={() => setIsAddingSecret(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Secret
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Secret Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Secret</DialogTitle>
            <DialogDescription>
              Update the value or description for this secret.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-secret-name">Secret Name</Label>
              <Input
                id="edit-secret-name"
                value={editingSecret?.name || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-secret-value">Secret Value</Label>
              <Textarea
                id="edit-secret-value"
                value={editingSecret?.value || ''}
                onChange={(e) => setEditingSecret(prev => prev ? { ...prev, value: e.target.value } : null)}
                placeholder="Enter secret value"
                rows={3}
                className="font-mono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-secret-description">Description (Optional)</Label>
              <Input
                id="edit-secret-description"
                value={editingSecret?.description || ''}
                onChange={(e) => setEditingSecret(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="Enter description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button onClick={saveEditedSecret} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}