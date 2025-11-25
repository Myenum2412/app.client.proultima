'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, CheckCircle2, Clock, XCircle, Eye } from 'lucide-react';
import { TaskStaffFilter } from '@/components/tasks/task-staff-filter';
import { DownloadMaintenancePDF } from '@/components/maintenance/download-maintenance-pdf';
import type { MaintenanceRequest } from '@/types/maintenance';
import { EmployeeDetailsDialog } from './employee-details-dialog';
import { useStaff } from '@/hooks/use-staff';

interface MaintenanceReportTableProps {
  requests: MaintenanceRequest[];
  isLoading: boolean;
}

export function MaintenanceReportTable({ requests, isLoading }: MaintenanceReportTableProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState<string | 'all'>('all');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const { staff } = useStaff();

  // Apply filters
  const filteredRequests = requests.filter(request => {
    const statusMatch = statusFilter === 'all' || request.status === statusFilter;
    const branchMatch = branchFilter === 'all' || request.branch === branchFilter;
    const staffMatch = staffFilter === 'all' || request.staff_id === staffFilter;
    return statusMatch && branchMatch && staffMatch;
  });

  // Get unique branches
  const uniqueBranches = Array.from(new Set(requests.map(r => r.branch).filter(Boolean)));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
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

  const getRunningStatusBadge = (status: string) => {
    return status === 'running' ? (
      <Badge variant="default" className="bg-green-100 text-green-800">Running</Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-100 text-red-800">Not Running</Badge>
    );
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
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No maintenance requests found</h3>
            <p className="text-muted-foreground">
              {requests.length === 0
                ? 'No maintenance requests have been submitted yet'
                : 'No requests match the selected filters'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Staff Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Contact Name</TableHead>
                <TableHead>Contact Number</TableHead>
                <TableHead>Workstation</TableHead>
                <TableHead>Running Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested Date</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request, index) => (
                <TableRow key={request.id} className="hover:bg-muted/50">
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{request.staff?.name || 'Unknown'}</TableCell>
                  <TableCell>{request.branch}</TableCell>
                  <TableCell>{request.serial_number || '-'}</TableCell>
                  <TableCell>{request.brand_name || '-'}</TableCell>
                  <TableCell>{request.contact_name || '-'}</TableCell>
                  <TableCell>{request.contact_number || '-'}</TableCell>
                  <TableCell>{request.workstation_number || '-'}</TableCell>
                  <TableCell>{getRunningStatusBadge(request.running_status)}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>{format(new Date(request.requested_date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedStaffId(request.staff_id);
                        setIsDetailsDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </TableCell>
                  <TableCell>
                    <DownloadMaintenancePDF request={request} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredRequests.length} of {requests.length} maintenance requests
      </div>

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

