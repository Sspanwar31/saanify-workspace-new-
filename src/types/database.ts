// Database types for Supabase
// Generated based on your Prisma schema

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          password: string
          role: string
          is_active: boolean
          last_login_at: string | null
          society_account_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          password: string
          role?: string
          is_active?: boolean
          last_login_at?: string | null
          society_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          password?: string
          role?: string
          is_active?: boolean
          last_login_at?: string | null
          society_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      society_accounts: {
        Row: {
          id: string
          name: string
          admin_name: string | null
          email: string
          phone: string | null
          address: string | null
          subscription_plan: string
          status: string
          trial_ends_at: string | null
          subscription_ends_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          admin_name?: string | null
          email: string
          phone?: string | null
          address?: string | null
          subscription_plan?: string
          status?: string
          trial_ends_at?: string | null
          subscription_ends_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          admin_name?: string | null
          email?: string
          phone?: string | null
          address?: string | null
          subscription_plan?: string
          status?: string
          trial_ends_at?: string | null
          subscription_ends_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      societies: {
        Row: {
          id: string
          name: string
          description: string | null
          address: string | null
          phone: string | null
          email: string | null
          society_account_id: string
          created_by_user_id: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          society_account_id: string
          created_by_user_id: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          society_account_id?: string
          created_by_user_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          title: string
          content: string | null
          published: boolean
          author_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content?: string | null
          published?: boolean
          author_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string | null
          published?: boolean
          author_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}