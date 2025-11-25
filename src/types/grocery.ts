export interface GroceryRequestItem {
  id?: string;
  grocery_request_id?: string;
  item_name: string;
  unit: 'Box' | 'Pcs' | 'Rim' | 'Count';
  quantity: number;
  unit_price: number;
  total_amount: number;
  created_at?: string;
  updated_at?: string;
}

export interface GroceryRequest {
  id: string;
  staff_id: string;
  staff_name: string;
  branch: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_date: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  viewed_by: string[];
  total_request_amount?: number;
  items?: GroceryRequestItem[]; // Array of items
}

export interface CreateGroceryRequestData {
  staff_id: string;
  staff_name: string;
  branch: string;
  notes?: string;
  items: GroceryRequestItem[]; // Changed from single item to array
}

export interface UpdateGroceryRequestData {
  notes?: string;
  items?: GroceryRequestItem[]; // Changed to support multiple items
}

export interface ApproveGroceryRequestData {
  admin_notes?: string;
}

export interface RejectGroceryRequestData {
  rejection_reason: string;
  admin_notes?: string;
}
