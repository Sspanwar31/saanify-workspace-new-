'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase'; // ✅ Updated to standard import
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, DollarSign, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { ApproveLoanModal } from './ApproveLoanModal';
import { toast } from 'sonner'; // ✅ Toast added for Admin feedback

// Accept Data as Prop
export function LoanRequestsTable({ requests }: { requests: any[] }) {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null); // To show loading on button

  // --- Handlers ---
  const handleApprove = (requestId: string) => {
    setSelectedRequest(requestId);
    setIsModalOpen(true);
  };

  // ✅ FIX: Reject Logic + Member Notification
  const handleReject = async (request: any) => {
    if(!confirm(`Are you sure you want to REJECT this loan for ${request.memberName}?`)) return;

    setProcessingId(request.id);
    try {
        // 1. Send Notification to Member (Taaki Member Panel pe Toast aaye)
        const { error: notifError } = await supabase.from('notifications').insert([{
            client_id: request.client_id || request.clientId, // Handle casing
            member_id: request.memberId,
            title: 'Loan Rejected ❌',
            message: `Your loan request for ₹${request.amount.toLocaleString()} has been rejected by admin.`,
            type: 'error',
            is_read: false,
            created_at: new Date().toISOString()
        }]);

        if (notifError) console.error("Notification Error:", notifError);

        // 2. Delete Loan Request (Ya status update karein 'rejected')
        // Aapke purane code ke hisab se DELETE kar rahe hain
        const { error } = await supabase
            .from('loans')
            .delete() // Ya .update({ status: 'rejected' }) agar record rakhna ho
            .eq('id', request.id);
        
        if (error) throw error;

        // 3. Admin Toast & Refresh
        toast.success("Loan Rejected & Member Notified");
        window.location.reload(); 

    } catch (err: any) {
        console.error(err);
        toast.error("Error: " + err.message);
    } finally {
        setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    if(!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR'
    }).format(amount || 0);
  };

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No pending loan requests</p>
        </CardContent>
      </Card>
    );
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
                    <p className="max-w-xs truncate">{request.purpose || 'Personal Loan'}</p>
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
                        disabled={!!processingId}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(request)}
                        disabled={processingId === request.id}
                      >
                        {processingId === request.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <XCircle className="h-4 w-4 mr-1" />}
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

      {/* APPROVE MODAL - Handled separately in ApproveLoanModal.tsx */}
      {isModalOpen && (
        <ApproveLoanModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedRequest(null);
              window.location.reload(); 
            }}
            requestId={selectedRequest}
        />
      )}
    </>
  );
}
