'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import type { GroceryRequest } from '@/types';

interface GroceryDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groceryRequest: GroceryRequest | null;
}

export function GroceryDetailsDialog({ isOpen, onClose, groceryRequest }: GroceryDetailsDialogProps) {
  if (!groceryRequest) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stationary Request Details</DialogTitle>
          <DialogDescription>
            View detailed information about this stationary request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <Badge className={getStatusColor(groceryRequest.status)}>
              {groceryRequest.status.charAt(0).toUpperCase() + groceryRequest.status.slice(1)}
            </Badge>
          </div>

          <Separator />

          {/* Request Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Staff Name</label>
                <p className="text-sm">{groceryRequest.staff_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Branch</label>
                <p className="text-sm">{groceryRequest.branch}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Requested Date</label>
                <p className="text-sm">
                  {format(new Date(groceryRequest.requested_date), 'PPP p')}
                </p>
              </div>
              {groceryRequest.approved_at && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {groceryRequest.status === 'approved' ? 'Approved' : 'Rejected'} Date
                  </label>
                  <p className="text-sm">
                    {format(new Date(groceryRequest.approved_at), 'PPP p')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Requested Items</h3>
              <span className="text-sm text-gray-500">
                {groceryRequest.items?.length || 0} item(s)
              </span>
            </div>

            {groceryRequest.items && groceryRequest.items.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groceryRequest.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.item_name}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">₹{item.unit_price.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">₹{item.total_amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No items found for this request.
              </div>
            )}
          </div>

          {/* Total Amount */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Total Request Amount</span>
              <span className="text-2xl font-bold text-green-600">
                ₹{(groceryRequest.total_request_amount || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Notes */}
          {groceryRequest.notes && (
            <div>
              <label className="text-sm font-medium text-gray-500">Notes</label>
              <p className="text-sm mt-1 p-3 bg-gray-50 rounded-lg">
                {groceryRequest.notes}
              </p>
            </div>
          )}

          <Separator />

          {/* Admin Response */}
          {(groceryRequest.admin_notes || groceryRequest.rejection_reason) && (
            <div>
              <label className="text-sm font-medium text-gray-500">
                {groceryRequest.status === 'rejected' ? 'Rejection Reason' : 'Admin Notes'}
              </label>
              <p className="text-sm mt-1 p-3 bg-gray-50 rounded-lg">
                {groceryRequest.rejection_reason || groceryRequest.admin_notes}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}