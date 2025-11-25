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
import { Card } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { ScrapRequest } from '@/types/scrap';
import { format } from 'date-fns';
import { DownloadScrapPDF } from '@/components/scrap/download-scrap-pdf';

interface ScrapReportTableProps {
  scrapRequests: ScrapRequest[];
}

export function ScrapReportTable({ scrapRequests }: ScrapReportTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scrapStatusFilter, setScrapStatusFilter] = useState<string>('all');

  const filteredRequests = useMemo(() => {
    return scrapRequests.filter((request) => {
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesScrapStatus =
        scrapStatusFilter === 'all' || request.scrap_status === scrapStatusFilter;
      return matchesStatus && matchesScrapStatus;
    });
  }, [scrapRequests, statusFilter, scrapStatusFilter]);

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

        <Select value={scrapStatusFilter} onValueChange={setScrapStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by scrap status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scrap Status</SelectItem>
            <SelectItem value="working">Working</SelectItem>
            <SelectItem value="damaged">Damaged</SelectItem>
            <SelectItem value="beyond_repair">Beyond Repair</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">S.No</TableHead>
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
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No scrap requests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request, index) => (
                  <TableRow key={request.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{request.brand_name}</TableCell>
                    <TableCell>{request.workstation_number}</TableCell>
                    <TableCell>{request.serial_number}</TableCell>
                    <TableCell>{getScrapStatusBadge(request.scrap_status)}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {format(new Date(request.requested_date), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DownloadScrapPDF request={request} />
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
