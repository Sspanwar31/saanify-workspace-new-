'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/providers/auth-provider'
import { Loader2, ShieldX, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase' // ✅ Added Import
import { toast } from 'sonner' // ✅ Added Import

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'ADMIN' | 'ADMIN' | 'CLIENT'
  fallback?: React.ReactNode
}

export default function AuthGuard({ children, requiredRole = 'ADMIN', fallback }: AuthGuardProps) {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isRedirecting, setIsRedirecting] = useState(false)

  // 🔥 NEW: Realtime Lock/Expire Listener
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`public:clients:${user.id}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'clients', filter: `id=eq.${user.id}` }, 
        (payload: any) => {
          const newStatus = payload.new.status;
          if (newStatus === 'LOCKED' || newStatus === 'EXPIRED') {
            toast.error(`Account ${newStatus}. Logging out...`);
            logout(); // Force Logout
            router.push('/login');
          }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, logout, router]);

  const checkAuthAndRedirect = useCallback(() => {
    // console.log('🔐 AuthGuard Check:', { isLoading, user, requiredRole })
    
    if (isLoading) return;

    if (!user) {
      setIsRedirecting(true)
      router.push('/login')
      return
    }

    // 🔥 NEW: Check if already locked in session
    if (user.status === 'LOCKED' || user.status === 'EXPIRED') {
       toast.error("Account Suspended");
       logout();
       return;
    }

    const userRole = user.role?.toUpperCase()
    
    if (requiredRole === 'ADMIN' && userRole !== 'ADMIN') {
      if (userRole === 'CLIENT') {
        setIsRedirecting(true)
        router.push('/client')
      } else if (userRole === 'ADMIN') {
        setIsRedirecting(true)
        router.push('/dashboard/admin')
      } else {
        setIsRedirecting(true)
        router.push('/login')
      }
      return
    }

    setIsRedirecting(false)
  }, [user, isLoading, requiredRole, router, logout])

  useEffect(() => {
    checkAuthAndRedirect()
  }, [checkAuthAndRedirect])

  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <h3 className="font-semibold">Verifying Authentication</h3>
              <p className="text-sm text-muted-foreground mt-1">Please wait while we verify your access...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user || (requiredRole && user.role?.toUpperCase() !== requiredRole)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <ShieldX className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>This page requires {requiredRole} privileges. Your current role: {user?.role || 'Unknown'}</AlertDescription>
            </Alert>
            <div className="flex flex-col gap-2">
              <Button onClick={() => router.back()} variant="outline" className="w-full">Go Back</Button>
              <Button onClick={() => router.push('/dashboard')} className="w-full">Go to Dashboard</Button>
              <Button onClick={logout} variant="destructive" className="w-full">Logout</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
