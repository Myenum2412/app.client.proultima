'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { GroceryRequest } from '@/types';
import { useGroceryRequests } from '@/hooks/use-grocery-requests';
import { useAuth } from '@/contexts/auth-context';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface GroceryApprovalDialogProps {
  request: GroceryRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GroceryApprovalDialog({
  request,
  open,
  onOpenChange,
}: GroceryApprovalDialogProps) {
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);

  const { user } = useAuth();
  const { approveGroceryRequest, rejectGroceryRequest } = useGroceryRequests();

  if (!request) return null;

  const handleApprove = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    setIsProcessing(true);
    try {
      await approveGroceryRequest({
        id: request.id,
        data: { admin_notes: adminNotes },
      });
      onOpenChange(false);
      setAdminNotes('');
    } catch (error) {
      console.error('Error approving request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);
    try {
      await rejectGroceryRequest({
        id: request.id,
        data: {
          rejection_reason: rejectionReason,
          admin_notes: adminNotes,
        },
      });
      onOpenChange(false);
      setRejectionReason('');
      setAdminNotes('');
      setShowRejectForm(false);
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isPending = request.status === 'pending';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stationary Request Details</DialogTitle>
          <DialogDescription>
            Review and process this stationary request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <Badge className={getStatusColor(request.status)}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </Badge>
          </div>

          <Separator />

          {/* Request Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Staff Name</label>
                <p className="text-sm">{request.staff_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Branch</label>
                <p className="text-sm">{request.branch}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Requested Date</label>
                <p className="text-sm">
                  {format(new Date(request.requested_date), 'PPP p')}
                </p>
              </div>
              {request.approved_at && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {request.status === 'approved' ? 'Approved' : 'Rejected'} Date
                  </label>
                  <p className="text-sm">
                    {format(new Date(request.approved_at), 'PPP p')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Requested Items</h3>
              <span className="text-sm text-gray-500">
                {request.items?.length || 0} item(s)
              </span>
            </div>

            {request.items && request.items.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {request.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.item_name}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">₹{item.unit_price.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">₹{item.total_amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No items found for this request.
              </div>
            )}
          </div>

          {/* Total Amount */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Total Request Amount</span>
              <span className="text-2xl font-bold text-green-600">
                ₹{(request.total_request_amount || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Notes */}
          {request.notes && (
            <div>
              <label className="text-sm font-medium text-gray-500">Staff Notes</label>
              <p className="text-sm mt-1 p-3 bg-gray-50 rounded-lg">
                {request.notes}
              </p>
            </div>
          )}

          <Separator />

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
            <Textarea
              id="admin-notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add any additional notes or comments..."
              rows={3}
            />
          </div>

          {/* Rejection Form */}
          {showRejectForm && (
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                rows={3}
                required
              />
            </div>
          )}

          {/* Action Buttons */}
          {isPending && (
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Approve Request
              </Button>
              
              <Button
                onClick={() => setShowRejectForm(!showRejectForm)}
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {showRejectForm ? 'Cancel Reject' : 'Reject Request'}
              </Button>
            </div>
          )}

          {/* Reject Button (when form is shown) */}
          {showRejectForm && (
            <Button
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Confirm Rejection
            </Button>
          )}

          {/* Admin Response (for approved/rejected requests) */}
          {(request.admin_notes || request.rejection_reason) && (
            <div>
              <label className="text-sm font-medium text-gray-500">
                {request.status === 'rejected' ? 'Rejection Reason' : 'Admin Notes'}
              </label>
              <p className="text-sm mt-1 p-3 bg-gray-50 rounded-lg">
                {request.rejection_reason || request.admin_notes}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}