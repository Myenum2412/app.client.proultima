export interface Invoice {
  id: string
  invoiceId: string
  projectNumber: string
  projectName: string
  billedTonnage: number
  unitPriceLumpSum: number
  tonsBilledAmount: number
  billedHoursCO: number
  coPrice: number
  coBilledAmount: number
  totalAmountBilled: number
  status: 'Paid' | 'Unpaid' | 'Due Date Expected'
  paidDate: string | null
  issueDate: string
  createdAt?: string
  updatedAt?: string
}

export interface InvoiceFilters {
  invoiceId?: string
  projectNumber?: string
  projectName?: string
  billedTonnage?: { min?: number; max?: number }
  billedHoursCO?: { min?: number; max?: number }
  coPrice?: { min?: number; max?: number }
  issueDate?: { from?: string; to?: string }
  status?: Invoice['status']
}

