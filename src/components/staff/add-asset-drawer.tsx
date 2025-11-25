'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { MultipleImageUpload } from '@/components/cashbook/multiple-image-upload';
import { useAssetRequests } from '@/hooks/use-asset-requests';
import { useAuth } from '@/contexts/auth-context';

interface AddAssetDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}

export function AddAssetDrawer({ isOpen, onOpenChange, onSubmit, isSubmitting = false }: AddAssetDrawerProps) {
  const { user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { uploadImages, isCreating } = useAssetRequests();

  const [requestType, setRequestType] = useState<'system' | 'common'>('system');
  
  const [formData, setFormData] = useState({
    // Common fields
    product_name: '',
    quantity: 1,
    
    // System fields
    condition: 'new' as 'new' | 'refurbished' | 'used',
    additional_notes: '',
    serial_no: '', // Serial Number for system type
    brand_name: '', // Brand for system type
    workstation: '', // Workstation for system type
    
    // Common fields
    shop_contact: '',
    warranty: '',
    specification: '',
    price: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.staffId) {
      toast.error('User not authenticated');
      return;
    }

    if (!formData.product_name) {
      toast.error('Please enter product name');
      return;
    }

    // Validate based on request type
    if (requestType === 'common') {
      if (!formData.shop_contact) {
        toast.error('Please enter shop contact');
        return;
      }
      if (!formData.brand_name) {
        toast.error('Please enter brand name');
        return;
      }
      if (formData.quantity <= 0) {
        toast.error('Quantity must be greater than 0');
        return;
      }
      if (formData.price < 0) {
        toast.error('Price cannot be negative');
        return;
      }
    }

    try {
      setIsUploading(true);

      // Upload images if any
      let uploadedImageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        try {
          uploadedImageUrls = await uploadImages(selectedFiles);
        } catch (uploadError: any) {
          console.error('Image upload failed:', uploadError);
          toast.error(uploadError.message || 'Failed to upload images. Please try again.');
          return; // Stop submission if upload fails
        }
      }

      // Call the onSubmit prop with the data
      const submitData: any = {
        staff_id: user.staffId,
        staff_name: user.name || '',
        branch: user.branch || '',
        request_type: requestType,
        product_name: formData.product_name,
        quantity: formData.quantity,
        image_urls: uploadedImageUrls,
      };

      // Add system-specific fields
      if (requestType === 'system') {
        submitData.condition = formData.condition;
        submitData.additional_notes = formData.additional_notes;
        submitData.serial_no = formData.serial_no || undefined;
        submitData.brand_name = formData.brand_name || undefined;
        submitData.workstation = formData.workstation || undefined;
      } else {
        // Add common-specific fields
        submitData.shop_contact = formData.shop_contact || undefined;
        submitData.serial_no = formData.serial_no || undefined;
        submitData.brand_name = formData.brand_name || undefined;
        submitData.warranty = formData.warranty || undefined;
        submitData.specification = formData.specification || undefined;
        // Price should be passed even if 0 (it's a required field for common type)
        submitData.price = formData.price !== undefined ? formData.price : undefined;
      }

      // Await the async onSubmit call
      await onSubmit(submitData);

      // Only show success and reset form after successful submission
      toast.success('Asset request submitted successfully!');
      
      // Reset form
      setFormData({
        product_name: '',
        quantity: 1,
        condition: 'new',
        additional_notes: '',
        serial_no: '',
        brand_name: '',
        workstation: '',
        shop_contact: '',
        warranty: '',
        specification: '',
        price: 0,
      });
      setSelectedFiles([]);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error submitting asset request:', error);
      const errorMessage = error?.message || error?.toString() || 'Failed to submit asset request. Please try again.';
      toast.error(errorMessage);
      // Don't reset form or close drawer on error - let user fix and retry
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] max-w-2xl mx-auto">
        <DrawerHeader className="border-b">
          <DrawerTitle>Add Asset </DrawerTitle>
          <DrawerDescription>
            Request new assets for your workstation. All requests will be reviewed by admin.
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-xl space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Request Type Selection */}
              <div className="space-y-3">
                <Label>Request Type</Label>
                <RadioGroup
                  value={requestType}
                  onValueChange={(value) => setRequestType(value as 'system' | 'common')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system">System (Office Assets)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="common" id="common" />
                    <Label htmlFor="common">Common (External Purchase)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Auto-filled fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Staff Name</Label>
                  <Input
                    value={user?.name || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Input
                    value={user?.branch || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* Conditional form fields based on requestType */}
              {requestType === 'system' ? (
                <>
                  {/* System fields: Product Name, Quantity, Condition, Notes, Images */}
                  {/* Product Name */}
                  <div className="space-y-2">
                    <Label htmlFor="product_name">Product Name</Label>
                    <Input
                      id="product_name"
                      value={formData.product_name}
                      onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                      placeholder="e.g., Dell Laptop, HP Printer, Monitor"
                      required
                    />
                  </div>

                  {/* Serial Number */}
                  <div className="space-y-2">
                    <Label htmlFor="serial_no">Serial Number</Label>
                    <Input
                      id="serial_no"
                      value={formData.serial_no}
                      onChange={(e) => setFormData({...formData, serial_no: e.target.value})}
                      placeholder="e.g., SN-2024-001"
                    />
                  </div>

                  {/* Brand */}
                  <div className="space-y-2">
                    <Label htmlFor="brand_name">Brand</Label>
                    <Input
                      id="brand_name"
                      value={formData.brand_name}
                      onChange={(e) => setFormData({...formData, brand_name: e.target.value})}
                      placeholder="e.g., Dell, HP, Lenovo"
                    />
                  </div>

                  {/* Workstation */}
                  <div className="space-y-2">
                    <Label htmlFor="workstation">Workstation</Label>
                    <Input
                      id="workstation"
                      value={formData.workstation}
                      onChange={(e) => setFormData({...formData, workstation: e.target.value})}
                      placeholder="e.g., WS-101, Desk-A5"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                      required
                    />
                  </div>

                  {/* Condition */}
                  <div className="space-y-3">
                    <Label>Condition</Label>
                    <RadioGroup
                      value={formData.condition}
                      onValueChange={(value) => setFormData({...formData, condition: value as 'new' | 'refurbished' | 'used'})}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="new" id="new" />
                        <Label htmlFor="new">New</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="refurbished" id="refurbished" />
                        <Label htmlFor="refurbished">Refurbished</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="used" id="used" />
                        <Label htmlFor="used">Used</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Additional Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="additional_notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="additional_notes"
                      value={formData.additional_notes}
                      onChange={(e) => setFormData({...formData, additional_notes: e.target.value})}
                      placeholder="Any additional information or reason for this request..."
                      rows={3}
                    />
                  </div>

                  {/* Image Upload */}
                  <MultipleImageUpload
                    onImagesChange={setSelectedFiles}
                    maxImages={5}
                    maxSizeMB={5}
                    acceptAllTypes={false}
                    label="Upload Images (Optional, max 5MB each)"
                  />
                </>
              ) : (
                <>
                  {/* Common Type Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Product Name */}
                    <div className="space-y-2">
                      <Label htmlFor="product_name">Product Name *</Label>
                      <Input
                        id="product_name"
                        value={formData.product_name}
                        onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                        placeholder="Enter product name"
                        required
                      />
                    </div>

                    {/* Shop Contact */}
                    <div className="space-y-2">
                      <Label htmlFor="shop_contact">Shop Contact *</Label>
                      <Input
                        id="shop_contact"
                        value={formData.shop_contact}
                        onChange={(e) => setFormData({...formData, shop_contact: e.target.value})}
                        placeholder="Contact number or name"
                        required
                      />
                    </div>

                    {/* Serial Number (S.no) */}
                    <div className="space-y-2">
                      <Label htmlFor="serial_no">S.No</Label>
                      <Input
                        id="serial_no"
                        value={formData.serial_no}
                        onChange={(e) => setFormData({...formData, serial_no: e.target.value})}
                        placeholder="Serial/Model number (optional)"
                      />
                    </div>

                    {/* Brand Name */}
                    <div className="space-y-2">
                      <Label htmlFor="brand_name">Brand Name *</Label>
                      <Input
                        id="brand_name"
                        value={formData.brand_name}
                        onChange={(e) => setFormData({...formData, brand_name: e.target.value})}
                        placeholder="Enter brand name"
                        required
                      />
                    </div>

                    {/* Warranty */}
                    <div className="space-y-2">
                      <Label htmlFor="warranty">Warranty</Label>
                      <Input
                        id="warranty"
                        value={formData.warranty}
                        onChange={(e) => setFormData({...formData, warranty: e.target.value})}
                        placeholder="e.g., 1 year, 2 years (optional)"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                        required
                      />
                    </div>

                    {/* Price */}
                    <div className="space-y-2">
                      <Label htmlFor="price">Price *</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  {/* Specification */}
                  <div className="space-y-2">
                    <Label htmlFor="specification">Specification</Label>
                    <Textarea
                      id="specification"
                      value={formData.specification}
                      onChange={(e) => setFormData({...formData, specification: e.target.value})}
                      placeholder="Product specifications (optional)"
                      rows={3}
                    />
                  </div>

                  {/* Photo Upload */}
                  <div className="space-y-3">
                    <MultipleImageUpload
                      onImagesChange={setSelectedFiles}
                      maxImages={5}
                      maxSizeMB={5}
                      acceptAllTypes={false}
                      label="Upload Photos * (Required)"
                    />
                    <p className="text-sm text-muted-foreground">
                      Upload clear images of the product for admin verification.
                    </p>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>

        <DrawerFooter className="border-t">
          <div className="flex gap-2 mx-auto w-full max-w-[300px]">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating || isUploading || isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isCreating || isUploading || isSubmitting}
            >
              {isCreating || isUploading || isSubmitting ? (
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
