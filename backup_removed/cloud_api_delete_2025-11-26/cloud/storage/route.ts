import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for files
let files: any[] = [
  {
    id: 'file_1',
    name: 'user-avatars',
    type: 'folder',
    size: '245 MB',
    modified: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    path: '/storage/user-avatars',
    fileCount: 1847,
    icon: '🖼️'
  },
  {
    id: 'file_2',
    name: 'society-docs',
    type: 'folder',
    size: '1.2 GB',
    modified: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    path: '/storage/society-docs',
    fileCount: 342,
    icon: '📄'
  },
  {
    id: 'file_3',
    name: 'backup-2024',
    type: 'folder',
    size: '3.8 GB',
    modified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    path: '/storage/backup-2024',
    fileCount: 28,
    icon: '💾'
  },
  {
    id: 'file_4',
    name: 'maintenance-logs',
    type: 'folder',
    size: '128 MB',
    modified: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    path: '/storage/maintenance-logs',
    fileCount: 156,
    icon: '📋'
  },
  {
    id: 'file_5',
    name: 'financial-reports',
    type: 'folder',
    size: '456 MB',
    modified: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    path: '/storage/financial-reports',
    fileCount: 89,
    icon: '📊'
  },
  {
    id: 'file_6',
    name: 'property-images',
    type: 'folder',
    size: '2.1 GB',
    modified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    path: '/storage/property-images',
    fileCount: 3247,
    icon: '🏠'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    let filteredFiles = files

    // Filter by type
    if (type && type !== 'all') {
      filteredFiles = files.filter(file => {
        if (type === 'images') return file.name.includes('avatar') || file.name.includes('images')
        if (type === 'documents') return file.name.includes('docs') || file.name.includes('logs') || file.name.includes('reports')
        if (type === 'backups') return file.name.includes('backup')
        return true
      })
    }

    // Filter by search
    if (search) {
      filteredFiles = filteredFiles.filter(file =>
        file.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    return NextResponse.json({
      success: true,
      data: filteredFiles,
      total: filteredFiles.length
    })
  } catch (error) {
    console.error('Error fetching storage files:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch storage files' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const path = formData.get('path') as string || '/storage'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Simulate file upload
    const uploadResult = {
      uploadId: `upload_${Date.now()}`,
      fileName: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      path: `${path}/${file.name}`,
      status: 'uploading',
      startTime: new Date().toISOString(),
      estimatedDuration: '30 seconds'
    }

    // Simulate upload completion
    setTimeout(() => {
      const newFile = {
        id: `file_${Date.now()}`,
        name: file.name,
        type: 'file',
        size: uploadResult.size,
        modified: new Date().toISOString(),
        path: uploadResult.path,
        icon: '📄'
      }
      files.push(newFile)
    }, 30000)

    return NextResponse.json({
      success: true,
      data: uploadResult,
      message: 'File upload started'
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'File ID is required' },
        { status: 400 }
      )
    }

    const initialLength = files.length
    files = files.filter(file => file.id !== id)

    if (files.length === initialLength) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}