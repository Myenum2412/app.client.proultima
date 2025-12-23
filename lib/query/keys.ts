/**
 * Centralized query keys for TanStack Query
 * Ensures consistent cache key structure and enables efficient cache invalidation
 */
export const queryKeys = {
  // Auth
  me: () => ["auth", "me"] as const,
  
  // Payments
  payments: () => ["payments"] as const,
  payment: (paymentId: string) => ["payments", paymentId] as const,
  
  // Drawings
  drawings: () => ["drawings"] as const,
  drawing: (drawingId: string) => ["drawings", drawingId] as const,
  drawingAnnotations: (drawingId: string) => ["drawings", drawingId, "annotations"] as const,
  
  // Billing
  billingInvoices: () => ["billing", "invoices"] as const,
  billingInvoice: (invoiceId: string) => ["billing", "invoices", invoiceId] as const,
  billingInvoicePayments: (invoiceId: string) => ["billing", "invoices", invoiceId, "payments"] as const,
  
  // Submissions
  submissions: () => ["submissions"] as const,
  submission: (submissionId: string) => ["submissions", submissionId] as const,
  
  // Projects
  projects: () => ["projects"] as const,
  project: (projectId: string) => ["projects", projectId] as const,
  projectSection: (projectId: string, section: string) =>
    ["projects", projectId, "sections", section] as const,
  projectMaterialLists: (projectId: string) =>
    ["projects", projectId, "materialLists"] as const,
  
  // Chat
  chatMessages: (projectId?: string) =>
    ["chat", "messages", projectId ?? "global"] as const,
  
  // Search
  search: (query: string) => ["search", query] as const,
} as const;


