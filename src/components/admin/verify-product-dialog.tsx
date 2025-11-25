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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Image as ImageIcon, Calendar, User, Eye, Download, ChevronLeft, ChevronRight, FileText, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { PurchaseRequisition } from '@/types/maintenance';
import { useSignedReceiptUrls } from '@/hooks/use-signed-receipt-urls';

interface VerifyProductDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  requisition: PurchaseRequisition;
  onVerify: (approve: boolean, verification_notes?: string) => void;
  isVerifying?: boolean;
}

export function VerifyProductDialog({
  isOpen,
  onOpenChange,
  requisition,
  onVerify,
  isVerifying = false,
}: VerifyProductDialogProps) {
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'quotation' | 'product'>('quotation');

  // Fetch signed URLs for quotation images
  const { signedUrls: signedQuotationUrls = requisition.quotation_urls, isLoading: quotationLoading } = useSignedReceiptUrls(
    requisition.quotation_urls,
    { bucket: 'cash-receipts', enabled: isOpen && !!requisition.quotation_urls?.length }
  );

  // Fetch signed URLs for product images
  const { signedUrls: signedProductUrls = requisition.product_image_urls, isLoading: productLoading } = useSignedReceiptUrls(
    requisition.product_image_urls,
    { bucket: 'cash-receipts', enabled: isOpen && !!requisition.product_image_urls?.length }
  );

  const handleVerify = (approve: boolean) => {
    onVerify(approve, verificationNotes);
    setVerificationNotes('');
    onOpenChange(false);
  };

  const openImageViewer = () => {
    setIsImageViewerOpen(true);
    setSelectedImageIndex(null);
    setActiveTab(requisition.quotation_urls?.length ? 'quotation' : 'product');
  };

  const getFileType = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return 'pdf';
    return 'image';
  };

  const getCurrentImages = () => {
    if (activeTab === 'quotation') {
      return signedQuotationUrls || [];
    }
    return signedProductUrls || [];
  };

  const openFullSize = (index: number) => {
    setSelectedImageIndex(index);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    const images = getCurrentImages();
    if (!images.length || selectedImageIndex === null) return;
    
    if (direction === 'prev') {
      setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : images.length - 1);
    } else {
      setSelectedImageIndex(selectedImageIndex < images.length - 1 ? selectedImageIndex + 1 : 0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Verify Product Purchase
          </DialogTitle>
          <DialogDescription>
            Review the quotation and actual product images to verify the purchase.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Purchase Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3">Purchase Request Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Item:</span>
                <p className="font-medium">{requisition.purchase_item}</p>
              </div>
              <div>
                <span className="text-gray-500">Staff:</span>
                <p className="font-medium">{requisition.staff?.name || requisition.name}</p>
              </div>
              <div>
                <span className="text-gray-500">Branch:</span>
                <p className="font-medium">{requisition.branch}</p>
              </div>
              <div>
                <span className="text-gray-500">Department:</span>
                <p className="font-medium">{requisition.department}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Description:</span>
                <p className="font-medium">{requisition.description || '-'}</p>
              </div>
            </div>
          </div>

          {/* Quotation Images */}
          {requisition.quotation_urls && requisition.quotation_urls.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Quotation/Estimate Images ({requisition.quotation_urls.length})
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openImageViewer}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View 
                </Button>
              </div>
              {quotationLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {signedQuotationUrls?.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Quotation ${index + 1}`}
                        className="w-full h-40 object-cover rounded-md border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = requisition.quotation_urls?.[index] || '';
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Product Details */}
          {requisition.product_name && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Product Details</h4>
                {requisition.request_type && (
                  <Badge variant={requisition.request_type === 'system' ? 'default' : 'secondary'}>
                    {requisition.request_type === 'system' ? 'System' : 'Common'}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Product Name:</span>
                  <p className="font-medium">{requisition.product_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Brand:</span>
                  <p className="font-medium">{requisition.brand_name || '-'}</p>
                </div>
                {requisition.serial_no && (
                  <div>
                    <span className="text-gray-500">Serial Number:</span>
                    <p className="font-medium">{requisition.serial_no}</p>
                  </div>
                )}
                {requisition.warranty && (
                  <div>
                    <span className="text-gray-500">Warranty:</span>
                    <p className="font-medium">{requisition.warranty}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Condition:</span>
                  <p className="font-medium capitalize">{requisition.condition?.replace('_', ' ') || '-'}</p>
                </div>
                {requisition.request_type === 'system' && (
                  <div>
                    <span className="text-gray-500">User Name:</span>
                    <p className="font-medium">{requisition.user_name || '-'}</p>
                  </div>
                )}
                {requisition.request_type === 'common' && requisition.shop_contact && (
                  <div>
                    <span className="text-gray-500">Shop Contact:</span>
                    <p className="font-medium">{requisition.shop_contact}</p>
                  </div>
                )}
                {requisition.request_type === 'common' && requisition.quantity && (
                  <div>
                    <span className="text-gray-500">Quantity:</span>
                    <p className="font-medium">{requisition.quantity}</p>
                  </div>
                )}
                {requisition.request_type === 'common' && requisition.price !== undefined && requisition.price !== null && (
                  <div>
                    <span className="text-gray-500">Price:</span>
                    <p className="font-medium">₹{requisition.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                )}
                {requisition.remote_id && (
                  <div>
                    <span className="text-gray-500">Remote ID:</span>
                    <p className="font-medium">{requisition.remote_id}</p>
                  </div>
                )}
                {requisition.specification && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Specification:</span>
                    <p className="font-medium mt-1">{requisition.specification}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product Images */}
          {requisition.product_image_urls && requisition.product_image_urls.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Product Photos ({requisition.product_image_urls.length})
                  <Badge variant="secondary" className="ml-2">
                    Uploaded {requisition.product_uploaded_at && format(new Date(requisition.product_uploaded_at), 'MMM dd, yyyy')}
                  </Badge>
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openImageViewer}
                >
                  <Eye className="h-4 w-4 mr-2" />
                   
                </Button>
              </div>
              {productLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {signedProductUrls?.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Product ${index + 1}`}
                        className="w-full h-40 object-cover rounded-md border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = requisition.product_image_urls?.[index] || '';
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Verification Notes */}
          <div className="space-y-3">
            <Label htmlFor="verification_notes">Verification Notes</Label>
            <Textarea
              id="verification_notes"
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              placeholder="Add notes about the verification (optional)"
              rows={3}
            />
          </div>

          {/* Previous Rejection Reason */}
          {requisition.proof_rejection_reason && (
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Previous Rejection Reason</h4>
              <p className="text-red-700 text-sm">{requisition.proof_rejection_reason}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isVerifying}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => handleVerify(false)}
            disabled={isVerifying}
            className="min-w-[120px]"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button
            onClick={() => handleVerify(true)}
            disabled={isVerifying}
            className="min-w-[120px]"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </div>
      </DialogContent>

      {/* Image Viewer Dialog */}
      <Dialog open={isImageViewerOpen} onOpenChange={setIsImageViewerOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 border-b">
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              View 
            </DialogTitle>
            <DialogDescription>
              View quotation and product images in detail
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={(v) => {
              setActiveTab(v as 'quotation' | 'product');
              setSelectedImageIndex(null);
            }} className="h-full flex flex-col">
              <TabsList className="mx-6 mt-4">
                {requisition.quotation_urls && requisition.quotation_urls.length > 0 && (
                  <TabsTrigger value="quotation">
                    Quotation Images ({requisition.quotation_urls.length})
                  </TabsTrigger>
                )}
                {requisition.product_image_urls && requisition.product_image_urls.length > 0 && (
                  <TabsTrigger value="product">
                    Product Photos ({requisition.product_image_urls.length})
                  </TabsTrigger>
                )}
              </TabsList>

              {requisition.quotation_urls && requisition.quotation_urls.length > 0 && (
                <TabsContent value="quotation" className="flex-1 overflow-y-auto p-6 mt-0">
                  {quotationLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {signedQuotationUrls?.map((url, index) => {
                        const fileType = getFileType(url);
                        return (
                          <div key={index} className="relative group">
                            {fileType === 'pdf' ? (
                              <div className="aspect-square bg-muted rounded-lg flex flex-col items-center justify-center p-4 border-2 border-dashed cursor-pointer hover:border-primary transition-colors"
                                onClick={() => openFullSize(index)}>
                                <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                                <span className="text-xs text-muted-foreground">PDF Document</span>
                              </div>
                            ) : (
                              <img
                                src={url}
                                alt={`Quotation ${index + 1}`}
                                className="w-full h-48 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => openFullSize(index)}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = requisition.quotation_urls?.[index] || '';
                                }}
                              />
                            )}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `quotation-${index + 1}${url.endsWith('.pdf') ? '.pdf' : '.jpg'}`;
                                  link.click();
                                }}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              )}

              {requisition.product_image_urls && requisition.product_image_urls.length > 0 && (
                <TabsContent value="product" className="flex-1 overflow-y-auto p-6 mt-0">
                  {productLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {signedProductUrls?.map((url, index) => {
                        const fileType = getFileType(url);
                        return (
                          <div key={index} className="relative group">
                            {fileType === 'pdf' ? (
                              <div className="aspect-square bg-muted rounded-lg flex flex-col items-center justify-center p-4 border-2 border-dashed cursor-pointer hover:border-primary transition-colors"
                                onClick={() => openFullSize(index)}>
                                <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                                <span className="text-xs text-muted-foreground">PDF Document</span>
                              </div>
                            ) : (
                              <img
                                src={url}
                                alt={`Product ${index + 1}`}
                                className="w-full h-48 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => openFullSize(index)}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = requisition.product_image_urls?.[index] || '';
                                }}
                              />
                            )}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `product-${index + 1}${url.endsWith('.pdf') ? '.pdf' : '.jpg'}`;
                                  link.click();
                                }}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Full-size Image Viewer */}
          {selectedImageIndex !== null && (
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
              <div className="relative max-w-7xl max-h-full">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                  onClick={() => setSelectedImageIndex(null)}
                >
                  <X className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={() => navigateImage('prev')}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={() => navigateImage('next')}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
                {(() => {
                  const images = getCurrentImages();
                  const currentUrl = images[selectedImageIndex];
                  const fileType = currentUrl ? getFileType(currentUrl) : 'image';
                  
                  if (fileType === 'pdf') {
                    return (
                      <iframe
                        src={currentUrl}
                        className="w-full h-[90vh] border-none rounded-lg"
                        title="PDF Viewer"
                      />
                    );
                  }
                  return (
                    <img
                      src={currentUrl}
                      alt={`Image ${selectedImageIndex + 1}`}
                      className="max-w-full max-h-[90vh] object-contain rounded-lg"
                    />
                  );
                })()}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
                  {selectedImageIndex !== null && `${selectedImageIndex + 1} / ${getCurrentImages().length}`}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}




