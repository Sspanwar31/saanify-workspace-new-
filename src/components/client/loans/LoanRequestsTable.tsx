'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase-simple' // Supabase
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, DollarSign, CheckCircle, XCircle } from 'lucide-react'
import { ApproveLoanModal } from './ApproveLoanModal'

// Accept Data as Prop
export function LoanRequestsTable({ requests }: { requests: any[] }) {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // --- Handlers ---
  const handleApprove = (requestId: string) => {
    setSelectedRequest(requestId)
    setIsModalOpen(true)
  }

  // ✅ FIX: Notify then Delete
  const handleReject = async (request: any) => {
    if(confirm(`Are you sure you want to REJECT and DELETE the loan request for ${request.memberName}?`)) {
       try {
         // 1. Send Notification to Member (so they know it's rejected)
         await supabase.from('notifications').insert([{
           client_id: request.client_id,
           member_id: request.memberId,
           title: 'Loan Request Rejected',
           message: `Your loan request for ₹${request.amount} has been rejected by the admin.`,
           is_read: false
         }]);

         // 2. Delete Loan Request from Database
         const { error } = await supabase
           .from('loans')
           .delete()
           .eq('id', request.id);
         
         if(!error) {
           window.location.reload(); // Refresh to remove from list
         } else {
           alert("Error deleting loan: " + error.message);
         }
       } catch (err) {
         console.error(err);
         alert("Something went wrong");
       }
    }
  }

  const formatDate = (dateString: string) => {
    if(!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR'
    }).format(amount || 0)
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No pending loan requests</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Pending Loan Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Total Deposits</TableHead>
                <TableHead>Requested Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`/avatars/${request.memberId}.jpg`} />
                        <AvatarFallback>
                          {request.memberName ? request.memberName.charAt(0) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col justify-center">
                        <div className="font-medium">{request.memberName}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium">{formatCurrency(request.amount)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-xs truncate">{request.purpose || 'Loan Request'}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <span>{formatCurrency(request.memberTotalDeposits)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(request.requestedDate)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(request)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isModalOpen && (
        <ApproveLoanModal
            isOpen={isModalOpen}
            onClose={() => {
            setIsModalOpen(false)
            setSelectedRequest(null)
            window.location.reload(); 
            }}
            requestId={selectedRequest}
        />
      )}
    </>
  )
}
