'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { StationaryItem } from '@/hooks/use-stationary';

interface BuyStationaryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: StationaryItem | null;
  onBuy: (itemId: string, quantity: number, staffName: string) => void;
  isBuying?: boolean;
  staffName: string;
}

export function BuyStationaryDialog({
  isOpen,
  onOpenChange,
  item,
  onBuy,
  isBuying = false,
  staffName,
}: BuyStationaryDialogProps) {
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (item) {
      setQuantity(1);
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || quantity <= 0 || quantity > item.quantity) {
      return;
    }
    onBuy(item.id, quantity, staffName);
    onOpenChange(false);
  };

  const handleClose = () => {
    setQuantity(1);
    onOpenChange(false);
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Buy Stationary Item</DialogTitle>
          <DialogDescription>
            Enter the quantity you want to purchase for {item.item_name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">Item Name</Label>
              <Input
                id="item-name"
                value={item.item_name}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="available-quantity">Available Quantity</Label>
              <Input
                id="available-quantity"
                value={`${item.quantity} ${item.unit}`}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Purchase *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={item.quantity}
                value={quantity}
                onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 0)}
                required
                placeholder="Enter quantity"
              />
              {quantity > item.quantity && (
                <p className="text-sm text-destructive">
                  Quantity cannot exceed available quantity ({item.quantity})
                </p>
              )}
              {quantity <= 0 && (
                <p className="text-sm text-destructive">
                  Quantity must be greater than 0
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isBuying}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isBuying ||
                quantity <= 0 ||
                quantity > item.quantity
              }
            >
              {isBuying ? 'Processing...' : 'Buy'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

