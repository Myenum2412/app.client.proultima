"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addTaskPriority, removeTaskPriority, updateTaskPriority } from "@/lib/actions/adminActions";
import { useTaskPriorities } from "@/hooks/use-task-priorities";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit, ListFilter } from "lucide-react";
import type { TaskPriorityOption } from "@/types";

const colorOptions = [
  { value: "red", label: "Red", className: "bg-red-100 text-red-800" },
  { value: "orange", label: "Orange", className: "bg-orange-100 text-orange-800" },
  { value: "yellow", label: "Yellow", className: "bg-yellow-100 text-yellow-800" },
  { value: "green", label: "Green", className: "bg-green-100 text-green-800" },
  { value: "blue", label: "Blue", className: "bg-blue-100 text-blue-800" },
  { value: "gray", label: "Gray", className: "bg-gray-100 text-gray-800" },
];

export function TaskPriorityManager() {
  const { user } = useAuth();
  const { priorities, refetch } = useTaskPriorities();
  const [loading, setLoading] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPriority, setEditingPriority] = useState<TaskPriorityOption | null>(null);
  
  const [newPriority, setNewPriority] = useState({
    name: "",
    color: "gray",
  });

  const [editPriority, setEditPriority] = useState({
    name: "",
    color: "gray",
  });

  const handleAdd = async () => {
    if (!newPriority.name.trim()) {
      toast.error("Please enter a priority name");
      return;
    }

    setLoading("add");

    try {
      const result = await addTaskPriority(newPriority.name, newPriority.color);

      if (result.success) {
        toast.success("Priority added successfully!");
        setNewPriority({ name: "", color: "gray" });
        setIsAddDialogOpen(false);
        refetch();
      } else {
        toast.error(result.error || "Failed to add priority");
      }
    } catch (error) {
      console.error("Add priority error:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(null);
    }
  };

  const handleEdit = async () => {
    if (!editingPriority || !editPriority.name.trim()) {
      toast.error("Please enter a priority name");
      return;
    }

    setLoading(`edit-${editingPriority.id}`);

    try {
      const result = await updateTaskPriority(editingPriority.id, {
        name: editPriority.name,
        color: editPriority.color,
      });

      if (result.success) {
        toast.success("Priority updated successfully!");
        setIsEditDialogOpen(false);
        setEditingPriority(null);
        refetch();
      } else {
        toast.error(result.error || "Failed to update priority");
      }
    } catch (error) {
      console.error("Update priority error:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(null);
    }
  };

  const handleRemove = async (priority: TaskPriorityOption) => {
    if (!confirm(`Are you sure you want to delete "${priority.name}"? This cannot be undone.`)) {
      return;
    }

    setLoading(`remove-${priority.id}`);

    try {
      const result = await removeTaskPriority(priority.id);

      if (result.success) {
        toast.success("Priority removed successfully!");
        refetch();
      } else {
        toast.error(result.error || "Failed to remove priority");
      }
    } catch (error) {
      console.error("Remove priority error:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(null);
    }
  };

  const openEditDialog = (priority: TaskPriorityOption) => {
    setEditingPriority(priority);
    setEditPriority({
      name: priority.name,
      color: priority.color,
    });
    setIsEditDialogOpen(true);
  };

  const getColorClass = (color: string) => {
    const colorOption = colorOptions.find(opt => opt.value === color);
    return colorOption?.className || "bg-gray-100 text-gray-800";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListFilter className="h-5 w-5" />
          Task Priority Management
        </CardTitle>
        <CardDescription>
          Manage task priority options for the system. These will appear in task creation and filtering.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add New Priority Button */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Priority
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Priority</DialogTitle>
                <DialogDescription>
                  Create a new task priority option.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="priority-name">Priority Name</Label>
                  <Input
                    id="priority-name"
                    placeholder="e.g., Critical, Low, Medium"
                    value={newPriority.name}
                    onChange={(e) => setNewPriority({ ...newPriority, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority-color">Color</Label>
                  <Select
                    value={newPriority.color}
                    onValueChange={(value) => setNewPriority({ ...newPriority, color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getColorClass(color.value)}`} />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={loading === "add"}>
                  {loading === "add" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Add Priority"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Priority Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Priority</DialogTitle>
                <DialogDescription>
                  Update the priority name and color.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-priority-name">Priority Name</Label>
                  <Input
                    id="edit-priority-name"
                    value={editPriority.name}
                    onChange={(e) => setEditPriority({ ...editPriority, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-priority-color">Color</Label>
                  <Select
                    value={editPriority.color}
                    onValueChange={(value) => setEditPriority({ ...editPriority, color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getColorClass(color.value)}`} />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleEdit} 
                  disabled={loading === `edit-${editingPriority?.id}`}
                >
                  {loading === `edit-${editingPriority?.id}` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Update Priority"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Priorities List */}
          <div className="space-y-2">
            <Label>Current Priorities</Label>
            {priorities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No priorities added yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {priorities.map((priority) => (
                  <div
                    key={priority.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${getColorClass(priority.color)}`} />
                      <span className="font-medium capitalize">{priority.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(priority)}
                        disabled={loading === `edit-${priority.id}`}
                      >
                        {loading === `edit-${priority.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Edit className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(priority)}
                        disabled={loading === `remove-${priority.id}`}
                        className="text-destructive hover:text-destructive"
                      >
                        {loading === `remove-${priority.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
