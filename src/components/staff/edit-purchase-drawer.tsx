'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MultipleImageUpload } from '@/components/cashbook/multiple-image-upload';
import { useTaskProofs } from '@/hooks/use-task-proofs';
import { Loader2 } from 'lucide-react';
import { usePurchaseRequisitions } from '@/hooks/use-purchase-requisitions';
import { toast } from 'sonner';
import type { PurchaseRequisition } from '@/types/maintenance';

const purchaseFormSchema = z.object({
  purchase_item: z.string().min(1, 'Purchase item is required'),
  description: z.string().optional(),
});

type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

interface EditPurchaseDrawerProps {
  requisition: PurchaseRequisition | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPurchaseDrawer({ requisition, isOpen, onOpenChange }: EditPurchaseDrawerProps) {
  const { updateRequisition, isUpdating } = usePurchaseRequisitions();
  const { uploadReceiptImage } = useTaskProofs();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quotationFiles, setQuotationFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      purchase_item: '',
      description: '',
    },
  });

  // Reset form when requisition changes
  useEffect(() => {
    if (requisition) {
      form.reset({
        purchase_item: requisition.purchase_item || '',
        description: requisition.description || '',
      });
    }
  }, [requisition, form]);

  const onSubmit = async (values: PurchaseFormValues) => {
    if (!requisition) return;

    setIsSubmitting(true);
    try {
      // Upload quotation files if provided
      let quotationUrls: string[] = [];
      if (quotationFiles.length > 0) {
        setUploading(true);
        try {
          quotationUrls = await Promise.all(
            quotationFiles.map(file => uploadReceiptImage(file, `purchase-${Date.now()}`))
          );
        } catch (error) {
          console.error('Error uploading files:', error);
          toast.error('Failed to upload some files');
        }
        setUploading(false);
      } else if (requisition.quotation_urls) {
        // Keep existing files if no new ones uploaded
        quotationUrls = requisition.quotation_urls;
      }

      await updateRequisition({
        id: requisition.id,
        data: {
          ...values,
          quotation_urls: quotationUrls.length > 0 ? quotationUrls : undefined,
        },
      });
      onOpenChange(false);
      toast.success('Purchase requisition updated successfully!');
    } catch (error) {
      console.error('Error updating purchase requisition:', error);
      toast.error('Failed to update purchase requisition');
    } finally {
      setIsSubmitting(false);
    }
  };


  if (!requisition) return null;

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] max-w-2xl mx-auto">
        <DrawerHeader className="border-b">
          <DrawerTitle>Edit Purchase Requisition</DrawerTitle>
          <DrawerDescription>
            Update your purchase requisition details. Only pending requests can be edited.
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-xl space-y-6">

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Auto-filled fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={requisition?.name || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Designation</label>
                <Input
                  value={requisition?.designation || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Input
                  value={requisition?.department || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Branch</label>
                <Input
                  value={requisition?.branch || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            {/* Purchase Item */}
            <FormField
              control={form.control}
              name="purchase_item"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Item *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter item name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter item description"
                      className="resize-none"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload Section */}
            <MultipleImageUpload
              onImagesChange={setQuotationFiles}
              maxImages={10}
              maxSizeMB={10}
              acceptAllTypes={true}
              label="Attach Quotation Files (Any type, max 10MB each)"
            />
              </form>
            </Form>
          </div>
        </div>

        <DrawerFooter className="border-t">
          <div className="flex gap-2 mx-auto w-full max-w-[300px]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isUpdating || uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting || isUpdating || uploading}
            >
              {isSubmitting || isUpdating || uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? 'Uploading...' : 'Updating...'}
                </>
              ) : (
                'Update Request'
              )}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
