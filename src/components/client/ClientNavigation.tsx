'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  BookOpen, 
  TrendingUp, 
  FileText, 
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navigationItems = [
  {
    label: 'Dashboard',
    href: '/dashboard/client',
    icon: LayoutDashboard,
    description: 'Overview and analytics'
  },
  {
    label: 'Members',
    href: '/dashboard/client/members',
    icon: Users,
    description: 'Member management'
  },
  {
    label: 'Loans',
    href: '/dashboard/client/loans',
    icon: CreditCard,
    description: 'Loan management'
  },
  {
    label: 'Passbook',
    href: '/dashboard/client/passbook',
    icon: BookOpen,
    description: 'Transaction history'
  },
  {
    label: 'Maturity',
    href: '/dashboard/client/maturity',
    icon: Calendar,
    description: 'Maturity tracking'
  },
  {
    label: 'Admin Fund',
    href: '/dashboard/client/admin-fund',
    icon: DollarSign,
    description: 'Fund management'
  },
  {
    label: 'Reports',
    href: '/dashboard/client/reports',
    icon: BarChart3,
    description: 'Reports and analytics'
  },
  {
    label: 'User Management',
    href: '/dashboard/client/user-management',
    icon: Settings,
    description: 'Role & permission management'
  }
]

interface ClientNavigationProps {
  className?: string
}

export default function ClientNavigation({ className }: ClientNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    return pathname === href
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className={cn("hidden lg:block", className)}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-64 bg-white/80 dark:bg-black/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-white/10 p-6"
        >
          <div className="mb-8">
            <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Client Panel
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Society Management
            </p>
          </div>

          <div className="space-y-2">
            {navigationItems.map((item, index) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer",
                        active
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                          : "hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        <div className={cn(
                          "text-xs",
                          active ? "text-emerald-100" : "text-muted-foreground"
                        )}>
                          {item.description}
                        </div>
                      </div>
                      {active && (
                        <motion.div
                          layoutId="activeTab"
                          className="w-2 h-2 bg-white rounded-full"
                          initial={false}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </div>
                  </motion.div>
                </Link>
              )
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <div className="text-xs text-muted-foreground">
              Version 1.0.0
            </div>
          </div>
        </motion.div>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Menu Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <Button
            variant="outline"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="bg-white/80 dark:bg-black/40 backdrop-blur-xl border-white/20 dark:border-white/10"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
            <span className="ml-2">Menu</span>
          </Button>
        </motion.div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <div className="bg-white/80 dark:bg-black/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-white/10 p-4">
              <div className="mb-4">
                <h2 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Client Panel
                </h2>
              </div>

              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  
                  return (
                    <Link key={item.href} href={item.href}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <div
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer",
                            active
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                              : "hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <div className="flex-1">
                            <div className="font-medium">{item.label}</div>
                            <div className={cn(
                              "text-xs",
                              active ? "text-emerald-100" : "text-muted-foreground"
                            )}>
                              {item.description}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  )
}