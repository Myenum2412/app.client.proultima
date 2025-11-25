'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Image as ImageIcon, Clock, CheckCircle2, XCircle, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useMemo } from 'react';
import { AssetApprovalDialog } from './asset-approval-dialog';
import { DownloadAssetPDF } from '@/components/asset/download-asset-pdf';
import { generateAssetNumbersForRequests } from '@/lib/asset-number-utils';
import type { AssetRequest } from '@/types/index';

interface AssetRequestsTableProps {
  assetRequests: AssetRequest[];
  isLoading?: boolean;
  startIndex?: number;
}

export function AssetRequestsTable({ assetRequests, isLoading, startIndex = 0 }: AssetRequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<AssetRequest | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);

  // Generate asset numbers for requests that don't have them
  const assetNumberMap = useMemo(() => {
    return generateAssetNumbersForRequests(assetRequests);
  }, [assetRequests]);

  const handleViewDetails = (request: AssetRequest) => {
    setSelectedRequest(request);
    setApprovalDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 flex items-center gap-1 w-fit">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 flex items-center gap-1 w-fit">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
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

  // Filter requests by status
  const pendingRequests = assetRequests.filter(req => req.status === 'pending');
  const approvedRequests = assetRequests.filter(req => req.status === 'approved');
  const rejectedRequests = assetRequests.filter(req => req.status === 'rejected');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (assetRequests.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No asset requests yet</h3>
        <p className="text-muted-foreground">
          No asset requests have been submitted yet
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">S.No</TableHead>
              <TableHead>Asset Number</TableHead>
              <TableHead>Requested Date</TableHead>
              <TableHead>Staff Name</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Download</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assetRequests.map((request, index) => {
              const assetNumber = request.asset_number || assetNumberMap.get(request.id) || '-';
              return (
              <TableRow 
                key={request.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleViewDetails(request)}
              >
                <TableCell>{startIndex + index + 1}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {assetNumber}
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(request.requested_date), 'MMM dd, yyyy')}</TableCell>
                <TableCell className="font-medium">{request.staff_name}</TableCell>
                <TableCell>{request.branch}</TableCell>
                <TableCell>
                  <Badge variant={request.request_type === 'system' ? 'default' : 'secondary'}>
                    {request.request_type === 'system' ? 'System' : 'Common'}
                  </Badge>
                </TableCell>
                <TableCell>{request.product_name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{request.quantity}</Badge>
                </TableCell>
                <TableCell>
                  {request.request_type === 'system' ? getConditionBadge(request.condition || 'new') : '-'}
                </TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                  <DownloadAssetPDF request={request} />
                </TableCell>
              </TableRow>
            );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Approval Dialog */}
      <AssetApprovalDialog
        request={selectedRequest}
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
      />
    </>
  );
}
