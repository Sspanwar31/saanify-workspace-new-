import { createClient } from '@supabase/supabase-js'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface SupabaseConfig {
  enabled: boolean
  autoOAuth: boolean
  organization?: {
    id: string
    name: string
  }
  project?: {
    id: string
    name: string
  }
  tokens?: {
    access_token: string
    refresh_token: string
    expires_at: number
  }
}

export class SupabaseTokenManager {
  private config: SupabaseConfig | null = null
  private configPath: string

  constructor() {
    this.configPath = join(process.cwd(), '.saanify-restore.json')
    this.loadConfig()
  }

  loadConfig(): SupabaseConfig | null {
    try {
      if (existsSync(this.configPath)) {
        const data = readFileSync(this.configPath, 'utf8')
        const parsed = JSON.parse(data)
        this.config = parsed.supabase || null
      }
    } catch (error) {
      console.error('Failed to load Supabase config:', error)
    }
    return this.config
  }

  saveConfig(config: SupabaseConfig): void {
    try {
      let existingData = {}
      if (existsSync(this.configPath)) {
        const data = readFileSync(this.configPath, 'utf8')
        existingData = JSON.parse(data)
      }
      
      const updatedData = {
        ...existingData,
        supabase: config
      }
      
      writeFileSync(this.configPath, JSON.stringify(updatedData, null, 2))
      this.config = config
    } catch (error) {
      console.error('Failed to save Supabase config:', error)
    }
  }

  getConfig(): SupabaseConfig | null {
    return this.config
  }

  getAccessToken(): string | null {
    return this.config?.tokens?.access_token || null
  }

  getRefreshToken(): string | null {
    return this.config?.tokens?.refresh_token || null
  }

  isTokenExpired(): boolean {
    if (!this.config?.tokens?.expires_at) return true
    return Date.now() > this.config.tokens.expires_at
  }

  async refreshAccessToken(): Promise<string | null> {
    if (!this.config?.tokens?.refresh_token) {
      return null
    }

    try {
      const response = await fetch('https://api.supabase.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.config.tokens.refresh_token,
          client_id: process.env.SUPABASE_CLIENT_ID,
          client_secret: process.env.SUPABASE_CLIENT_SECRET
        })
      })

      const tokenData = await response.json()
      
      if (tokenData.error) {
        console.error('Token refresh failed:', tokenData.error)
        return null
      }

      // Update tokens
      const updatedTokens = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: Date.now() + (tokenData.expires_in * 1000)
      }

      // Update config
      if (this.config) {
        this.config.tokens = updatedTokens
        this.saveConfig(this.config)
      }

      return tokenData.access_token
    } catch (error) {
      console.error('Token refresh failed:', error)
      return null
    }
  }

  async createSupabaseClient() {
    const accessToken = this.getAccessToken()
    if (!accessToken) {
      throw new Error('No access token available')
    }
    
    return createClient(
      accessToken,
      process.env.NEXT_PUBLIC_SUPABASE_URL
    )
  }

  async isAuthenticated(): Promise<boolean> {
    const token = this.getAccessToken()
    return !!token && !this.isTokenExpired()
  }

  async logout(): Promise<void> {
    if (this.config) {
      this.config.tokens = undefined
      this.saveConfig(this.config)
    }
  }
}