import { NextRequest } from 'next/server'
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api/utils'
import nodemailer from 'nodemailer'

interface DrawingEmailRequest {
  drawings: Array<{
    dwg: string
    status: string
    description: string
    totalWeight?: number
    latestSubmittedDate?: string
    weeksSinceSent?: string
  }>
  projectNumber?: string
  projectName?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: DrawingEmailRequest = await request.json()
    const { drawings, projectNumber, projectName } = body

    if (!drawings || drawings.length === 0) {
      return createErrorResponse('No drawings selected', 400)
    }

    // Create transporter - using Gmail SMTP
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('Email credentials not configured. Email will not be sent.')
      // In development, use Ethereal Email for testing
      const testAccount = await nodemailer.createTestAccount()
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      })
      
      const info = await transporter.sendMail({
        from: testAccount.user,
        to: 'myenumam@gmail.com',
        subject: `Drawings Yet to Return - ${projectNumber || 'Project'}`,
        html: generateEmailHTML(drawings, projectNumber, projectName),
        text: generateEmailText(drawings, projectNumber, projectName),
      })
      
      const testUrl = nodemailer.getTestMessageUrl(info)
      console.log('Test email sent. Preview URL:', testUrl)
      
      return createSuccessResponse(
        {
          sent: true,
          recipientEmail: 'myenumam@gmail.com',
          testMode: true,
          previewUrl: testUrl,
        },
        'Drawing notification email sent (test mode). Check console for preview URL.'
      )
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@proultima.com',
      to: 'myenumam@gmail.com',
      subject: `Drawings Yet to Return - ${projectNumber || 'Project'}`,
      html: generateEmailHTML(drawings, projectNumber, projectName),
      text: generateEmailText(drawings, projectNumber, projectName),
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)

    return createSuccessResponse(
      {
        sent: true,
        recipientEmail: 'myenumam@gmail.com',
        messageId: info.messageId,
      },
      `Drawing notification email sent successfully to myenumam@gmail.com for ${drawings.length} drawing(s).`
    )
  } catch (error: any) {
    console.error('Error sending drawing email:', error)
    return handleApiError(error)
  }
}

function generateEmailHTML(drawings: DrawingEmailRequest['drawings'], projectNumber?: string, projectName?: string): string {
  const drawingsList = drawings.map((drawing, index) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${drawing.dwg}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${drawing.status}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${drawing.description || '—'}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${drawing.totalWeight ? drawing.totalWeight.toFixed(1) : 'N/A'}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${drawing.latestSubmittedDate || '—'}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${drawing.weeksSinceSent || '—'}</td>
    </tr>
  `).join('')

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <h2 style="color: #333;">Drawings Yet to Return (APP/R&R)</h2>
      ${projectNumber ? `<p><strong>Project Number:</strong> ${projectNumber}</p>` : ''}
      ${projectName ? `<p><strong>Project Name:</strong> ${projectName}</p>` : ''}
      <p><strong>Total Drawings:</strong> ${drawings.length}</p>
      <div style="margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">#</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">DWG #</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Status</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Description</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Total Weight (Tons)</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Latest Submitted Date</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Weeks Since Sent</th>
            </tr>
          </thead>
          <tbody>
            ${drawingsList}
          </tbody>
        </table>
      </div>
      <p style="color: #666; font-size: 14px; margin-top: 20px;">
        This is an automated notification from Proultima.
      </p>
    </div>
  `
}

function generateEmailText(drawings: DrawingEmailRequest['drawings'], projectNumber?: string, projectName?: string): string {
  const drawingsText = drawings.map((drawing, index) => `
${index + 1}. DWG #: ${drawing.dwg}
   Status: ${drawing.status}
   Description: ${drawing.description || '—'}
   Total Weight: ${drawing.totalWeight ? drawing.totalWeight.toFixed(1) : 'N/A'} Tons
   Latest Submitted Date: ${drawing.latestSubmittedDate || '—'}
   Weeks Since Sent: ${drawing.weeksSinceSent || '—'}
  `).join('\n')

  return `
Drawings Yet to Return (APP/R&R)

${projectNumber ? `Project Number: ${projectNumber}` : ''}
${projectName ? `Project Name: ${projectName}` : ''}
Total Drawings: ${drawings.length}

Drawings:
${drawingsText}

This is an automated notification from Proultima.
  `.trim()
}

