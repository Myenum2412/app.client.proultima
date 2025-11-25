export type MaintenanceCondition = 'new' | 'used';
export type MaintenanceRunningStatus = 'running' | 'not_running';
export type MaintenanceStatus = 'pending' | 'approved' | 'rejected';

export interface MaintenanceRequest {
  id: string;
  staff_id: string;
  branch: string;
  
  // System Information
  asset_number?: string; // Asset number reference (ASS001, ASS002, etc.)
  serial_number?: string;
  workstation_number?: string;
  brand_name?: string;
  
  // Dates
  report_month: string;
  date_of_purchase?: string;
  warranty_end_date?: string;
  
  // Contact Information
  contact_name?: string;
  contact_number?: string;
  
  // Status
  condition: MaintenanceCondition;
  running_status: MaintenanceRunningStatus;
  
  // Request Management
  status: MaintenanceStatus;
  requested_date: string;
  
  // Approval/Rejection
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
  
  // Attachments
  attachment_urls?: string[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relations
  staff?: {
    name: string;
    email: string;
    employee_id: string;
  };
  approver?: {
    name: string;
    email: string;
  };
}

export interface MaintenanceFormData {
  asset_number?: string; // Asset number reference (ASS001, ASS002, etc.)
  serial_number?: string;
  workstation_number?: string;
  brand_name?: string;
  report_month: string;
  date_of_purchase?: string;
  warranty_end_date?: string;
  condition: MaintenanceCondition;
  running_status: MaintenanceRunningStatus;
  branch: string;
  contact_name?: string;
  contact_number?: string;
  remarks?: string; // Remarks/notes field (stored in admin_notes in database)
  admin_notes?: string; // Admin notes (can be set from remarks or by admin)
}

// Purchase Requisition Types
export interface PurchaseRequisition {
  id: string;
  staff_id: string;
  name: string;
  designation: string;
  department: string;
  branch: string;
  purchase_item: string;
  description?: string;
  quotation_urls?: string[]; // Estimate images
  
  // Product Details (uploaded after approval)
  product_image_urls?: string[]; // Actual product images
  product_uploaded_at?: string;
  product_name?: string; // Actual product name received (distinct from purchase_item)
  brand_name?: string; // Product brand
  serial_no?: string; // Serial number
  warranty?: string; // Warranty information
  condition?: 'new' | '2nd_hand' | 'used'; // Product condition
  user_name?: string; // User/assignee name
  remote_id?: string; // Remote ID
  specification?: string; // Product specifications
  request_type?: 'system' | 'common'; // Purchase type: system (office assets) or common (external purchases)
  shop_contact?: string; // Shop contact information for common type purchases
  quantity?: number; // Quantity of items purchased (required for common type)
  price?: number; // Price of the purchase (required for common type)
  
  // Verification Fields
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
  proof_rejection_reason?: string;
  
  status: 'pending' | 'verification_pending' | 'awaiting_final_verification' | 'completed' | 'approved' | 'rejected';
  requested_date: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  staff?: {
    name: string;
    employee_id: string;
    email: string;
  };
  admin?: {
    name: string;
    email: string;
  };
  verifier?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PurchaseRequisitionFormData {
  name: string;
  designation: string;
  department: string;
  branch: string;
  purchase_item: string;
  description?: string;
  quotation_urls?: string[];
}



