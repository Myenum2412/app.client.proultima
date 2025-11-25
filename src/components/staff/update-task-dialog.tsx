'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/hooks/use-tasks';
import { useTaskProofs } from '@/hooks/use-task-proofs';
import { useTaskStatuses } from '@/hooks/use-task-statuses';
import { RescheduleTaskDialog } from './reschedule-task-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TaskProofUpload } from './task-proof-upload';
import type { Task, TaskStatus } from '@/types';

interface UpdateTaskDialogProps {
  task: Task;
}

export function UpdateTaskDialog({ task }: UpdateTaskDialogProps) {
  const { user } = useAuth();
  const { updateTask } = useTasks();
  const { uploadProofImage, createProof } = useTaskProofs();
  const { statuses } = useTaskStatuses();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [withProof, setWithProof] = useState(false);
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofNotes, setProofNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setStatus(task.status);
      setWithProof(false);
      setProofImage(null);
      setProofNotes('');
    }
  }, [open, task.status]);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus as TaskStatus);
    
    // If user selects 'rescheduled', close update dialog and open reschedule dialog
    if (newStatus === 'rescheduled') {
      setOpen(false); // Close the update dialog
      setTimeout(() => {
        setShowRescheduleDialog(true); // Open reschedule dialog after transition
      }, 100);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (status === task.status && !withProof) {
      toast.info('No changes to save');
      return;
    }

    if (withProof && !proofImage) {
      toast.error('Please upload a proof image');
      return;
    }

    if (!user?.staffId) {
      toast.error('User not authenticated');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload proof image if provided
      let proofImageUrl = '';
      if (withProof && proofImage) {
        setIsUploadingProof(true);
        proofImageUrl = await uploadProofImage(proofImage, task.id);
        setIsUploadingProof(false);
      }

      // Update task status
      await updateTask({
        id: task.id,
        title: task.title,
        description: task.description,
        allocation_mode: task.allocation_mode,
        status,
        priority: task.priority,
        due_date: task.due_date,
        start_date: task.start_date,
        is_repeated: task.is_repeated,
        repeat_config: task.repeat_config,
        assigned_staff_ids: task.assigned_staff_ids,
        assigned_team_ids: task.assigned_team_ids,
      });

      // Create proof record if image was uploaded
      if (withProof && proofImageUrl) {
        createProof({
          task_id: task.id,
          staff_id: user.staffId,
          status,
          proof_image_url: proofImageUrl,
          notes: proofNotes || undefined,
        });
      }
      
      // Trigger real-time update event
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      
      const message = withProof 
        ? 'Task updated with proof! Awaiting admin verification.'
        : 'Task status updated successfully!';
      toast.success(message);
      setOpen(false);
      
      // Reset form
      setWithProof(false);
      setProofImage(null);
      setProofNotes('');
      setStatus(task.status);

    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Edit className="h-3 w-3 mr-1" />
            <span className='max-sm:hidden'>Update</span>
          </Button>
        </DialogTrigger>
        <DialogContent 
          className="sm:max-w-[600px] max-w-[95vw] w-full h-[90vh] max-h-[90vh] flex flex-col p-0 overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {/* Fixed Header */}
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b bg-background shrink-0 flex-shrink-0">
            <DialogTitle className="text-lg sm:text-xl">Update Task Status</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm mt-1">
              Change the status of &quot;{task.title}&quot;
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Scrollable Content Area */}
            <div 
              className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 min-h-0 overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              style={{
                overflowY: 'auto',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                maxHeight: '100%',
              }}
            >
              {/* Mobile View - Essential Information Only */}
              <div className="block sm:hidden space-y-4">
                {/* Task Title */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Task Title</Label>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-sm">
                    <p className="text-foreground font-medium break-words">{task.title}</p>
                  </div>
                </div>

                {/* Description */}
                {task.description && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Description</Label>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-sm">
                      <p className="text-muted-foreground break-words whitespace-pre-wrap">{task.description}</p>
                    </div>
                  </div>
                )}

                {/* Due Date */}
                {task.due_date && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Due Date</Label>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-sm">
                      <p className="text-muted-foreground">{new Date(task.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}

                {/* Update Status */}
                <div className="space-y-2">
                  <Label htmlFor="status-mobile" className="text-sm font-semibold">Update Status</Label>
                  <Select value={status} onValueChange={handleStatusChange}>
                    <SelectTrigger id="status-mobile" className="w-full h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((statusOption) => (
                        <SelectItem key={statusOption.id} value={statusOption.name}>
                          {statusOption.name.charAt(0).toUpperCase() + statusOption.name.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Add proof option - Mobile */}
                <div className="flex items-start space-x-3 pt-1">
                  <Checkbox
                    id="with-proof-mobile"
                    checked={withProof}
                    onCheckedChange={(checked) => setWithProof(checked as boolean)}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="with-proof-mobile"
                    className="text-sm font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                  >
                    Upload proof image for this update
                  </Label>
                </div>

                {/* Proof upload section - Mobile */}
                {withProof && (
                  <div className="pt-2">
                    <TaskProofUpload
                      onImageSelect={setProofImage}
                      onNotesChange={setProofNotes}
                      isUploading={isUploadingProof}
                    />
                  </div>
                )}
              </div>

              {/* Desktop View - 2 Column Layout */}
              <div className="hidden sm:grid sm:grid-cols-2 gap-4">
                {/* Column 1 */}
                <div className="space-y-4">
                  {/* Task Title */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Task Title</Label>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-sm min-h-[44px] flex items-center">
                      <p className="text-foreground font-medium break-words">{task.title}</p>
                    </div>
                  </div>

                  {/* Description */}
                  {task.description && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Description</Label>
                      <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-sm min-h-[80px]">
                        <p className="text-muted-foreground break-words whitespace-pre-wrap">{task.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Current Status */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Current Status</Label>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-sm min-h-[44px] flex items-center">
                      <span className="capitalize text-muted-foreground">{task.status.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Priority</Label>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-sm min-h-[44px] flex items-center">
                      <span className="capitalize text-muted-foreground">{task.priority}</span>
                    </div>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-4">
                  {/* Due Date */}
                  {task.due_date && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Due Date</Label>
                      <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-sm min-h-[44px] flex items-center">
                        <span className="text-muted-foreground">{new Date(task.due_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Update Status */}
          <div className="space-y-2">
                    <Label htmlFor="status-desktop" className="text-sm font-semibold">Update Status</Label>
            <Select value={status} onValueChange={handleStatusChange}>
                      <SelectTrigger id="status-desktop" className="w-full h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((statusOption) => (
                  <SelectItem key={statusOption.id} value={statusOption.name}>
                    {statusOption.name.charAt(0).toUpperCase() + statusOption.name.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Add proof option */}
                  <div className="flex items-start space-x-3 pt-1">
            <Checkbox
              id="with-proof"
              checked={withProof}
              onCheckedChange={(checked) => setWithProof(checked as boolean)}
                      className="mt-0.5"
            />
            <Label
              htmlFor="with-proof"
                      className="text-sm font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
            >
              Upload proof image for this update
            </Label>
          </div>

          {/* Proof upload section */}
          {withProof && (
                    <div className="pt-2">
            <TaskProofUpload
              onImageSelect={setProofImage}
              onNotesChange={setProofNotes}
              isUploading={isUploadingProof}
            />
                    </div>
                  )}
            </div>
              </div>
          </div>

            {/* Fixed Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 bg-background shrink-0 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
                className="w-full sm:w-auto h-10 sm:h-9"
            >
              Cancel
            </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || (status === task.status && !withProof) || (withProof && !proofImage)}
                className="w-full sm:w-auto h-10 sm:h-9"
              >
              {isSubmitting || isUploadingProof ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog - Controlled */}
      <RescheduleTaskDialog
        task={task}
        trigger={<div style={{ display: 'none' }} />}
        isOpen={showRescheduleDialog}
        onOpenChange={setShowRescheduleDialog}
      />
    </>
  );
}