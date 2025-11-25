import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import type { Task } from '@/types';
import type { MaintenanceRequest, PurchaseRequisition } from '@/types/maintenance';
import type { TaskUpdateProof } from '@/types/cashbook';
import type { ScrapRequest } from '@/types/scrap';
import type { AssetRequest, GroceryRequest } from '@/types';

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Core email sending function
 */
export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    const transport = getTransporter();
    
    const info = await transport.sendMail({
      from: `ProUltima Task Manager <${process.env.EMAIL_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
    });

    // console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send task assignment notification
 */
export async function sendTaskAssignmentEmail(
  task: Task,
  assigneeEmail: string,
  assigneeName: string,
  assignedBy?: string
) {
  const priorityColor = {
    low: '#3b82f6',
    medium: '#f59e0b',
    high: '#ef4444',
    urgent: '#dc2626',
  }[task.priority] || '#6b7280';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .task-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
          .priority { background-color: ${priorityColor}; color: white; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">New Task Assigned</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">You have a new task to work on</p>
          </div>
          <div class="content">
            <p>Hi ${assigneeName},</p>
            <p>You have been assigned a new task:</p>
            
            <div class="task-card">
              <h2 style="margin-top: 0; color: #111827;">${task.title}</h2>
              ${task.description ? `<p style="color: #6b7280;">${task.description}</p>` : ''}
              
              <div style="margin: 15px 0;">
                <span class="badge priority">${task.priority.toUpperCase()}</span>
              </div>
              
              ${task.due_date ? `
                <p style="margin: 10px 0; color: #6b7280;">
                  <strong>Due Date:</strong> ${new Date(task.due_date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              ` : ''}
            </div>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/staff/tasks" class="button">
              View Task
            </a>
            
            <div class="footer">
              <p>This is an automated email from ProUltima Task Manager.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: assigneeEmail,
    subject: `New Task Assigned: ${task.title}`,
    html,
  });
}

/**
 * Send team task assignment notification to team leader
 */
export async function sendTeamTaskAssignmentEmail(
  task: Task,
  teamName: string,
  leaderEmail: string,
  leaderName: string,
  teamMemberCount: number
) {
  const priorityColor = {
    low: '#3b82f6',
    medium: '#f59e0b',
    high: '#ef4444',
    urgent: '#dc2626',
  }[task.priority] || '#6b7280';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .task-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
          .priority { background-color: ${priorityColor}; color: white; }
          .team-badge { background-color: #8b5cf6; color: white; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">New Team Task Assigned</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">A new task has been assigned to your team</p>
          </div>
          <div class="content">
            <p>Hi ${leaderName},</p>
            <p>A new task has been assigned to <strong>${teamName}</strong>:</p>
            
            <div class="task-card">
              <h2 style="margin-top: 0; color: #111827;">${task.title}</h2>
              ${task.description ? `<p style="color: #6b7280;">${task.description}</p>` : ''}
              
              <div style="margin: 15px 0;">
                <span class="badge priority">${task.priority.toUpperCase()}</span>
                <span class="badge team-badge">TEAM TASK</span>
              </div>
              
              ${task.due_date ? `
                <p style="margin: 10px 0; color: #6b7280;">
                  <strong>Due Date:</strong> ${new Date(task.due_date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              ` : ''}
            </div>
            
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/staff/tasks" class="button">
              View Task
            </a>
            
            <div class="footer">
              <p>This is an automated email from ProUltima Task Manager.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: leaderEmail,
    subject: `New Team Task: ${task.title}`,
    html,
  });
}

/**
 * Send task status change notification to admin
 */
export async function sendTaskStatusChangeEmail(
  task: Task,
  adminEmail: string,
  staffName: string,
  oldStatus: string,
  newStatus: string
) {
  const statusColors = {
    backlog: '#6b7280',
    todo: '#3b82f6',
    in_progress: '#f59e0b',
    completed: '#10b981',
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .task-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .status-change { display: flex; align-items: center; gap: 10px; margin: 15px 0; }
          .status-badge { padding: 6px 12px; border-radius: 12px; font-size: 14px; font-weight: 600; color: white; }
          .arrow { font-size: 20px; color: #6b7280; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Task Status Updated</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">A task status has been changed</p>
          </div>
          <div class="content">
            <p>Hi Admin,</p>
            <p><strong>${staffName}</strong> has updated a task status:</p>
            
            <div class="task-card">
              <h2 style="margin-top: 0; color: #111827;">${task.title}</h2>
              <p style="color: #6b7280;">Task #${task.task_no || 'N/A'}</p>
              
              <div class="status-change">
                <span class="status-badge" style="background-color: ${statusColors[oldStatus as keyof typeof statusColors]}">
                  ${oldStatus.replace('_', ' ').toUpperCase()}
                </span>
                <span class="arrow">→</span>
                <span class="status-badge" style="background-color: ${statusColors[newStatus as keyof typeof statusColors]}">
                  ${newStatus.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              
              ${task.due_date ? `
                <p style="margin: 10px 0; color: #6b7280;">
                  <strong>Due Date:</strong> ${new Date(task.due_date).toLocaleDateString()}
                </p>
              ` : ''}
            </div>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/tasks" class="button">
              View Task
            </a>
            
            <div class="footer">
              <p>This is an automated email from ProUltima Task Manager.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `Task Status Changed: ${task.title}`,
    html,
  });
}

/**
 * Send daily report to admin
 */
export async function sendDailyReport(
  adminEmail: string,
  reportData: {
    todayTasks: number;              // NEW
    completedToday: number;
    inProgress: number;
    overdue: number;
    attendance: {                    // NEW
      present: number;
      absent: number;
      leave: number;
    };
    pendingRequests: {               // NEW
      maintenance: number;
      purchase: number;
      scrap: number;
      grocery: number;
    };
    teamPerformance: Array<{ teamName: string; completionRate: number }>;
    topPerformers: Array<{ staffName: string; tasksCompleted: number }>;
  }
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 700px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
          .stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .stat-number { font-size: 36px; font-weight: bold; color: #667eea; margin: 10px 0; }
          .stat-label { color: #6b7280; font-size: 14px; }
          .section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .section h3 { margin-top: 0; color: #111827; }
          .list-item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .list-item:last-child { border-bottom: none; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Daily Task Report</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
          <div class="content">
            <h2 style="color: #111827;">Today's Overview</h2>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Today's Tasks</div>
                <div class="stat-number" style="color: #3b82f6;">${reportData.todayTasks}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Completed Today</div>
                <div class="stat-number" style="color: #10b981;">${reportData.completedToday}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">In Progress</div>
                <div class="stat-number" style="color: #f59e0b;">${reportData.inProgress}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Overdue</div>
                <div class="stat-number" style="color: #ef4444;">${reportData.overdue}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Present Today</div>
                <div class="stat-number" style="color: #10b981;">${reportData.attendance.present}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Absent/Leave</div>
                <div class="stat-number" style="color: #6b7280;">${reportData.attendance.absent + reportData.attendance.leave}</div>
              </div>
            </div>
            
            ${reportData.topPerformers.length > 0 ? `
              <div class="section">
                <h3>Top Performers</h3>
                ${reportData.topPerformers.map(performer => `
                  <div class="list-item">
                    <strong>${performer.staffName}</strong>
                    <span style="float: right; color: #10b981;">${performer.tasksCompleted} tasks completed</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            ${reportData.teamPerformance.length > 0 ? `
              <div class="section">
                <h3>Team Performance</h3>
                ${reportData.teamPerformance.map(team => `
                  <div class="list-item">
                    <strong>${team.teamName}</strong>
                    <span style="float: right; color: #667eea;">${team.completionRate}% completion rate</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            <div class="section">
              <h3>Pending Requests</h3>
              <div class="list-item">
                <strong>Maintenance Requests</strong>
                <span style="float: right; color: #f59e0b;">${reportData.pendingRequests.maintenance} pending</span>
              </div>
              <div class="list-item">
                <strong>Purchase Requisitions</strong>
                <span style="float: right; color: #f59e0b;">${reportData.pendingRequests.purchase} pending</span>
              </div>
              <div class="list-item">
                <strong>Scrap Requests</strong>
                <span style="float: right; color: #f59e0b;">${reportData.pendingRequests.scrap} pending</span>
              </div>
              <div class="list-item">
                <strong>Stationary Requests</strong>
                <span style="float: right; color: #f59e0b;">${reportData.pendingRequests.grocery} pending</span>
              </div>
            </div>
            
            <div class="footer">
              <p>This is your automated daily report from ProUltima Task Manager.</p>
              <p>Keep up the great work!</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `Daily Task Report - ${new Date().toLocaleDateString()}`,
    html,
  });
}

/**
 * Send task update notification
 */
export async function sendTaskUpdateEmail(
  task: Task,
  assigneeEmail: string,
  assigneeName: string,
  changes: Partial<Task>
) {
  const changeList = Object.entries(changes)
    .filter(([key, value]) => value !== undefined && key !== 'id')
    .map(([key, value]) => {
      const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `<li><strong>${displayKey}:</strong> ${value}</li>`;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .task-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .changes { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 Task Updated</h1>
            <p>Hello ${assigneeName},</p>
            <p>A task assigned to you has been updated.</p>
          </div>
          <div class="content">
            <div class="task-card">
              <h2>${task.title}</h2>
              <p><strong>Description:</strong> ${task.description || 'No description'}</p>
              <p><strong>Status:</strong> <span class="badge status">${task.status}</span></p>
              <p><strong>Priority:</strong> <span class="badge priority">${task.priority}</span></p>
              ${task.due_date ? `<p><strong>Due Date:</strong> ${new Date(task.due_date).toLocaleDateString()}</p>` : ''}
            </div>
            <p>Please review the updated task and take any necessary actions.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/staff/tasks" class="button">View Task</a>
          </div>
          <div class="footer">
            <p>This is an automated notification from ProUltima Task Manager.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: assigneeEmail,
    subject: `Task Updated: ${task.title}`,
    html,
  });
}

/**
 * Send task reassignment notification
 */
export async function sendTaskReassignmentEmail(
  task: Task,
  oldAssigneeEmail: string,
  newAssigneeEmail: string,
  newAssigneeName: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .task-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔄 Task Reassigned</h1>
            <p>Hello ${newAssigneeName},</p>
            <p>A task has been reassigned to you.</p>
          </div>
          <div class="content">
            <div class="task-card">
              <h2>${task.title}</h2>
              <p><strong>Description:</strong> ${task.description || 'No description'}</p>
              <p><strong>Status:</strong> <span class="badge status">${task.status}</span></p>
              <p><strong>Priority:</strong> <span class="badge priority">${task.priority}</span></p>
              ${task.due_date ? `<p><strong>Due Date:</strong> ${new Date(task.due_date).toLocaleDateString()}</p>` : ''}
            </div>
            
            <p>This task was previously assigned to another team member and has now been reassigned to you.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/staff/tasks" class="button">View Task</a>
          </div>
          <div class="footer">
            <p>This is an automated notification from ProUltima Task Manager.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: newAssigneeEmail,
    subject: `Task Reassigned: ${task.title}`,
    html,
  });
}

/**
 * Send task delegation notification
 */
export async function sendTaskDelegationEmail(
  task: Task,
  assigneeEmail: string,
  assigneeName: string,
  delegatedBy: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .task-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .delegation-info { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤝 Task Delegated to You</h1>
            <p>Hello ${assigneeName},</p>
            <p>You have been assigned to help with a delegated task.</p>
          </div>
          <div class="content">
            <div class="delegation-info">
              <p><strong>📋 Delegation Notice:</strong> This task was delegated to you by <strong>${delegatedBy}</strong> to help with completion.</p>
              <p><strong>Note:</strong> The original assignee (${delegatedBy}) remains responsible for this task.</p>
            </div>
            
            <div class="task-card">
              <h2>${task.title}</h2>
              <p><strong>Description:</strong> ${task.description || 'No description'}</p>
              <p><strong>Status:</strong> <span class="badge status">${task.status}</span></p>
              <p><strong>Priority:</strong> <span class="badge priority">${task.priority}</span></p>
              ${task.due_date ? `<p><strong>Due Date:</strong> ${new Date(task.due_date).toLocaleDateString()}</p>` : ''}
            </div>
            
            <p>Please coordinate with ${delegatedBy} to ensure successful task completion.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/staff/tasks" class="button">View Task</a>
          </div>
          <div class="footer">
            <p>This is an automated notification from ProUltima Task Manager.</p>
            <p><strong>Admin has been notified</strong> about this delegation.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: assigneeEmail,
    subject: `Task Delegated: ${task.title}`,
    html,
  });
}

/**
 * Send admin notification about task delegation
 */
export async function sendDelegationAdminNotification(
  task: Task,
  delegatedBy: string,
  adminEmail: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .task-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .alert { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Task Delegation Alert</h1>
            <p>Admin Notification</p>
          </div>
          <div class="content">
            <div class="alert">
              <p><strong>⚠️ Attention Required:</strong> A task has been delegated by a staff member and requires your review.</p>
            </div>
            
            <div class="task-card">
              <h2>${task.title}</h2>
              <p><strong>Description:</strong> ${task.description || 'No description'}</p>
              <p><strong>Status:</strong> <span class="badge status">${task.status}</span></p>
              <p><strong>Priority:</strong> <span class="badge priority">${task.priority}</span></p>
              <p><strong>Delegated by:</strong> ${delegatedBy}</p>
              ${task.due_date ? `<p><strong>Due Date:</strong> ${new Date(task.due_date).toLocaleDateString()}</p>` : ''}
            </div>
            
            <p>The original assignee remains responsible for this task, but additional staff members have been added to help with completion.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/tasks" class="button">Review in Admin Panel</a>
          </div>
          <div class="footer">
            <p>This is an automated notification from ProUltima Task Manager.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `Task Delegation Alert: ${task.title}`,
    html,
  });
}

/**
 * Send maintenance request notification to admin
 */
export async function sendMaintenanceRequestEmail(
  request: MaintenanceRequest,
  adminEmail: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Maintenance Request</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🔧 New Maintenance Request</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello Admin,</p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              A new maintenance request has been submitted by <strong>${request.staff?.name || 'Staff'}</strong> from <strong>${request.branch}</strong> branch.
            </p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #667eea;">Request Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Staff:</td>
                  <td style="padding: 8px 0; color: #333;">${request.staff?.name || 'Unknown'} (${request.staff?.employee_id || 'N/A'})</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Branch:</td>
                  <td style="padding: 8px 0; color: #333;">${request.branch}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Serial Number:</td>
                  <td style="padding: 8px 0; color: #333;">${request.serial_number || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Brand:</td>
                  <td style="padding: 8px 0; color: #333;">${request.brand_name || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Workstation:</td>
                  <td style="padding: 8px 0; color: #333;">${request.workstation_number || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Condition:</td>
                  <td style="padding: 8px 0; color: #333; text-transform: capitalize;">${request.condition}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Status:</td>
                  <td style="padding: 8px 0; color: #333; text-transform: capitalize;">${request.running_status.replace('_', ' ')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Report Month:</td>
                  <td style="padding: 8px 0; color: #333;">${new Date(request.report_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/maintenance" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Review Request</a>
            </div>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">This is an automated notification from ProUltima Task Manager.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `New Maintenance Request from ${request.staff?.name || 'Staff'}`,
    html,
  });
}

/**
 * Send maintenance approval notification to staff
 */
export async function sendMaintenanceApprovalEmail(
  request: MaintenanceRequest,
  staffEmail: string,
  adminNotes?: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Maintenance Request Approved</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">✅ Maintenance Request Approved</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello ${request.staff?.name || 'Staff'},</p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Great news! Your maintenance request has been <strong style="color: #22c55e;">approved</strong> by the admin.
            </p>
            
            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #22c55e;">Request Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Serial Number:</td>
                  <td style="padding: 8px 0; color: #333;">${request.serial_number || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Brand:</td>
                  <td style="padding: 8px 0; color: #333;">${request.brand_name || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Branch:</td>
                  <td style="padding: 8px 0; color: #333;">${request.branch}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Status:</td>
                  <td style="padding: 8px 0; color: #22c55e; font-weight: bold;">✓ Approved</td>
                </tr>
              </table>
            </div>

            ${adminNotes ? `
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <h3 style="margin-top: 0; color: #667eea;">Admin Notes:</h3>
                <p style="color: #333; margin: 0;">${adminNotes}</p>
              </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/staff/maintenance" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">View Request</a>
            </div>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">This is an automated notification from ProUltima Task Manager.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: staffEmail,
    subject: 'Your Maintenance Request Has Been Approved',
    html,
  });
}

/**
 * Send maintenance rejection notification to staff
 */
export async function sendMaintenanceRejectionEmail(
  request: MaintenanceRequest,
  staffEmail: string,
  rejectionReason: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Maintenance Request Rejected</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">❌ Maintenance Request Rejected</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello ${request.staff?.name || 'Staff'},</p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Unfortunately, your maintenance request has been <strong style="color: #ef4444;">rejected</strong> by the admin.
            </p>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #ef4444;">Request Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Serial Number:</td>
                  <td style="padding: 8px 0; color: #333;">${request.serial_number || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Brand:</td>
                  <td style="padding: 8px 0; color: #333;">${request.brand_name || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Branch:</td>
                  <td style="padding: 8px 0; color: #333;">${request.branch}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Status:</td>
                  <td style="padding: 8px 0; color: #ef4444; font-weight: bold;">✗ Rejected</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #ef4444;">Rejection Reason:</h3>
              <p style="color: #333; margin: 0;">${rejectionReason}</p>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #667eea;">Next Steps:</h3>
              <p style="color: #333; margin: 0;">
                Please review the rejection reason and resubmit your request with the necessary corrections, or contact your administrator for more information.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/staff/maintenance" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">View Request</a>
            </div>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">This is an automated notification from ProUltima Task Manager.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: staffEmail,
    subject: 'Your Maintenance Request Has Been Rejected',
    html,
  });
}

/**
 * Send task rejection notification to staff
 */
export async function sendTaskRejectionEmail(
  task: Task,
  staffEmail: string,
  staffName: string,
  rejectedBy: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .task-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">❌ Task Rejected</h1>
          </div>
          <div class="content">
            <p>Hi ${staffName},</p>
            
            <p><strong>${rejectedBy} rejected your task: ${task.title}</strong></p>
            
            <div class="task-info">
              <p style="margin: 10px 0;"><strong>Your task is back in progress</strong></p>
              <p style="margin: 10px 0;">Priority: ${task.priority.toUpperCase()}</p>
              ${task.due_date ? `<p style="margin: 10px 0;">Due Date: ${new Date(task.due_date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>` : ''}
            </div>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/staff/tasks" class="button">
              View Task
            </a>
            
            <div class="footer">
              <p>This is an automated email from ProUltima Task Manager.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: staffEmail,
    subject: `Task Rejected: ${task.title}`,
    html,
  });
}

/**
 * Send task approval notification to staff
 */
export async function sendTaskApprovalEmail(
  task: Task,
  staffEmail: string,
  staffName: string,
  approvedBy: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .task-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">✅ Task Approved</h1>
          </div>
          <div class="content">
            <p>Hi ${staffName},</p>
            
            <p><strong>${approvedBy} approved your task: ${task.title}</strong></p>
            
            <div class="task-info">
              <p style="margin: 10px 0;"><strong>Task completed successfully</strong></p>
              <p style="margin: 10px 0;">Priority: ${task.priority.toUpperCase()}</p>
            </div>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/staff/tasks" class="button">
              View Tasks
            </a>
            
            <div class="footer">
              <p>This is an automated email from ProUltima Task Manager.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: staffEmail,
    subject: `Task Approved: ${task.title}`,
    html,
  });
}

/**
 * Send purchase requisition submission notification to admin
 */
export async function sendPurchaseSubmissionEmail({
  adminEmail,
  staffName,
  staffEmail,
  purchaseItem,
  branch,
  requestDate,
}: {
  adminEmail: string;
  staffName: string;
  staffEmail: string;
  purchaseItem: string;
  branch: string;
  requestDate: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🛒 New Purchase Requisition</h1>
          </div>
          <div class="content">
            <p>A new purchase requisition has been submitted and requires your review.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #667eea;">Purchase Details</h3>
              <p><strong>Staff:</strong> ${staffName}</p>
              <p><strong>Email:</strong> ${staffEmail}</p>
              <p><strong>Branch:</strong> ${branch}</p>
              <p><strong>Purchase Item:</strong> ${purchaseItem}</p>
              <p><strong>Requested:</strong> ${format(new Date(requestDate), 'PPP')}</p>
            </div>
            
            <p>Please log in to the admin panel to review and approve/reject this requisition.</p>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/maintenance" class="button">
              View Purchase Requisition
            </a>
            
            <div class="footer">
              <p>This is an automated email from ProUltima Management System.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `New Purchase Requisition - ${purchaseItem}`,
    html,
  });
}

/**
 * Send purchase requisition status update notification to staff
 */
export async function sendPurchaseStatusEmail({
  staffEmail,
  staffName,
  purchaseItem,
  status,
  adminNotes,
  rejectionReason,
}: {
  staffEmail: string;
  staffName: string;
  purchaseItem: string;
  status: 'approved' | 'rejected';
  adminNotes?: string;
  rejectionReason?: string;
}) {
  const isApproved = status === 'approved';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${isApproved ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}; color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .status-badge { padding: 8px 16px; border-radius: 12px; font-size: 16px; font-weight: 600; color: white; background: ${isApproved ? '#10b981' : '#ef4444'}; display: inline-block; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">${isApproved ? '✅' : '❌'} Purchase Requisition ${isApproved ? 'Approved' : 'Rejected'}</h1>
          </div>
          <div class="content">
            <p>Hi ${staffName},</p>
            <p>Your purchase requisition has been <strong>${status}</strong> by the admin.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: ${isApproved ? '#10b981' : '#ef4444'};">Requisition Details</h3>
              <p><strong>Purchase Item:</strong> ${purchaseItem}</p>
              <p><strong>Status:</strong> <span class="status-badge">${status.toUpperCase()}</span></p>
              ${adminNotes ? `<p><strong>Admin Notes:</strong> ${adminNotes}</p>` : ''}
              ${rejectionReason ? `<p><strong>Rejection Reason:</strong> ${rejectionReason}</p>` : ''}
            </div>
            
            <p>You can view the full details in your maintenance dashboard.</p>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/staff/maintenance" class="button">
              View My Requisitions
            </a>
            
            <div class="footer">
              <p>This is an automated email from ProUltima Management System.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: staffEmail,
    subject: `Purchase Requisition ${isApproved ? 'Approved' : 'Rejected'} - ${purchaseItem}`,
    html,
  });
}

/**
 * Send task proof approval notification to staff
 */
export async function sendProofApprovalEmail(
  task: Task,
  staffEmail: string,
  staffName: string,
  approvedBy: string,
  proof: TaskUpdateProof
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .status-badge { padding: 8px 16px; border-radius: 12px; font-size: 16px; font-weight: 600; color: white; background: #10b981; display: inline-block; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">✅ Task Proof Approved</h1>
          </div>
          <div class="content">
            <p>Hi ${staffName},</p>
            <p>Great news! Your task proof has been <strong>approved</strong> by ${approvedBy}.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #10b981;">Task Details</h3>
              <p><strong>Task:</strong> ${task.title}</p>
              <p><strong>Status:</strong> <span class="status-badge">${proof.status.replace('_', ' ').toUpperCase()}</span></p>
              <p><strong>Submitted:</strong> ${format(new Date(proof.created_at), 'PPp')}</p>
              <p><strong>Approved:</strong> ${format(new Date(), 'PPp')}</p>
            </div>
            
            ${proof.verification_notes ? `
              <div class="info-box">
                <h3 style="margin-top: 0; color: #10b981;">Admin Notes</h3>
                <p>${proof.verification_notes}</p>
              </div>
            ` : ''}
            
            <p>Your task is now marked as completed. Great work!</p>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/staff/tasks" class="button">
              View My Tasks
            </a>
            
            <div class="footer">
              <p>This is an automated email from ProUltima Management System.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: staffEmail,
    subject: `✅ Task Proof Approved: ${task.title}`,
    html,
  });
}

