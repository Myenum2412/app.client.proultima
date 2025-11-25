'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileDown, Calendar, ShoppingCart, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { exportPurchaseReport } from '@/lib/pdf/exportPurchaseReport';
import { toast } from 'sonner';
import type { PurchaseRequisition } from '@/types/maintenance';

interface PurchaseReportTableProps {
  requests: PurchaseRequisition[];
}

export function PurchaseReportTable({ requests }: PurchaseReportTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter requests based on selected status
  const filteredRequests = requests.filter(request => {
    return statusFilter === 'all' || request.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleExportPDF = async () => {
    // console.log('Filtered requests before export:', filteredRequests);
    // console.log('Filtered requests count:', filteredRequests.length);
    
    if (filteredRequests.length === 0) {
      toast.error('No purchase requests to export. Please adjust filters.');
      return;
    }
    
    try {
      // console.log(`Exporting ${filteredRequests.length} purchase requests`);
      await exportPurchaseReport(filteredRequests);
    } catch (error) {
      console.error('Failed to export purchase report:', error);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No purchase requests</h3>
        <p className="text-muted-foreground">
          You haven't submitted any purchase requisitions yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Export */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleExportPDF} className="w-full sm:w-auto">
          <FileDown className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>S.No</TableHead>
              <TableHead>Purchase Item</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested Date</TableHead>
              <TableHead>Admin Response</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((request, index) => (
              <TableRow key={request.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium">{request.purchase_item}</TableCell>
                <TableCell className="max-w-xs truncate">{request.description || '-'}</TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(request.requested_date), 'MMM dd, yyyy')}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs">
                  {request.admin_notes && (
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1 mb-1">
                        <MessageSquare className="h-3 w-3" />
                        <span className="font-medium">Notes:</span>
                      </div>
                      <div className="text-xs bg-muted p-2 rounded">
                        {request.admin_notes}
                      </div>
                    </div>
                  )}
                  {request.rejection_reason && (
                    <div className="text-sm text-red-600">
                      <div className="flex items-center gap-1 mb-1">
                        <MessageSquare className="h-3 w-3" />
                        <span className="font-medium">Reason:</span>
                      </div>
                      <div className="text-xs bg-red-50 text-red-800 p-2 rounded border border-red-200">
                        {request.rejection_reason}
                      </div>
                    </div>
                  )}
                  {!request.admin_notes && !request.rejection_reason && (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredRequests.length} of {requests.length} purchase requests
      </div>
    </div>
  );
}
