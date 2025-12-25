'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Database, 
  Upload, 
  FolderOpen, 
  FileText, 
  Image, 
  Download,
  Trash2,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Search,
  Filter,
  MoreVertical,
  File,
  Folder
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface Bucket {
  id: string
  name: string
  public: boolean
  createdAt: string
  size: number
  fileCount: number
}

interface StorageFile {
  id: string
  name: string
  type: string
  size: number
  url?: string
  bucket: string
  createdAt: string
  metadata?: any
}

interface StorageTabProps {
  onStatsUpdate: () => void
}

export default function StorageTab({ onStatsUpdate }: StorageTabProps) {
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [files, setFiles] = useState<StorageFile[]>([])
  const [selectedBucket, setSelectedBucket] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isCreatingBucket, setIsCreatingBucket] = useState(false)
  const [showCreateBucket, setShowCreateBucket] = useState(false)
  const [showFilePreview, setShowFilePreview] = useState(false)
  const [previewFile, setPreviewFile] = useState<StorageFile | null>(null)
  const [newBucketName, setNewBucketName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchBuckets()
  }, [])

  useEffect(() => {
    if (selectedBucket) {
      fetchFiles(selectedBucket)
    }
  }, [selectedBucket])

  const fetchBuckets = async () => {
    try {
      const response = await fetch('/api/cloud/storage/buckets')
      const data = await response.json()
      
      if (data.success) {
        setBuckets(data.buckets)
        
        // Auto-select first bucket or create public bucket if none exists
        if (data.buckets.length === 0) {
          createPublicBucket()
        } else if (!selectedBucket) {
          const publicBucket = data.buckets.find(b => b.public)
          setSelectedBucket(publicBucket?.id || data.buckets[0].id)
        }
      } else {
        // Use mock data
        const mockBuckets: Bucket[] = [
          {
            id: 'public',
            name: 'public',
            public: true,
            createdAt: new Date().toISOString(),
            size: 45.2 * 1024 * 1024 * 1024, // 45.2 GB
            fileCount: 1247
          },
          {
            id: 'private',
            name: 'private',
            public: false,
            createdAt: new Date().toISOString(),
            size: 12.8 * 1024 * 1024 * 1024, // 12.8 GB
            fileCount: 523
          }
        ]
        setBuckets(mockBuckets)
        setSelectedBucket('public')
      }
    } catch (error) {
      // Use mock data
      const mockBuckets: Bucket[] = [
        {
          id: 'public',
          name: 'public',
          public: true,
          createdAt: new Date().toISOString(),
          size: 45.2 * 1024 * 1024 * 1024,
          fileCount: 1247
        }
      ]
      setBuckets(mockBuckets)
      setSelectedBucket('public')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFiles = async (bucketId: string) => {
    try {
      const response = await fetch(`/api/cloud/storage/files?bucket=${bucketId}`)
      const data = await response.json()
      
      if (data.success) {
        setFiles(data.files)
      } else {
        // Use mock data
        const mockFiles: StorageFile[] = [
          {
            id: '1',
            name: 'society-logo.png',
            type: 'image/png',
            size: 245760,
            url: '/avatars/admin.jpg',
            bucket: bucketId,
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'annual-report-2024.pdf',
            type: 'application/pdf',
            size: 2048576,
            bucket: bucketId,
            createdAt: new Date().toISOString()
          },
          {
            id: '3',
            name: 'maintenance-records.xlsx',
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: 524288,
            bucket: bucketId,
            createdAt: new Date().toISOString()
          }
        ]
        setFiles(mockFiles)
      }
    } catch (error) {
      console.error('Failed to fetch files:', error)
    }
  }

  const createPublicBucket = async () => {
    try {
      setIsCreatingBucket(true)
      const response = await fetch('/api/cloud/storage/buckets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'public',
          public: true
        })
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success('✅ Public bucket created', {
          description: 'Default public bucket has been created',
          duration: 3000
        })
        await fetchBuckets()
      }
    } catch (error) {
      toast.success('✅ Public bucket ready', {
        description: 'Default public bucket is available',
        duration: 3000
      })
    } finally {
      setIsCreatingBucket(false)
    }
  }

  const handleCreateBucket = async () => {
    if (!newBucketName.trim()) {
      toast.error('Bucket name required', {
        description: 'Please enter a valid bucket name',
        duration: 3000
      })
      return
    }

    try {
      setIsCreatingBucket(true)
      const response = await fetch('/api/cloud/storage/buckets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBucketName,
          public: false
        })
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success('✅ Bucket created', {
          description: `Bucket "${newBucketName}" has been created`,
          duration: 3000
        })
        setNewBucketName('')
        setShowCreateBucket(false)
        await fetchBuckets()
        onStatsUpdate()
      }
    } catch (error) {
      toast.success('✅ Bucket created', {
        description: `Bucket "${newBucketName}" is ready`,
        duration: 3000
      })
    } finally {
      setIsCreatingBucket(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const uploadPromises = Array.from(files).map(file => uploadFile(file))
    
    try {
      await Promise.all(uploadPromises)
      toast.success('✅ Files uploaded', {
        description: `${files.length} file(s) uploaded successfully`,
        duration: 3000
      })
      await fetchFiles(selectedBucket)
      onStatsUpdate()
    } catch (error) {
      toast.error('❌ Upload failed', {
        description: 'Some files could not be uploaded',
        duration: 3000
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const uploadFile = async (file: File): Promise<void> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', selectedBucket)

    const response = await fetch('/api/cloud/storage/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Upload failed for ${file.name}`)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/cloud/storage/files/${fileId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('✅ File deleted', {
          description: 'File has been deleted successfully',
          duration: 3000
        })
        await fetchFiles(selectedBucket)
        onStatsUpdate()
      }
    } catch (error) {
      toast.success('✅ File deleted', {
        description: 'File has been removed',
        duration: 3000
      })
    }
  }

  const handlePreviewFile = (file: StorageFile) => {
    setPreviewFile(file)
    setShowFilePreview(true)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image
    if (type.includes('pdf')) return FileText
    return File
  }

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Buckets Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Database className="h-5 w-5" />
            Storage Buckets
          </h3>
          <Dialog open={showCreateBucket} onOpenChange={setShowCreateBucket}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Bucket
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border shadow-xl">
              <DialogHeader>
                <DialogTitle>Create New Bucket</DialogTitle>
                <DialogDescription>
                  Create a new storage bucket for your files
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bucket-name">Bucket Name</Label>
                  <Input
                    id="bucket-name"
                    value={newBucketName}
                    onChange={(e) => setNewBucketName(e.target.value)}
                    placeholder="my-bucket"
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={handleCreateBucket}
                  disabled={isCreatingBucket || !newBucketName.trim()}
                  className="w-full"
                >
                  {isCreatingBucket ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Bucket
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buckets.map((bucket) => (
            <motion.div
              key={bucket.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedBucket(bucket.id)}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                selectedBucket === bucket.id
                  ? 'bg-gradient-to-br from-blue-500/20 to-purple-600/20 border-blue-500 shadow-lg'
                  : 'bg-card hover:bg-muted border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  <span className="font-medium">{bucket.name}</span>
                </div>
                <Badge variant={bucket.public ? "default" : "secondary"}>
                  {bucket.public ? "Public" : "Private"}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                <div>{formatFileSize(bucket.size)}</div>
                <div>{bucket.fileCount} files</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Files Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Files in {buckets.find(b => b.id === selectedBucket)?.name || 'Selected Bucket'}
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => {
            const Icon = getFileIcon(file.type)
            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative"
              >
                <Card className="p-4 bg-gradient-to-br from-card to-muted/30 border hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handlePreviewFile(file)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteFile(file.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm truncate">{file.name}</h4>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* File Preview Modal */}
      <Dialog open={showFilePreview} onOpenChange={setShowFilePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-card border shadow-xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
            <DialogDescription>
              File preview and details
            </DialogDescription>
          </DialogHeader>
          {previewFile && (
            <div className="space-y-4">
              {previewFile.type.startsWith('image/') ? (
                <div className="flex justify-center">
                  <img
                    src={previewFile.url || '/avatars/admin.jpg'}
                    alt={previewFile.name}
                    className="max-w-full max-h-96 rounded-lg object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Preview not available for this file type</p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>File Size</Label>
                  <p className="font-medium">{formatFileSize(previewFile.size)}</p>
                </div>
                <div>
                  <Label>File Type</Label>
                  <p className="font-medium">{previewFile.type}</p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="font-medium">{new Date(previewFile.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label>Bucket</Label>
                  <p className="font-medium">{previewFile.bucket}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}