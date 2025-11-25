'use client';

import { useState, useMemo } from 'react';
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
import { Card } from '@/components/ui/card';
import { TaskStaffFilter } from '@/components/tasks/task-staff-filter';
import { Eye } from 'lucide-react';
import { ScrapRequest } from '@/types/scrap';
import { format } from 'date-fns';
import { DownloadScrapPDF } from '@/components/scrap/download-scrap-pdf';

interface AdminScrapReportTableProps {
  scrapRequests: ScrapRequest[];
  onViewDetails: (request: ScrapRequest) => void;
}

export function AdminScrapReportTable({
  scrapRequests,
  onViewDetails,
}: AdminScrapReportTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scrapStatusFilter, setScrapStatusFilter] = useState<string>('all');
  const [submitterTypeFilter, setSubmitterTypeFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [staffFilter, setStaffFilter] = useState<string | 'all'>('all');

  // Get unique branches
  const branches = useMemo(() => {
    const uniqueBranches = Array.from(new Set(scrapRequests.map((r) => r.branch)));
    return uniqueBranches.sort();
  }, [scrapRequests]);

  const filteredRequests = useMemo(() => {
    return scrapRequests.filter((request) => {
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesScrapStatus =
        scrapStatusFilter === 'all' || request.scrap_status === scrapStatusFilter;
      const matchesSubmitterType =
        submitterTypeFilter === 'all' || request.submitter_type === submitterTypeFilter;
      const matchesBranch = branchFilter === 'all' || request.branch === branchFilter;
      const matchesStaff = staffFilter === 'all' || request.staff_id === staffFilter;
      return matchesStatus && matchesScrapStatus && matchesSubmitterType && matchesBranch && matchesStaff;
    });
  }, [scrapRequests, statusFilter, scrapStatusFilter, submitterTypeFilter, branchFilter, staffFilter]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getScrapStatusBadge = (scrapStatus: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      working: 'default',
      damaged: 'secondary',
      beyond_repair: 'destructive',
    };
    const labels: Record<string, string> = {
      working: 'Working',
      damaged: 'Damaged',
      beyond_repair: 'Beyond Repair',
    };
    return (
      <Badge variant={variants[scrapStatus] || 'outline'}>
        {labels[scrapStatus] || scrapStatus}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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

        <Select value={scrapStatusFilter} onValueChange={setScrapStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by scrap status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scrap Status</SelectItem>
            <SelectItem value="working">Working</SelectItem>
            <SelectItem value="damaged">Damaged</SelectItem>
            <SelectItem value="beyond_repair">Beyond Repair</SelectItem>
          </SelectContent>
        </Select>

        <Select value={submitterTypeFilter} onValueChange={setSubmitterTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by submitter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Submitters</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
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

        <TaskStaffFilter 
          value={staffFilter} 
          onValueChange={setStaffFilter} 
        />
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">S.No</TableHead>
                <TableHead>Submitter</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Workstation</TableHead>
                <TableHead>Serial No.</TableHead>
                <TableHead>Scrap Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground">
                    No scrap requests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request, index) => (
                  <TableRow key={request.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{request.submitter_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {request.submitter_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{request.branch}</TableCell>
                    <TableCell>{request.brand_name}</TableCell>
                    <TableCell>{request.workstation_number}</TableCell>
                    <TableCell>{request.serial_number}</TableCell>
                    <TableCell>{getScrapStatusBadge(request.scrap_status)}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {format(new Date(request.requested_date), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails(request)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DownloadScrapPDF request={request} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}


