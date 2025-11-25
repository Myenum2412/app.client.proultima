'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Check, X, Image as ImageIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAssetRequests } from '@/hooks/use-asset-requests';
import type { AssetRequest } from '@/types/index';

const approvalSchema = z.object({
  admin_notes: z.string().optional(),
  rejection_reason: z.string().optional(),
});

type ApprovalData = z.infer<typeof approvalSchema>;

interface AssetApprovalDialogProps {
  request: AssetRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssetApprovalDialog({ request, open, onOpenChange }: AssetApprovalDialogProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const { updateAssetRequest } = useAssetRequests();

  const form = useForm<ApprovalData>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      admin_notes: '',
      rejection_reason: '',
    },
  });

  const handleApprove = async (data: ApprovalData) => {
    if (!request) return;

    try {
      setIsApproving(true);
      await updateAssetRequest({
        id: request.id,
        status: 'approved',
        admin_notes: data.admin_notes,
      });

      toast.success('Asset request approved successfully!');
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error approving asset request:', error);
      toast.error('Failed to approve asset request. Please try again.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (data: ApprovalData) => {
    if (!request) return;

    if (!data.rejection_reason?.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }

    try {
      setIsRejecting(true);
      await updateAssetRequest({
        id: request.id,
        status: 'rejected',
        rejection_reason: data.rejection_reason,
        admin_notes: data.admin_notes,
      });

      toast.success('Asset request rejected successfully!');
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error rejecting asset request:', error);
      toast.error('Failed to reject asset request. Please try again.');
    } finally {
      setIsRejecting(false);
    }
  };

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'new':
        return <Badge variant="default">New</Badge>;
      case 'refurbished':
        return <Badge variant="secondary">Refurbished</Badge>;
      case 'used':
        return <Badge variant="outline">Used</Badge>;
      default:
        return <Badge variant="secondary">{condition}</Badge>;
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asset Request Approval</DialogTitle>
          <DialogDescription>
            Review and approve or reject this asset request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Request Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Staff Name</label>
              <p className="text-lg font-medium">{request.staff_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Branch</label>
              <p className="text-lg font-medium">{request.branch}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Product Name</label>
              <p className="text-lg font-medium">{request.product_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Quantity</label>
              <p className="text-lg font-medium">{request.quantity}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Condition</label>
              <div className="mt-1">
                {getConditionBadge(request.condition || 'new')}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Requested Date</label>
              <p className="text-lg font-medium">
                {new Date(request.requested_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Additional Notes */}
          {request.additional_notes && (
            <div>
              <label className="text-sm font-medium text-gray-500">Additional Notes</label>
              <p className="mt-1 p-3 bg-gray-50 rounded-md">
                {request.additional_notes}
              </p>
            </div>
          )}

          {/* Images */}
          {request.image_urls && request.image_urls.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-500">Images</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {request.image_urls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Asset image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md border"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approval Form */}
          <Form {...form}>
            <form className="space-y-4">
              <FormField
                control={form.control}
                name="admin_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes or comments..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rejection_reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rejection Reason (Required for rejection)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide a reason for rejection..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={form.handleSubmit(handleReject)}
                  disabled={isRejecting || isApproving}
                >
                  {isRejecting ? (
                    <>
                      <X className="mr-2 h-4 w-4 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={form.handleSubmit(handleApprove)}
                  disabled={isApproving || isRejecting}
                >
                  {isApproving ? (
                    <>
                      <Check className="mr-2 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
