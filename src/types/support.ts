export type SupportTicketCategory = 'bug' | 'feature' | 'question' | 'other';
export type SupportTicketPriority = 'low' | 'medium' | 'high';
export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  ticket_no: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: 'admin' | 'staff';
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  title: string;
  description: string;
  attachment_urls?: string[];
  status: SupportTicketStatus;
  admin_response?: string | null;
  admin_responder_id?: string | null;
  responded_at?: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined data
  admin_responder?: {
    name: string;
    email: string;
  } | null;
}

export interface SupportTicketFormData {
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: 'admin' | 'staff';
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  title: string;
  description: string;
  attachment_urls?: string[];
}

