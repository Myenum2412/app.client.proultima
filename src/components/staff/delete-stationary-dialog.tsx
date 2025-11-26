'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { StationaryItem } from '@/hooks/use-stationary';

interface DeleteStationaryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: StationaryItem | null;
  onDelete: (itemId: string) => void;
  isDeleting?: boolean;
}

export function DeleteStationaryDialog({
  isOpen,
  onOpenChange,
  item,
  onDelete,
  isDeleting = false,
}: DeleteStationaryDialogProps) {
  const handleDelete = () => {
    if (!item) return;
    onDelete(item.id);
    onOpenChange(false);
  };

  if (!item) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Stationary Item</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{item.item_name}</strong>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


