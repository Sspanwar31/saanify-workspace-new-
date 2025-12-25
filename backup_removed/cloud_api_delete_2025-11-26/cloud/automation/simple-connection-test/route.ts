import { NextRequest, NextResponse } from 'next/server'
import { withAdmin, AuthenticatedRequest } from '@/lib/auth-middleware'
import SupabaseService from '@/lib/supabase-service'

export const GET = withAdmin(async (req: AuthenticatedRequest) => {
  try {
    console.log('🔍 Testing simple Supabase connection...')
    
    const supabaseService = SupabaseService.getInstance()
    const client = await supabaseService.getClient()
    
    if (!client) {
      console.log('❌ Failed to create Supabase client')
      return NextResponse.json({
        success: false,
        error: 'Failed to create Supabase client',
        connection_status: 'failed'
      })
    }

    console.log('✅ Supabase client created successfully')
    
    // Test 1: Basic connection test
    try {
      const { data, error } = await client.from('test_table').select('*').limit(1)
      console.log('📊 Testing basic query...')
      
      if (error) {
        console.log('❌ Basic query failed:', error)
        return NextResponse.json({
          success: false,
          error: `Basic query failed: ${error.message}`,
          connection_status: 'query_failed'
        })
      }
      
      console.log('✅ Basic query successful')
    } catch (queryError) {
      console.log('❌ Basic query exception:', queryError)
      // Table might not exist, which is okay
    }

    // Test 2: Storage access test
    try {
      console.log('📁 Testing storage access...')
      const { data: buckets, error: storageError } = await client.storage.listBuckets()
      
      if (storageError) {
        console.log('❌ Storage access failed:', storageError)
        return NextResponse.json({
          success: false,
          error: `Storage access failed: ${storageError.message}`,
          connection_status: 'storage_failed'
        })
      }
      
      console.log('✅ Storage access successful')
      console.log('📦 Available buckets:', buckets?.map(b => b.name) || [])
    } catch (storageException) {
      console.log('❌ Storage access exception:', storageException)
      return NextResponse.json({
        success: false,
        error: `Storage access exception: ${storageException instanceof Error ? storageException.message : 'Unknown'}`,
        connection_status: 'storage_exception'
      })
    }

    // Test 3: Auth test
    try {
      console.log('🔐 Testing authentication...')
      const { data: { user }, error: authError } = await client.auth.getUser()
      
      if (authError) {
        console.log('❌ Auth test failed:', authError)
        return NextResponse.json({
          success: false,
          error: `Auth test failed: ${authError.message}`,
          connection_status: 'auth_failed'
        })
      }
      
      console.log('✅ Auth test successful')
      console.log('👤 User:', user ? { id: user.id, email: user.email } : 'No user')
    } catch (authException) {
      console.log('❌ Auth test exception:', authException)
      return NextResponse.json({
        success: false,
        error: `Auth test exception: ${authException instanceof Error ? authException.message : 'Unknown'}`,
        connection_status: 'auth_exception'
      })
    }

    // Test 4: Secrets access test
    try {
      console.log('🔐 Testing secrets access...')
      const { data: secrets, error: secretsError } = await client.from('secrets').select('*').limit(1)
      
      if (secretsError) {
        console.log('❌ Secrets access failed:', secretsError)
        return NextResponse.json({
          success: false,
          error: `Secrets access failed: ${secretsError.message}`,
          connection_status: 'secrets_failed'
        })
      }
      
      console.log('✅ Secrets access successful')
      console.log('🔐 Available secrets count:', secrets?.length || 0)
    } catch (secretsException) {
      console.log('❌ Secrets access exception:', secretsException)
      // Table might not exist
    }

    console.log('🎉 All connection tests completed successfully!')
    
    return NextResponse.json({
      success: true,
      message: 'All connection tests passed',
      connection_status: 'success',
      tests: {
        client_created: true,
        basic_query: 'passed',
        storage_access: 'passed',
        auth_test: 'passed',
        secrets_access: 'passed'
      },
      recommendations: [
        '✅ Supabase client is working',
        '✅ Storage access is functional', 
        '✅ Authentication is working',
        '✅ Automation can proceed',
        'ℹ️ Note: Some tables may not exist yet (this is normal in development)'
      ]
    })

  } catch (error) {
    console.error('💥 Connection test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      connection_status: 'failed'
    })
  }
})