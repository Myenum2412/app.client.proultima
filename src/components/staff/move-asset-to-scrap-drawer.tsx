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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, X, Loader2 } from 'lucide-react';
import { useScrapRequests, uploadScrapImages } from '@/hooks/use-scrap-requests';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import Image from 'next/image';
import type { AssetRequest } from '@/types/index';

const scrapFormSchema = z.object({
  brand_name: z.string().min(1, 'Brand name is required'),
  workstation_number: z.string().min(1, 'Workstation number is required'),
  users_name: z.string().min(1, 'User name is required'),
  serial_number: z.string().min(1, 'Serial number is required'),
  scrap_status: z.enum(['working', 'damaged', 'beyond_repair', 'other']),
  other_issue: z.string().optional(),
}).refine((data) => {
  // If scrap_status is 'other', other_issue is required
  if (data.scrap_status === 'other') {
    return data.other_issue && data.other_issue.trim().length > 0;
  }
  return true;
}, {
  message: 'Please describe the issue',
  path: ['other_issue'],
});

type ScrapFormValues = z.infer<typeof scrapFormSchema>;

interface MoveAssetToScrapDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  asset: AssetRequest | null;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}

export function MoveAssetToScrapDrawer({ 
  isOpen, 
  onOpenChange, 
  asset,
  onSubmit, 
  isSubmitting = false 
}: MoveAssetToScrapDrawerProps) {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { user } = useAuth();

  const form = useForm<ScrapFormValues>({
    resolver: zodResolver(scrapFormSchema),
    defaultValues: {
      brand_name: '',
      workstation_number: '',
      users_name: '',
      serial_number: '',
      scrap_status: 'damaged',
      other_issue: '',
    },
  });

  // Pre-fill form when asset changes
  useEffect(() => {
    if (asset && isOpen) {
      form.reset({
        brand_name: asset.brand_name || '',
        serial_number: asset.serial_no || '',
        users_name: asset.staff_name || '',
        workstation_number: '', // Leave empty for staff input
        scrap_status: 'damaged', // Default to damaged
        other_issue: '',
      });
    }
  }, [asset, isOpen, form]);

  // Reset form when drawer closes
  useEffect(() => {
    if (!isOpen) {
      form.reset({
        brand_name: '',
        workstation_number: '',
        users_name: '',
        serial_number: '',
        scrap_status: 'damaged',
        other_issue: '',
      });
      setImageFiles([]);
      setImagePreviews([]);
    }
  }, [isOpen, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (imageFiles.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const newFiles = [...imageFiles, ...files].slice(0, 5);
    setImageFiles(newFiles);

    // Generate previews
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Revoke the URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (values: ScrapFormValues) => {
    if (!user?.staffId) {
      toast.error('User not authenticated');
      return;
    }

    if (!asset) {
      toast.error('Asset information is missing');
      return;
    }

    setIsUploading(true);

    try {
      // Upload images if any
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        imageUrls = await uploadScrapImages(imageFiles);
      }

      // Map 'other' status to 'beyond_repair' for database (since DB only accepts working, damaged, beyond_repair)
      const dbScrapStatus = values.scrap_status === 'other' ? 'beyond_repair' : values.scrap_status;
      
      onSubmit({
        ...values,
        scrap_status: dbScrapStatus, // Use mapped status for DB
        staff_id: user.staffId,
        submitter_type: 'staff',
        submitter_name: user.name || '',
        branch: user.branch || asset.branch,
        images: imageUrls.length > 0 ? imageUrls : undefined,
        source_asset_id: asset.id, // Store source asset ID for tracking
        other_issue: values.scrap_status === 'other' ? values.other_issue : undefined, // Store other issue for notification metadata
      });

      // Reset form and close drawer
      form.reset();
      setImageFiles([]);
      setImagePreviews([]);
    } catch (error) {
      console.error('Error submitting scrap request:', error);
      toast.error('Failed to submit scrap request');
    } finally {
      setIsUploading(false);
    }
  };

  if (!asset) {
    return null;
  }

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] max-w-2xl mx-auto">
        <DrawerHeader className="border-b">
          <DrawerTitle>Move Asset to Scrap</DrawerTitle>
          <DrawerDescription>
            Submit this asset for scrap. The asset will be removed from your asset list after admin approval.
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-xl space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Asset Information
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Product:</span>{' '}
                      <span className="font-medium">{asset.product_name}</span>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Quantity:</span>{' '}
                      <span className="font-medium">{asset.quantity}</span>
                    </div>
                    {asset.brand_name && (
                      <div>
                        <span className="text-blue-700 dark:text-blue-300">Brand:</span>{' '}
                        <span className="font-medium">{asset.brand_name}</span>
                      </div>
                    )}
                    {asset.serial_no && (
                      <div>
                        <span className="text-blue-700 dark:text-blue-300">Serial:</span>{' '}
                        <span className="font-medium">{asset.serial_no}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="brand_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter brand name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="workstation_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Workstation Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter workstation number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="users_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter user name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serial_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serial Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter serial number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="scrap_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scrap Status *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value !== 'other') {
                              form.setValue('other_issue', '');
                            }
                          }}
                          value={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="damaged" id="damaged" />
                            <Label htmlFor="damaged" className="cursor-pointer">
                              Damaged
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="other" id="other" />
                            <Label htmlFor="other" className="cursor-pointer">
                              Other
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('scrap_status') === 'other' && (
                  <FormField
                    control={form.control}
                    name="other_issue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Describe the Issue *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please describe the issue or reason for scrapping..."
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="space-y-2">
                  <Label>Images (Optional, max 5)</Label>
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      disabled={imageFiles.length >= 5}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Images
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {imageFiles.length} / 5 images
                    </span>
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageChange}
                  />

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mt-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <Image
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            width={100}
                            height={100}
                            className="w-full h-24 object-cover rounded-md border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </div>

        <DrawerFooter className="border-t">
          <div className="flex gap-2 mx-auto w-full max-w-[300px]">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                form.reset();
                setImageFiles([]);
                setImagePreviews([]);
              }}
              disabled={isSubmitting || isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={form.handleSubmit(handleSubmit)}
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting || isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? 'Uploading...' : 'Submitting...'}
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

