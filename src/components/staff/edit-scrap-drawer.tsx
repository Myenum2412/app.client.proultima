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
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2 } from 'lucide-react';
import { useScrapRequests, uploadScrapImages } from '@/hooks/use-scrap-requests';
import { toast } from 'sonner';
import Image from 'next/image';
import type { ScrapRequest } from '@/types/scrap';

const scrapFormSchema = z.object({
  brand_name: z.string().min(1, 'Brand name is required'),
  workstation_number: z.string().min(1, 'Workstation number is required'),
  users_name: z.string().min(1, 'User name is required'),
  serial_number: z.string().min(1, 'Serial number is required'),
  scrap_status: z.enum(['working', 'damaged', 'beyond_repair']),
});

type ScrapFormValues = z.infer<typeof scrapFormSchema>;

interface EditScrapDrawerProps {
  scrapRequest: ScrapRequest | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditScrapDrawer({ scrapRequest, isOpen, onOpenChange }: EditScrapDrawerProps) {
  const { staffUpdateScrapRequest, isStaffUpdating } = useScrapRequests();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<ScrapFormValues>({
    resolver: zodResolver(scrapFormSchema),
    defaultValues: {
      brand_name: '',
      workstation_number: '',
      users_name: '',
      serial_number: '',
      scrap_status: 'working',
    },
  });

  // Reset form when scrap request changes
  useEffect(() => {
    if (scrapRequest) {
      form.reset({
        brand_name: scrapRequest.brand_name || '',
        workstation_number: scrapRequest.workstation_number || '',
        users_name: scrapRequest.users_name || '',
        serial_number: scrapRequest.serial_number || '',
        scrap_status: scrapRequest.scrap_status || 'working',
      });
      
      // Set existing images as previews
      if (scrapRequest.images && scrapRequest.images.length > 0) {
        setImagePreviews(scrapRequest.images);
      }
    }
  }, [scrapRequest, form]);

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

  const onSubmit = async (values: ScrapFormValues) => {
    if (!scrapRequest) return;

    setIsUploading(true);
    try {
      let imageUrls: string[] = [];
      
      // Upload new images if any
      if (imageFiles.length > 0) {
        imageUrls = await uploadScrapImages(imageFiles);
      } else if (scrapRequest.images) {
        // Keep existing images if no new ones uploaded
        imageUrls = scrapRequest.images;
      }

      await staffUpdateScrapRequest({
        id: scrapRequest.id,
        data: {
          ...values,
          images: imageUrls,
        },
      });
      
      onOpenChange(false);
      toast.success('Scrap request updated successfully!');
    } catch (error) {
      console.error('Error updating scrap request:', error);
      toast.error('Failed to update scrap request');
    } finally {
      setIsUploading(false);
    }
  };


  if (!scrapRequest) return null;

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] max-w-2xl mx-auto">
        <DrawerHeader className="border-b">
          <DrawerTitle>Edit Scrap Request</DrawerTitle>
          <DrawerDescription>
            Update your scrap request details. Only pending requests can be edited.
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-xl space-y-6">

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            {/* Scrap Status */}
            <FormField
              control={form.control}
              name="scrap_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scrap Status *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={scrapRequest.scrap_status}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="working" id="working" />
                        <Label htmlFor="working">Working</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="damaged" id="damaged" />
                        <Label htmlFor="damaged">Damaged</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="beyond_repair" id="beyond_repair" />
                        <Label htmlFor="beyond_repair">Beyond Repair</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload */}
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

              {/* Image Previews */}
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
              onClick={() => onOpenChange(false)}
              disabled={isUploading || isStaffUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isUploading || isStaffUpdating}
            >
              {(isUploading || isStaffUpdating) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
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
