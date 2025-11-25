"use client"

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Settings, 
  MapPin, 
  Briefcase, 
  Calendar,
  FileText,
  AlertCircle
} from 'lucide-react';
import type { MaintenanceRequest } from '@/types/maintenance';

interface MaintenanceDetailsDialogProps {
  request: MaintenanceRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaintenanceDetailsDialog({
  request,
  open,
  onOpenChange,
}: MaintenanceDetailsDialogProps) {
  if (!request) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRunningStatusBadge = (status: string) => {
    return status === 'running' ? (
      <Badge variant="default" className="bg-green-100 text-green-800">Running</Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-100 text-red-800">Not Running</Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl md:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Settings className="h-5 w-5 text-primary" />
            Maintenance Request Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* System Record Details */}
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              {/* Desktop: 3 columns, Mobile: 2 columns */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                {/* Row 1 - Column 1: Serial Number */}
                <div className="space-y-2 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Serial Number
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-foreground break-words">
                    {request.serial_number || <span className="text-muted-foreground italic font-normal">Not provided</span>}
                  </p>
                </div>

                {/* Row 1 - Column 2: Brand Name */}
                <div className="space-y-2 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Brand Name
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-foreground break-words">
                    {request.brand_name || <span className="text-muted-foreground italic font-normal">Not provided</span>}
                  </p>
                </div>

                {/* Row 1 - Column 3 (Desktop only): Workstation Number */}
                <div className="space-y-2 min-w-0 hidden md:block">
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Workstation Number
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-foreground break-words">
                    {request.workstation_number || <span className="text-muted-foreground italic font-normal">Not provided</span>}
                  </p>
                </div>

                {/* Row 2 - Column 1: Branch */}
                <div className="space-y-2 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Branch
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-1.5 break-words">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="min-w-0">{request.branch || <span className="text-muted-foreground italic font-normal">Not provided</span>}</span>
                  </p>
                </div>

                {/* Row 2 - Column 2: Condition */}
                <div className="space-y-2 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Condition
                  </p>
                  <div>
                    <Badge variant="outline" className="capitalize text-sm font-medium px-2.5 py-1">
                      {request.condition}
                    </Badge>
                  </div>
                </div>

                {/* Row 2 - Column 3 (Desktop only): Running Status */}
                <div className="space-y-2 min-w-0 hidden md:block">
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Running Status
                  </p>
                  <div>
                    {getRunningStatusBadge(request.running_status)}
                  </div>
                </div>

                {/* Row 3 (Mobile only) - Column 1: Workstation Number */}
                <div className="space-y-2 min-w-0 md:hidden">
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Workstation Number
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-foreground break-words">
                    {request.workstation_number || <span className="text-muted-foreground italic font-normal">Not provided</span>}
                  </p>
                </div>

                {/* Row 3 (Mobile only) - Column 2: Running Status */}
                <div className="space-y-2 min-w-0 md:hidden">
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Running Status
                  </p>
                  <div>
                    {getRunningStatusBadge(request.running_status)}
                  </div>
                </div>

                {/* Row 3 (Desktop) / Row 4 (Mobile) - Column 1: Approval Status */}
                <div className="space-y-2 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Approval Status
                  </p>
                  <div>
                    {getStatusBadge(request.status)}
                  </div>
                </div>

                {/* Row 3 (Desktop) / Row 4 (Mobile) - Column 2: Requested Date */}
                <div className="space-y-2 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Requested Date
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="min-w-0">{format(new Date(request.requested_date), 'MMM dd, yyyy')}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Response */}
          {(request.admin_notes || request.rejection_reason || request.approved_at) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Admin Response</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {request.admin_notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Admin Notes</p>
                    <p className="text-sm bg-muted p-3 rounded-md">{request.admin_notes}</p>
                  </div>
                )}
                {request.rejection_reason && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Rejection Reason</p>
                    <p className="text-sm bg-red-50 text-red-800 p-3 rounded-md border border-red-200">
                      {request.rejection_reason}
                    </p>
                  </div>
                )}
                {request.approved_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Approved Date</p>
                    <p className="text-sm font-medium text-green-700">
                      {format(new Date(request.approved_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

