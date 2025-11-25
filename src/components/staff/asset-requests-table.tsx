'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, Image as ImageIcon, Pencil, Trash2, Monitor, Clock, CheckCircle2, XCircle, MoreVertical, Archive, Wrench, Maximize2, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { useMemo } from 'react';
import type { AssetRequest } from '@/types/index';
import { DownloadAssetPDF } from '@/components/asset/download-asset-pdf';
import { generateAssetNumbersForRequests } from '@/lib/asset-number-utils';

interface AssetRequestsTableProps {
  assetRequests: AssetRequest[];
  isLoading?: boolean;
  onEditRequest?: (request: AssetRequest) => void;
  onDeleteRequest?: (id: string) => void;
  onMoveToScrap?: (request: AssetRequest) => void;
  onMoveToMaintenance?: (request: AssetRequest) => void;
  startIndex?: number;
}

export function AssetRequestsTable({ assetRequests, isLoading, onEditRequest, onDeleteRequest, onMoveToScrap, onMoveToMaintenance, startIndex = 0 }: AssetRequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<AssetRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Generate asset numbers for requests that don't have them
  const assetNumberMap = useMemo(() => {
    return generateAssetNumbersForRequests(assetRequests);
  }, [assetRequests]);

  const handleViewDetails = (request: AssetRequest) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
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
        <Monitor className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No asset requests yet</h3>
        <p className="text-muted-foreground">
          You haven't submitted any asset requests yet
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
              <TableHead>Type</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested Date</TableHead>
              <TableHead>Images</TableHead>
              <TableHead>Actions</TableHead>
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
                <TableCell>
                  <Badge variant={request.request_type === 'system' ? 'default' : 'secondary'}>
                    {request.request_type === 'system' ? 'System' : 'Common'}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{request.product_name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{request.quantity}</Badge>
                </TableCell>
                <TableCell>
                  {request.request_type === 'system' ? getConditionBadge(request.condition || 'new') : '-'}
                </TableCell>
                <TableCell>
                  {getStatusBadge(request.status)}
                </TableCell>
                <TableCell>{format(new Date(request.requested_date), 'MMM dd, yyyy')}</TableCell>
                <TableCell>
                  {request.image_urls && request.image_urls.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <ImageIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {request.image_urls.length}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2 justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onMoveToMaintenance && request.status === 'approved' && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onMoveToMaintenance(request);
                          }}>
                            <Wrench className="mr-2 h-4 w-4" />
                            Move to Maintenance
                          </DropdownMenuItem>
                        )}
                        {onMoveToScrap && request.status === 'approved' && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onMoveToScrap(request);
                          }}>
                            <Archive className="mr-2 h-4 w-4" />
                            Move to Scrape
                          </DropdownMenuItem>
                        )}
                        {onEditRequest && request.status === 'pending' && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onEditRequest(request);
                          }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {onDeleteRequest && request.status === 'pending' && (
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteRequest(request.id);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DownloadAssetPDF request={request} />
                  </div>
                </TableCell>
              </TableRow>
            );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Asset Request Details</DialogTitle>
            <DialogDescription>
              Complete information about this asset request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Product Name</label>
                  <p className="text-lg font-medium">{selectedRequest.product_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Quantity</label>
                  <p className="text-lg font-medium">{selectedRequest.quantity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Condition</label>
                  <div className="mt-1">
                    {getConditionBadge(selectedRequest.condition || 'new')}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              {selectedRequest.additional_notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Additional Notes</label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-md">
                    {selectedRequest.additional_notes}
                  </p>
                </div>
              )}

              {/* Images */}
              {selectedRequest.image_urls && selectedRequest.image_urls.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Images</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {selectedRequest.image_urls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Asset image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md border cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setSelectedImage(url)}
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(url);
                          }}
                        >
                          <Maximize2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Response */}
              {selectedRequest.status !== 'pending' && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Admin Response</h4>
                  {selectedRequest.admin_notes && (
                    <div className="mb-2">
                      <label className="text-sm font-medium text-gray-500">Admin Notes</label>
                      <p className="mt-1 p-3 bg-blue-50 rounded-md">
                        {selectedRequest.admin_notes}
                      </p>
                    </div>
                  )}
                  {selectedRequest.rejection_reason && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Rejection Reason</label>
                      <p className="mt-1 p-3 bg-red-50 rounded-md text-red-700">
                        {selectedRequest.rejection_reason}
                      </p>
                    </div>
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    {selectedRequest.status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
                    {selectedRequest.approved_at && 
                      new Date(selectedRequest.approved_at).toLocaleDateString()
                    }
                  </div>
                </div>
              )}

              {/* Request Info */}
              <div className="border-t pt-4 text-sm text-gray-500">
                <p>Requested on: {new Date(selectedRequest.requested_date).toLocaleDateString()}</p>
                <p>Request ID: {selectedRequest.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={selectedImage !== null} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative w-full flex flex-col gap-3 px-6 pb-6">
              <div className="relative w-full h-[70vh] bg-muted rounded-md overflow-hidden">
                <img
                  src={selectedImage}
                  alt="Full size preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={selectedImage} target="_blank" rel="noopener noreferrer">
                    <Eye className="h-4 w-4 mr-2" />
                    Open in new tab
                  </a>
                </Button>
                <Button asChild size="sm">
                  <a href={selectedImage} download>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
