'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, User, MapPin, Calendar, Package, Clock, Eye, Download, FileText, File, Archive, Building, Briefcase, Maximize2 } from 'lucide-react';
import type { PurchaseRequisition } from '@/types/maintenance';
import { format } from 'date-fns';

interface PurchaseRequisitionViewDialogProps {
  requisition: PurchaseRequisition;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseRequisitionViewDialog({ requisition, isOpen, onOpenChange }: PurchaseRequisitionViewDialogProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'image';
    if (['pdf'].includes(ext || '')) return 'pdf';
    if (['doc', 'docx'].includes(ext || '')) return 'doc';
    if (['xls', 'xlsx'].includes(ext || '')) return 'excel';
    if (['zip', 'rar', '7z'].includes(ext || '')) return 'zip';
    return 'file';
  };

  const getStatusBadge = () => {
    switch (requisition.status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'verification_pending':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800"><Clock className="h-3 w-3 mr-1" />Waiting for Product Upload</Badge>;
      case 'awaiting_final_verification':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Pending Verification</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed ✓</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{requisition.status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Purchase Requisition Details</DialogTitle>
          <DialogDescription>
            View your purchase requisition details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Request Status</h3>
              <div className="mt-2">{getStatusBadge()}</div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">Requested On</p>
              <p className="text-sm">{format(new Date(requisition.requested_date), 'PPp')}</p>
            </div>
          </div>

          <Separator />

          {/* Staff Information */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Your Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="font-medium">{requisition.name}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Designation</Label>
                <p className="font-medium">{requisition.designation}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Department</Label>
                <p className="font-medium flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {requisition.department}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Branch</Label>
                <p className="font-medium flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {requisition.branch}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Purchase Details */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Purchase Details
            </h3>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Purchase Item</Label>
                <p className="text-sm text-muted-foreground mt-1">{requisition.purchase_item}</p>
              </div>
              {requisition.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">{requisition.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quotation Files */}
          {requisition.quotation_urls && requisition.quotation_urls.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Quotation Files ({requisition.quotation_urls.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {requisition.quotation_urls.map((url, index) => {
                    const fileType = getFileIcon(url);
                    const fileName = url.split('/').pop() || `File ${index + 1}`;
                    const isImage = fileType === 'image';
                    
                    return (
                      <Card key={index} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 relative group">
                              {isImage ? (
                                <>
                                  <img 
                                    src={url} 
                                    alt={`Quotation ${index + 1}`}
                                    className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => setSelectedImage(url)}
                                  />
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-md h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedImage(url);
                                    }}
                                  >
                                    <Maximize2 className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : (
                                <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                                  {fileType === 'pdf' && <FileText className="h-8 w-8 text-red-500" />}
                                  {fileType === 'doc' && <File className="h-8 w-8 text-blue-500" />}
                                  {fileType === 'excel' && <File className="h-8 w-8 text-green-500" />}
                                  {fileType === 'zip' && <Archive className="h-8 w-8 text-orange-500" />}
                                  {fileType === 'file' && <File className="h-8 w-8 text-gray-500" />}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{fileName}</p>
                              <div className="flex gap-2 mt-2">
                                {isImage ? (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedImage(url)}
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      Preview
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.download = fileName;
                                        link.click();
                                      }}
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(url, '_blank')}
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      View
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.download = fileName;
                                        link.click();
                                      }}
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Product Details (if uploaded) */}
          {requisition.product_name && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Product Details
                  </h3>
                  {requisition.request_type && (
                    <Badge variant={requisition.request_type === 'system' ? 'default' : 'secondary'}>
                      {requisition.request_type === 'system' ? 'System' : 'Common'}
                    </Badge>
                  )}
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Product Name</Label>
                      <p className="font-medium">{requisition.product_name}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Brand</Label>
                      <p className="font-medium">{requisition.brand_name || '-'}</p>
                    </div>
                    {requisition.serial_no && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Serial Number</Label>
                        <p className="font-medium">{requisition.serial_no}</p>
                      </div>
                    )}
                    {requisition.warranty && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Warranty</Label>
                        <p className="font-medium">{requisition.warranty}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs text-muted-foreground">Condition</Label>
                      <p className="font-medium capitalize">{requisition.condition?.replace('_', ' ') || '-'}</p>
                    </div>
                    {requisition.request_type === 'system' && (
                      <div>
                        <Label className="text-xs text-muted-foreground">User Name</Label>
                        <p className="font-medium">{requisition.user_name || '-'}</p>
                      </div>
                    )}
                    {requisition.request_type === 'common' && requisition.shop_contact && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Shop Contact</Label>
                        <p className="font-medium">{requisition.shop_contact}</p>
                      </div>
                    )}
                    {requisition.request_type === 'common' && requisition.quantity && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Quantity</Label>
                        <p className="font-medium">{requisition.quantity}</p>
                      </div>
                    )}
                    {requisition.request_type === 'common' && requisition.price !== undefined && requisition.price !== null && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Price</Label>
                        <p className="font-medium">₹{requisition.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    )}
                    {requisition.remote_id && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Remote ID</Label>
                        <p className="font-medium">{requisition.remote_id}</p>
                      </div>
                    )}
                    {requisition.specification && (
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Specification</Label>
                        <p className="font-medium mt-1">{requisition.specification}</p>
                      </div>
                    )}
                  </div>
                  {requisition.product_uploaded_at && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Uploaded on {format(new Date(requisition.product_uploaded_at), 'PPp')}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Product Images */}
              {requisition.product_image_urls && requisition.product_image_urls.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Product Photos ({requisition.product_image_urls.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {requisition.product_image_urls.map((url, index) => (
                      <Card key={index} className="overflow-hidden">
                        <CardContent className="p-0 relative group">
                          <img
                            src={url}
                            alt={`Product ${index + 1}`}
                            className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity"
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
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Admin Response */}
          {(requisition.admin_notes || requisition.rejection_reason || requisition.verification_notes || requisition.proof_rejection_reason) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Admin Response</h3>
                <div className="p-4 bg-muted rounded-lg">
                  {requisition.admin_notes && (
                    <div className="mb-2">
                      <Label className="text-sm font-medium">Notes</Label>
                      <p className="text-sm text-muted-foreground mt-1">{requisition.admin_notes}</p>
                    </div>
                  )}
                  {requisition.verification_notes && (
                    <div className="mb-2">
                      <Label className="text-sm font-medium">Verification Notes</Label>
                      <p className="text-sm text-muted-foreground mt-1">{requisition.verification_notes}</p>
                    </div>
                  )}
                  {requisition.rejection_reason && (
                    <div className="mb-2">
                      <Label className="text-sm font-medium text-destructive">Rejection Reason</Label>
                      <p className="text-sm text-destructive mt-1">{requisition.rejection_reason}</p>
                    </div>
                  )}
                  {requisition.proof_rejection_reason && (
                    <div>
                      <Label className="text-sm font-medium text-destructive">Product Rejection Reason</Label>
                      <p className="text-sm text-destructive mt-1">{requisition.proof_rejection_reason}</p>
                    </div>
                  )}
                  {requisition.approved_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Responded on {format(new Date(requisition.approved_at), 'PPp')}
                    </p>
                  )}
                  {requisition.verified_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Verified on {format(new Date(requisition.verified_at), 'PPp')}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>

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
    </Dialog>
  );
}

