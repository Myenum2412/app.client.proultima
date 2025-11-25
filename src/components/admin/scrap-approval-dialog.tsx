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
import { CheckCircle2, XCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { ScrapRequest } from '@/types/scrap';
import { useScrapRequests } from '@/hooks/use-scrap-requests';
import { useAuth } from '@/contexts/auth-context';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Image from 'next/image';

interface ScrapApprovalDialogProps {
  request: ScrapRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScrapApprovalDialog({
  request,
  open,
  onOpenChange,
}: ScrapApprovalDialogProps) {
  const [adminResponse, setAdminResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { user } = useAuth();
  const { updateScrapRequest } = useScrapRequests();

  if (!request) return null;

  const handleApprove = async () => {
    if (!adminResponse.trim()) {
      toast.error('Please provide a response');
      return;
    }

    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    setIsProcessing(true);
    try {
      await updateScrapRequest.mutateAsync({
        id: request.id,
        data: {
          status: 'approved',
          admin_response: adminResponse,
          admin_approver_id: user.id,
        },
      });
      onOpenChange(false);
      setAdminResponse('');
    } catch (error) {
      console.error('Error approving request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!adminResponse.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    setIsProcessing(true);
    try {
      await updateScrapRequest.mutateAsync({
        id: request.id,
        data: {
          status: 'rejected',
          admin_response: adminResponse,
          admin_approver_id: user.id,
        },
      });
      onOpenChange(false);
      setAdminResponse('');
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getScrapStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      working: 'Working',
      damaged: 'Damaged',
      beyond_repair: 'Beyond Repair',
    };
    return labels[status] || status;
  };

  const getScrapStatusBadge = (scrapStatus: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      working: 'default',
      damaged: 'secondary',
      beyond_repair: 'destructive',
    };
    return (
      <Badge variant={variants[scrapStatus] || 'outline'}>
        {getScrapStatusLabel(scrapStatus)}
      </Badge>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Scrap Request</DialogTitle>
            <DialogDescription>
              Review the scrap request details and provide your response
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Submitter Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Submitted By</Label>
                <p className="font-medium">{request.submitter_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Submitter Type</Label>
                <p className="font-medium capitalize">{request.submitter_type}</p>
              </div>
            </div>

            <Separator />

            {/* Equipment Details */}
            <div className="space-y-3">
              <h4 className="font-semibold">Equipment Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Brand Name</Label>
                  <p className="font-medium">{request.brand_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Workstation Number</Label>
                  <p className="font-medium">{request.workstation_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">User Name</Label>
                  <p className="font-medium">{request.users_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Serial Number</Label>
                  <p className="font-medium">{request.serial_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Branch</Label>
                  <p className="font-medium">{request.branch}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Scrap Status</Label>
                  <div className="mt-1">{getScrapStatusBadge(request.scrap_status)}</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Request Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Requested Date</Label>
                <p className="font-medium">
                  {format(new Date(request.requested_date), 'dd MMM yyyy, hh:mm a')}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Current Status</Label>
                <p className="font-medium capitalize">{request.status}</p>
              </div>
            </div>

            {/* Images */}
            {request.images && request.images.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Attached Images ({request.images.length})
                  </Label>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                    {request.images.map((imageUrl, index) => (
                      <div
                        key={index}
                        className="relative group cursor-pointer"
                        onClick={() => setSelectedImage(imageUrl)}
                      >
                        <Image
                          src={imageUrl}
                          alt={`Scrap image ${index + 1}`}
                          width={150}
                          height={150}
                          className="w-full h-24 object-cover rounded-md border hover:border-primary transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Admin Response (if already responded) */}
            {request.admin_response && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Previous Admin Response</Label>
                  <p className="text-sm bg-muted p-3 rounded-md">{request.admin_response}</p>
                </div>
              </>
            )}

            {/* Admin Response Input */}
            {request.status === 'pending' && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="admin-response">
                    Admin Response <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="admin-response"
                    placeholder="Provide your response or reason..."
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      onOpenChange(false);
                      setAdminResponse('');
                    }}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isProcessing}
                  >
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button onClick={handleApprove} disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Image Preview</DialogTitle>
            </DialogHeader>
            <div className="relative w-full h-[70vh]">
              <Image
                src={selectedImage}
                alt="Full size preview"
                fill
                className="object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
