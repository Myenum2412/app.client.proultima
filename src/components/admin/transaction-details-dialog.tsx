'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Copy,
  Download,
  Calendar,
  User,
  Building,
  FileText,
  Tag,
  DollarSign,
  Receipt,
  ShieldCheck,
  CreditCard,
  Eye,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Check,
  X,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';
import type { CashTransaction } from '@/types/cashbook';
import { useSignedReceiptUrls } from '@/hooks/use-signed-receipt-urls';

const isImageUrl = (url: string) => /\.(png|jpe?g|webp|gif)$/i.test(url);
const isPdfUrl = (url: string) => url.toLowerCase().endsWith('.pdf');

interface TransactionDetailsDialogProps {
  transaction: CashTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetailsDialog({ 
  transaction, 
  open, 
  onOpenChange 
}: TransactionDetailsDialogProps) {
  const [selectedAttachmentUrl, setSelectedAttachmentUrl] = useState<string | null>(null);

  const { signedUrls: signedAttachments = transaction?.attachment_urls, isLoading: attachmentsLoading, error: attachmentError } = useSignedReceiptUrls(transaction?.attachment_urls, {
    enabled: open,
    expiresInSeconds: 60 * 15,
  });

  const combinedAttachments = useMemo(() => {
    const entries: { url: string; label: string; type: 'image' | 'pdf' | 'file' }[] = [];
    if (transaction?.receipt_image_url) {
      entries.push({
        url: transaction.receipt_image_url,
        label: 'Receipt image',
        type: isImageUrl(transaction.receipt_image_url) ? 'image' : 'file',
      });
    }
    (signedAttachments || []).forEach((url, index) => {
      entries.push({
        url,
        label: `Attachment ${index + 1}`,
        type: isImageUrl(url) ? 'image' : isPdfUrl(url) ? 'pdf' : 'file',
      });
    });
    return entries;
  }, [transaction?.receipt_image_url, signedAttachments]);

  if (!transaction) return null;

  const isCashOut = transaction.cash_out > 0;
  const amount = isCashOut ? transaction.cash_out : transaction.cash_in;
  const transactionType = isCashOut ? 'Cash Out (Expense)' : 'Cash In (Receipt)';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionTypeColor = () => {
    return isCashOut ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm font-mono">
                Voucher #{transaction.voucher_no}
              </Badge>
              <DialogTitle>Transaction Details</DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Transaction Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Transaction Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                    <div className="flex items-center gap-2">
                      {isCashOut ? (
                        <ArrowDownLeft className="h-4 w-4 text-red-500" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-2xl font-bold">
                        ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                    <Badge className={getTransactionTypeColor()}>
                      {transactionType}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Badge className={getStatusColor(transaction.bill_status)}>
                      {transaction.bill_status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Staff Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Staff Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Staff Name</Label>
                    <p className="font-medium">{transaction.staff?.name || 'N/A'}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Employee ID</Label>
                    <p className="font-mono text-sm">{transaction.staff?.employee_id || 'N/A'}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="text-sm">{transaction.staff?.email || 'N/A'}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Branch</Label>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{transaction.branch}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Transaction Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="text-sm bg-muted p-3 rounded-md">{transaction.primary_list}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Nature of Expense</Label>
                  <p className="text-sm bg-muted p-3 rounded-md">{transaction.nature_of_expense}</p>
                </div>
                
                {transaction.notes && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                    <p className="text-sm bg-muted p-3 rounded-md">{transaction.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Image Gallery Card */}
            {attachmentsLoading ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                Loading attachments…
              </div>
            ) : combinedAttachments.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Attached Proofs ({combinedAttachments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {combinedAttachments.map((attachment, index) => (
                      <div key={index} className="relative group rounded-xl border bg-card overflow-hidden">
                        <div className="relative h-40 bg-muted flex items-center justify-center">
                          {attachment.type === 'image' ? (
                            <img
                              src={attachment.url}
                              alt={attachment.label}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                              onClick={() => setSelectedAttachmentUrl(attachment.url)}
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 p-4 text-xs text-muted-foreground">
                              <ImageIcon className="h-6 w-6" />
                              <span>{attachment.type === 'pdf' ? 'PDF document' : 'File attachment'}</span>
                            </div>
                          )}
                        </div>
                        <div className="p-2 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setSelectedAttachmentUrl(attachment.url)}
                            disabled={attachment.type !== 'image'}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <Button size="sm" variant="secondary" asChild className="flex-1">
                            <a href={attachment.url} download>
                              <Download className="h-3 w-3 mr-1" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {attachmentError ? (
                    <p className="mt-3 text-xs text-destructive">{attachmentError}</p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full-size Image Modal */}
      <Dialog open={selectedAttachmentUrl !== null} onOpenChange={(state) => !state && setSelectedAttachmentUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          {selectedAttachmentUrl && (
            <div className="relative">
              <img
                src={selectedAttachmentUrl}
                alt="Attachment preview"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <a href={selectedAttachmentUrl} target="_blank" rel="noopener noreferrer">
                    Open in new tab
                  </a>
                </Button>
                <Button size="sm" onClick={() => setSelectedAttachmentUrl(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

