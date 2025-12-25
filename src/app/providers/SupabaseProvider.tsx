'use client'

import { ReactNode } from 'react'

interface SupabaseProviderProps {
  children: ReactNode
}

export default function SupabaseProvider({ children }: SupabaseProviderProps) {
  // Simple provider wrapper for future Supabase integration
  // Currently just passes through children
  return <>{children}</>
}