'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  RefreshCcw, 
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Users,
  UserCheck,
  UserX,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useSuperClientStore } from '@/lib/super-client/store'

export default function MembersPage() {
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    phone: '',
    email: '',
    address: '',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'active' as 'active' | 'inactive'
  })

  const {
    members,
    addMember,
    getActiveMembers,
    getInactiveMembers
  } = useSuperClientStore()

  // Wait for hydration to prevent SSR/client mismatch
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Calculate counts only after hydration
  const activeMembers = isHydrated ? getActiveMembers() : []
  const inactiveMembers = isHydrated ? getInactiveMembers() : []

  const handleViewProfile = (member: any) => {
    // Navigate to profile or show details
    alert(`Viewing profile for ${member.name}\n\nID: ${member.id}\nPhone: ${member.phone}\nEmail: ${member.email}\nAddress: ${member.address}\nStatus: ${member.status}\nJoin Date: ${member.joinDate}`);
  }

  const handleEditMember = (member: any) => {
    // Set form data for editing
    setFormData({
      name: member.name,
      fatherName: member.fatherName,
      phone: member.phone,
      email: member.email,
      address: member.address,
      joinDate: member.joinDate,
      status: member.status
    });
    setIsAddMemberOpen(true);
  }

  const handleDeleteMember = (member: any) => {
    if (confirm(`Are you sure you want to delete ${member.name}?`)) {
      // In a real app, this would call the store's deleteMember function
      // For now, we'll just show an alert
      alert(`Member ${member.name} deleted successfully`);
      // You could also call a delete function from the store if available
      // deleteMember(member.id);
    }
  }

  const handleAddMember = () => {
    if (!formData.name || !formData.fatherName || !formData.phone || !formData.email || !formData.address || !formData.joinDate) {
      return
    }

    const memberData = {
      ...formData,
      joinDate: formData.joinDate
    }

    addMember(memberData)
    
    // Reset form
    setFormData({
      name: '',
      fatherName: '',
      phone: '',
      email: '',
      address: '',
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active'
    })
    setIsAddMemberOpen(false)
  }

  const handleRefresh = () => {
    // In a real app, this would refetch data from the server
    window.location.reload()
  }

  const handleExport = () => {
    // Simple CSV export
    const csvContent = [
      ['ID', 'Name', 'Father/Husband Name', 'Phone', 'Email', 'Address', 'Join Date', 'Status'],
      ...members.map(member => [
        member.id,
        member.name,
        member.fatherName,
        member.phone,
        member.email,
        member.address,
        member.joinDate,
        member.status
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'members-ledger.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-red-100 text-red-800 border-red-200'
    }
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const truncateAddress = (address: string, maxLength: number = 30) => {
    return address.length > maxLength ? address.substring(0, maxLength) + '...' : address
  }

  return (
    <div className="space-y-6 font-sans">
      {!isHydrated ? (
        // Loading skeleton during hydration
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-white border-orange-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-orange-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Records</CardTitle>
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {members.length}
            </div>
            <p className="text-xs text-gray-500">
              All registered members
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-orange-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeMembers.length}
            </div>
            <p className="text-xs text-gray-500">
              Currently active members
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-orange-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Inactive</CardTitle>
            <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
              <UserX className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {inactiveMembers.length}
            </div>
            <p className="text-xs text-gray-500">
              Currently inactive members
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-orange-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Clock className="h-4 w-4 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              0
            </div>
            <p className="text-xs text-gray-500">
              Pending approvals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Toolbar */}
      <div className="bg-white border border-orange-100 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Members Ledger</h1>
            <p className="text-gray-600 mt-1">Manage society members and their records</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              className="border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh Ledger
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleExport}
              className="border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Members
            </Button>
            
            <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-md">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Member
                </Button>
              </DialogTrigger>
              
              <DialogContent className="bg-white border border-orange-100 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-gray-900">
                    {formData.name ? 'Edit Member' : 'Add New Member'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-700">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter member name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="fatherName" className="text-gray-700">Father/Husband Name</Label>
                    <Input
                      id="fatherName"
                      placeholder="Enter father/husband name"
                      value={formData.fatherName}
                      onChange={(e) => setFormData({...formData, fatherName: e.target.value})}
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-gray-700">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-gray-700">Address</Label>
                    <Input
                      id="address"
                      placeholder="Enter complete address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="border-gray-300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="joinDate" className="text-gray-700">Joining Date</Label>
                    <Input
                      id="joinDate"
                      type="date"
                      value={formData.joinDate}
                      onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                      className="border-gray-300"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="status" className="text-gray-700">Status</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsAddMemberOpen(false)
                        setFormData({
                          name: '',
                          fatherName: '',
                          phone: '',
                          email: '',
                          address: '',
                          joinDate: new Date().toISOString().split('T')[0],
                          status: 'active'
                        })
                      }}
                      className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={formData.name ? handleEditMember : handleAddMember}
                      disabled={!formData.name || !formData.fatherName || !formData.phone || !formData.email || !formData.address || !formData.joinDate}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      {formData.name ? 'Update Member' : 'Add Member'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <Card className="bg-white border border-orange-100">
        <CardHeader className="border-b border-orange-100">
          <CardTitle className="text-gray-900">All Members</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-orange-100">
                <TableHead className="text-gray-700 font-medium">Name</TableHead>
                <TableHead className="text-gray-700 font-medium">Father/Husband Name</TableHead>
                <TableHead className="text-gray-700 font-medium">Phone</TableHead>
                <TableHead className="text-gray-700 font-medium">Email</TableHead>
                <TableHead className="text-gray-700 font-medium">Join Date</TableHead>
                <TableHead className="text-gray-700 font-medium">Address</TableHead>
                <TableHead className="text-gray-700 font-medium">Status</TableHead>
                <TableHead className="text-gray-700 font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id} className="border-b border-orange-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {member.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          ID: {member.id}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {member.fatherName}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {member.phone}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {member.email}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {new Date(member.joinDate).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    <span title={member.address}>
                      {truncateAddress(member.address)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(member.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-orange-50">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border border-orange-100">
                        <DropdownMenuItem 
                          onClick={() => handleViewProfile(member)}
                          className="text-gray-700 hover:bg-orange-50"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleEditMember(member)}
                          className="text-gray-700 hover:bg-orange-50"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteMember(member)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  )
}