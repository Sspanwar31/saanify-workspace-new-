import { NextRequest, NextResponse } from 'next/server'

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
      status: 'completed',
      startTime: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      duration: Math.floor(Math.random() * 5000) + 1000 // 1-6 seconds
    }

    return NextResponse.json({
      success: true,
      data: uploadResult,
      message: 'File uploaded successfully'
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}