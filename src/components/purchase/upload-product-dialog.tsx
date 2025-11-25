'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MultipleImageUpload } from '@/components/cashbook/multiple-image-upload';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import type { PurchaseRequisition } from '@/types/maintenance';

export interface ProductDetailsData {
  request_type: 'system' | 'common';
  product_name: string;
  brand_name: string;
  serial_no?: string;
  warranty?: string;
  condition: 'new' | '2nd_hand' | 'used';
  user_name: string;
  remote_id?: string;
  specification?: string;
  product_image_urls: string[];
  // Common type fields
  shop_contact?: string; // Required for common type
  quantity: number; // Required for common type
  price: number; // Required for common type
}

interface UploadProductDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  requisition: PurchaseRequisition;
  onUpload: (productData: ProductDetailsData) => void;
  isUploading?: boolean;
  uploadImages: (files: File[]) => Promise<string[]>;
}

export function UploadProductDialog({
  isOpen,
  onOpenChange,
  requisition,
  onUpload,
  isUploading = false,
  uploadImages,
}: UploadProductDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  
  // Request type selection
  const [requestType, setRequestType] = useState<'system' | 'common'>('system');
  
  // Form state - System fields
  const [productName, setProductName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [warranty, setWarranty] = useState('');
  const [condition, setCondition] = useState<'new' | '2nd_hand' | 'used'>('new');
  const [userName, setUserName] = useState('');
  const [remoteId, setRemoteId] = useState('');
  const [specification, setSpecification] = useState('');
  
  // Form state - Common fields
  const [shopContact, setShopContact] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);

  const handleUpload = async () => {
    // Validation based on request type
    if (!productName.trim()) {
      toast.error('Product Name is required');
      return;
    }
    
    if (requestType === 'system') {
      // System type validation
      if (!brandName.trim()) {
        toast.error('Brand is required');
        return;
      }
      if (!userName.trim()) {
        toast.error('User Name is required');
        return;
      }
    } else {
      // Common type validation
      if (!shopContact.trim()) {
        toast.error('Shop Contact is required');
        return;
      }
      if (!brandName.trim()) {
        toast.error('Brand Name is required');
        return;
      }
      if (quantity <= 0) {
        toast.error('Quantity must be greater than 0');
        return;
      }
      if (price < 0) {
        toast.error('Price cannot be negative');
        return;
      }
    }
    
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one product image');
      return;
    }
    
    try {
      setIsUploadingImages(true);
      const uploadedUrls = await uploadImages(selectedFiles);
      
      const productData: ProductDetailsData = {
        request_type: requestType,
        product_name: productName.trim(),
        brand_name: brandName.trim(),
        serial_no: serialNo.trim() || undefined,
        warranty: warranty.trim() || undefined,
        condition,
        user_name: requestType === 'system' ? userName.trim() : '',
        remote_id: remoteId.trim() || undefined,
        specification: specification.trim() || undefined,
        product_image_urls: uploadedUrls,
        shop_contact: requestType === 'common' ? shopContact.trim() : undefined,
        quantity: requestType === 'common' ? quantity : 1,
        price: requestType === 'common' ? price : 0,
      };
      
      onUpload(productData);
      
      // Reset form
      setRequestType('system');
      setProductName('');
      setBrandName('');
      setSerialNo('');
      setWarranty('');
      setCondition('new');
      setUserName('');
      setRemoteId('');
      setSpecification('');
      setShopContact('');
      setQuantity(1);
      setPrice(0);
      setSelectedFiles([]);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Failed to upload product details. Please try again.');
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleImagesChange = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleClose = () => {
    // Reset form on close
    setRequestType('system');
    setProductName('');
    setBrandName('');
    setSerialNo('');
    setWarranty('');
    setCondition('new');
    setUserName('');
    setRemoteId('');
    setSpecification('');
    setShopContact('');
    setQuantity(1);
    setPrice(0);
    setSelectedFiles([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Product Details
          </DialogTitle>
          <DialogDescription>
            Enter product details and upload images of the actual product you purchased for verification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Purchase Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Purchase Request Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Requested Item:</span>
                <p className="font-medium">{requisition.purchase_item}</p>
              </div>
              <div>
                <span className="text-gray-500">Description:</span>
                <p className="font-medium">{requisition.description || '-'}</p>
              </div>
            </div>
          </div>

          {/* Request Type Selection */}
          <div className="space-y-3">
            <Label>Purchase Type</Label>
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

          {/* Product Details Form */}
          <div className="space-y-4">
            {requestType === 'system' ? (
              <>
                {/* System Type Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product Name */}
                  <div className="space-y-2">
                    <Label htmlFor="product_name">Product Name *</Label>
                    <Input
                      id="product_name"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Enter actual product name"
                      required
                    />
                  </div>

                  {/* Brand */}
                  <div className="space-y-2">
                    <Label htmlFor="brand_name">Brand *</Label>
                    <Input
                      id="brand_name"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Enter brand name"
                      required
                    />
                  </div>

                  {/* Serial Number */}
                  <div className="space-y-2">
                    <Label htmlFor="serial_no">Serial Number</Label>
                    <Input
                      id="serial_no"
                      value={serialNo}
                      onChange={(e) => setSerialNo(e.target.value)}
                      placeholder="Enter serial number (optional)"
                    />
                  </div>

                  {/* Warranty */}
                  <div className="space-y-2">
                    <Label htmlFor="warranty">Warranty</Label>
                    <Input
                      id="warranty"
                      value={warranty}
                      onChange={(e) => setWarranty(e.target.value)}
                      placeholder="e.g., 1 year, 2 years (optional)"
                    />
                  </div>

                  {/* Condition */}
                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition *</Label>
                    <Select value={condition} onValueChange={(value: 'new' | '2nd_hand' | 'used') => setCondition(value)}>
                      <SelectTrigger id="condition">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="used">Used</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* User Name */}
                  <div className="space-y-2">
                    <Label htmlFor="user_name">User Name *</Label>
                    <Input
                      id="user_name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter user/assignee name"
                      required
                    />
                  </div>

                  {/* Remote ID */}
                  <div className="space-y-2">
                    <Label htmlFor="remote_id">Remote ID</Label>
                    <Input
                      id="remote_id"
                      value={remoteId}
                      onChange={(e) => setRemoteId(e.target.value)}
                      placeholder="Enter remote ID (optional)"
                    />
                  </div>
                </div>

                {/* Specification */}
                <div className="space-y-2">
                  <Label htmlFor="specification">Specification</Label>
                  <Textarea
                    id="specification"
                    value={specification}
                    onChange={(e) => setSpecification(e.target.value)}
                    placeholder="Enter product specifications and technical details (optional)"
                    rows={3}
                  />
                </div>
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
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  {/* Shop Contact */}
                  <div className="space-y-2">
                    <Label htmlFor="shop_contact">Shop Contact *</Label>
                    <Input
                      id="shop_contact"
                      value={shopContact}
                      onChange={(e) => setShopContact(e.target.value)}
                      placeholder="Contact number or name"
                      required
                    />
                  </div>

                  {/* Serial Number (S.no) */}
                  <div className="space-y-2">
                    <Label htmlFor="serial_no">S.No</Label>
                    <Input
                      id="serial_no"
                      value={serialNo}
                      onChange={(e) => setSerialNo(e.target.value)}
                      placeholder="Serial/Model number (optional)"
                    />
                  </div>

                  {/* Brand Name */}
                  <div className="space-y-2">
                    <Label htmlFor="brand_name">Brand Name *</Label>
                    <Input
                      id="brand_name"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Enter brand name"
                      required
                    />
                  </div>

                  {/* Warranty */}
                  <div className="space-y-2">
                    <Label htmlFor="warranty">Warranty</Label>
                    <Input
                      id="warranty"
                      value={warranty}
                      onChange={(e) => setWarranty(e.target.value)}
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
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
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
                      value={price}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
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
                    value={specification}
                    onChange={(e) => setSpecification(e.target.value)}
                    placeholder="Product specifications (optional)"
                    rows={3}
                  />
                </div>
              </>
            )}

            {/* Photo Upload */}
            <div className="space-y-3">
              <Label>Product Photos *</Label>
              <MultipleImageUpload
                onImagesChange={handleImagesChange}
                maxImages={5}
                maxSizeMB={5}
                acceptAllTypes={false}
                label="Upload actual product images (Required)"
              />
              <p className="text-sm text-gray-500">
                Upload clear images of the purchased product for admin verification.
              </p>
            </div>

            {/* Selected Images Preview */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                <Label>Selected Images ({selectedFiles.length})</Label>
                <div className="grid grid-cols-2 gap-4">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Product image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          const newFiles = selectedFiles.filter((_, i) => i !== index);
                          setSelectedFiles(newFiles);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isUploading || isUploadingImages}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={
              isUploading || 
              isUploadingImages || 
              !productName.trim() || 
              (requestType === 'system' && (!brandName.trim() || !userName.trim())) ||
              (requestType === 'common' && (!shopContact.trim() || !brandName.trim() || quantity <= 0 || price < 0)) ||
              selectedFiles.length === 0
            }
            className="min-w-[120px]"
          >
            {isUploadingImages ? 'Uploading...' : 'Submit Product Details'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
