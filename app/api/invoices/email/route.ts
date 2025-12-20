import { NextRequest } from 'next/server'
import { createSuccessResponse, handleApiError } from '@/lib/api/utils'
import { createServerClient } from '@/lib/supabase/server'

interface EmailRequest {
  invoiceIds: string[]
  recipientEmail?: string
  subject?: string
  message?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const body: EmailRequest = await request.json()
    const { invoiceIds, recipientEmail, subject, message } = body

    if (!invoiceIds || invoiceIds.length === 0) {
      return createSuccessResponse(null, 'No invoices selected to send.')
    }

    // Fetch invoices
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .in('id', invoiceIds)
      .order('issue_date', { ascending: false })

    if (error) {
      console.error('Error fetching invoices for email:', error)
      return createSuccessResponse(null, `Error fetching invoices: ${error.message}`)
    }

    if (!invoices || invoices.length === 0) {
      return createSuccessResponse(null, 'No invoices found to send.')
    }

    // In a real implementation, you would integrate with an email service (SendGrid, Resend, etc.)
    // For now, we'll simulate the email sending
    const emailData = {
      to: recipientEmail || '',
      subject: subject || `Invoice Summary - ${invoices.length} Invoice(s)`,
      message: message || `Please find attached ${invoices.length} invoice(s) for your review.`,
      invoiceCount: invoices.length,
      totalAmount: invoices.reduce((sum: number, inv: any) => sum + (inv.total_amount_billed || 0), 0),
    }

    // TODO: Integrate with actual email service
    console.log('Email would be sent:', emailData)

    return createSuccessResponse(
      {
        sent: true,
        recipientEmail: emailData.to,
        invoiceCount: emailData.invoiceCount,
      },
      `Email sent successfully to ${emailData.to} with ${emailData.invoiceCount} invoice(s).`
    )
  } catch (error) {
    return handleApiError(error)
  }
}

