'use client';

import { useState } from 'react';
import { useSupportTickets } from '@/hooks/use-support-tickets';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MultipleImageUpload } from '@/components/cashbook/multiple-image-upload';
import { useStaff } from '@/hooks/use-staff';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LifeBuoy, Clock, CheckCircle2, AlertCircle, Eye, Send, Loader2, Plus, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { SupportTicket, SupportTicketCategory, SupportTicketPriority } from '@/types/support';

export default function AdminHelpPage() {
  const { user } = useAuth();
  const { staff: allStaff } = useStaff();
  const { tickets, isLoading, updateTicket, isUpdating, createTicket, isCreating, openCount, inProgressCount, resolvedCount, closedCount } = useSupportTickets();
  const supabase = createClient();
  
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Create ticket dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    user_id: '',
    user_name: '',
    user_email: '',
    user_role: 'staff' as 'staff' | 'admin',
    category: 'bug' as SupportTicketCategory,
    priority: 'medium' as SupportTicketPriority,
    title: '',
    description: '',
  });
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);

  const filteredTickets = filterStatus === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === filterStatus);

  // Upload attachments helper
  const uploadAttachments = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `support/admin/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('support-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('support-attachments')
        .getPublicUrl(fileName);

      return publicUrl;
    });

    return Promise.all(uploadPromises);
  };

  // Reset create form
  const resetCreateForm = () => {
    setCreateFormData({
      user_id: '',
      user_name: '',
      user_email: '',
      user_role: 'staff',
      category: 'bug',
      priority: 'medium',
      title: '',
      description: '',
    });
    setAttachmentFiles([]);
  };

  // Create ticket handler
  const handleCreateTicket = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to create tickets');
      return;
    }

    if (!createFormData.user_id) {
      toast.error('Please select a user for the ticket');
      return;
    }

    try {
      // Upload attachments if any
      let attachmentUrls: string[] = [];
      if (attachmentFiles.length > 0) {
        try {
          attachmentUrls = await uploadAttachments(attachmentFiles);
        } catch (uploadError: any) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload attachments: ${uploadError.message}`);
          return;
        }
      }

      // Create ticket
      await createTicket({
        ...createFormData,
        attachment_urls: attachmentUrls,
      });

      // Reset and close
      setIsCreateDialogOpen(false);
      resetCreateForm();
      toast.success('Ticket created successfully');
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast.error(`Failed to create ticket: ${error.message || 'Unknown error'}`);
    }
  };


  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setAdminResponse(ticket.admin_response || '');
    setNewStatus(ticket.status);
    setIsDialogOpen(true);
  };

  const handleUpdateTicket = () => {
    if (!selectedTicket || !user?.id) return;

    updateTicket(
      {
        id: selectedTicket.id,
        status: newStatus,
        admin_response: adminResponse.trim() || undefined,
        admin_responder_id: user.id,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          setSelectedTicket(null);
          setAdminResponse('');
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Open</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><AlertCircle className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'resolved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Resolved</Badge>;
      case 'closed':
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bug': return '🐛';
      case 'feature': return '✨';
      case 'question': return '❓';
      default: return '📝';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return '';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LifeBuoy className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Help & Support</h1>
            <p className="text-muted-foreground">
              Manage support tickets from staff and users
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed</CardTitle>
            <XCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{closedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Support Tickets</CardTitle>
              <CardDescription>All support tickets from users</CardDescription>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading tickets...
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <LifeBuoy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tickets found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getCategoryIcon(ticket.category)}</span>
                        <h3 className="font-semibold">{ticket.title}</h3>
                        {getStatusBadge(ticket.status)}
                        <span className={`text-xs font-medium uppercase ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="font-mono">{ticket.ticket_no}</span>
                        <span>•</span>
                        <span>{ticket.user_name} ({ticket.user_email})</span>
                        <span>•</span>
                        <span>{format(new Date(ticket.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewTicket(ticket)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
            <DialogDescription>
              View and respond to support ticket
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-6">
              {/* Ticket Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{getCategoryIcon(selectedTicket.category)}</span>
                  <div>
                    <h2 className="text-xl font-semibold">{selectedTicket.title}</h2>
                    <p className="text-sm text-muted-foreground font-mono">{selectedTicket.ticket_no}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <p className="font-medium">{selectedTicket.user_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedTicket.user_email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Priority</Label>
                    <p className={`font-medium capitalize ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Submitted</Label>
                    <p className="font-medium">{format(new Date(selectedTicket.created_at), 'MMM dd, yyyy')}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>

                {selectedTicket.attachment_urls && selectedTicket.attachment_urls.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Attachments ({selectedTicket.attachment_urls.length})</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {selectedTicket.attachment_urls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border rounded-lg p-2 hover:bg-muted transition-colors"
                        >
                          <img src={url} alt={`Attachment ${index + 1}`} className="w-full h-32 object-cover rounded" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Response */}
              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label htmlFor="status">Update Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger id="status" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="response">Admin Response</Label>
                  <Textarea
                    id="response"
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Add your response to the user..."
                    rows={5}
                    className="mt-2"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateTicket}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Update Ticket
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Ticket Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              Create a new support ticket for a user or internal issue
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* User Selection */}
            <div className="space-y-2">
              <Label>Ticket For *</Label>
              <Select 
                value={createFormData.user_role} 
                onValueChange={(value) => {
                  if (value === 'admin') {
                    // Use first staff member as placeholder for admin internal tickets
                    // This avoids FK constraint issues since user_id must reference staff table
                    const firstStaff = allStaff[0];
                    setCreateFormData({
                      ...createFormData,
                      user_role: 'admin',
                      user_id: firstStaff?.id || '',
                      user_name: user?.name || '',
                      user_email: user?.email || '',
                    });
                  } else {
                    setCreateFormData({
                      ...createFormData,
                      user_role: 'staff',
                      user_id: '',
                      user_name: '',
                      user_email: '',
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff Member</SelectItem>
                  <SelectItem value="admin">Admin (Internal)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Staff Dropdown (if staff selected) */}
            {createFormData.user_role === 'staff' && (
              <div className="space-y-2">
                <Label>Select Staff *</Label>
                <Select 
                  value={createFormData.user_id}
                  onValueChange={(value) => {
                    const selectedStaff = allStaff.find(s => s.id === value);
                    if (selectedStaff) {
                      setCreateFormData({
                        ...createFormData,
                        user_id: value,
                        user_name: selectedStaff.name,
                        user_email: selectedStaff.email,
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {allStaff.map(staff => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name} ({staff.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Category and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select 
                  value={createFormData.category}
                  onValueChange={(value) => setCreateFormData({...createFormData, category: value as SupportTicketCategory})}
                >
                  <SelectTrigger>
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
                <Label>Priority *</Label>
                <Select 
                  value={createFormData.priority}
                  onValueChange={(value) => setCreateFormData({...createFormData, priority: value as SupportTicketPriority})}
                >
                  <SelectTrigger>
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
              <Label>Title *</Label>
              <Input
                value={createFormData.title}
                onChange={(e) => setCreateFormData({...createFormData, title: e.target.value})}
                placeholder="Brief description of the issue"
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={createFormData.description}
                onChange={(e) => setCreateFormData({...createFormData, description: e.target.value})}
                placeholder="Detailed information about the issue"
                rows={6}
                maxLength={1000}
              />
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <Label>Attachments (Optional)</Label>
              <MultipleImageUpload
                onImagesChange={setAttachmentFiles}
                maxImages={3}
                maxSizeMB={5}
                acceptAllTypes
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTicket}
                disabled={!createFormData.user_id || !createFormData.title.trim() || !createFormData.description.trim() || isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Create Ticket
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

