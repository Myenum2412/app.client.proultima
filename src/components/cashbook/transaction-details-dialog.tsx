'use client';

import React, { useState, useMemo } from 'react';
import { pdf } from '@react-pdf/renderer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  Calendar,
  User,
  Building,
  FileText,
  Tag,
  DollarSign,
  Receipt,
  Image as ImageIcon,
  Edit,
  Trash2,
  X,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { CashTransaction } from '@/types/cashbook';
import { useSignedReceiptUrls } from '@/hooks/use-signed-receipt-urls';
import { TransactionPDFReceipt } from './transaction-pdf-receipt';

interface TransactionDetailsDialogProps {
  transaction: CashTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (transaction: CashTransaction) => void;
  onDelete?: (transaction: CashTransaction) => void;
}

export function TransactionDetailsDialog({
  transaction,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: TransactionDetailsDialogProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const { signedUrls: signedAttachments = transaction?.attachment_urls, isLoading: attachmentsLoading, error: attachmentError } = useSignedReceiptUrls(transaction?.attachment_urls, {
    enabled: open && !!transaction,
    expiresInSeconds: 60 * 15,
  });

  const allImages = useMemo(() => {
    if (!transaction) return [];
    const base: string[] = [];
    if (transaction.receipt_image_url) {
      base.push(transaction.receipt_image_url);
    }
    if (signedAttachments && signedAttachments.length > 0) {
      base.push(...signedAttachments);
    }
    return base;
  }, [transaction, signedAttachments]);

  // Get the first available download URL
  const downloadUrl = useMemo(() => {
    if (!transaction) return '#';
    return transaction.receipt_image_url || (signedAttachments && signedAttachments[0]) || '#';
  }, [transaction, signedAttachments]);

  // Download PDF and all images
  const handleDownloadAll = async () => {
    if (!transaction) return;

    setIsDownloading(true);
    toast.info('Preparing downloads...');

    try {
      // Generate combined PDF with images
      const pdfDoc = pdf(
        <TransactionPDFReceipt 
          transaction={transaction} 
          images={allImages}
        />
      );
      const pdfBlob = await pdfDoc.toBlob();
      
      // Create PDF download
      const pdfFileName = `receipt-${transaction.voucher_no}-with-proofs-${new Date(transaction.transaction_date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '-')}.pdf`;
      
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const pdfLink = document.createElement('a');
      pdfLink.href = pdfUrl;
      pdfLink.download = pdfFileName;
      document.body.appendChild(pdfLink);
      pdfLink.click();
      document.body.removeChild(pdfLink);
      URL.revokeObjectURL(pdfUrl);


      toast.success(`Combined PDF downloaded successfully${allImages.length > 0 ? ` with ${allImages.length} supporting proof(s)` : ''}!`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download files. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!transaction) return null;


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="!max-w-4xl !w-[95vw] !max-h-[90vh] !flex !flex-col !p-0 !gap-0 !h-[85vh] sm:!h-[90vh] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          showCloseButton={false}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          } as React.CSSProperties}
        >
          <div className="flex flex-col h-full min-h-0 overflow-hidden">
            {/* Fixed Header */}
            <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 flex-shrink-0 border-b bg-background relative">
              {/* Close Button - Desktop and Mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 h-8 w-8 z-10"
                onClick={() => onOpenChange(false)}
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pr-10 sm:pr-10">
              <div>
                  <DialogTitle className="text-xl sm:text-2xl font-bold">
                  Transaction Details
                </DialogTitle>
                  <DialogDescription className="text-sm sm:text-base mt-1">
                  Voucher: {transaction.voucher_no}
                </DialogDescription>
              </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleDownloadAll}
                    disabled={isDownloading}
                    className="h-9 w-9"
                    title="Download Combined PDF with Supporting Proofs"
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                  {/* Hide edit button for approved transactions */}
                  {onEdit && transaction.verification_status !== 'approved' && (
                    <Button
                      variant="default"
                      size="icon"
                    onClick={() => {
                      if (transaction && onEdit) {
                        onEdit(transaction);
                      }
                    }}
                      className="h-9 w-9"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                  {/* Hide delete button for approved transactions */}
                  {onDelete && transaction.verification_status !== 'approved' && (
                  <Button
                    variant="destructive"
                      size="icon"
                    onClick={() => {
                      if (transaction && onDelete) {
                        onDelete(transaction);
                      }
                    }}
                      className="h-9 w-9"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

            {/* Scrollable Content Area */}
            <div
              className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              style={{
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                minHeight: 0,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              } as React.CSSProperties}
            >
            <div className="space-y-6 p-1">
              {/* Transaction Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Transaction Overview
                  </CardTitle>
                </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-muted-foreground">Date</p>
                          <p className="font-medium text-sm sm:text-base truncate">{formatDate(transaction.transaction_date)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 min-w-0">
                        <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-muted-foreground">Branch</p>
                          <Badge variant="outline" className="mt-1 text-xs sm:text-sm">
                            {transaction.branch}
                          </Badge>
                      </div>
                    </div>

                      <div className="flex items-center gap-3 min-w-0">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-muted-foreground">Staff</p>
                          <p className="font-medium text-sm sm:text-base truncate">
                            {transaction.staff?.name || 'Unknown'}
                            {transaction.staff?.employee_id && (
                              <span className="text-muted-foreground ml-1 text-xs">
                                ({transaction.staff.employee_id})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 min-w-0">
                        <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge className={`mt-1 text-xs sm:text-sm ${getStatusColor(transaction.bill_status)}`}>
                            {transaction.bill_status}
                          </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description & Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Description & Category
                  </CardTitle>
                </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="min-w-0">
                    <p className="text-sm text-muted-foreground mb-2">Description</p>
                        <p className="font-medium text-sm sm:text-base break-words">{transaction.primary_list}</p>
                  </div>

                      <div className="min-w-0">
                    <p className="text-sm text-muted-foreground mb-2">Category</p>
                        <Badge variant="secondary" className="text-xs sm:text-sm">
                      {transaction.nature_of_expense}
                    </Badge>
                  </div>

                      {transaction.notes ? (
                        <div className="min-w-0">
                      <p className="text-sm text-muted-foreground mb-2">Notes</p>
                          <p className="text-sm bg-muted p-3 rounded-md break-words">
                        {transaction.notes}
                      </p>
                        </div>
                      ) : (
                        <div></div>
                      )}
                    </div>
                </CardContent>
              </Card>

              {/* Amount Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Amount Breakdown
                  </CardTitle>
                </CardHeader>

                <CardContent>
                    <div
                      className={`
        grid gap-4 auto-rows-[1fr]
        grid-cols-1
        sm:grid-cols-2
        ${transaction.cash_in > 0 && transaction.cash_out > 0 ? "md:grid-cols-3" : "md:grid-cols-2"}
      `}
                    >
                    {transaction.cash_out > 0 && (
                        <div className="text-center p-4 sm:p-5 bg-red-50 rounded-lg border border-red-200 flex flex-col justify-center h-full">
                          <p className="text-xs sm:text-sm text-red-600 mb-1 sm:mb-2">Cash Out</p>
                          <p className="text-xl sm:text-2xl font-bold text-red-700 break-words">
                          {formatCurrency(transaction.cash_out)}
                        </p>
                      </div>
                    )}

                    {transaction.cash_in > 0 && (
                        <div className="text-center p-4 sm:p-5 bg-green-50 rounded-lg border border-green-200 flex flex-col justify-center h-full">
                          <p className="text-xs sm:text-sm text-green-600 mb-1 sm:mb-2">Cash In</p>
                          <p className="text-xl sm:text-2xl font-bold text-green-700 break-words">
                          {formatCurrency(transaction.cash_in)}
                        </p>
                      </div>
                    )}

                      <div className="text-center p-4 sm:p-5 bg-blue-50 rounded-lg border border-blue-200 flex flex-col justify-center h-full">
                        <p className="text-xs sm:text-sm text-blue-600 mb-1 sm:mb-2">Balance</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-700 break-words">
                        {formatCurrency(transaction.balance)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>


              {/* Supporting Proofs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Supporting Proofs
                  </CardTitle>
                </CardHeader>
                  <CardContent>
                  {attachmentsLoading ? (
                      <div className="flex w-full h-32 items-center justify-center text-sm text-muted-foreground">
                      Loading attachments…
                    </div>
                  ) : allImages.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                      {allImages.map((url, index) => (
                          <div
                            key={index}
                            className="group relative overflow-hidden rounded-xl border bg-card cursor-pointer w-auto"
                            onClick={() => setSelectedImage(url)}
                          >
                          <img
                            src={url}
                            alt={`Attachment ${index + 1}`}
                              className="h-24 sm:h-32 w-full object-cover group-hover:scale-105 transition-transform"
                          />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `attachment-${index + 1}`;
                                  link.click();
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No supporting files attached.</p>
                  )}
                  {attachmentError ? (
                      <p className="text-xs text-destructive mt-2">{attachmentError}</p>
                  ) : null}
                </CardContent>
              </Card>



              {/* Transaction Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">
                    Transaction Metadata
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Voucher Number</p>
                        <p className="font-mono font-medium">{transaction.voucher_no}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Transaction ID</p>
                        <p className="font-mono text-xs text-muted-foreground">{transaction.id}</p>
                      </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p>{new Date(transaction.created_at).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Updated</p>
                      <p>{new Date(transaction.updated_at).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={selectedImage !== null} onOpenChange={(openState) => {
        if (!openState) {
          setSelectedImage(null);
        }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Attachment preview</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex flex-col gap-3">
              <img src={selectedImage} alt="Receipt" className="max-h-[70vh] w-full object-contain rounded-md border" />
              <div className="flex justify-end gap-2">
                <Button asChild size="icon" className="h-9 w-9">
                  <a href={selectedImage} download>
                    <Download className="h-4 w-4" />
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
