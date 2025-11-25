// Task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_staff_ids: string[]; // Array of staff IDs
  assigned_team_ids: string[]; // Array of team IDs
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  start_date?: string;
  created_at: string;
  updated_at: string;
  allocation_mode: 'individual' | 'team';
  assigned_staff?: TaskAssignment[]; // Populated staff details
  assigned_teams?: Team[]; // Populated team details
  is_repeated: boolean;
  repeat_config?: TaskRepeatConfig;
  support_files?: string[];
  task_no?: string; // Task number from database (e.g., "T002")
  parent_task_id?: string | null; // References parent task for cloned tasks (T002.1, T002.2)
  parent_task?: { // Populated parent task details
    task_no: string;
    title: string;
  } | null;
  child_tasks?: number; // Count of child tasks (for parent tasks)
  delegated_from_staff_id?: string | null; // ID of staff who delegated (from task_delegations)
  delegated_by_staff_name?: string | null; // Name of staff who delegated (for display)
  delegated_to_staff_id?: string | null; // ID of staff who received delegation
  delegated_to_staff_name?: string | null; // Name of staff who received delegation
  delegation_notes?: string | null; // Notes provided during delegation
  last_updated_by?: string | null; // ID of staff who last updated the task
  last_updater?: { // Populated staff details for last updater
    name: string;
    email: string;
  } | null;
  created_by_staff_id?: string | null; // ID of staff who created the task (NULL for admin-created)
  created_by_staff?: { // Populated staff details for creator
    id: string;
    name: string;
    email: string;
    employee_id: string;
    profile_image_url?: string;
  } | null;
  // Reschedule fields
  has_pending_reschedule?: boolean;
  has_approved_reschedule?: boolean;
  pending_reschedule?: TaskReschedule | null;
  latest_approved_reschedule?: TaskReschedule | null;
  // Delegation tracking fields
  delegations?: TaskDelegation[]; // Array of delegation records
  delegation_count?: number;
  has_delegations?: boolean;
  // Current delegation status (for UI display)
  current_delegation_status?: 'active' | 'completed' | 'verified';
  pending_verification?: boolean; // True if delegator needs to verify
  delegatee_notes?: string; // Notes from delegatee when completing task
}

export interface TaskAssignment {
  id: string;
  task_id: string;
  staff_id: string;
  staff?: Staff;
  assigned_at: string;
}

export interface TaskDelegation {
  id: string;
  task_id: string;
  from_staff_id: string;
  to_staff_id: string;
  notes?: string;
  delegation_status: 'active' | 'completed' | 'verified';
  completed_by_delegatee_at?: string;
  verified_by_delegator_at?: string;
  delegatee_notes?: string;
  created_at: string;
  from_staff?: {
    id: string;
    name: string;
    email: string;
    employee_id: string;
    profile_image_url?: string;
  };
  to_staff?: {
    id: string;
    name: string;
    email: string;
    employee_id: string;
    profile_image_url?: string;
  };
}

export interface TaskRepeatConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  end_date?: string;
  custom_days?: number[]; // 0-6 for Sunday-Saturday
  has_specific_time: boolean;
  start_time?: string;
  end_time?: string;
}

export type TaskStatus = string;
export type TaskPriority = string;
export type TaskRepeat = 'none' | 'daily' | 'weekly' | 'monthly';

// Task Priority Option interface
export interface TaskPriorityOption {
  id: string;
  name: string;
  color: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

// Task Status Option interface
export interface TaskStatusOption {
  id: string;
  name: string;
  color: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

// Task Reschedule interface
export interface TaskReschedule {
  id: string;
  task_id: string;
  staff_id: string;
  reason: string;
  original_due_date?: string;
  requested_new_date: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_id?: string;
  admin_response?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
  staff?: {
    name: string;
    email: string;
  };
  admin?: {
    name: string;
    email: string;
  };
  task?: {
    id: string;
    title: string;
    task_no: string;
  };
}

// Staff types
export interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  branch?: string;
  phone?: string;
  profile_image_url?: string | null;
  created_at: string;
  updated_at: string;
  is_online?: boolean;        // Online/offline status
  last_seen?: string;          // Last activity timestamp
  is_active?: boolean;         // Active/inactive status for soft delete
}

// Team types
export interface Team {
  id: string;
  name: string;
  description?: string;
  leader_id: string;
  leader?: Staff;
  branch?: string;
  members?: TeamMember[];
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  staff_id: string;
  staff?: Staff;
  joined_at: string;
}

// Report types
export interface Report {
  id: string;
  title: string;
  description?: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// UI State types
export interface UIState {
  // Dialog states
  taskDialog: {
    isOpen: boolean;
    mode: 'create' | 'edit';
    taskId?: string;
  };
  teamDialog: {
    isOpen: boolean;
    mode: 'create' | 'edit';
    teamId?: string;
  };
  staffDialog: {
    isOpen: boolean;
    mode: 'create' | 'edit';
    staffId?: string;
  };
  
  // Filter states
  searchQuery: string;
  statusFilter: TaskStatus | 'all';
  priorityFilter: TaskPriority | 'all';
  
  // Loading states
  isLoading: boolean;
  draggedItem: string | null;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Form types
export interface TaskFormData {
  title: string;
  description?: string;
  allocation_mode: 'individual' | 'team';
  assigned_staff_ids: string[]; // Array of staff IDs
  assigned_team_ids: string[]; // Array of team IDs
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  start_date?: string;
  is_repeated: boolean;
  repeat_config?: TaskRepeatConfig;
  support_files?: string[];
}

export interface UpdateTaskFormData extends TaskFormData {
  id: string;
}

export interface StaffFormData {
  name: string;
  email: string;
  role: string;
  department: string;
}

export interface TeamFormData {
  name: string;
  description?: string;
  leader_id: string;
  branch?: string;
  member_ids: string[];
}

export interface UpdateTeamFormData extends TeamFormData {
  id: string;
}

// Asset Request types
export interface AssetRequest {
  id: string;
  staff_id: string;
  staff_name: string;
  branch: string;
  request_type: 'system' | 'common'; // NEW
  asset_number?: string; // Auto-generated asset number (ASS001, ASS002, etc.)
  
  // Common fields
  product_name: string;
  quantity: number;
  image_urls?: string[];
  
  // System-specific fields
  condition?: 'new' | 'refurbished' | 'used';
  additional_notes?: string;
  serial_no?: string; // Serial Number (for system type)
  brand_name?: string; // Brand (for system type)
  workstation?: string; // Workstation (for system type)
  
  // Common-specific fields
  shop_contact?: string; // NEW
  warranty?: string; // NEW
  specification?: string; // NEW
  price?: number; // NEW
  
  // Status fields
  status: 'pending' | 'approved' | 'rejected';
  requested_date: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  staff?: {
    id: string;
    name: string;
    email: string;
    branch: string;
  };
  admin?: {
    id: string;
    name: string;
    email: string;
  };
}

// Stationary Request types
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
  staff?: {
    id: string;
    name: string;
    email: string;
    branch: string;
  };
  admin?: {
    id: string;
    name: string;
    email: string;
  };
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
