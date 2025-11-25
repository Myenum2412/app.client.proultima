'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, CheckCircle2, Clock, XCircle, Eye } from 'lucide-react';
import { TaskStaffFilter } from '@/components/tasks/task-staff-filter';
import { DownloadPurchasePDF } from '@/components/purchase/download-purchase-pdf';
import { VerifyProductDialog } from '@/components/admin/verify-product-dialog';
import { usePurchaseRequisitions } from '@/hooks/use-purchase-requisitions';
import { useAuth } from '@/contexts/auth-context';
import type { PurchaseRequisition } from '@/types/maintenance';
import { EmployeeDetailsDialog } from './employee-details-dialog';
import { useStaff } from '@/hooks/use-staff';

interface PurchaseReportTableProps {
  requisitions: PurchaseRequisition[];
  isLoading: boolean;
}

export function PurchaseReportTable({ requisitions, isLoading }: PurchaseReportTableProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState<string | 'all'>('all');
  const [selectedRequisition, setSelectedRequisition] = useState<PurchaseRequisition | null>(null);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  
  const { verifyProduct, isVerifying } = usePurchaseRequisitions();
  const { user } = useAuth();
  const { staff } = useStaff();
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Apply filters
  const filteredRequisitions = requisitions.filter(req => {
    const statusMatch = statusFilter === 'all' || req.status === statusFilter;
    const branchMatch = branchFilter === 'all' || req.branch === branchFilter;
    const staffMatch = staffFilter === 'all' || req.staff_id === staffFilter;
    return statusMatch && branchMatch && staffMatch;
  });

  // Get unique branches
  const uniqueBranches = Array.from(new Set(requisitions.map(r => r.branch).filter(Boolean)));

  const handleVerifyProduct = (approve: boolean, verification_notes?: string) => {
    if (!selectedRequisition || !user?.id) return;
    
    verifyProduct({
      id: selectedRequisition.id,
      verified_by: user.id,
      verification_notes,
      approve,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'verification_pending':
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            <Clock className="h-3 w-3 mr-1" />
            Waiting for Product Upload
          </Badge>
        );
      case 'awaiting_final_verification':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending Verification
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed ✓
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4 max-sm:mx-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verification_pending">Waiting for Product Upload</SelectItem>
            <SelectItem value="awaiting_final_verification">Pending Verification</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {uniqueBranches.map(branch => (
              <SelectItem key={branch} value={branch}>
                {branch}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <TaskStaffFilter 
          value={staffFilter} 
          onValueChange={setStaffFilter} 
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredRequisitions.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No purchase requisitions found</h3>
            <p className="text-muted-foreground">
              {requisitions.length === 0
                ? 'No purchase requisitions have been submitted yet'
                : 'No requisitions match the selected filters'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Requested Date</TableHead>
                <TableHead>Staff Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Purchase Item</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verify</TableHead>
                <TableHead>View Details</TableHead>
                <TableHead>Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequisitions.map((req, index) => (
                <TableRow key={req.id} className="hover:bg-muted/50">
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{format(new Date(req.requested_date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="font-medium">{req.staff?.name || 'Unknown'}</TableCell>
                  <TableCell>{req.designation}</TableCell>
                  <TableCell>{req.branch}</TableCell>
                  <TableCell>{req.purchase_item}</TableCell>
                  <TableCell>{getStatusBadge(req.status)}</TableCell>
                  <TableCell>
                    {req.status === 'awaiting_final_verification' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRequisition(req);
                          setIsVerifyDialogOpen(true);
                        }}
                        disabled={isVerifying}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Verify Product
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedStaffId(req.staff_id);
                        setIsDetailsDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </TableCell>
                  <TableCell>
                    <DownloadPurchasePDF requisition={req} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredRequisitions.length} of {requisitions.length} purchase requisitions
      </div>

      {/* Verify Product Dialog */}
      {selectedRequisition && (
        <VerifyProductDialog
          requisition={selectedRequisition}
          isOpen={isVerifyDialogOpen}
          onOpenChange={setIsVerifyDialogOpen}
          onVerify={handleVerifyProduct}
          isVerifying={isVerifying}
        />
      )}

      {/* Employee Details Dialog */}
      {selectedStaffId && staff.find(s => s.id === selectedStaffId) && (
        <EmployeeDetailsDialog
          isOpen={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          staff={staff.find(s => s.id === selectedStaffId)!}
          dateRange={30}
        />
      )}
    </div>
  );
}

