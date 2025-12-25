'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  CreditCard, 
  TrendingUp, 
  Briefcase,
  Receipt, 
  BarChart3,
  Settings, 
  Sparkles,
  ShieldCheck,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSuperClientStore, PERMISSIONS, MOCK_ROLES } from '@/lib/super-client/store'
import Link from 'next/link'

// Define Menu Items with Required Permissions
const menuItems = [
  { 
    label: 'Dashboard', 
    href: '/super-client/dashboard', 
    icon: LayoutDashboard, 
    req: PERMISSIONS.VIEW_DASHBOARD 
  },
  { 
    label: 'Members', 
    href: '/super-client/members', 
    icon: Users, 
    req: PERMISSIONS.VIEW_MEMBERS 
  },
  { 
    label: 'Passbook', 
    href: '/super-client/passbook', 
    icon: BookOpen, 
    req: PERMISSIONS.VIEW_PASSBOOK 
  },
  { 
    label: 'Loans', 
    href: '/super-client/loans', 
    icon: CreditCard, 
    req: PERMISSIONS.VIEW_LOANS 
  },
  { 
    label: 'Maturity', 
    href: '/super-client/maturity', 
    icon: TrendingUp, 
    req: PERMISSIONS.VIEW_LOANS // Use same permission as loans
  },
  { 
    label: 'Admin Fund', 
    href: '/super-client/admin-fund', 
    icon: Briefcase, 
    req: PERMISSIONS.MANAGE_FINANCE 
  },
  { 
    label: 'Expenses', 
    href: '/super-client/expenses', 
    icon: Receipt, 
    req: PERMISSIONS.MANAGE_FINANCE 
  },
  { 
    label: 'Reports', 
    href: '/super-client/reports', 
    icon: BarChart3, 
    req: PERMISSIONS.VIEW_REPORTS 
  },
  { 
    label: 'Settings', 
    href: '/super-client/settings', 
    icon: Settings, 
    req: PERMISSIONS.VIEW_SETTINGS 
  },
  { 
    label: 'Subscription', 
    href: '/super-client/subscription', 
    icon: Sparkles, 
    req: PERMISSIONS.MANAGE_SYSTEM 
  },
  { 
    label: 'User Management', 
    href: '/super-client/users', 
    icon: ShieldCheck, 
    req: PERMISSIONS.VIEW_USERS // <--- Protected: Only visible with VIEW_USERS permission
  }
]

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { logout, currentUser } = useSuperClientStore()

  // Check if user is Super Admin OR has specific permission
  const hasAccess = (requiredPermission: string) => {
    if (!currentUser) return false;
    
    // Check if user has SUPER_ADMIN role (handle both string and object formats)
    const userRoleId = typeof currentUser.role === 'string' 
      ? currentUser.role 
      : currentUser.role?.id;
    
    if (userRoleId === 'SUPER_ADMIN') return true; // Master Key 🔑
    
    // Check permissions directly from currentUser.role.permissions if available
    if (currentUser.role && typeof currentUser.role === 'object' && currentUser.role.permissions) {
      return currentUser.role.permissions.includes(requiredPermission);
    }
    
    // Fallback to MOCK_ROLES lookup
    const role = MOCK_ROLES.find(r => r.id === userRoleId);
    return role ? role.permissions.includes(requiredPermission as any) : false;
  }
  
  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-orange-200 bg-orange-50/50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <h1 className="font-bold text-xl text-orange-600">Saanify V2</h1>
            <p className="text-xs text-orange-500">Super Client</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto bg-orange-50/30">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          
          // GHOST MODE LOGIC: If permission missing, return null (Hide Item)
          // SUPER_ADMIN always has access (Safety Net)
          if (!currentUser || !hasAccess(item.req)) return null

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`
                flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors
                ${isActive 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md' 
                  : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                }
              `}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-orange-200 bg-orange-50/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">SC</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {currentUser?.name || 'Super Client'}
            </p>
            <p className="text-xs text-orange-500 truncate">
              {currentUser?.email || 'super@saanify.com'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )
}