import { sendEmail } from './email';
import { format } from 'date-fns';

/**
 * Send task proof uploaded notification to admin
 */
export async function sendTaskProofUploadedEmail(proof: any, adminEmail: string) {
  const subject = `Task Proof Uploaded - ${proof.task?.title || 'Task'}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Task Proof Uploaded</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .proof-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #3b82f6; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📸 Task Proof Uploaded</h1>
          <p>Staff has uploaded proof for task completion</p>
        </div>
        <div class="content">
          <p>Hello Admin,</p>
          
          <p><strong>${proof.staff?.name || 'Staff Member'}</strong> has uploaded proof for task completion that requires your verification.</p>
          
          <div class="proof-info">
            <h3>Task Details</h3>
            <p><strong>Task:</strong> ${proof.task?.title || 'Unknown Task'}</p>
            <p><strong>Task Number:</strong> ${proof.task?.task_no || 'N/A'}</p>
            <p><strong>Completed by:</strong> ${proof.staff?.name || 'Staff Member'}</p>
            <p><strong>Department:</strong> ${proof.staff?.department || 'N/A'}</p>
            <p><strong>Branch:</strong> ${proof.staff?.branch || 'N/A'}</p>
            <p><strong>Uploaded on:</strong> ${format(new Date(proof.created_at), 'PPP p')}</p>
            <p><strong>Proof Type:</strong> ${proof.proof_type || 'Image'}</p>
          </div>
          
          <p><strong>Action Required:</strong> Please review the uploaded proof and verify if the task was completed satisfactorily.</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/tasks" class="button">
            Review Proof
          </a>
          
          <div class="footer">
            <p>This is an automated notification from ProUltima Task Manager</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject,
    html,
  });
}

/**
 * Send task proof approved notification to staff
 */
export async function sendTaskProofApprovedEmail(proof: any, staffEmail: string, verificationNotes?: string) {
  const subject = `Task Proof Approved - ${proof.task?.title || 'Task'}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Task Proof Approved</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f0fdf4; padding: 20px; border-radius: 0 0 8px 8px; }
        .proof-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #10b981; }
        .success { background: #d1fae5; border: 1px solid #10b981; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Task Proof Approved</h1>
          <p>Your task proof has been verified and approved</p>
        </div>
        <div class="content">
          <p>Hello <strong>${proof.staff?.name || 'Staff Member'}</strong>,</p>
          
          <div class="success">
            <p><strong>🎉 Congratulations!</strong> Your task proof has been reviewed and approved by the admin.</p>
          </div>
          
          <div class="proof-info">
            <h3>Task Details</h3>
            <p><strong>Task:</strong> ${proof.task?.title || 'Unknown Task'}</p>
            <p><strong>Task Number:</strong> ${proof.task?.task_no || 'N/A'}</p>
            <p><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">COMPLETED</span></p>
            <p><strong>Approved on:</strong> ${format(new Date(), 'PPP p')}</p>
          </div>
          
          ${verificationNotes ? `
            <div class="proof-info">
              <h3>Admin Notes</h3>
              <p>${verificationNotes}</p>
            </div>
          ` : ''}
          
          <p><strong>Great job!</strong> Your task has been successfully completed and verified.</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/staff/tasks" class="button">
            View Tasks
          </a>
          
          <div class="footer">
            <p>This is an automated notification from ProUltima Task Manager</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: staffEmail,
    subject,
    html,
  });
}

/**
 * Send task proof rejected notification to staff
 */
export async function sendTaskProofRejectedEmail(proof: any, staffEmail: string, verificationNotes?: string) {
  const subject = `Task Proof Rejected - ${proof.task?.title || 'Task'}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Task Proof Rejected</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fef2f2; padding: 20px; border-radius: 0 0 8px 8px; }
        .proof-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #ef4444; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .button { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Task Proof Rejected</h1>
          <p>Your task proof needs to be resubmitted</p>
        </div>
        <div class="content">
          <p>Hello <strong>${proof.staff?.name || 'Staff Member'}</strong>,</p>
          
          <div class="warning">
            <p><strong>⚠️ Action Required:</strong> Your task proof has been reviewed and rejected by the admin.</p>
          </div>
          
          <div class="proof-info">
            <h3>Task Details</h3>
            <p><strong>Task:</strong> ${proof.task?.title || 'Unknown Task'}</p>
            <p><strong>Task Number:</strong> ${proof.task?.task_no || 'N/A'}</p>
            <p><strong>Status:</strong> <span style="color: #ef4444; font-weight: bold;">PROOF REJECTED</span></p>
            <p><strong>Rejected on:</strong> ${format(new Date(), 'PPP p')}</p>
          </div>
          
          ${verificationNotes ? `
            <div class="proof-info">
              <h3>Rejection Reason</h3>
              <p>${verificationNotes}</p>
            </div>
          ` : ''}
          
          <p><strong>Next Steps:</strong> Please review the feedback and upload new proof that meets the requirements.</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/staff/tasks" class="button">
            Upload New Proof
          </a>
          
          <div class="footer">
            <p>This is an automated notification from ProUltima Task Manager</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: staffEmail,
    subject,
    html,
  });
}



