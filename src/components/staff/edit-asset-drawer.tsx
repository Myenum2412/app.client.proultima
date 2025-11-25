'use client';

import { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
import { useAssetRequests } from '@/hooks/use-asset-requests';
import { toast } from 'sonner';
import { MultipleImageUpload } from '@/components/cashbook/multiple-image-upload';
import type { AssetRequest } from '@/types/index';

interface EditAssetDrawerProps {
  assetRequest: AssetRequest | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAssetDrawer({ assetRequest, isOpen, onOpenChange }: EditAssetDrawerProps) {
  const { staffUpdateAssetRequest, uploadImages, isStaffUpdating } = useAssetRequests();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    product_name: '',
    quantity: 1,
    condition: 'new' as 'new' | 'refurbished' | 'used',
    additional_notes: '',
    serial_no: '',
    brand_name: '',
    workstation: '',
  });

  // Reset form when asset request changes
  useEffect(() => {
    if (assetRequest) {
      setFormData({
        product_name: assetRequest.product_name || '',
        quantity: assetRequest.quantity || 1,
        condition: assetRequest.condition || 'new',
        additional_notes: assetRequest.additional_notes || '',
        serial_no: assetRequest.serial_no || '',
        brand_name: assetRequest.brand_name || '',
        workstation: (assetRequest as any).workstation || '',
      });
    }
  }, [assetRequest]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assetRequest) return;

    setIsUploading(true);
    try {
      let imageUrls: string[] = [];
      
      // Upload new images if any
      if (selectedFiles.length > 0) {
        imageUrls = await uploadImages(selectedFiles);
      } else if (assetRequest.image_urls) {
        // Keep existing images if no new ones uploaded
        imageUrls = assetRequest.image_urls;
      }

      await staffUpdateAssetRequest({
        id: assetRequest.id,
        data: {
          ...formData,
          image_urls: imageUrls,
        },
      });
      
      onOpenChange(false);
      toast.success('Asset request updated successfully!');
    } catch (error) {
      console.error('Error updating asset request:', error);
      toast.error('Failed to update asset request');
    } finally {
      setIsUploading(false);
    }
  };


  if (!assetRequest) return null;

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] max-w-2xl mx-auto">
        <DrawerHeader className="border-b">
          <DrawerTitle>Edit Asset Request</DrawerTitle>
          <DrawerDescription>
            Update your asset request details. Only pending requests can be edited.
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-xl space-y-6">

            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Auto-filled fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Staff Name</Label>
              <Input
                value={assetRequest.staff?.name || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Branch</Label>
              <Input
                value={assetRequest.staff?.branch || ''}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="product_name">Product Name</Label>
            <Input
              id="product_name"
              value={formData.product_name}
              onChange={(e) => setFormData({...formData, product_name: e.target.value})}
              placeholder="Enter product name"
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
          <div className="space-y-2">
            <Label>Condition</Label>
            <RadioGroup
              value={formData.condition}
              onValueChange={(value: 'new' | 'refurbished' | 'used') => 
                setFormData({...formData, condition: value})
              }
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
            <Label htmlFor="additional_notes">Additional Notes</Label>
            <Textarea
              id="additional_notes"
              value={formData.additional_notes}
              onChange={(e) => setFormData({...formData, additional_notes: e.target.value})}
              placeholder="Any additional information about the asset request"
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
            </form>
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
              onClick={handleSubmit}
              disabled={isUploading || isStaffUpdating}
            >
              {isUploading || isStaffUpdating ? (
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
