'use client'

import { useRouter, usePathname } from 'next/navigation'
import { 
  LayoutDashboard, Users, BookOpen, CreditCard, TrendingUp, Briefcase, 
  Receipt, BarChart3, Settings, Sparkles, ShieldCheck, LogOut 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useClientStore, PERMISSIONS } from '@/lib/client/store' // REMOVED MOCK_ROLES
import Link from 'next/link'
import { useEffect, useState } from 'react'

const menuItems = [
  { label: 'Dashboard', href: '/client/dashboard', icon: LayoutDashboard, req: PERMISSIONS.VIEW_DASHBOARD },
  { label: 'Members', href: '/client/members', icon: Users, req: PERMISSIONS.VIEW_MEMBERS },
  { label: 'Passbook', href: '/client/passbook', icon: BookOpen, req: PERMISSIONS.VIEW_PASSBOOK },
  { label: 'Loans', href: '/client/loans', icon: CreditCard, req: PERMISSIONS.VIEW_LOANS },
  { label: 'Maturity', href: '/client/maturity', icon: TrendingUp, req: PERMISSIONS.VIEW_LOANS },
  { label: 'Admin Fund', href: '/client/admin-fund', icon: Briefcase, req: PERMISSIONS.MANAGE_FINANCE },
  { label: 'Expenses', href: '/client/expenses', icon: Receipt, req: PERMISSIONS.MANAGE_FINANCE },
  { label: 'Reports', href: '/client/reports', icon: BarChart3, req: PERMISSIONS.VIEW_REPORTS },
  { label: 'Settings', href: '/client/settings', icon: Settings, req: PERMISSIONS.VIEW_SETTINGS },
  { label: 'Subscription', href: '/client/subscription', icon: Sparkles, req: PERMISSIONS.MANAGE_SYSTEM },
  { label: 'User Management', href: '/client/users', icon: ShieldCheck, req: PERMISSIONS.VIEW_USERS }
]

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  
  // 1. FETCH ROLES FROM STORE (LIVE DATA)
  const { logout, currentUser, roles } = useClientStore()
  
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const hasAccess = (requiredPermission: string) => {
    if (!currentUser) return false;
    
    // NORMALIZE ROLE ID
    const roleId = typeof currentUser.role === 'string' 
      ? currentUser.role 
      : currentUser.role?.id;
    
    // MASTER KEY: Client Admin always gets access
    if (roleId === 'CLIENT_ADMIN' || roleId === 'SUPER_ADMIN') return true;
    
    // PRIORITY 1: Check embedded permissions (Specific to user)
    if (typeof currentUser.role === 'object' && currentUser.role.permissions) {
      if (currentUser.role.permissions.includes(requiredPermission)) return true;
    }
    
    // PRIORITY 2: Check Dynamic Roles from Store (Updated via User Management)
    // This connects Sidebar to "Roles & Permissions" tab settings
    const liveRole = roles.find(r => r.id === roleId);
    
    if (liveRole && liveRole.permissions) {
       // Case-insensitive check to be safe
       return liveRole.permissions.some(p => p.toUpperCase() === requiredPermission.toUpperCase());
    }
    
    return false;
  }
  
  const handleLogout = () => {
    logout()
    router.push('/')
  }

  // Prevent hydration mismatch but render skeleton structure
  if (!mounted) return <div className="w-64 h-full bg-orange-50/30 border-r" />;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-orange-200 bg-orange-50/50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <h1 className="font-bold text-xl text-orange-600">Saanify V2</h1>
            <p className="text-xs text-orange-500">
               {currentUser?.role === 'CLIENT_ADMIN' ? 'Client Admin' : (typeof currentUser?.role === 'string' ? currentUser.role : 'Staff Panel')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto bg-orange-50/30 scrollbar-thin scrollbar-thumb-orange-200">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          
          // GHOST MODE LOGIC
          const canView = currentUser ? hasAccess(item.req) : true; 

          if (!canView) return null

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`
                flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg translate-x-1' 
                  : 'text-gray-700 hover:text-orange-600 hover:bg-orange-100 hover:translate-x-1'
                }
              `}
            >
              <item.icon className={`h-5 w-5 mr-3 ${isActive ? 'text-white' : 'text-orange-500'}`} />
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-orange-200 bg-orange-50/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
            {currentUser?.name?.charAt(0) || 'G'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {currentUser?.name || 'Guest User'}
            </p>
            <p className="text-xs text-orange-500 truncate">
              {currentUser?.email || 'Please Login'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start border-orange-200 text-orange-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {currentUser ? 'Logout' : 'Sign In'}
        </Button>
      </div>
    </div>
  )
}