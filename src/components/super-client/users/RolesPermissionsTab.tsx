'use client'

import { Role, Permission } from '@/lib/super-client/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Shield, Settings, Users, FileText, DollarSign, Lock, Eye, Edit } from 'lucide-react'

interface RolesPermissionsTabProps {
  roles: Role[]
  canManageUsers: boolean
  togglePermission: (roleId: string, permissionId: Permission) => void
  currentUser?: any // Add currentUser prop
}

// Permission categories with icons
const permissionCategories = {
  // Module Access (Ghost Mode triggers)
  'VIEW_DASHBOARD': { name: 'View Dashboard', icon: Eye, category: 'General' },
  'VIEW_PASSBOOK': { name: 'View Passbook', icon: Eye, category: 'General' },
  'VIEW_LOANS': { name: 'View Loans', icon: Eye, category: 'General' },
  'VIEW_MEMBERS': { name: 'View Members', icon: Eye, category: 'General' },
  'VIEW_REPORTS': { name: 'View Reports', icon: Eye, category: 'General' },
  'VIEW_SETTINGS': { name: 'View Settings', icon: Eye, category: 'General' },
  'VIEW_USERS': { name: 'User Management Access', icon: Users, category: 'User Management' }, // <--- NEW: Controls User Mgmt Tab Visibility
  
  // Actions
  'MANAGE_FINANCE': { name: 'Manage Finance', icon: DollarSign, category: 'Financial' }, // Approve loans, add entries
  'MANAGE_USERS': { name: 'Manage Users', icon: Users, category: 'User Management' },    // Add/Edit/Block users
  'MANAGE_SYSTEM': { name: 'Manage System', icon: Settings, category: 'System' },   // Settings, Subscription
  
  // Legacy permissions for backward compatibility
  'MANAGE_LOANS': { name: 'Manage Loans', icon: DollarSign, category: 'Financial' },
  'EXPORT_DATA': { name: 'Export Data', icon: FileText, category: 'General' },
  'MANAGE_MEMBERS': { name: 'Manage Members', icon: Users, category: 'User Management' },
  'MANAGE_EXPENSES': { name: 'Manage Expenses', icon: DollarSign, category: 'Financial' },
  'MANAGE_SUBSCRIPTION': { name: 'Manage Subscription', icon: Settings, category: 'System' },
  'VIEW_ACTIVITY_LOGS': { name: 'View Activity Logs', icon: Eye, category: 'Security' },
  'MANAGE_ROLES': { name: 'Manage Roles', icon: Shield, category: 'Security' },
  'GHOST_MODE': { name: 'Ghost Mode', icon: Eye, category: 'Security' },
  'APPROVE_LOANS': { name: 'Approve Loans', icon: DollarSign, category: 'Financial' },
  'MANAGE_PASSBOOK': { name: 'Manage Passbook', icon: FileText, category: 'Financial' },
  'MANAGE_ADMIN_FUND': { name: 'Manage Admin Fund', icon: DollarSign, category: 'Financial' }
}

export default function RolesPermissionsTab({ roles, canManageUsers, togglePermission, currentUser }: RolesPermissionsTabProps) {
  const allPermissions = Object.keys(permissionCategories) as Permission[]
  
  // Group permissions by category
  const permissionsByCategory = allPermissions.reduce((acc, permission) => {
    const category = permissionCategories[permission].category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  const getPermissionIcon = (permission: Permission) => {
    const IconComponent = permissionCategories[permission].icon
    return <IconComponent className="h-4 w-4" />
  }

  const getPermissionName = (permission: Permission) => {
    return permissionCategories[permission].name
  }

  return (
    <div className="space-y-6">
      {/* Role Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {roles.map((role) => (
          <Card key={role.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {role.name}
                </span>
                <Badge className={role.color}>
                  {role.permissions.length} permissions
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {role.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 3).map((permission) => (
                  <Badge key={permission} variant="outline" className="text-xs">
                    {getPermissionName(permission).split(' ')[0]}
                  </Badge>
                ))}
                {role.permissions.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{role.permissions.length - 3} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permission Matrix by Category */}
      {Object.entries(permissionsByCategory).map(([category, permissions]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {category} Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Permission</TableHead>
                    {roles.map((role) => (
                      <TableHead key={role.id} className="text-center">
                        <Badge className={role.color}>
                          {role.name}
                        </Badge>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission) => (
                    <TableRow key={permission} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getPermissionIcon(permission)}
                          <span>{getPermissionName(permission)}</span>
                        </div>
                      </TableCell>
                      {roles.map((role) => (
                        <TableCell key={role.id} className="text-center">
                          <Checkbox 
                            checked={role.permissions.includes(permission)}
                            onCheckedChange={() => togglePermission(role.id, permission)}
                            disabled={
                              !canManageUsers || // Disable if user doesn't have manage permissions
                              role.id === 'SUPER_ADMIN' || // Protect Super Admin (Always Full Access)
                              role.id === 'MEMBER' // Protect Member (Always Read Only)
                            }
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Permission Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Permission Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {roles.map((role) => (
              <div key={role.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={role.color}>
                    {role.name}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {role.permissions.length} total
                  </span>
                </div>
                <div className="space-y-1">
                  {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => {
                    const roleCategoryPermissions = categoryPermissions.filter(p => role.permissions.includes(p))
                    const percentage = (roleCategoryPermissions.length / categoryPermissions.length) * 100
                    
                    return (
                      <div key={`${role.id}-${category}`} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>{category}</span>
                          <span>{roleCategoryPermissions.length}/{categoryPermissions.length}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Notes */}
      {!canManageUsers && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Read-Only Access
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You have read-only access to view roles and permissions. 
                  To modify roles or permissions, please contact your system administrator.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Mode Instructions */}
      {canManageUsers && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Edit className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Edit Mode Enabled
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You can modify permissions for <strong>Administrator</strong> and <strong>Treasurer</strong> roles.
                  <br />
                  <strong>Super Admin</strong> permissions are locked (always full access).
                  <br />
                  <strong>Member</strong> permissions are locked (always read-only).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}