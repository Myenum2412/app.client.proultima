import { NextRequest } from 'next/server'
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api/utils'
import nodemailer from 'nodemailer'

interface MeetingEmailRequest {
  title: string
  dateTime: string
  description: string
  member: string
}

export async function POST(request: NextRequest) {
  try {
    const body: MeetingEmailRequest = await request.json()
    const { title, dateTime, description, member } = body

    if (!title || !dateTime || !description) {
      return createErrorResponse('Missing required fields: title, dateTime, or description', 400)
    }

    // Create transporter - using Gmail SMTP
    // Set EMAIL_USER and EMAIL_PASSWORD in your .env.local file
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('Email credentials not configured. Email will not be sent.')
      // In development, you can use Ethereal Email for testing
      // For production, you must set EMAIL_USER and EMAIL_PASSWORD
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
      
      // Send to client
      const clientInfo = await transporter.sendMail({
        from: testAccount.user,
        to: 'myenumam@gmail.com',
        subject: `Meeting Scheduled: ${title}`,
        text: `Meeting: ${title}\nDate: ${new Date(dateTime).toLocaleString()}\nMember: ${member}\nDescription: ${description}`,
      })
      
      // Send to admin
      const adminInfo = await transporter.sendMail({
        from: testAccount.user,
        to: 'sathish@proultima.com',
        subject: `Meeting Scheduled: ${title}`,
        text: `Meeting: ${title}\nDate: ${new Date(dateTime).toLocaleString()}\nMember: ${member}\nDescription: ${description}`,
      })
      
      const clientTestUrl = nodemailer.getTestMessageUrl(clientInfo)
      const adminTestUrl = nodemailer.getTestMessageUrl(adminInfo)
      console.log('Test emails sent. Client preview URL:', clientTestUrl)
      console.log('Test emails sent. Admin preview URL:', adminTestUrl)
      
      return createSuccessResponse(
        {
          sent: true,
          clientEmail: 'myenumam@gmail.com',
          adminEmail: 'sathish@proultima.com',
          testMode: true,
          clientPreviewUrl: clientTestUrl,
          adminPreviewUrl: adminTestUrl,
        },
        'Meeting notification emails sent (test mode). Check console for preview URLs.'
      )
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    // Format the date
    const meetingDate = new Date(dateTime)
    const formattedDate = meetingDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    // Email content template
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Meeting Scheduled</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2563eb; margin-top: 0;">${title}</h3>
          <p><strong>Date & Time:</strong> ${formattedDate}</p>
          <p><strong>Member:</strong> ${member}</p>
          <div style="margin-top: 20px;">
            <p><strong>Description:</strong></p>
            <p style="white-space: pre-wrap;">${description}</p>
          </div>
        </div>
        <p style="color: #666; font-size: 14px;">
          This is an automated notification from Proultima.
        </p>
      </div>
    `
    
    const emailText = `
New Meeting Scheduled

Title: ${title}
Date & Time: ${formattedDate}
Member: ${member}

Description:
${description}

This is an automated notification from Proultima.
    `

    // Send email to client
    let clientInfo = null
    let clientError = null
    try {
      clientInfo = await transporter.sendMail({
        from: process.env.EMAIL_USER || 'noreply@proultima.com',
        to: 'myenumam@gmail.com',
        subject: `Meeting Scheduled: ${title}`,
        html: emailHtml,
        text: emailText,
      })
    } catch (error: any) {
      clientError = error.message
      console.error('Error sending email to client:', error)
    }

    // Send email to admin (try even if client email failed)
    let adminInfo = null
    let adminError = null
    try {
      adminInfo = await transporter.sendMail({
        from: process.env.EMAIL_USER || 'noreply@proultima.com',
        to: 'sathish@proultima.com',
        subject: `Meeting Scheduled: ${title}`,
        html: emailHtml,
        text: emailText,
      })
    } catch (error: any) {
      adminError = error.message
      console.error('Error sending email to admin:', error)
    }

    // If both emails failed, return error
    if (clientError && adminError) {
      return createErrorResponse(
        `Failed to send emails to both recipients. Client: ${clientError}, Admin: ${adminError}`,
        500
      )
    }

    // If one email failed, return partial success
    if (clientError || adminError) {
      return createSuccessResponse(
        {
          sent: true,
          clientEmail: 'myenumam@gmail.com',
          adminEmail: 'sathish@proultima.com',
          clientSent: !clientError,
          adminSent: !adminError,
          clientError: clientError || null,
          adminError: adminError || null,
          clientMessageId: clientInfo?.messageId || null,
          adminMessageId: adminInfo?.messageId || null,
        },
        `Meeting notification emails sent with partial success. ${clientError ? 'Client email failed. ' : ''}${adminError ? 'Admin email failed.' : ''}`
      )
    }

    // Both emails sent successfully
    return createSuccessResponse(
      {
        sent: true,
        clientEmail: 'myenumam@gmail.com',
        adminEmail: 'sathish@proultima.com',
        clientMessageId: clientInfo?.messageId,
        adminMessageId: adminInfo?.messageId,
      },
      'Meeting notification emails sent successfully to client and admin'
    )
  } catch (error: any) {
    console.error('Error sending meeting email:', error)
    return handleApiError(error)
  }
}

