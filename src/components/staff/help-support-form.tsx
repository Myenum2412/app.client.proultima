'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useSupportTickets } from '@/hooks/use-support-tickets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultipleImageUpload } from '@/components/cashbook/multiple-image-upload';
import { Loader2, Send, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { SupportTicketCategory, SupportTicketPriority } from '@/types/support';

export function HelpSupportForm() {
  const { user } = useAuth();
  const { createTicket, isCreating } = useSupportTickets();
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SupportTicketCategory>('bug');
  const [priority, setPriority] = useState<SupportTicketPriority>('medium');
  const [description, setDescription] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');

  const uploadAttachments = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `support/${user?.staffId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('support-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('support-attachments')
        .getPublicUrl(fileName);

      return publicUrl;
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.staffId) {
      toast.error('You must be logged in to submit a ticket');
      return;
    }

    try {
      // Upload attachments if any
      let attachmentUrls: string[] = [];
      if (attachmentFiles.length > 0) {
        attachmentUrls = await uploadAttachments(attachmentFiles);
      }

      // Create ticket
      const ticketData = {
        user_id: user.staffId,
        user_name: user.name || '',
        user_email: user.email || '',
        user_role: 'staff' as const,
        category,
        priority,
        title: title.trim(),
        description: description.trim(),
        attachment_urls: attachmentUrls,
      };

      createTicket(ticketData, {
        onSuccess: (result: any) => {
          setIsSubmitted(true);
          setTicketNumber(result.ticket_no);
          
          // Send email notification
          fetch('/api/support/send-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticketNo: result.ticket_no,
              ...ticketData,
            }),
          }).catch(err => console.error('Failed to send email:', err));

          // Reset form
          setTitle('');
          setDescription('');
          setAttachmentFiles([]);
          setCategory('bug');
          setPriority('medium');

          // Show success state for 5 seconds
          setTimeout(() => setIsSubmitted(false), 5000);
        },
      });
    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast.error('Failed to submit ticket');
    }
  };

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4 py-8">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold">Ticket Submitted!</h3>
              <p className="text-muted-foreground mt-2">
                Your support ticket has been submitted successfully.
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium">Ticket Number</p>
              <p className="text-2xl font-mono font-bold text-primary">{ticketNumber}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Our development team will review your ticket and respond soon.
              You can track the status in your tickets history.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Support Ticket</CardTitle>
        <CardDescription>
          Report bugs, request features, or ask questions to our development team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Your Information (read-only) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <Label className="text-xs text-muted-foreground">Your Name</Label>
              <p className="font-medium">{user?.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Role</Label>
              <p className="font-medium">Staff</p>
            </div>
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as SupportTicketCategory)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">🐛 Bug Report</SelectItem>
                  <SelectItem value="feature">✨ Feature Request</SelectItem>
                  <SelectItem value="question">❓ Question</SelectItem>
                  <SelectItem value="other">📝 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as SupportTicketPriority)}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
              maxLength={100}
              required
            />
            <p className="text-xs text-muted-foreground text-right">
              {title.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed information about the issue, including steps to reproduce if it's a bug"
              rows={6}
              maxLength={1000}
              required
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/1000 characters
            </p>
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label>Screenshots (Optional)</Label>
            <MultipleImageUpload
              onImagesChange={setAttachmentFiles}
              maxImages={3}
              maxSizeMB={5}
              label="Upload screenshots or files to help explain the issue"
              acceptAllTypes
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              * Required fields
            </p>
            <Button
              type="submit"
              disabled={isCreating || !title.trim() || !description.trim()}
              size="lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Ticket
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

