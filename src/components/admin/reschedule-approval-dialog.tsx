'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useTaskReschedules } from '@/hooks/use-task-reschedules';
import { useAuth } from '@/contexts/auth-context';
import type { TaskReschedule } from '@/types';

interface RescheduleApprovalDialogProps {
  reschedule: TaskReschedule;
  trigger: React.ReactNode;
}

export function RescheduleApprovalDialog({ reschedule, trigger }: RescheduleApprovalDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { approveReschedule, rejectReschedule, isApproving, isRejecting } = useTaskReschedules();
  const { user } = useAuth();

  const handleApprove = async () => {
    if (!user?.id) return;

    setIsProcessing(true);
    try {
      await approveReschedule({
        id: reschedule.id,
        adminId: user.id,
        response: adminResponse.trim() || undefined,
      });
      setIsOpen(false);
      setAdminResponse('');
    } catch (error) {
      console.error('Error approving reschedule:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!user?.id || !adminResponse.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);
    try {
      await rejectReschedule({
        id: reschedule.id,
        adminId: user.id,
        response: adminResponse.trim(),
      });
      setIsOpen(false);
      setAdminResponse('');
    } catch (error) {
      console.error('Error rejecting reschedule:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Reschedule Request Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Task Information */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Task Information</Label>
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="font-medium">{reschedule.task?.title}</div>
              {reschedule.task?.task_no && (
                <div className="text-sm text-muted-foreground">#{reschedule.task.task_no}</div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Requested by:</span>
                <span className="font-medium">{reschedule.staff?.name}</span>
              </div>
            </div>
          </div>

          {/* Reschedule Details */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Reschedule Details</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Original Due Date</Label>
                <div className="p-3 bg-muted rounded-md">
                  {reschedule.original_due_date ? format(new Date(reschedule.original_due_date), 'PPP') : 'Not set'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Requested New Date</Label>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  {format(new Date(reschedule.requested_new_date), 'PPP')}
                </div>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Reason for Rescheduling</Label>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{reschedule.reason}</p>
            </div>
          </div>

          {/* Current Status */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Current Status</Label>
            <div className="flex items-center gap-2">
              {getStatusBadge(reschedule.status)}
              <span className="text-sm text-muted-foreground">
                Requested on {format(new Date(reschedule.created_at), 'PPP')}
              </span>
            </div>
          </div>

          {/* Admin Response (if already responded) */}
          {reschedule.status !== 'pending' && reschedule.admin_response && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Admin Response</Label>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">{reschedule.admin_response}</p>
                {reschedule.responded_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Responded on {format(new Date(reschedule.responded_at), 'PPP')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Admin Actions (only for pending requests) */}
          {reschedule.status === 'pending' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-response">Admin Response (Optional)</Label>
                <Textarea
                  id="admin-response"
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Add any additional notes or feedback..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isProcessing}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isProcessing || isRejecting}
                >
                  {isRejecting ? 'Rejecting...' : 'Reject Request'}
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={isProcessing || isApproving}
                >
                  {isApproving ? 'Approving...' : 'Approve Request'}
                </Button>
              </div>
            </div>
          )}

          {/* View Only for Non-Pending */}
          {reschedule.status !== 'pending' && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
