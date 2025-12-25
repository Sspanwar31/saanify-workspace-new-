import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

interface SupabaseConfig {
  tokens?: {
    access_token: string
    refresh_token: string
    expires_at: string
    token_type: string
  }
  user?: {
    id: string
    email: string
    name: string
    avatar_url?: string
  }
  organization?: {
    id: string
    name: string
  }
  project?: {
    id: string
    name: string
    database_region: string
  }
  provider?: string
  connected_at?: string
}

let supabaseClient: ReturnType<typeof createClient> | null = null
let configCache: SupabaseConfig | null = null

export function getSupabaseConfig(): SupabaseConfig | null {
  if (configCache) {
    return configCache
  }

  try {
    const configPath = path.join(process.cwd(), 'config', 'supabase-config.json')
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf-8')
      configCache = JSON.parse(configData)
      return configCache
    }
  } catch (error) {
    console.error('Error reading Supabase config:', error)
  }

  return null
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  try {
    const configPath = path.join(process.cwd(), 'config', 'supabase-config.json')
    fs.mkdirSync(path.dirname(configPath), { recursive: true })
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    configCache = config
  } catch (error) {
    console.error('Error saving Supabase config:', error)
    throw error
  }
}

export function clearSupabaseConfig(): void {
  try {
    const configPath = path.join(process.cwd(), 'config', 'supabase-config.json')
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath)
    }
    configCache = null
    supabaseClient = null
  } catch (error) {
    console.error('Error clearing Supabase config:', error)
  }
}

export function isTokenExpired(): boolean {
  const config = getSupabaseConfig()
  if (!config?.tokens?.expires_at) {
    return true
  }

  const expiryTime = new Date(config.tokens.expires_at).getTime()
  const currentTime = new Date().getTime()
  
  // Add 5-minute buffer before expiry
  return currentTime >= (expiryTime - 5 * 60 * 1000)
}

export async function refreshAccessToken(): Promise<string | null> {
  const config = getSupabaseConfig()
  if (!config?.tokens?.refresh_token) {
    return null
  }

  try {
    const response = await fetch('https://api.supabase.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: config.tokens.refresh_token,
        client_id: process.env.SUPABASE_CLIENT_ID,
        client_secret: process.env.SUPABASE_CLIENT_SECRET
      })
    })

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    const tokens = await response.json()
    
    const updatedConfig = {
      ...config,
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || config.tokens.refresh_token,
        expires_at: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString(),
        token_type: tokens.token_type
      }
    }

    saveSupabaseConfig(updatedConfig)
    return tokens.access_token
  } catch (error) {
    console.error('Error refreshing token:', error)
    return null
  }
}

export function getSupabaseClient() {
  const config = getSupabaseConfig()
  
  if (!config?.tokens?.access_token) {
    return null
  }

  if (isTokenExpired()) {
    const newToken = refreshAccessToken()
    if (!newToken) {
      return null
    }
  }

  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const accessToken = config.tokens.access_token

    if (!supabaseUrl || !accessToken) {
      return null
    }

    supabaseClient = createClient(supabaseUrl, accessToken)
  }

  return supabaseClient
}

export function isSupabaseConnected(): boolean {
  const config = getSupabaseConfig()
  return !!(config?.tokens?.access_token && !isTokenExpired())
}

export async function testSupabaseConnection(): Promise<boolean> {
  const client = getSupabaseClient()
  if (!client) {
    return false
  }

  try {
    const { data, error } = await client.from('_test_connection').select('1').limit(1)
    return !error
  } catch (error) {
    console.error('Supabase connection test failed:', error)
    return false
  }
}

export function getSupabaseUserInfo() {
  const config = getSupabaseConfig()
  return config?.user || null
}

export function getSupabaseProjectInfo() {
  const config = getSupabaseConfig()
  return config?.project || null
}