/**
 * Send task proof rejection notification to staff
 */
export async function sendProofRejectionEmail(
  task: Task,
  staffEmail: string,
  staffName: string,
  rejectedBy: string,
  proof: TaskUpdateProof
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .status-badge { padding: 8px 16px; border-radius: 12px; font-size: 16px; font-weight: 600; color: white; background: #ef4444; display: inline-block; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">❌ Task Proof Rejected</h1>
          </div>
          <div class="content">
            <p>Hi ${staffName},</p>
            <p>Your task proof has been <strong>rejected</strong> by ${rejectedBy}. Please review and resubmit.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #ef4444;">Task Details</h3>
              <p><strong>Task:</strong> ${task.title}</p>
              <p><strong>Status:</strong> <span class="status-badge">${proof.status.replace('_', ' ').toUpperCase()}</span></p>
              <p><strong>Submitted:</strong> ${format(new Date(proof.created_at), 'PPp')}</p>
              <p><strong>Rejected:</strong> ${format(new Date(), 'PPp')}</p>
            </div>
            
            ${proof.verification_notes ? `
              <div class="info-box">
                <h3 style="margin-top: 0; color: #ef4444;">Admin Notes</h3>
                <p>${proof.verification_notes}</p>
              </div>
            ` : ''}
            
            <p>Please review the feedback above and resubmit your proof with the necessary corrections.</p>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/staff/tasks" class="button">
              View My Tasks
            </a>
            
            <div class="footer">
              <p>This is an automated email from ProUltima Management System.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: staffEmail,
    subject: `❌ Task Proof Rejected: ${task.title}`,
    html,
  });
}

