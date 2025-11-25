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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  Calendar, 
  Clock, 
  User, 
  Users, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  Paperclip,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { TaskProofUpload } from './task-proof-upload';
import { format } from 'date-fns';
import type { Task, TaskStatus } from '@/types';

interface UpdateTaskStatusDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdateTaskStatusDialog({ task, open, onOpenChange }: UpdateTaskStatusDialogProps) {
  const { user } = useAuth();
  const { updateTask } = useTasks();
  const { uploadProofImage, createProof } = useTaskProofs();
  const { statuses } = useTaskStatuses();
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo');
  const [withProof, setWithProof] = useState(false);
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofNotes, setProofNotes] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);

  // Reset form when dialog opens or task changes
  useEffect(() => {
    if (open && task) {
      setStatus(task.status);
      setWithProof(false);
      setProofImage(null);
      setProofNotes('');
      setRemarks('');
    }
  }, [open, task]);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus as TaskStatus);
    
    // If user selects 'rescheduled', close update dialog and open reschedule dialog
    if (newStatus === 'rescheduled') {
      onOpenChange(false);
      setTimeout(() => {
        setShowRescheduleDialog(true);
      }, 100);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task) return;
    
    if (status === task.status && !withProof && !remarks.trim()) {
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
          notes: proofNotes || remarks || undefined,
        });
      }
      
      // Trigger real-time update event
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      
      const message = withProof 
        ? 'Task updated with proof! Awaiting admin verification.'
        : 'Task status updated successfully!';
      toast.success(message);
      onOpenChange(false);
      
      // Reset form
      setWithProof(false);
      setProofImage(null);
      setProofNotes('');
      setRemarks('');
      setStatus(task.status);

    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task status');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'todo': return 'bg-yellow-100 text-yellow-800';
      case 'backlog': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-[95vw] sm:w-[90vw] md:w-[85vw] max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b flex-shrink-0">
            <DialogTitle className="text-xl sm:text-2xl font-bold">Update Task Status</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Review task details and update the status
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0">
            <div className="px-4 sm:px-6 py-4">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* Task Overview Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                        Task Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Task Title</Label>
                        <p className="text-sm sm:text-base font-semibold mt-1 break-words">{task.title}</p>
                      </div>

                      {task.description && (
                        <div>
                          <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Description</Label>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">{task.description}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Task Number</Label>
                          <p className="text-xs sm:text-sm font-mono mt-1 break-all">{task.task_no || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Current Status</Label>
                          <div className="mt-1 sm:mt-2">
                            <Badge className={`${getStatusColor(task.status)} text-xs`}>
                              {task.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Priority</Label>
                          <div className="mt-1 sm:mt-2">
                            <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
                              {task.priority.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Allocation Mode</Label>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {task.allocation_mode === 'team' ? (
                              <Users className="h-3 w-3 mr-1" />
                            ) : (
                              <User className="h-3 w-3 mr-1" />
                            )}
                            {task.allocation_mode === 'team' ? 'Team' : 'Individual'}
                          </Badge>
                        </div>
                        {task.start_date && (
                          <div>
                            <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Start Date</Label>
                            <p className="text-xs sm:text-sm mt-1">
                              {format(new Date(task.start_date), 'PPP')}
                            </p>
                          </div>
                        )}
                        {task.due_date && (
                          <div>
                            <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Due Date</Label>
                            <p className="text-xs sm:text-sm mt-1">
                              {format(new Date(task.due_date), 'PPP')}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>


                  <Separator className="my-4 sm:my-6" />

                  {/* Status Update Section */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        Update Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-xs sm:text-sm font-medium">New Status</Label>
                        <Select value={status} onValueChange={handleStatusChange}>
                          <SelectTrigger id="status" className="h-9 sm:h-10 w-full text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((statusOption) => (
                              <SelectItem key={statusOption.id} value={statusOption.name}>
                                {statusOption.name.charAt(0).toUpperCase() + statusOption.name.slice(1).replace('_', ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Remarks Section */}
                      <div className="space-y-2">
                        <Label htmlFor="remarks" className="text-xs sm:text-sm font-medium">Remarks (Optional)</Label>
                        <Textarea
                          id="remarks"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Add any remarks or notes about this status update..."
                          className="min-h-[80px] sm:min-h-[100px] resize-none w-full text-sm"
                        />
                      </div>

                      {/* Add proof option */}
                      <div className="flex items-start sm:items-center space-x-2">
                        <Checkbox
                          id="with-proof"
                          checked={withProof}
                          onCheckedChange={(checked) => setWithProof(checked as boolean)}
                          className="mt-1 sm:mt-0"
                        />
                        <Label
                          htmlFor="with-proof"
                          className="text-xs sm:text-sm font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          Upload proof image for this update
                        </Label>
                      </div>

                      {/* Proof upload section */}
                      {withProof && (
                        <TaskProofUpload
                          onImageSelect={setProofImage}
                          onNotesChange={setProofNotes}
                          isUploading={isUploadingProof}
                        />
                      )}
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 sm:pt-4 border-t mt-4 sm:mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto text-sm"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || (status === task.status && !withProof && !remarks.trim()) || (withProof && !proofImage)}
                      className="w-full sm:w-auto text-sm"
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
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog - Controlled */}
      {task && (
        <RescheduleTaskDialog
          task={task}
          trigger={<div style={{ display: 'none' }} />}
          isOpen={showRescheduleDialog}
          onOpenChange={setShowRescheduleDialog}
        />
      )}
    </>
  );
}

