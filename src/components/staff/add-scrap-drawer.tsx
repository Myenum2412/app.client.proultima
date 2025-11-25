'use client';

import { useState } from 'react';
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
import { useScrapRequests } from '@/hooks/use-scrap-requests';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import Image from 'next/image';

const scrapFormSchema = z.object({
  brand_name: z.string().min(1, 'Brand name is required'),
  workstation_number: z.string().min(1, 'Workstation number is required'),
  users_name: z.string().min(1, 'User name is required'),
  serial_number: z.string().min(1, 'Serial number is required'),
  scrap_status: z.enum(['working', 'damaged', 'beyond_repair']),
});

type ScrapFormValues = z.infer<typeof scrapFormSchema>;

interface AddScrapDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}

export function AddScrapDrawer({ isOpen, onOpenChange, onSubmit, isSubmitting = false }: AddScrapDrawerProps) {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { user } = useAuth();
  const { uploadScrapImages } = useScrapRequests();

  const form = useForm<ScrapFormValues>({
    resolver: zodResolver(scrapFormSchema),
    defaultValues: {
      brand_name: '',
      workstation_number: '',
      users_name: '',
      serial_number: '',
      scrap_status: undefined,
    },
  });

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

    setIsUploading(true);

    try {
      // Upload images if any
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        imageUrls = await uploadScrapImages(imageFiles);
      }

      onSubmit({
        ...values,
        staff_id: user.staffId,
        submitter_type: 'staff',
        submitter_name: user.name || '',
        branch: user.branch || '',
        images: imageUrls.length > 0 ? imageUrls : undefined,
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

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] max-w-2xl mx-auto">
        <DrawerHeader className="border-b">
          <DrawerTitle>Submit Scrap Request</DrawerTitle>
          <DrawerDescription>
            Fill in the details for the equipment scrap request
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-xl space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="brand_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand Name</FormLabel>
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
                        <FormLabel>Workstation Number</FormLabel>
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
                        <FormLabel>User Name</FormLabel>
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
                        <FormLabel>Serial Number</FormLabel>
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
                      <FormLabel>Scrap Status</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="working" id="working" />
                            <Label htmlFor="working" className="cursor-pointer">
                              Working
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="damaged" id="damaged" />
                            <Label htmlFor="damaged" className="cursor-pointer">
                              Damaged
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="beyond_repair" id="beyond_repair" />
                            <Label htmlFor="beyond_repair" className="cursor-pointer">
                              Beyond Repair
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
