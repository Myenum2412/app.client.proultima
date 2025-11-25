'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { GroceryRequest } from '@/types';
import { format } from 'date-fns';
import { TablePagination } from '@/components/ui/table-pagination';

interface GroceryReportTableProps {
  groceryRequests: GroceryRequest[];
  onViewDetails: (request: GroceryRequest) => void;
}

export function GroceryReportTable({
  groceryRequests,
  onViewDetails,
}: GroceryReportTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Get unique branches
  const branches = useMemo(() => {
    const uniqueBranches = Array.from(new Set(groceryRequests.map((r) => r.branch)));
    return uniqueBranches.sort();
  }, [groceryRequests]);

  const filteredRequests = useMemo(() => {
    return groceryRequests.filter((request) => {
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesBranch = branchFilter === 'all' || request.branch === branchFilter;
      return matchesStatus && matchesBranch;
    });
  }, [groceryRequests, statusFilter, branchFilter]);

  // Pagination logic
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, branchFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
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
          <SelectTrigger>
            <SelectValue placeholder="Filter by branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch} value={branch}>
                {branch}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">S.No</TableHead>
              <TableHead>Staff Name</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No stationary requests found
                </TableCell>
              </TableRow>
            ) : (
              paginatedRequests.map((request, index) => (
                <TableRow
                  key={request.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onViewDetails(request)}
                >
                  <TableCell>{startIndex + index + 1}</TableCell>
                  <TableCell className="font-medium">{request.staff_name}</TableCell>
                  <TableCell>{request.branch}</TableCell>
                  <TableCell className="font-medium">
                    {request.items && request.items.length > 0 ? (
                      <div>
                        <div className="font-semibold">
                          {request.items.length} item{request.items.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.items.slice(0, 2).map(item => item.item_name).join(', ')}
                          {request.items.length > 2 && ` +${request.items.length - 2} more`}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">No items</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ₹{(request.total_request_amount || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    {format(new Date(request.requested_date), 'dd MMM yyyy')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Controls */}
      {filteredRequests.length > 0 && (
        <TablePagination
          totalItems={filteredRequests.length}
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(newRowsPerPage) => {
            setRowsPerPage(newRowsPerPage);
            setCurrentPage(1);
          }}
          itemLabel="requests"
        />
      )}
    </div>
  );
}
