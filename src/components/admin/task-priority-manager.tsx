"use client";

import { useState } from "react";
import { useTaskPriorities } from "@/hooks/use-task-priorities";
import { addTaskPriority, updateTaskPriority, removeTaskPriority } from "@/lib/actions/adminActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, GripVertical, Palette } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface TaskPriorityManagerProps {
  className?: string;
}

export function TaskPriorityManager({ className }: TaskPriorityManagerProps) {
  const { priorities, isLoading, error } = useTaskPriorities();
  const queryClient = useQueryClient();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPriority, setEditingPriority] = useState<any>(null);
  const [newPriority, setNewPriority] = useState({ name: "", color: "#3B82F6" });
  const [editPriority, setEditPriority] = useState({ name: "", color: "#3B82F6" });

  const handleAddPriority = async () => {
    if (!newPriority.name.trim()) {
      toast.error("Priority name is required");
      return;
    }

    try {
      const result = await addTaskPriority(
        newPriority.name.trim(),
        newPriority.color,
        priorities.length + 1
      );

      if (result.success) {
        toast.success("Priority added successfully");
        setNewPriority({ name: "", color: "#3B82F6" });
        setIsAddDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ['task-priorities'] });
      } else {
        toast.error(result.error || "Failed to add priority");
      }
    } catch (error) {
      console.error("Error adding priority:", error);
      toast.error("Failed to add priority");
    }
  };

  const handleEditPriority = async () => {
    if (!editingPriority || !editPriority.name.trim()) {
      toast.error("Priority name is required");
      return;
    }

    try {
      const result = await updateTaskPriority(editingPriority.id, {
        name: editPriority.name.trim(),
        color: editPriority.color,
      });

      if (result.success) {
        toast.success("Priority updated successfully");
        setEditingPriority(null);
        setEditPriority({ name: "", color: "#3B82F6" });
        setIsEditDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ['task-priorities'] });
      } else {
        toast.error(result.error || "Failed to update priority");
      }
    } catch (error) {
      console.error("Error updating priority:", error);
      toast.error("Failed to update priority");
    }
  };

  const handleDeletePriority = async (priority: any) => {
    try {
      const result = await removeTaskPriority(priority.id);

      if (result.success) {
        toast.success("Priority deleted successfully");
        queryClient.invalidateQueries({ queryKey: ['task-priorities'] });
      } else {
        toast.error(result.error || "Failed to delete priority");
      }
    } catch (error) {
      console.error("Error deleting priority:", error);
      toast.error("Failed to delete priority");
    }
  };

  const openEditDialog = (priority: any) => {
    setEditingPriority(priority);
    setEditPriority({ name: priority.name, color: priority.color });
    setIsEditDialogOpen(true);
  };

  const predefinedColors = [
    "#10B981", // Green
    "#F59E0B", // Yellow
    "#EF4444", // Red
    "#DC2626", // Dark Red
    "#3B82F6", // Blue
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#6B7280", // Gray
  ];

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Task Priorities</CardTitle>
          <CardDescription>Manage task priority levels and colors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading priorities...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Task Priorities</CardTitle>
          <CardDescription>Manage task priority levels and colors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-destructive">Error loading priorities</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Task Priorities</CardTitle>
            <CardDescription>Manage task priority levels and colors</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Priority
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Priority</DialogTitle>
                <DialogDescription>
                  Create a new task priority level with custom color.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="priority-name">Priority Name</Label>
                  <Input
                    id="priority-name"
                    value={newPriority.name}
                    onChange={(e) => setNewPriority({ ...newPriority, name: e.target.value })}
                    placeholder="e.g., Critical, High, Medium, Low"
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex gap-2">
                      {predefinedColors.map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 ${
                            newPriority.color === color ? 'border-gray-900' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewPriority({ ...newPriority, color })}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="color"
                        value={newPriority.color}
                        onChange={(e) => setNewPriority({ ...newPriority, color: e.target.value })}
                        className="w-12 h-8 p-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: newPriority.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    Preview: {newPriority.name || "Priority Name"}
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPriority}>
                  Add Priority
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {priorities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No priorities configured. Add your first priority to get started.
            </div>
          ) : (
            priorities.map((priority, index) => (
              <div
                key={priority.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: priority.color }}
                  />
                  <div>
                    <div className="font-medium capitalize">{priority.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Order: {priority.display_order}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {priority.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(priority)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Priority</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the "{priority.name}" priority? 
                          This action cannot be undone and may affect existing tasks.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeletePriority(priority)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Priority</DialogTitle>
              <DialogDescription>
                Update the priority name and color.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-priority-name">Priority Name</Label>
                <Input
                  id="edit-priority-name"
                  value={editPriority.name}
                  onChange={(e) => setEditPriority({ ...editPriority, name: e.target.value })}
                  placeholder="e.g., Critical, High, Medium, Low"
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-2">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${
                          editPriority.color === color ? 'border-gray-900' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setEditPriority({ ...editPriority, color })}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="color"
                      value={editPriority.color}
                      onChange={(e) => setEditPriority({ ...editPriority, color: e.target.value })}
                      className="w-12 h-8 p-1"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: editPriority.color }}
                />
                <span className="text-sm text-muted-foreground">
                  Preview: {editPriority.name || "Priority Name"}
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditPriority}>
                Update Priority
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
