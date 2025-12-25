import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Testing server-side Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase.from('members').select('count').limit(1)
    
    if (error) {
      console.error('Server-side Supabase error:', error)
      return NextResponse.json({ 
        status: 'error', 
        message: error.message,
        details: error
      }, { status: 500 })
    }
    
    console.log('Server-side Supabase connection successful:', data)
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'Connected to Live Supabase from Server!',
      data: data,
      timestamp: new Date().toISOString()
    })
    
  } catch (err) {
    console.error('Server connection error:', err)
    return NextResponse.json({ 
      status: 'error', 
      message: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}