export interface ScrapRequest {
  id: string;
  staff_id?: string;
  admin_submitter_id?: string;
  submitter_type: 'staff' | 'admin';
  submitter_name: string;
  brand_name: string;
  workstation_number: string;
  users_name: string;
  serial_number: string;
  scrap_status: 'working' | 'damaged' | 'beyond_repair';
  branch: string;
  images?: string[];
  status: 'pending' | 'approved' | 'rejected';
  admin_response?: string;
  admin_approver_id?: string;
  other_issue?: string; // Issue description when scrap_status is 'beyond_repair' (from 'other' selection)
  requested_date: string;
  updated_at: string;
  created_at: string;
  staff?: {
    id: string;
    name: string;
    email: string;
    department?: string;
    branch?: string;
  };
  admin?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateScrapRequestData {
  staff_id?: string;
  admin_submitter_id?: string;
  submitter_type: 'staff' | 'admin';
  submitter_name: string;
  brand_name: string;
  workstation_number: string;
  users_name: string;
  serial_number: string;
  scrap_status: 'working' | 'damaged' | 'beyond_repair';
  branch: string;
  images?: string[];
  source_asset_id?: string; // ID of the asset that was moved to scrap
  other_issue?: string; // Issue description when scrap_status is 'other' (mapped to 'beyond_repair' in DB)
}

export interface UpdateScrapRequestData {
  status: 'approved' | 'rejected';
  admin_response: string;
  admin_approver_id: string;
}

export interface StaffUpdateScrapRequestData {
  brand_name?: string;
  workstation_number?: string;
  users_name?: string;
  serial_number?: string;
  scrap_status?: 'working' | 'damaged' | 'beyond_repair';
  images?: string[];
}
