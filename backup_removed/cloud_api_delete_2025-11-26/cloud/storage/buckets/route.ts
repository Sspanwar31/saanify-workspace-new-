import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Simulate storage buckets
    const buckets = [
      {
        id: 'bucket_1',
        name: 'saanify-storage',
        region: 'us-east-1',
        createdAt: new Date('2024-01-01').toISOString(),
        size: '45.2 GB',
        files: 1247,
        public: false,
        versioning: true
      },
      {
        id: 'bucket_2',
        name: 'saanify-backups',
        region: 'us-west-2',
        createdAt: new Date('2024-01-15').toISOString(),
        size: '12.8 GB',
        files: 89,
        public: false,
        versioning: true
      },
      {
        id: 'bucket_3',
        name: 'saanify-assets',
        region: 'eu-west-1',
        createdAt: new Date('2024-02-01').toISOString(),
        size: '8.4 GB',
        files: 3421,
        public: true,
        versioning: false
      }
    ]

    return NextResponse.json({
      success: true,
      data: buckets
    })
  } catch (error) {
    console.error('Error fetching storage buckets:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch storage buckets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, region, public: isPublic, versioning } = body

    if (!name || !region) {
      return NextResponse.json(
        { success: false, error: 'Name and region are required' },
        { status: 400 }
      )
    }

    // Simulate bucket creation
    const newBucket = {
      id: `bucket_${Date.now()}`,
      name,
      region,
      createdAt: new Date().toISOString(),
      size: '0 GB',
      files: 0,
      public: isPublic || false,
      versioning: versioning || false
    }

    return NextResponse.json({
      success: true,
      data: newBucket,
      message: 'Bucket created successfully'
    })
  } catch (error) {
    console.error('Error creating bucket:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create bucket' },
      { status: 500 }
    )
  }
}