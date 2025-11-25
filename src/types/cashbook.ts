// Cash Book and Task Proof Types

export interface CashTransaction {
  id: string;
  voucher_no: string;
  staff_id: string;
  branch: string;
  transaction_date: string;
  bill_status: 'Paid' | 'Pending' | 'Cancelled' | 'Yet to pay' | 'Refund';
  primary_list: string;
  nature_of_expense: string;
  cash_out: number;
  cash_in: number;
  balance: number;
  calculatedBalance?: number; // NEW: Calculated running balance
  receipt_image_url?: string; // Keep for backward compatibility
  attachment_urls?: string[]; // NEW: Multiple images
  notes?: string;
  created_at: string;
  updated_at: string;
  verification_status?: 'pending' | 'approved' | 'rejected';
  verified_by?: string | null;
  verified_at?: string | null;
  verification_notes?: string | null;
  staff?: {
    name: string;
    employee_id: string;
    email: string;
  };
}

export interface CashTransactionFormData {
  transaction_date: string;
  bill_status: 'Paid' | 'Pending' | 'Cancelled' | 'Yet to pay' | 'Refund';
  primary_list: string;
  nature_of_expense: string;
  cash_out?: number;
  cash_in?: number;
  receipt_image_url?: string; // Keep for backward compatibility
  attachment_urls?: string[]; // NEW: Array of image URLs
  notes?: string;
}

export interface BranchOpeningBalanceHistoryEntry {
  date: string; // YYYY-MM-DD
  amount: number; // positive to add, negative to reduce
  note?: string;
  added_by?: string; // admin id or email
}

export interface BranchOpeningBalance {
  id: string;
  branch: string;
  opening_balance: number;
  period_start: string;
  period_end?: string;
  created_at: string;
  updated_at: string;
  balance_history?: BranchOpeningBalanceHistoryEntry[]; // NEW: array of history entries
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface TaskUpdateProof {
  id: string;
  task_id: string;
  staff_id: string;
  status: string;
  proof_image_url: string;
  notes?: string;
  is_verified: boolean | null; // null = pending, true = verified, false = rejected
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
  created_at: string;
  updated_at: string;
  staff?: {
    name: string;
    employee_id: string;
  };
  admin?: {
    name: string;
    email: string;
  };
}

export interface TaskUpdateProofFormData {
  task_id: string;
  status: string;
  proof_image: File;
  notes?: string;
}

export interface CashBookSummary {
  opening_balance: number;
  total_cash_in: number;
  total_cash_out: number;
  closing_balance: number;
  transaction_count: number;
}

export interface BranchCashSummary extends CashBookSummary {
  branch: string;
  staff_count: number;
}

export interface VoucherNumberResponse {
  voucher_no: string;
  type: 'cash_out' | 'cash_in';
}



