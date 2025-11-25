'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, Plus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getTaskStatuses, addTaskStatus, updateTaskStatus, removeTaskStatus } from '@/lib/actions/adminActions';
import { useTaskStatuses } from '@/hooks/use-task-statuses';

const colorOptions = [
  { value: 'gray', label: 'Gray', color: 'bg-gray-500' },
  { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
  { value: 'green', label: 'Green', color: 'bg-green-500' },
  { value: 'yellow', label: 'Yellow', color: 'bg-yellow-500' },
  { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
  { value: 'red', label: 'Red', color: 'bg-red-500' },
  { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
  { value: 'pink', label: 'Pink', color: 'bg-pink-500' },
];

export function TaskStatusManager() {
  const { statuses, isLoading, refetch } = useTaskStatuses();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: 'gray',
    display_order: 99,
  });

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      toast.error('Status name is required');
      return;
    }

    try {
      const result = await addTaskStatus(formData.name, formData.color, formData.display_order);
      if (result.success) {
        toast.success('Status added successfully');
        setIsAddDialogOpen(false);
        setFormData({ name: '', color: 'gray', display_order: 99 });
        refetch();
      } else {
        toast.error(result.error || 'Failed to add status');
      }
    } catch (error) {
      toast.error('Failed to add status');
    }
  };

  const handleEdit = async () => {
    if (!editingStatus || !formData.name.trim()) {
      toast.error('Status name is required');
      return;
    }

    try {
      const result = await updateTaskStatus(editingStatus.id, {
        name: formData.name,
        color: formData.color,
        display_order: formData.display_order,
      });
      if (result.success) {
        toast.success('Status updated successfully');
        setIsEditDialogOpen(false);
        setEditingStatus(null);
        setFormData({ name: '', color: 'gray', display_order: 99 });
        refetch();
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (status: any) => {
    if (status.name === 'completed') {
      toast.error('Cannot delete the "completed" status as it is system-critical');
      return;
    }

    if (!confirm(`Are you sure you want to delete the status "${status.name}"?`)) {
      return;
    }

    try {
      const result = await removeTaskStatus(status.id);
      if (result.success) {
        toast.success('Status deleted successfully');
        refetch();
      } else {
        toast.error(result.error || 'Failed to delete status');
      }
    } catch (error) {
      toast.error('Failed to delete status');
    }
  };

  const openEditDialog = (status: any) => {
    setEditingStatus(status);
    setFormData({
      name: status.name,
      color: status.color,
      display_order: status.display_order,
    });
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading statuses...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Task Status Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage task status options that appear in dropdowns throughout the system.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Status
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Status Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., In Review"
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${option.color}`} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 99 })}
                  placeholder="99"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd}>Add Status</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {statuses.map((status) => (
          <div key={status.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full bg-${status.color}-500`} />
              <div>
                <div className="font-medium capitalize">{status.name}</div>
                <div className="text-sm text-muted-foreground">
                  Order: {status.display_order} • Color: {status.color}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEditDialog(status)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(status)}
                disabled={status.name === 'completed'}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {statuses.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>No status options found. Add your first status to get started.</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Status Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., In Review"
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Color</Label>
              <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${option.color}`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-display_order">Display Order</Label>
              <Input
                id="edit-display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 99 })}
                placeholder="99"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit}>Update Status</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
