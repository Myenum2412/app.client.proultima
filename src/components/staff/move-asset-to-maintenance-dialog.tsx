'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AssetRequest } from '@/types/index';
import type { MaintenanceRunningStatus } from '@/types/maintenance';

interface MoveAssetToMaintenanceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  asset: AssetRequest | null;
  onSubmit: (data: {
    running_status: MaintenanceRunningStatus;
    remarks: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function MoveAssetToMaintenanceDialog({
  isOpen,
  onOpenChange,
  asset,
  onSubmit,
  isSubmitting = false,
}: MoveAssetToMaintenanceDialogProps) {
  const { user } = useAuth();
  const [runningStatus, setRunningStatus] = useState<MaintenanceRunningStatus>('not_running');
  const [remarks, setRemarks] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!asset) {
      toast.error('Asset information is missing');
      return;
    }

    if (!remarks.trim()) {
      toast.error('Please enter remarks');
      return;
    }

    try {
      await onSubmit({
        running_status: runningStatus,
        remarks: remarks.trim(),
      });

      // Reset form
      setRunningStatus('not_running');
      setRemarks('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting maintenance request:', error);
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRunningStatus('not_running');
      setRemarks('');
      onOpenChange(false);
    }
  };

  if (!asset) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Move Asset to Maintenance</DialogTitle>
          <DialogDescription>
            Provide details about the asset's current status. This information will be reviewed by admin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Asset Information Display */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Product Name</Label>
                <p className="font-medium">{asset.product_name}</p>
              </div>
              {asset.brand_name && (
                <div>
                  <Label className="text-xs text-muted-foreground">Brand</Label>
                  <p className="font-medium">{asset.brand_name}</p>
                </div>
              )}
              {asset.serial_no && (
                <div>
                  <Label className="text-xs text-muted-foreground">Serial Number</Label>
                  <p className="font-medium">{asset.serial_no}</p>
                </div>
              )}
              {asset.asset_number && (
                <div>
                  <Label className="text-xs text-muted-foreground">Asset Number</Label>
                  <p className="font-medium font-mono">{asset.asset_number}</p>
                </div>
              )}
            </div>
          </div>

          {/* Running Status */}
          <div className="space-y-3">
            <Label>Running Status *</Label>
            <RadioGroup
              value={runningStatus}
              onValueChange={(value) => setRunningStatus(value as MaintenanceRunningStatus)}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="running" id="running" />
                <Label htmlFor="running" className="cursor-pointer font-normal">
                  Running
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="not_running" id="not_running" />
                <Label htmlFor="not_running" className="cursor-pointer font-normal">
                  Not Running
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks *</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Describe the issue, maintenance needed, or any other relevant information..."
              rows={4}
              required
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This information will be visible to admin for review.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !remarks.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit for Review'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

