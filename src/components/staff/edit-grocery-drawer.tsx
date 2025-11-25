'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { GroceryRequest, UpdateGroceryRequestData, GroceryRequestItem } from '@/types';
import { Plus, Trash2 } from 'lucide-react';

interface EditGroceryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateGroceryRequestData) => void;
  groceryRequest: GroceryRequest | null;
  isSubmitting?: boolean;
}

export function EditGroceryDrawer({ 
  isOpen, 
  onClose, 
  onSubmit, 
  groceryRequest, 
  isSubmitting = false 
}: EditGroceryDrawerProps) {
  const [formData, setFormData] = useState<UpdateGroceryRequestData>({
    notes: '',
    items: [],
  });

  // Pre-fill form when grocery request changes
  useEffect(() => {
    if (groceryRequest) {
      setFormData({
        notes: groceryRequest.notes || '',
        items: groceryRequest.items || [],
      });
    }
  }, [groceryRequest]);

  // Auto-calculate total amount for each item
  useEffect(() => {
    const updatedItems = formData.items?.map(item => ({
      ...item,
      total_amount: item.quantity * item.unit_price
    })) || [];
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  }, [formData.items?.map(item => `${item.quantity}-${item.unit_price}`).join(',')]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groceryRequest || !formData.items || formData.items.length === 0 || formData.items.some(item => !item.item_name.trim())) {
      return;
    }
    onSubmit(groceryRequest.id, formData);
  };

  const handleInputChange = (field: keyof UpdateGroceryRequestData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof GroceryRequestItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ) || []
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), {
        item_name: '',
        unit: 'Pcs',
        quantity: 1,
        unit_price: 0,
        total_amount: 0,
      }]
    }));
  };

  const removeItem = (index: number) => {
    if ((formData.items?.length || 0) > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items?.filter((_, i) => i !== index) || []
      }));
    }
  };

  const handleClose = () => {
    setFormData({
      notes: '',
      items: [],
    });
    onClose();
  };

  const totalRequestAmount = (formData.items || []).reduce((sum, item) => sum + item.total_amount, 0);
  const hasValidItems = (formData.items?.length || 0) > 0 && (formData.items || []).every(item => item.item_name.trim() && item.quantity > 0 && item.unit_price >= 0);

  if (!groceryRequest) return null;

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh] mx-auto max-w-4xl">
        <DrawerHeader className="border-b">
          <DrawerTitle>Edit Stationary Request</DrawerTitle>
          <DrawerDescription>
            Update your stationary request details.
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="overflow-y-auto px-4 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Items Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Item Name *</TableHead>
                      <TableHead className="w-[100px]">Unit *</TableHead>
                      <TableHead className="w-[80px]">Quantity *</TableHead>
                      <TableHead className="w-[100px]">Unit Price *</TableHead>
                      <TableHead className="w-[100px]">Total Amount</TableHead>
                      <TableHead className="w-[60px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(formData.items || []).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            value={item.item_name}
                            onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                            placeholder="Enter item name"
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.unit}
                            onValueChange={(value: 'Box' | 'Pcs' | 'Rim' | 'Count') => handleItemChange(index, 'unit', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pcs">Pcs</SelectItem>
                              <SelectItem value="Box">Box</SelectItem>
                              <SelectItem value="Rim">Rim</SelectItem>
                              <SelectItem value="Count">Count</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.total_amount.toFixed(2)}
                            disabled
                            className="bg-gray-50 font-semibold"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            disabled={(formData.items?.length || 0) === 1}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Total Amount */}
            <div className="flex justify-end">
              <div className="text-right">
                <Label className="text-lg font-semibold">Total Request Amount: ₹{totalRequestAmount.toFixed(2)}</Label>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional notes or specifications..."
                rows={3}
              />
            </div>
          </form>
        </div>

        <DrawerFooter className="border-t mx-auto w-full max-w-[300px]">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !hasValidItems}
              className="flex-1"
            >
              {isSubmitting ? 'Updating...' : 'Update Request'}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}