/**
 * Send support ticket notification to developers
 */
export async function sendSupportTicketEmail({
  toEmail,
  ticketNo,
  senderName,
  senderEmail,
  senderRole,
  category,
  priority,
  title,
  description,
  attachmentUrls,
}: {
  toEmail: string;
  ticketNo: string;
  senderName: string;
  senderEmail: string;
  senderRole: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  attachmentUrls?: string[];
}) {
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'bug': return '🐛 Bug Report';
      case 'feature': return '✨ Feature Request';
      case 'question': return '❓ Question';
      default: return '📝 Other';
    }
  };

  const getPriorityColor = (pri: string) => {
    switch (pri) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .priority-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; color: white; display: inline-block; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🎫 Support Ticket #${ticketNo}</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${getCategoryLabel(category)}</p>
          </div>
          <div class="content">
            <p>Hi Development Team,</p>
            <p>A new support ticket has been submitted and requires your attention.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #667eea;">Ticket Information</h3>
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0;"><strong>Ticket ID:</strong></td>
                  <td style="padding: 8px 0;">${ticketNo}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Category:</strong></td>
                  <td style="padding: 8px 0;">${getCategoryLabel(category)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Priority:</strong></td>
                  <td style="padding: 8px 0;">
                    <span class="priority-badge" style="background: ${getPriorityColor(priority)};">
                      ${priority.toUpperCase()}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Submitted:</strong></td>
                  <td style="padding: 8px 0;">${format(new Date(), 'PPp')}</td>
                </tr>
              </table>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0; color: #667eea;">From</h3>
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0;"><strong>Name:</strong></td>
                  <td style="padding: 8px 0;">${senderName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Email:</strong></td>
                  <td style="padding: 8px 0;">${senderEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Role:</strong></td>
                  <td style="padding: 8px 0;">${senderRole}</td>
                </tr>
              </table>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0; color: #667eea;">Issue Details</h3>
              <p><strong>Title:</strong></p>
              <p style="margin: 5px 0 15px 0; font-size: 16px;">${title}</p>
              
              <p><strong>Description:</strong></p>
              <p style="margin: 5px 0; white-space: pre-wrap;">${description}</p>
            </div>

            ${attachmentUrls && attachmentUrls.length > 0 ? `
              <div class="info-box">
                <h3 style="margin-top: 0; color: #667eea;">Attachments (${attachmentUrls.length})</h3>
                ${attachmentUrls.map((url, index) => `
                  <p style="margin: 5px 0;">
                    <a href="${url}" target="_blank" style="color: #667eea; text-decoration: none;">
                      📎 Attachment ${index + 1}
                    </a>
                  </p>
                `).join('')}
              </div>
            ` : ''}

            <div class="footer">
              <p>This is an automated support ticket from ProUltima Management System.</p>
              <p>Please respond to the ticket in the admin portal.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: `[Support #${ticketNo}] ${getCategoryLabel(category)} - ${title}`,
    html,
  });
}

/**
 * Send scrap request notification to admin
 */
export async function sendScrapRequestEmail(
  request: ScrapRequest,
  adminEmail: string
) {
  const scrapStatusLabel = {
    working: 'Working',
    damaged: 'Damaged',
    beyond_repair: 'Beyond Repair',
  }[request.scrap_status] || request.scrap_status;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Scrap Request</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📦 New Scrap Request</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello Admin,</p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              A new scrap request has been submitted by <strong>${request.submitter_name}</strong> (${request.submitter_type.toUpperCase()}) from <strong>${request.branch}</strong> branch.
            </p>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #f59e0b;">Request Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Submitter:</td>
                  <td style="padding: 8px 0; color: #333;">${request.submitter_name} (${request.submitter_type.toUpperCase()})</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Branch:</td>
                  <td style="padding: 8px 0; color: #333;">${request.branch}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Brand Name:</td>
                  <td style="padding: 8px 0; color: #333;">${request.brand_name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Workstation:</td>
                  <td style="padding: 8px 0; color: #333;">${request.workstation_number}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Serial Number:</td>
                  <td style="padding: 8px 0; color: #333;">${request.serial_number}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">User Name:</td>
                  <td style="padding: 8px 0; color: #333;">${request.users_name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Scrap Status:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${scrapStatusLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Requested Date:</td>
                  <td style="padding: 8px 0; color: #333;">${format(new Date(request.requested_date), 'dd MMM yyyy, hh:mm a')}</td>
                </tr>
                ${request.images && request.images.length > 0 ? `
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Attachments:</td>
                  <td style="padding: 8px 0; color: #333;">${request.images.length} image(s)</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/reports?tab=scrap" 
                 style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Scrap Request
              </a>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
              <p style="margin: 0;">Please review and take action on this scrap request.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `New Scrap Request from ${request.submitter_name} - ${request.brand_name}`,
    html,
  });
}

/**
 * Send scrap request approval notification to submitter
 */
export async function sendScrapApprovalEmail(
  request: ScrapRequest,
  submitterEmail: string,
  adminNotes?: string
) {
  const scrapStatusLabel = {
    working: 'Working',
    damaged: 'Damaged',
    beyond_repair: 'Beyond Repair',
  }[request.scrap_status] || request.scrap_status;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Scrap Request Approved</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">✅ Scrap Request Approved</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello ${request.submitter_name},</p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Great news! Your scrap request has been <strong style="color: #22c55e;">approved</strong> by the admin.
            </p>
            
            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #22c55e;">Request Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Brand Name:</td>
                  <td style="padding: 8px 0; color: #333;">${request.brand_name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Workstation:</td>
                  <td style="padding: 8px 0; color: #333;">${request.workstation_number}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Serial Number:</td>
                  <td style="padding: 8px 0; color: #333;">${request.serial_number}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Branch:</td>
                  <td style="padding: 8px 0; color: #333;">${request.branch}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Scrap Status:</td>
                  <td style="padding: 8px 0; color: #333;">${scrapStatusLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Status:</td>
                  <td style="padding: 8px 0; color: #22c55e; font-weight: bold;">✓ Approved</td>
                </tr>
              </table>
            </div>

            ${adminNotes ? `
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <h3 style="margin-top: 0; color: #667eea;">Admin Response:</h3>
                <p style="color: #333; margin: 0;">${adminNotes}</p>
              </div>
            ` : ''}

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/${request.submitter_type === 'staff' ? 'staff' : 'admin'}/maintenance?tab=scrap" 
                 style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Request
              </a>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
              <p style="margin: 0;">This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: submitterEmail,
    subject: `✅ Your Scrap Request has been Approved - ${request.brand_name}`,
    html,
  });
}

/**
 * Send scrap request rejection notification to submitter
 */
export async function sendScrapRejectionEmail(
  request: ScrapRequest,
  submitterEmail: string,
  rejectionReason: string
) {
  const scrapStatusLabel = {
    working: 'Working',
    damaged: 'Damaged',
    beyond_repair: 'Beyond Repair',
  }[request.scrap_status] || request.scrap_status;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Scrap Request Rejected</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">❌ Scrap Request Rejected</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello ${request.submitter_name},</p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Unfortunately, your scrap request has been <strong style="color: #ef4444;">rejected</strong> by the admin.
            </p>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #ef4444;">Request Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Brand Name:</td>
                  <td style="padding: 8px 0; color: #333;">${request.brand_name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Workstation:</td>
                  <td style="padding: 8px 0; color: #333;">${request.workstation_number}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Serial Number:</td>
                  <td style="padding: 8px 0; color: #333;">${request.serial_number}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Branch:</td>
                  <td style="padding: 8px 0; color: #333;">${request.branch}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Scrap Status:</td>
                  <td style="padding: 8px 0; color: #333;">${scrapStatusLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Status:</td>
                  <td style="padding: 8px 0; color: #ef4444; font-weight: bold;">✗ Rejected</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #fff7ed; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #f59e0b;">Reason for Rejection:</h3>
              <p style="color: #333; margin: 0;">${rejectionReason}</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/${request.submitter_type === 'staff' ? 'staff' : 'admin'}/maintenance?tab=scrap" 
                 style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Request
              </a>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
              <p style="margin: 0;">If you have questions about this decision, please contact your administrator.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: submitterEmail,
    subject: `❌ Your Scrap Request has been Rejected - ${request.brand_name}`,
    html,
  });
}

// Reschedule Notification Email Templates
interface RescheduleNotificationEmailOptions {
  type: 'new_reschedule' | 'reschedule_approved' | 'reschedule_rejected';
  to: string;
  toName: string;
  taskTitle: string;
  taskNo?: string;
  staffName?: string;
  staffEmail?: string;
  reason?: string;
  requestedDate?: string;
  originalDate?: string;
  newDueDate?: string;
  adminResponse?: string;
  rescheduleId: string;
}

export async function sendRescheduleNotificationEmail(options: RescheduleNotificationEmailOptions) {
  const { type, to, toName, taskTitle, taskNo, reason, requestedDate, originalDate, newDueDate, adminResponse } = options;

  let subject: string;
  let html: string;

  switch (type) {
    case 'new_reschedule':
      subject = `📅 New Task Reschedule Request from ${options.staffName}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">📅 Task Reschedule Request</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">A staff member has requested to reschedule a task</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0;">Task Details</h2>
              <div style="margin-bottom: 20px;">
                <strong>Task:</strong> ${taskTitle}<br>
                ${taskNo ? `<strong>Task #:</strong> ${taskNo}<br>` : ''}
                <strong>Requested by:</strong> ${options.staffName} (${options.staffEmail})<br>
                <strong>Current Due Date:</strong> ${originalDate ? format(new Date(originalDate), 'PPP') : 'Not set'}<br>
                <strong>Requested New Date:</strong> ${requestedDate ? format(new Date(requestedDate), 'PPP') : 'Not specified'}
              </div>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <strong>Reason for Rescheduling:</strong><br>
                <em>"${reason || 'No reason provided'}"</em>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/tasks?reschedule=${options.rescheduleId}" 
                   style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Review Request
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
      break;

    case 'reschedule_approved':
      subject = `✅ Your Reschedule Request has been Approved`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">✅ Reschedule Approved</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">Your task reschedule request has been approved</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0;">Task Details</h2>
              <div style="margin-bottom: 20px;">
                <strong>Task:</strong> ${taskTitle}<br>
                ${taskNo ? `<strong>Task #:</strong> ${taskNo}<br>` : ''}
                <strong>New Due Date:</strong> ${newDueDate ? format(new Date(newDueDate), 'PPP') : 'Not specified'}
              </div>
              
              ${adminResponse ? `
                <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <strong>Admin Response:</strong><br>
                  <em>"${adminResponse}"</em>
                </div>
              ` : ''}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/staff/tasks" 
                   style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  View Tasks
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
      break;

    case 'reschedule_rejected':
      subject = `❌ Your Reschedule Request has been Rejected`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">❌ Reschedule Rejected</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">Your task reschedule request has been rejected</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0;">Task Details</h2>
              <div style="margin-bottom: 20px;">
                <strong>Task:</strong> ${taskTitle}<br>
                ${taskNo ? `<strong>Task #:</strong> ${taskNo}<br>` : ''}
                <strong>Original Due Date:</strong> ${originalDate ? format(new Date(originalDate), 'PPP') : 'Not set'}
              </div>
              
              <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <strong>Rejection Reason:</strong><br>
                <em>"${adminResponse || 'No reason provided'}"</em>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/staff/tasks" 
                   style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  View Tasks
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
      break;

    default:
      throw new Error('Invalid reschedule notification type');
  }

  return sendEmail({
    to,
    subject,
    html,
  });
}

// Asset Request Email Templates

/**
 * Send asset request notification to admin
 */
export async function sendAssetRequestNotificationEmail(assetRequest: AssetRequest, adminEmail: string) {
  if (!adminEmail) {
    console.warn('No admin email provided for asset request notification');
    return { success: false, error: 'No admin email provided' };
  }

  const subject = `New Asset Request - ${assetRequest.product_name}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Asset Request</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .info-table th, .info-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        .info-table th { background: #e2e8f0; font-weight: 600; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
        .badge-pending { background: #fef3c7; color: #92400e; }
        .badge-new { background: #d1fae5; color: #065f46; }
        .badge-refurbished { background: #e5e7eb; color: #374151; }
        .badge-used { background: #f3f4f6; color: #6b7280; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Asset Request</h1>
          <p>A staff member has submitted a new asset request</p>
        </div>
        <div class="content">
          <h2>Request Details</h2>
          <table class="info-table">
            <tr>
              <th>Staff Name</th>
              <td>${assetRequest.staff_name}</td>
            </tr>
            <tr>
              <th>Branch</th>
              <td>${assetRequest.branch}</td>
            </tr>
            <tr>
              <th>Product Name</th>
              <td>${assetRequest.product_name}</td>
            </tr>
            <tr>
              <th>Quantity</th>
              <td>${assetRequest.quantity}</td>
            </tr>
            <tr>
              <th>Condition</th>
              <td><span class="badge badge-${assetRequest.condition || 'new'}">${(assetRequest.condition || 'new').charAt(0).toUpperCase() + (assetRequest.condition || 'new').slice(1)}</span></td>
            </tr>
            <tr>
              <th>Status</th>
              <td><span class="badge badge-pending">Pending</span></td>
            </tr>
            <tr>
              <th>Requested Date</th>
              <td>${format(new Date(assetRequest.requested_date), 'PPP')}</td>
            </tr>
            ${assetRequest.additional_notes ? `
            <tr>
              <th>Additional Notes</th>
              <td>${assetRequest.additional_notes}</td>
            </tr>
            ` : ''}
            ${assetRequest.image_urls && assetRequest.image_urls.length > 0 ? `
            <tr>
              <th>Images</th>
              <td>${assetRequest.image_urls.length} image(s) attached</td>
            </tr>
            ` : ''}
          </table>
          
          <p><strong>Action Required:</strong> Please review this request in the admin panel and approve or reject it.</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from ProUltima Task Manager</p>
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
 * Send asset approval notification to staff
 */
export async function sendAssetApprovalEmail(assetRequest: AssetRequest, staffEmail: string, adminNotes?: string) {
  const subject = `Asset Request Approved - ${assetRequest.product_name}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Asset Request Approved</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .info-table th, .info-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        .info-table th { background: #e2e8f0; font-weight: 600; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
        .badge-approved { background: #d1fae5; color: #065f46; }
        .badge-new { background: #d1fae5; color: #065f46; }
        .badge-refurbished { background: #e5e7eb; color: #374151; }
        .badge-used { background: #f3f4f6; color: #6b7280; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        .success-message { background: #d1fae5; color: #065f46; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Asset Request Approved</h1>
          <p>Your asset request has been approved</p>
        </div>
        <div class="content">
          <div class="success-message">
            <strong>✅ Great news!</strong> Your asset request has been approved and will be processed soon.
          </div>
          
          <h2>Request Details</h2>
          <table class="info-table">
            <tr>
              <th>Product Name</th>
              <td>${assetRequest.product_name}</td>
            </tr>
            <tr>
              <th>Quantity</th>
              <td>${assetRequest.quantity}</td>
            </tr>
            <tr>
              <th>Condition</th>
              <td><span class="badge badge-${assetRequest.condition || 'new'}">${(assetRequest.condition || 'new').charAt(0).toUpperCase() + (assetRequest.condition || 'new').slice(1)}</span></td>
            </tr>
            <tr>
              <th>Status</th>
              <td><span class="badge badge-approved">Approved</span></td>
            </tr>
            <tr>
              <th>Requested Date</th>
              <td>${format(new Date(assetRequest.requested_date), 'PPP')}</td>
            </tr>
            <tr>
              <th>Approved Date</th>
              <td>${assetRequest.approved_at ? format(new Date(assetRequest.approved_at), 'PPP') : 'N/A'}</td>
            </tr>
            ${assetRequest.admin_notes ? `
            <tr>
              <th>Admin Notes</th>
              <td>${assetRequest.admin_notes}</td>
            </tr>
            ` : ''}
          </table>
          
          <p><strong>Next Steps:</strong> The IT team will contact you regarding the delivery and setup of your requested assets.</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from ProUltima Task Manager</p>
          ${adminNotes ? `<p><strong>Admin Notes:</strong> ${adminNotes}</p>` : ''}
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
 * Send asset rejection notification to staff
 */
export async function sendAssetRejectionEmail(assetRequest: AssetRequest, staffEmail: string, rejectionReason?: string) {
  const subject = `Asset Request Rejected - ${assetRequest.product_name}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Asset Request Rejected</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .info-table th, .info-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        .info-table th { background: #e2e8f0; font-weight: 600; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
        .badge-rejected { background: #fee2e2; color: #991b1b; }
        .badge-new { background: #d1fae5; color: #065f46; }
        .badge-refurbished { background: #e5e7eb; color: #374151; }
        .badge-used { background: #f3f4f6; color: #6b7280; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        .rejection-message { background: #fee2e2; color: #991b1b; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Asset Request Rejected</h1>
          <p>Your asset request has been rejected</p>
        </div>
        <div class="content">
          <div class="rejection-message">
            <strong>❌ Request Rejected</strong> Your asset request has been rejected. Please see the reason below.
          </div>
          
          <h2>Request Details</h2>
          <table class="info-table">
            <tr>
              <th>Product Name</th>
              <td>${assetRequest.product_name}</td>
            </tr>
            <tr>
              <th>Quantity</th>
              <td>${assetRequest.quantity}</td>
            </tr>
            <tr>
              <th>Condition</th>
              <td><span class="badge badge-${assetRequest.condition || 'new'}">${(assetRequest.condition || 'new').charAt(0).toUpperCase() + (assetRequest.condition || 'new').slice(1)}</span></td>
            </tr>
            <tr>
              <th>Status</th>
              <td><span class="badge badge-rejected">Rejected</span></td>
            </tr>
            <tr>
              <th>Requested Date</th>
              <td>${format(new Date(assetRequest.requested_date), 'PPP')}</td>
            </tr>
            <tr>
              <th>Rejected Date</th>
              <td>${assetRequest.approved_at ? format(new Date(assetRequest.approved_at), 'PPP') : 'N/A'}</td>
            </tr>
            ${assetRequest.rejection_reason ? `
            <tr>
              <th>Rejection Reason</th>
              <td>${assetRequest.rejection_reason}</td>
            </tr>
            ` : ''}
            ${assetRequest.admin_notes ? `
            <tr>
              <th>Admin Notes</th>
              <td>${assetRequest.admin_notes}</td>
            </tr>
            ` : ''}
          </table>
          
          <p><strong>Next Steps:</strong> You can submit a new request with the necessary corrections or contact your manager for more information.</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from ProUltima Task Manager</p>
          ${rejectionReason ? `<p><strong>Rejection Reason:</strong> ${rejectionReason}</p>` : ''}
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
 * Send grocery request notification to admin
 */
export async function sendGroceryRequestEmail(
  groceryRequest: GroceryRequest,
  adminEmail: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .label { font-weight: 600; color: #6b7280; }
          .value { color: #111827; }
          .total { font-size: 24px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🛒 New Stationary Request</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">A staff member has submitted a stationary request</p>
          </div>
          <div class="content">
            <div class="info-card">
              <div class="info-row">
                <span class="label">Staff Name:</span>
                <span class="value">${groceryRequest.staff_name}</span>
              </div>
              <div class="info-row">
                <span class="label">Branch:</span>
                <span class="value">${groceryRequest.branch}</span>
              </div>
              <div class="info-row">
                <span class="label">Items:</span>
                <span class="value">${groceryRequest.items?.length || 0} item(s)</span>
              </div>
              ${groceryRequest.notes ? `
              <div class="info-row">
                <span class="label">Notes:</span>
                <span class="value">${groceryRequest.notes}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="label">Requested Date:</span>
                <span class="value">${format(new Date(groceryRequest.requested_date), 'PPP p')}</span>
              </div>
            </div>
            <div class="total">
              Total Amount: ₹${(groceryRequest.total_request_amount || 0).toFixed(2)}
            </div>
            <p style="text-align: center; color: #6b7280; margin-top: 30px;">
              Please review and approve/reject this request in the admin panel.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `New Stationary Request from ${groceryRequest.staff_name}`,
    html,
  });
}

/**
 * Send grocery approval notification to staff
 */
export async function sendGroceryApprovalEmail(
  groceryRequest: GroceryRequest,
  staffEmail: string,
  adminNotes?: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-badge { background: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: 600; margin: 20px 0; }
          .info-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">✅ Stationary Request Approved</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your stationary request has been approved</p>
          </div>
          <div class="content">
            <div class="success-badge">APPROVED</div>
            <div class="info-card">
              <h3>Request Details:</h3>
              <p><strong>Items:</strong> ${groceryRequest.items?.length || 0} item(s)</p>
              <p><strong>Total Amount:</strong> ₹${(groceryRequest.total_request_amount || 0).toFixed(2)}</p>
              ${adminNotes ? `<p><strong>Admin Notes:</strong> ${adminNotes}</p>` : ''}
              <p><strong>Approved Date:</strong> ${format(new Date(groceryRequest.approved_at!), 'PPP p')}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: staffEmail,
    subject: 'Stationary Request Approved',
    html,
  });
}

/**
 * Send grocery rejection notification to staff
 */
export async function sendGroceryRejectionEmail(
  groceryRequest: GroceryRequest,
  staffEmail: string,
  rejectionReason: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .reject-badge { background: #fee2e2; color: #991b1b; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: 600; margin: 20px 0; }
          .info-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .reason-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">❌ Stationary Request Rejected</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your stationary request has been rejected</p>
          </div>
          <div class="content">
            <div class="reject-badge">REJECTED</div>
            <div class="info-card">
              <h3>Request Details:</h3>
              <p><strong>Items:</strong> ${groceryRequest.items?.length || 0} item(s)</p>
              <p><strong>Total Amount:</strong> ₹${(groceryRequest.total_request_amount || 0).toFixed(2)}</p>
              <div class="reason-box">
                <strong>Rejection Reason:</strong><br/>
                ${rejectionReason}
              </div>
              ${groceryRequest.admin_notes ? `<p><strong>Admin Notes:</strong> ${groceryRequest.admin_notes}</p>` : ''}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: staffEmail,
    subject: 'Stationary Request Rejected',
    html,
  });
}

// Delegation Email Functions

export async function sendDelegationCompletionEmail(
  delegatorEmail: string,
  delegatorName: string,
  delegateeName: string,
  taskTitle: string,
  taskNo: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Delegated Task Completed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .task-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #3b82f6; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Delegated Task Completed</h1>
            <p>Action required: Please verify task completion</p>
          </div>
          <div class="content">
            <p>Hello <strong>${delegatorName}</strong>,</p>
            
            <p><strong>${delegateeName}</strong> has completed the task you delegated to them and it requires your verification.</p>
            
            <div class="task-info">
              <h3>Task Details</h3>
              <p><strong>Task:</strong> ${taskTitle}</p>
              <p><strong>Task Number:</strong> ${taskNo}</p>
              <p><strong>Completed by:</strong> ${delegateeName}</p>
              <p><strong>Completed on:</strong> ${format(new Date(), 'PPP p')}</p>
            </div>
            
            <div class="warning">
              <p><strong>⚠️ Action Required:</strong> Please log in to the system to review and verify the completed work.</p>
            </div>
            
            <p>You can approve or reject the task completion based on your review.</p>
            
            <p>Best regards,<br>ProUltima Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: delegatorEmail,
    subject: `Task Completed - Verification Required: ${taskTitle}`,
    html,
  });
}

export async function sendDelegationVerifiedEmail(
  delegateeEmail: string,
  delegateeName: string,
  delegatorName: string,
  taskTitle: string,
  taskNo: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Task Verification Approved</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f0fdf4; padding: 20px; border-radius: 0 0 8px 8px; }
          .task-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #10b981; }
          .success { background: #d1fae5; border: 1px solid #10b981; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Task Verification Approved</h1>
            <p>Your completed task has been verified and approved</p>
          </div>
          <div class="content">
            <p>Hello <strong>${delegateeName}</strong>,</p>
            
            <p>Great news! <strong>${delegatorName}</strong> has reviewed and approved your completed task.</p>
            
            <div class="task-info">
              <h3>Task Details</h3>
              <p><strong>Task:</strong> ${taskTitle}</p>
              <p><strong>Task Number:</strong> ${taskNo}</p>
              <p><strong>Verified by:</strong> ${delegatorName}</p>
              <p><strong>Verified on:</strong> ${format(new Date(), 'PPP p')}</p>
            </div>
            
            <div class="success">
              <p><strong>🎉 Congratulations!</strong> The task has been successfully completed and verified.</p>
            </div>
            
            <p>Thank you for your excellent work!</p>
            
            <p>Best regards,<br>ProUltima Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: delegateeEmail,
    subject: `Task Approved: ${taskTitle}`,
    html,
  });
}

export async function sendDelegationRejectedEmail(
  delegateeEmail: string,
  delegateeName: string,
  delegatorName: string,
  taskTitle: string,
  taskNo: string,
  rejectionReason?: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Task Verification Rejected</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #fef2f2; padding: 20px; border-radius: 0 0 8px 8px; }
          .task-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #ef4444; }
          .rejection { background: #fee2e2; border: 1px solid #ef4444; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Task Verification Rejected</h1>
            <p>Please review and resubmit your work</p>
          </div>
          <div class="content">
            <p>Hello <strong>${delegateeName}</strong>,</p>
            
            <p><strong>${delegatorName}</strong> has reviewed your completed task but found it needs additional work or corrections.</p>
            
            <div class="task-info">
              <h3>Task Details</h3>
              <p><strong>Task:</strong> ${taskTitle}</p>
              <p><strong>Task Number:</strong> ${taskNo}</p>
              <p><strong>Rejected by:</strong> ${delegatorName}</p>
              <p><strong>Rejected on:</strong> ${format(new Date(), 'PPP p')}</p>
            </div>
            
            ${rejectionReason ? `
              <div class="rejection">
                <h4>Rejection Reason:</h4>
                <p>${rejectionReason}</p>
              </div>
            ` : ''}
            
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Please review the feedback above</li>
              <li>Make the necessary corrections or improvements</li>
              <li>Resubmit the task for verification</li>
            </ul>
            
            <p>If you have any questions, please contact ${delegatorName} directly.</p>
            
            <p>Best regards,<br>ProUltima Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: delegateeEmail,
    subject: `Task Rejected - Action Required: ${taskTitle}`,
    html,
  });
}

