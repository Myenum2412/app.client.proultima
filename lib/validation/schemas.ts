/**
 * Validation Schemas
 * Centralized validation schemas using Zod for type-safe validation
 */

import { z } from 'zod'

// Invoice validation schemas
export const invoiceSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  projectNumber: z.string().min(1, 'Project number is required'),
  projectName: z.string().min(1, 'Project name is required'),
  billedTonnage: z.number().min(0, 'Billed tonnage must be non-negative'),
  unitPriceLumpSum: z.number().min(0, 'Unit price must be non-negative'),
  tonsBilledAmount: z.number().min(0, 'Tons billed amount must be non-negative'),
  billedHoursCO: z.number().min(0, 'Billed hours CO must be non-negative'),
  coPrice: z.number().min(0, 'CO price must be non-negative'),
  coBilledAmount: z.number().min(0, 'CO billed amount must be non-negative'),
  totalAmountBilled: z.number().min(0, 'Total amount billed must be non-negative'),
  status: z.enum(['Paid', 'Unpaid', 'Due Date Expected'], {
    message: 'Invalid status',
  }),
  paidDate: z.string().nullable().optional(),
  issueDate: z.string().min(1, 'Issue date is required'),
})

export const invoiceFiltersSchema = z.object({
  invoiceId: z.string().optional(),
  projectNumber: z.string().optional(),
  projectName: z.string().optional(),
  billedTonnage: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  billedHoursCO: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  coPrice: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  issueDate: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }).optional(),
  status: z.enum(['Paid', 'Unpaid', 'Due Date Expected']).optional(),
})

// Payment validation schemas
export const paymentSchema = z.object({
  invoiceIds: z.array(z.string()).min(1, 'At least one invoice is required'),
  paymentMethod: z.enum(['credit-card', 'bank-transfer', 'check', 'cash', 'wire-transfer'], {
    message: 'Invalid payment method',
  }),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  discount: z.number().min(0).optional(),
  notes: z.string().optional(),
})

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

// Project validation schemas
export const projectSchema = z.object({
  projectName: z.string().min(1, 'Project name is required'),
  projectNumber: z.string().min(1, 'Project number is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  description: z.string().optional(),
  status: z.string().optional(),
  files: z.array(z.string()).optional(),
})

// Export validation schemas
export const exportSchema = z.object({
  invoiceIds: z.array(z.string()).min(1, 'At least one invoice is required'),
  format: z.enum(['csv', 'pdf', 'excel']).default('csv'),
})

// Email validation schemas
export const emailSchema = z.object({
  invoiceIds: z.array(z.string()).min(1, 'At least one invoice is required'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().optional(),
  recipientEmail: z.string().email('Invalid recipient email').optional(),
})

// Type exports
export type InvoiceInput = z.infer<typeof invoiceSchema>
export type InvoiceFiltersInput = z.infer<typeof invoiceFiltersSchema>
export type PaymentInput = z.infer<typeof paymentSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ProjectInput = z.infer<typeof projectSchema>
export type ExportInput = z.infer<typeof exportSchema>
export type EmailInput = z.infer<typeof emailSchema>

