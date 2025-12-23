/**
 * Audit Logger for PDF Editor
 * Tracks all user actions for compliance and security
 */

import type { AuditLog } from "./types";

export class AuditLogger {
  private logs: AuditLog[] = [];
  private maxLogs: number = 10000;
  private userId?: string;
  private userName?: string;
  private userEmail?: string;

  constructor(
    userId?: string,
    userName?: string,
    userEmail?: string
  ) {
    this.userId = userId;
    this.userName = userName;
    this.userEmail = userEmail;
  }

  log(
    action: string,
    type: AuditLog["type"],
    targetId?: string,
    targetType?: string,
    details?: Record<string, any>
  ): void {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      type,
      targetId,
      targetType,
      userId: this.userId || "anonymous",
      userName: this.userName || "Anonymous User",
      userEmail: this.userEmail,
      timestamp: new Date().toISOString(),
      details,
      ipAddress: typeof window !== "undefined" ? this.getClientIP() : undefined,
      userAgent: typeof window !== "undefined" ? navigator.userAgent : undefined,
    };

    this.logs.push(log);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // In production, you would send this to a backend service
    if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
      this.sendToBackend(log).catch((error) => {
        console.error("Failed to send audit log to backend:", error);
      });
    }
  }

  getLogs(filters?: {
    type?: AuditLog["type"];
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): AuditLog[] {
    let filtered = [...this.logs];

    if (filters?.type) {
      filtered = filtered.filter((log) => log.type === filters.type);
    }

    if (filters?.userId) {
      filtered = filtered.filter((log) => log.userId === filters.userId);
    }

    if (filters?.startDate) {
      filtered = filtered.filter(
        (log) => log.timestamp >= filters.startDate!
      );
    }

    if (filters?.endDate) {
      filtered = filtered.filter((log) => log.timestamp <= filters.endDate!);
    }

    return filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  clearLogs(): void {
    this.logs = [];
  }

  private getClientIP(): string | undefined {
    // In a real application, this would be obtained from the server
    // For client-side, we can't reliably get the IP
    return undefined;
  }

  private async sendToBackend(log: AuditLog): Promise<void> {
    try {
      await fetch("/api/pdf-editor/audit-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(log),
      });
    } catch (error) {
      console.error("Failed to send audit log:", error);
    }
  }
}