// Purchase 2-Step Verification Email Functions

/**
 * Send purchase product uploaded notification to admin
 */
export async function sendPurchaseProductUploadedEmail(purchase: PurchaseRequisition, adminEmail: string) {
  const subject = `Product Images Ready for Verification - ${purchase.purchase_item}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Product Images Ready for Verification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .request-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #f59e0b; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📸 Product Images Ready for Verification</h1>
          <p>Staff has uploaded actual product images for your review</p>
        </div>
        <div class="content">
          <p>Hello Admin,</p>
          
          <p><strong>${purchase.staff?.name || 'Staff Member'}</strong> has uploaded actual product images for the purchase requisition that was previously approved.</p>
          
          <div class="request-info">
            <h3>Purchase Request Details</h3>
            <p><strong>Requested Item:</strong> ${purchase.purchase_item}</p>
            <p><strong>Requested by:</strong> ${purchase.staff?.name || 'Staff Member'}</p>
            <p><strong>Branch:</strong> ${purchase.branch}</p>
            <p><strong>Description:</strong> ${purchase.description || 'N/A'}</p>
            ${purchase.product_name ? `
            <h3 style="margin-top: 20px;">Product Details</h3>
            ${purchase.request_type ? `<p><strong>Purchase Type:</strong> <span style="background: ${purchase.request_type === 'system' ? '#3b82f6' : '#8b5cf6'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${purchase.request_type === 'system' ? 'System' : 'Common'}</span></p>` : ''}
            <p><strong>Product Name:</strong> ${purchase.product_name}</p>
            <p><strong>Brand:</strong> ${purchase.brand_name || 'N/A'}</p>
            ${purchase.serial_no ? `<p><strong>Serial Number:</strong> ${purchase.serial_no}</p>` : ''}
            ${purchase.warranty ? `<p><strong>Warranty:</strong> ${purchase.warranty}</p>` : ''}
            <p><strong>Condition:</strong> ${purchase.condition ? purchase.condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}</p>
            ${purchase.request_type === 'system' ? `<p><strong>User Name:</strong> ${purchase.user_name || 'N/A'}</p>` : ''}
            ${purchase.request_type === 'common' && purchase.shop_contact ? `<p><strong>Shop Contact:</strong> ${purchase.shop_contact}</p>` : ''}
            ${purchase.request_type === 'common' && purchase.quantity ? `<p><strong>Quantity:</strong> ${purchase.quantity}</p>` : ''}
            ${purchase.request_type === 'common' && purchase.price !== undefined && purchase.price !== null ? `<p><strong>Price:</strong> ₹${purchase.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>` : ''}
            ${purchase.remote_id ? `<p><strong>Remote ID:</strong> ${purchase.remote_id}</p>` : ''}
            ${purchase.specification ? `<p><strong>Specification:</strong> ${purchase.specification}</p>` : ''}
            ` : ''}
            <p><strong>Uploaded on:</strong> ${purchase.product_uploaded_at ? format(new Date(purchase.product_uploaded_at), 'PPP p') : format(new Date(), 'PPP p')}</p>
          </div>
          
          <p><strong>Action Required:</strong> Please review the uploaded product details and images to verify if they match the approved request.</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/maintenance" class="button">
            Review Product Images
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
 * Send purchase product verified notification to staff
 */
export async function sendPurchaseProductVerifiedEmail(purchase: PurchaseRequisition, staffEmail: string, verificationNotes?: string) {
  const subject = `Product Verification Approved - ${purchase.purchase_item}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Product Verification Approved</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f0fdf4; padding: 20px; border-radius: 0 0 8px 8px; }
        .request-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #10b981; }
        .success { background: #d1fae5; border: 1px solid #10b981; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Product Verification Approved</h1>
          <p>Your product images have been verified and approved</p>
        </div>
        <div class="content">
          <p>Hello <strong>${purchase.staff?.name || 'Staff Member'}</strong>,</p>
          
          <div class="success">
            <p><strong>🎉 Great news!</strong> Your uploaded product images have been reviewed and approved by the admin.</p>
          </div>
          
          <div class="request-info">
            <h3>Purchase Request Details</h3>
            <p><strong>Requested Item:</strong> ${purchase.purchase_item}</p>
            <p><strong>Branch:</strong> ${purchase.branch}</p>
            <p><strong>Description:</strong> ${purchase.description || 'N/A'}</p>
            ${purchase.product_name ? `
            <h3 style="margin-top: 20px;">Product Details</h3>
            ${purchase.request_type ? `<p><strong>Purchase Type:</strong> <span style="background: ${purchase.request_type === 'system' ? '#3b82f6' : '#8b5cf6'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${purchase.request_type === 'system' ? 'System' : 'Common'}</span></p>` : ''}
            <p><strong>Product Name:</strong> ${purchase.product_name}</p>
            <p><strong>Brand:</strong> ${purchase.brand_name || 'N/A'}</p>
            ${purchase.serial_no ? `<p><strong>Serial Number:</strong> ${purchase.serial_no}</p>` : ''}
            ${purchase.warranty ? `<p><strong>Warranty:</strong> ${purchase.warranty}</p>` : ''}
            <p><strong>Condition:</strong> ${purchase.condition ? purchase.condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}</p>
            ${purchase.request_type === 'system' ? `<p><strong>User Name:</strong> ${purchase.user_name || 'N/A'}</p>` : ''}
            ${purchase.request_type === 'common' && purchase.shop_contact ? `<p><strong>Shop Contact:</strong> ${purchase.shop_contact}</p>` : ''}
            ${purchase.request_type === 'common' && purchase.quantity ? `<p><strong>Quantity:</strong> ${purchase.quantity}</p>` : ''}
            ${purchase.request_type === 'common' && purchase.price !== undefined && purchase.price !== null ? `<p><strong>Price:</strong> ₹${purchase.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>` : ''}
            ${purchase.remote_id ? `<p><strong>Remote ID:</strong> ${purchase.remote_id}</p>` : ''}
            ${purchase.specification ? `<p><strong>Specification:</strong> ${purchase.specification}</p>` : ''}
            ` : ''}
            <p><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">COMPLETED</span></p>
            <p><strong>Verified on:</strong> ${purchase.verified_at ? format(new Date(purchase.verified_at), 'PPP p') : format(new Date(), 'PPP p')}</p>
          </div>
          
          ${verificationNotes ? `
            <div class="request-info">
              <h3>Admin Notes</h3>
              <p>${verificationNotes}</p>
            </div>
          ` : ''}
          
          <p><strong>Next Steps:</strong> The purchase process is now complete. ${purchase.request_type === 'system' ? 'An asset record has been automatically created in your asset list.' : 'The procurement team will proceed with the order.'}</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/staff/maintenance" class="button">
            View Request
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
 * Send purchase product rejected notification to staff
 */
export async function sendPurchaseProductRejectedEmail(purchase: PurchaseRequisition, staffEmail: string, rejectionReason?: string) {
  const subject = `Product Verification Rejected - ${purchase.purchase_item}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Product Verification Rejected</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fef2f2; padding: 20px; border-radius: 0 0 8px 8px; }
        .request-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #ef4444; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .button { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Product Verification Rejected</h1>
          <p>Your product images need to be resubmitted</p>
        </div>
        <div class="content">
          <p>Hello <strong>${purchase.staff?.name || 'Staff Member'}</strong>,</p>
          
          <div class="warning">
            <p><strong>⚠️ Action Required:</strong> The product details you uploaded have been reviewed and rejected by the admin.</p>
          </div>
          
          <div class="request-info">
            <h3>Purchase Request Details</h3>
            <p><strong>Requested Item:</strong> ${purchase.purchase_item}</p>
            <p><strong>Branch:</strong> ${purchase.branch}</p>
            <p><strong>Description:</strong> ${purchase.description || 'N/A'}</p>
            ${purchase.product_name ? `
            <h3 style="margin-top: 20px;">Product Details</h3>
            ${purchase.request_type ? `<p><strong>Purchase Type:</strong> <span style="background: ${purchase.request_type === 'system' ? '#3b82f6' : '#8b5cf6'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${purchase.request_type === 'system' ? 'System' : 'Common'}</span></p>` : ''}
            <p><strong>Product Name:</strong> ${purchase.product_name}</p>
            <p><strong>Brand:</strong> ${purchase.brand_name || 'N/A'}</p>
            ${purchase.serial_no ? `<p><strong>Serial Number:</strong> ${purchase.serial_no}</p>` : ''}
            ${purchase.warranty ? `<p><strong>Warranty:</strong> ${purchase.warranty}</p>` : ''}
            <p><strong>Condition:</strong> ${purchase.condition ? purchase.condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}</p>
            ${purchase.request_type === 'system' ? `<p><strong>User Name:</strong> ${purchase.user_name || 'N/A'}</p>` : ''}
            ${purchase.request_type === 'common' && purchase.shop_contact ? `<p><strong>Shop Contact:</strong> ${purchase.shop_contact}</p>` : ''}
            ${purchase.request_type === 'common' && purchase.quantity ? `<p><strong>Quantity:</strong> ${purchase.quantity}</p>` : ''}
            ${purchase.request_type === 'common' && purchase.price !== undefined && purchase.price !== null ? `<p><strong>Price:</strong> ₹${purchase.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>` : ''}
            ${purchase.remote_id ? `<p><strong>Remote ID:</strong> ${purchase.remote_id}</p>` : ''}
            ${purchase.specification ? `<p><strong>Specification:</strong> ${purchase.specification}</p>` : ''}
            ` : ''}
            <p><strong>Status:</strong> <span style="color: #ef4444; font-weight: bold;">VERIFICATION PENDING</span></p>
            <p><strong>Rejected on:</strong> ${format(new Date(), 'PPP p')}</p>
          </div>
          
          ${rejectionReason ? `
            <div class="request-info">
              <h3>Rejection Reason</h3>
              <p>${rejectionReason}</p>
            </div>
          ` : ''}
          
          <p><strong>Next Steps:</strong> Please update the product details and upload new product images that meet the requirements, then resubmit for verification.</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/staff/maintenance" class="button">
            Upload New Images
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
 * Send purchase asset created notification to staff
 * Notifies staff when an asset is auto-created from purchase verification
 */
export async function sendPurchaseAssetCreatedEmail(
  purchase: PurchaseRequisition,
  assetRequest: AssetRequest,
  staffEmail: string
) {
  const subject = `Asset Created from Purchase - ${purchase.product_name || purchase.purchase_item}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Asset Created from Purchase</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .request-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #3b82f6; }
        .success { background: #dbeafe; border: 1px solid #3b82f6; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Asset Created from Purchase</h1>
          <p>Your verified purchase has been added to your assets</p>
        </div>
        <div class="content">
          <p>Hello <strong>${purchase.staff?.name || 'Staff Member'}</strong>,</p>
          
          <div class="success">
            <p><strong>✅ Asset Created!</strong> Your verified purchase has been automatically added to your asset list.</p>
          </div>
          
          <div class="request-info">
            <h3>Purchase Details</h3>
            <p><strong>Purchase Item:</strong> ${purchase.purchase_item}</p>
            <p><strong>Product Name:</strong> ${purchase.product_name || 'N/A'}</p>
            <p><strong>Branch:</strong> ${purchase.branch}</p>
            ${purchase.request_type ? `<p><strong>Purchase Type:</strong> <span style="background: ${purchase.request_type === 'system' ? '#3b82f6' : '#8b5cf6'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${purchase.request_type === 'system' ? 'System' : 'Common'}</span></p>` : ''}
          </div>
          
          <div class="request-info">
            <h3>Asset Details</h3>
            <p><strong>Product Name:</strong> ${assetRequest.product_name}</p>
            <p><strong>Quantity:</strong> ${assetRequest.quantity}</p>
            ${assetRequest.brand_name ? `<p><strong>Brand:</strong> ${assetRequest.brand_name}</p>` : ''}
            ${assetRequest.serial_no ? `<p><strong>Serial Number:</strong> ${assetRequest.serial_no}</p>` : ''}
            ${assetRequest.condition ? `<p><strong>Condition:</strong> ${assetRequest.condition.charAt(0).toUpperCase() + assetRequest.condition.slice(1)}</p>` : ''}
            ${assetRequest.warranty ? `<p><strong>Warranty:</strong> ${assetRequest.warranty}</p>` : ''}
            <p><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">APPROVED</span></p>
            <p><strong>Created on:</strong> ${format(new Date(assetRequest.requested_date), 'PPP p')}</p>
          </div>
          
          <p><strong>Note:</strong> This asset was automatically created when your purchase was verified. You can view and manage it in your asset list.</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/staff/maintenance" class="button">
            View Assets
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
 * Send purchase duplicate serial number notification to staff
 * Notifies staff when a duplicate serial number is detected during asset creation
 */
export async function sendPurchaseDuplicateSerialEmail(
  purchase: PurchaseRequisition,
  duplicateSerialNo: string,
  staffEmail: string
) {
  const subject = `Duplicate Serial Number Detected - ${purchase.product_name || purchase.purchase_item}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Duplicate Serial Number Detected</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fef3c7; padding: 20px; border-radius: 0 0 8px 8px; }
        .request-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #f59e0b; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Duplicate Serial Number Detected</h1>
          <p>Asset creation skipped due to duplicate serial number</p>
        </div>
        <div class="content">
          <p>Hello <strong>${purchase.staff?.name || 'Staff Member'}</strong>,</p>
          
          <div class="warning">
            <p><strong>⚠️ Important Notice:</strong> Your purchase was verified, but the asset creation was skipped because a duplicate serial number was found in the system.</p>
          </div>
          
          <div class="request-info">
            <h3>Purchase Details</h3>
            <p><strong>Purchase Item:</strong> ${purchase.purchase_item}</p>
            <p><strong>Product Name:</strong> ${purchase.product_name || 'N/A'}</p>
            <p><strong>Serial Number:</strong> <strong style="color: #ef4444;">${duplicateSerialNo}</strong></p>
            <p><strong>Branch:</strong> ${purchase.branch}</p>
            <p><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">VERIFIED</span></p>
          </div>
          
          <div class="request-info">
            <h3>What This Means</h3>
            <p>The serial number <strong>${duplicateSerialNo}</strong> already exists in the asset system. To prevent duplicates, the asset was not automatically created.</p>
            <p><strong>Action Required:</strong> Please verify the serial number or contact your admin if you believe this is an error.</p>
          </div>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/staff/maintenance" class="button">
            View Purchase Details
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
 * Send low balance alert email to admins
 * Notifies admins when a branch balance drops below ₹500
 */
export async function sendLowBalanceAlertEmail(
  branchName: string,
  currentBalance: number,
  adminEmails: string[]
): Promise<{ success: boolean; messageId?: string }> {
  const subject = `Low Balance Alert: ${branchName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Low Balance Alert</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
        <h2 style="color: #856404; margin-top: 0;">⚠️ Low Balance Alert</h2>
      </div>
      
      <p>Dear Admin,</p>
      
      <p>The <strong>${branchName}</strong> branch is currently below 500 rupees.</p>
      
      <div style="background-color: #f8f9fa; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Branch:</strong> ${branchName}</p>
        <p style="margin: 5px 0 0 0;"><strong>Current Balance:</strong> ₹${currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <p style="margin: 5px 0 0 0;"><strong>Threshold:</strong> ₹500.00</p>
      </div>
      
      <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Action Required:</strong></p>
        <p style="margin: 5px 0 0 0;">Please add opening account balance to maintain sufficient funds for the ${branchName} branch.</p>
        <p style="margin: 5px 0 0 0;">You can update the opening balance from the Admin Settings page.</p>
      </div>
      
      <p style="margin-top: 30px;">Best regards,<br><strong>ProUltima System</strong></p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
    </body>
    </html>
  `;

  return sendEmail({
    to: adminEmails,
    subject,
    html,
  });
}

export async function sendRepeatedTaskEmail(
  recipientEmail: string,
  recipientName: string,
  taskTitle: string,
  taskNo: string,
  priority: string,
  dueDate?: string
) {
  const priorityColors: Record<string, string> = {
    low: '#3b82f6',
    medium: '#f59e0b',
    high: '#ef4444',
    urgent: '#dc2626',
  };

  const priorityKey = typeof priority === 'string' ? priority.toLowerCase() : String(priority);

  const priorityColor = priorityColors[priorityKey] || '#6b7280';

  const dueDateDisplay = dueDate
    ? format(new Date(dueDate), "EEEE, MMMM do yyyy 'at' h:mm a")
    : null;

  const priorityLabel = typeof priority === 'string' ? priority.toUpperCase() : String(priority).toUpperCase();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #14b8a6 0%, #0ea5e9 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .task-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
          .priority { background-color: ${priorityColor}; color: white; }
          .repeat { background-color: #0ea5e9; color: white; }
          .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Repeated Task Created</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">A recurring task has been generated for you</p>
          </div>
          <div class="content">
            <p>Hi ${recipientName},</p>
            <p>A repeated task has been automatically created for you:</p>
            <div class="task-card">
              <h2 style="margin-top: 0; color: #111827;">${taskTitle}</h2>
              <p style="margin: 4px 0 12px 0; color: #6b7280;">Task Number: ${taskNo}</p>
              <div style="margin: 15px 0; display: flex; gap: 8px; align-items: center;">
                <span class="badge priority">${priorityLabel}</span>
                <span class="badge repeat">REPEATED TASK</span>
              </div>
              ${dueDateDisplay ? `
                <p style="margin: 10px 0; color: #6b7280;">
                  <strong>Due Date:</strong> ${dueDateDisplay}
                </p>
              ` : ''}
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/staff/tasks" class="button">
              View Task
            </a>
            <div class="footer">
              <p>This task was automatically scheduled by ProUltima Task Manager.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: `🔄 Repeated Task Assigned: ${taskTitle} (${taskNo})`,
    html,
  });
}

