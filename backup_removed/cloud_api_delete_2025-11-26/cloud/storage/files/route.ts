import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get('bucket')
    const prefix = searchParams.get('prefix') || ''

    // Simulate files in storage
    const files = [
      {
        id: 'file_1',
        name: 'user-avatar-001.jpg',
        size: 245678,
        type: 'image/jpeg',
        modified: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        etag: 'abc123',
        bucket: bucket || 'saanify-storage',
        path: `${prefix}/user-avatar-001.jpg`
      },
      {
        id: 'file_2',
        name: 'society-rules.pdf',
        size: 1024567,
        type: 'application/pdf',
        modified: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        etag: 'def456',
        bucket: bucket || 'saanify-storage',
        path: `${prefix}/society-rules.pdf`
      },
      {
        id: 'file_3',
        name: 'maintenance-report.xlsx',
        size: 567890,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        modified: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        etag: 'ghi789',
        bucket: bucket || 'saanify-storage',
        path: `${prefix}/maintenance-report.xlsx`
      }
    ]

    return NextResponse.json({
      success: true,
      data: files,
      total: files.length
    })
  } catch (error) {
    console.error('Error fetching storage files:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch storage files' },
      { status: 500 }
    )
  }
}