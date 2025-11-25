'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { PlusCircle, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useCashTransactions } from '@/hooks/use-cash-transactions';
import { useTaskProofs } from '@/hooks/use-task-proofs';
import { MultipleImageUpload } from '@/components/cashbook/multiple-image-upload';
import { NatureExpenseCombobox } from '@/components/cashbook/nature-expense-combobox';
import type { CashTransactionFormData } from '@/types/cashbook';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format as formatDate } from 'date-fns';

interface AddCashTransactionDialogProps {
  branch: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddCashTransactionDialog({ branch, open: externalOpen, onOpenChange }: AddCashTransactionDialogProps) {
  const { user } = useAuth();
  const { expenseCategories, createTransaction, isCreating } = useCashTransactions(branch, undefined, undefined, {
    autoApprove: false,
    includePending: true,
  });
  const { uploadReceiptImage } = useTaskProofs();
  
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [transactionType, setTransactionType] = useState<'cash_out' | 'cash_in'>('cash_out');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState<CashTransactionFormData>({
    transaction_date: new Date().toISOString().split('T')[0],
    bill_status: 'Paid',
    primary_list: '',
    nature_of_expense: '',
    cash_out: 0,
    cash_in: 0,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.staffId) {
      toast.error('User not authenticated');
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
      // Get voucher number
      const voucherResponse = await fetch('/api/cashbook/voucher-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch, type: transactionType }),
      });

      if (!voucherResponse.ok) {
        throw new Error('Failed to generate voucher number');
      }

      const { voucher_no } = await voucherResponse.json();

      // Upload images if provided
      let attachmentUrls: string[] = [];
      if (imageFiles.length > 0) {
        setUploading(true);
        try {
          attachmentUrls = await Promise.all(
            imageFiles.map(file => uploadReceiptImage(file, voucher_no))
          );
        } catch (error) {
          console.error('Error uploading images:', error);
          toast.error('Failed to upload some images');
        }
        setUploading(false);
      }

      // Create transaction
      createTransaction({
        ...formData,
        cash_out: transactionType === 'cash_out' ? (formData.cash_out || 0) : 0,
        cash_in: transactionType === 'cash_in' ? (formData.cash_in || 0) : 0,
        attachment_urls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
        staff_id: user.staffId,
        branch,
        voucher_no,
      });

      // Reset form
      setFormData({
        transaction_date: new Date().toISOString().split('T')[0],
        bill_status: 'Paid',
        primary_list: '',
        nature_of_expense: '',
        cash_out: 0,
        cash_in: 0,
        notes: '',
      });
      setImageFiles([]);
      setOpen(false);
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error('Failed to create transaction');
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Cash Transaction</DialogTitle>
          <DialogDescription>
            Record a new cash transaction for {branch} branch
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

          <MultipleImageUpload
            onImagesChange={setImageFiles}
            maxImages={5}
            maxSizeMB={8}
            acceptedMimeTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']}
            label="Attach supporting bills or receipts"
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || uploading}>
              {isCreating || uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? 'Uploading...' : 'Creating...'}
                </>
              ) : (
                'Add Transaction'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}



