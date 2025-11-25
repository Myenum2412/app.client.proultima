'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTaskReschedules } from '@/hooks/use-task-reschedules';
import { useAuth } from '@/contexts/auth-context';
import type { Task } from '@/types';

interface RescheduleTaskDialogProps {
  task: Task;
  trigger: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function RescheduleTaskDialog({ task, trigger, isOpen: controlledOpen, onOpenChange }: RescheduleTaskDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createReschedule, isCreating } = useTaskReschedules();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate) {
      alert('Please select a new date');
      return;
    }
    
    if (!reason.trim()) {
      alert('Please provide a reason for rescheduling');
      return;
    }

    // Check if the new date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newDate = new Date(selectedDate);
    newDate.setHours(0, 0, 0, 0);
    
    if (newDate <= today) {
      alert('The new date must be in the future');
      return;
    }

    setIsSubmitting(true);

    try {
      await createReschedule({
        task_id: task.id,
        staff_id: user?.id || '',
        reason: reason.trim(),
        requested_new_date: selectedDate.toISOString(),
        original_due_date: task.due_date,
      });

      setIsOpen(false);
      setReason('');
      setSelectedDate(undefined);
    } catch (error) {
      console.error('Error creating reschedule request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setReason('');
      setSelectedDate(undefined);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule Task</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Task</Label>
            <div className="p-3 bg-muted rounded-md">
              <div className="font-medium">{task.title}</div>
              {task.task_no && (
                <div className="text-sm text-muted-foreground">#{task.task_no}</div>
              )}
              {task.due_date && (
                <div className="text-sm text-muted-foreground">
                  Current due date: {format(new Date(task.due_date), 'PPP')}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Rescheduling *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you need to reschedule this task..."
              className="min-h-[100px]"
              maxLength={500}
              required
            />
            <div className="text-xs text-muted-foreground">
              {reason.length}/500 characters
            </div>
          </div>

          <div className="space-y-2">
            <Label>New Due Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Select new date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date <= new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <div className="text-xs text-muted-foreground">
              Select a future date for the new due date
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedDate || !reason.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
