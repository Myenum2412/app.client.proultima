'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useCashTransactions } from '@/hooks/use-cash-transactions';
import { useTaskProofs } from '@/hooks/use-task-proofs';
import { MultipleImageUpload } from '@/components/cashbook/multiple-image-upload';
import { NatureExpenseCombobox } from '@/components/cashbook/nature-expense-combobox';
import type { CashTransaction, CashTransactionFormData } from '@/types/cashbook';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format as formatDate } from 'date-fns';

interface EditCashTransactionDialogProps {
  transaction: CashTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditCashTransactionDialog({
  transaction,
  open,
  onOpenChange,
  onSuccess,
}: EditCashTransactionDialogProps) {
  const { user } = useAuth();
  const { expenseCategories, updateTransaction, isUpdating } = useCashTransactions(
    transaction?.branch || '',
    undefined,
    undefined,
    {
      autoApprove: false,
      includePending: true,
    }
  );
  const { uploadReceiptImage } = useTaskProofs();

  const [transactionType, setTransactionType] = useState<'cash_out' | 'cash_in'>('cash_out');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);

  const [formData, setFormData] = useState<CashTransactionFormData>({
    transaction_date: new Date().toISOString().split('T')[0],
    bill_status: 'Paid',
    primary_list: '',
    nature_of_expense: '',
    cash_out: 0,
    cash_in: 0,
    notes: '',
  });

  // Initialize form data when transaction changes
  useEffect(() => {
    if (transaction && open) {
      const isCashOut = transaction.cash_out > 0;
      setTransactionType(isCashOut ? 'cash_out' : 'cash_in');
      
      // Combine receipt_image_url and attachment_urls
      const allUrls: string[] = [];
      if (transaction.receipt_image_url) {
        allUrls.push(transaction.receipt_image_url);
      }
      if (transaction.attachment_urls && transaction.attachment_urls.length > 0) {
        allUrls.push(...transaction.attachment_urls);
      }
      setExistingImageUrls(allUrls);

      setFormData({
        transaction_date: transaction.transaction_date.split('T')[0],
        bill_status: transaction.bill_status,
        primary_list: transaction.primary_list,
        nature_of_expense: transaction.nature_of_expense,
        cash_out: transaction.cash_out || 0,
        cash_in: transaction.cash_in || 0,
        notes: transaction.notes || '',
      });
      setImageFiles([]);
    }
  }, [transaction, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.staffId) {
      toast.error('User not authenticated');
      return;
    }

    if (!transaction) {
      toast.error('Transaction not found');
      return;
    }

    if (!formData.primary_list) {
      toast.error('Please enter transaction description');
      return;
    }

    if (!formData.nature_of_expense) {
      toast.error('Please select expense category');
      return;
    }

    const amount = transactionType === 'cash_out' ? formData.cash_out : formData.cash_in;
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      // Upload new images if provided
      let newAttachmentUrls: string[] = [];
      if (imageFiles.length > 0) {
        setUploading(true);
        try {
          newAttachmentUrls = await Promise.all(
            imageFiles.map(file => uploadReceiptImage(file, transaction.voucher_no))
          );
        } catch (error) {
          console.error('Error uploading images:', error);
          toast.error('Failed to upload some images');
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      // Combine existing URLs with new ones
      const allAttachmentUrls = [...existingImageUrls, ...newAttachmentUrls];

      // Update transaction
      updateTransaction({
        id: transaction.id,
        ...formData,
        cash_out: transactionType === 'cash_out' ? (formData.cash_out || 0) : 0,
        cash_in: transactionType === 'cash_in' ? (formData.cash_in || 0) : 0,
        attachment_urls: allAttachmentUrls.length > 0 ? allAttachmentUrls : undefined,
      }, {
        onSuccess: () => {
          onOpenChange(false);
          if (onSuccess) {
            onSuccess();
          }
        }
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Failed to update transaction');
      setUploading(false);
    }
  };

  const handleRemoveExistingImage = (urlToRemove: string) => {
    setExistingImageUrls(prev => prev.filter(url => url !== urlToRemove));
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Cash Transaction</DialogTitle>
          <DialogDescription>
            Update transaction details for voucher {transaction.voucher_no}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transaction_date">Transaction Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-60" />
                    {formData.transaction_date
                      ? formatDate(new Date(formData.transaction_date), 'MMM dd, yyyy')
                      : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="single"
                    className='mx-auto'
                    selected={formData.transaction_date ? new Date(formData.transaction_date) : undefined}
                    onSelect={(d) => d && setFormData({ ...formData, transaction_date: formatDate(d, 'yyyy-MM-dd') })}
                    defaultMonth={formData.transaction_date ? new Date(formData.transaction_date) : new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction_type">Transaction Type</Label>
              <Select value={transactionType} onValueChange={(value: 'cash_out' | 'cash_in') => setTransactionType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash_out">Cash Out (Expense)</SelectItem>
                  <SelectItem value="cash_in">Cash In (Receipt)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bill_status">Bill Status</Label>
            <Select value={formData.bill_status} onValueChange={(value: any) => setFormData({ ...formData, bill_status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary_list">Description</Label>
            <Input
              id="primary_list"
              value={formData.primary_list}
              onChange={(e) => setFormData({ ...formData, primary_list: e.target.value })}
              placeholder="e.g., Office stationery purchase"
              required
            />
          </div>

          <NatureExpenseCombobox
            value={formData.nature_of_expense}
            onValueChange={(value) => setFormData({ ...formData, nature_of_expense: value })}
            options={expenseCategories}
            placeholder="Select or type custom category..."
          />

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={transactionType === 'cash_out' ? formData.cash_out : formData.cash_in}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                if (transactionType === 'cash_out') {
                  setFormData({ ...formData, cash_out: value, cash_in: 0 });
                } else {
                  setFormData({ ...formData, cash_in: value, cash_out: 0 });
                }
              }}
              placeholder="0.00"
              required
            />
          </div>

          {/* Existing Images */}
          {existingImageUrls.length > 0 && (
            <div className="space-y-2">
              <Label>Existing Attachments</Label>
              <div className="grid grid-cols-3 gap-2">
                {existingImageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Attachment ${index + 1}`}
                      className="h-24 w-full object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveExistingImage(url)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <MultipleImageUpload
            onImagesChange={setImageFiles}
            maxImages={5}
            maxSizeMB={8}
            acceptedMimeTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']}
            label="Add more supporting bills or receipts"
            helperText="Images (JPG, PNG, WEBP) or PDF documents supported"
          />

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating || uploading}>
              {isUpdating || uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? 'Uploading...' : 'Updating...'}
                </>
              ) : (
                'Update Transaction'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

