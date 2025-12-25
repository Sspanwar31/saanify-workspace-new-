import crypto from 'crypto'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'fallback-key-32-chars-long'

// Encrypt sensitive data
export function encrypt(text: string): string {
  const algorithm = 'aes-256-gcm'
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 100000)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher(algorithm, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted = cipher.final('hex')
  
  return iv.toString('hex') + ':' + encrypted
}

// Decrypt sensitive data
export function decrypt(encryptedData: string): string {
  const algorithm = 'aes-256-gcm'
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 100000)
  const textParts = encryptedData.split(':')
  const iv = Buffer.from(textParts[0], 'hex')
  const encryptedText = Buffer.from(textParts[1], 'hex')
  const decipher = crypto.createDecipher(algorithm, key, iv)
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted = decipher.final('utf8')
  
  return decrypted
}

// Save configuration to encrypted local file
export function saveConfig(config: any): any {
  try {
    const configPath = join(process.cwd(), '.saanify-restore.json')
    const existingConfig = existsSync(configPath) ? readFileSync(configPath, 'utf8') : '{}'
    const parsedConfig = JSON.parse(existingConfig)
    
    const updatedConfig = {
      ...parsedConfig,
      supabase: {
        ...parsedConfig.supabase,
        ...config
      }
    }
    
    writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2))
    console.log('✅ Supabase configuration saved securely')
    return updatedConfig
  } catch (error) {
    console.error('Failed to save configuration:', error)
    throw error
  }
}

// Load configuration from local file
export function loadConfig(): any {
  try {
    const configPath = join(process.cwd(), '.saanify-restore.json')
    if (existsSync(configPath)) {
      const configData = readFileSync(configPath, 'utf8')
      return JSON.parse(configData)
    }
    return {}
  } catch (error) {
    console.log('No existing configuration found')
    return {}
  }
}

// Delete configuration
export function deleteConfig(): void {
  try {
    const configPath = join(process.cwd(), '.saanify-restore.json')
    if (existsSync(configPath)) {
      writeFileSync(configPath, JSON.stringify({}), null, 2)
      console.log('🗑️ Supabase configuration deleted')
    }
  } catch (error) {
    console.error('Failed to delete configuration:', error)
  }
}

// Token management
export class TokenManager {
  static saveTokens(tokens: {
    access_token: string
    refresh_token: string
    expires_at: string
  }): void {
    const config = loadConfig()
    const updatedConfig = {
      ...config,
      supabase: {
        ...config.supabase,
        tokens: {
          access_token: encrypt(tokens.access_token),
          refresh_token: encrypt(tokens.refresh_token),
          expires_at: tokens.expires_at
        }
      }
    }
    saveConfig(updatedConfig)
  }

  static loadTokens() {
    const config = loadConfig()
    if (config.supabase?.tokens) {
      return {
        access_token: decrypt(config.supabase.tokens.access_token),
        refresh_token: decrypt(config.supabase.tokens.refresh_token),
        expires_at: config.supabase.tokens.expires_at
      }
    }
    return null
  }

  static isTokenExpired(): boolean {
    const tokens = this.loadTokens()
    if (!tokens || !tokens.expires_at) return true
    
    const expirationTime = new Date(tokens.expires_at)
    const now = new Date()
    return expirationTime <= now
  }

  async refreshAccessToken(): Promise<string | null> {
    const tokens = loadTokens()
    if (!tokens || !tokens.refresh_token) {
      console.error('No refresh token available')
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
          refresh_token: tokens.refresh_token,
          client_id: process.env.SUPABASE_CLIENT_ID || 'your-client-id',
          redirect_uri: process.env.NEXTAUTH_URL 
            ? `${process.env.NEXTAUTH_URL}/api/integrations/supabase/callback`
            : 'http://localhost:3000/api/integrations/supabase/callback'
        })
      })

      if (!response.ok) {
        const newTokens = await response.json()
        
        // Save new tokens
        this.saveTokens(newTokens)
        
        return newTokens.access_token
      }

      return null
    } catch (error) {
      console.error('Token refresh failed:', error)
      return null
    }
  }
}