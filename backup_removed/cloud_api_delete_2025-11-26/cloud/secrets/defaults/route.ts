import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    const defaultSecrets = [
      {
        key: 'SUPABASE_URL',
        value: 'https://your-project.supabase.co',
        description: 'Supabase project URL - Your project endpoint'
      },
      {
        key: 'SUPABASE_ANON_KEY',
        value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhYW5pZnktc3VwYWJhc2UiLCJpYXQiOjE3MzY3MjM2MDAsImV4cCI6MjA1MjQ2MDAwMH0.placeholder',
        description: 'Supabase anonymous/public key for client-side access'
      },
      {
        key: 'SUPABASE_SERVICE_KEY',
        value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhYW5pZnktc3VwYWJhc2UiLCJpYXQiOjE3MzY3MjM2MDAsImV4cCI6MjA1MjQ2MDAwMH0.placeholder',
        description: 'Supabase service role key for admin access'
      },
      {
        key: 'SUPABASE_DB_URL',
        value: 'postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres',
        description: 'Direct database connection URL'
      }
    ]

    const results = []
    
    for (const secret of defaultSecrets) {
      // Check if secret already exists
      const existing = await db.secret.findUnique({
        where: { key: secret.key }
      })

      if (!existing) {
        const newSecret = await db.secret.create({
          data: {
            ...secret,
            lastRotated: new Date()
          }
        })
        results.push(newSecret)
      } else {
        results.push(existing)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Default Supabase secrets added successfully',
      secrets: results.map(s => ({
        id: s.id,
        name: s.key,
        description: s.description,
        lastRotated: s.lastRotated?.toISOString()
      }))
    })
  } catch (error) {
    console.error('Failed to add default secrets:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to add default secrets'
    }, { status: 500 })
  }
}