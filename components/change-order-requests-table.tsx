"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, CheckCircle2, XCircle, Clock, Edit, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export interface ChangeOrderRequest {
  id: string
  coNumber: string
  project: string
  projectNumber: string
  description: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "approved" | "rejected" | "fulfilled"
  requestedBy: string
  requestedDate: string
  requiredDate?: string
  approvedBy?: string
  approvedDate?: string
  revisionTime?: number
  notes?: string
}

interface ChangeOrderRequestsTableProps {
  requests: ChangeOrderRequest[]
  onStatusChange?: (id: string, status: ChangeOrderRequest["status"]) => void
  onViewDetails?: (request: ChangeOrderRequest) => void
  onEdit?: (request: ChangeOrderRequest) => void
  onDelete?: (id: string) => void
}

export function ChangeOrderRequestsTable({
  requests,
  onStatusChange,
  onViewDetails,
  onEdit,
  onDelete,
}: ChangeOrderRequestsTableProps) {
  const getPriorityBadge = (priority: ChangeOrderRequest["priority"]) => {
    const variants = {
      low: "outline",
      medium: "secondary",
      high: "default",
      urgent: "destructive",
    } as const

    return (
      <Badge variant={variants[priority]} className="capitalize">
        {priority}
      </Badge>
    )
  }

  const getStatusBadge = (status: ChangeOrderRequest["status"]) => {
    const config = {
      pending: { variant: "secondary" as const, icon: Clock, label: "Pending" },
      approved: { variant: "default" as const, icon: CheckCircle2, label: "Approved" },
      rejected: { variant: "destructive" as const, icon: XCircle, label: "Rejected" },
      fulfilled: { variant: "default" as const, icon: CheckCircle2, label: "Fulfilled" },
    }

    const { variant, icon: Icon, label } = config[status]
    return (
      <Badge variant={variant} className="capitalize">
        <Icon className="mr-1 h-3 w-3" />
        {label}
      </Badge>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No change order requests found</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-green-50 dark:bg-green-950/20">
            <TableHead className="text-green-700 dark:text-green-300 font-semibold">CO Number</TableHead>
            <TableHead className="text-green-700 dark:text-green-300 font-semibold">Project</TableHead>
            <TableHead className="text-green-700 dark:text-green-300 font-semibold">Description</TableHead>
            <TableHead className="text-green-700 dark:text-green-300 font-semibold">Priority</TableHead>
            <TableHead className="text-green-700 dark:text-green-300 font-semibold">Status</TableHead>
            <TableHead className="text-green-700 dark:text-green-300 font-semibold">Requested By</TableHead>
            <TableHead className="text-green-700 dark:text-green-300 font-semibold">Requested Date</TableHead>
            <TableHead className="text-green-700 dark:text-green-300 font-semibold">Required Date</TableHead>
            <TableHead className="text-green-700 dark:text-green-300 font-semibold">Revision Time</TableHead>
            <TableHead className="text-green-700 dark:text-green-300 font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id} className="border-b">
              <TableCell className="font-medium">{request.coNumber}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{request.project}</div>
                  <div className="text-sm text-muted-foreground">{request.projectNumber}</div>
                </div>
              </TableCell>
              <TableCell className="max-w-xs">
                <div className="truncate" title={request.description}>
                  {request.description}
                </div>
              </TableCell>
              <TableCell>{getPriorityBadge(request.priority)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusBadge(request.status)}
                  {onStatusChange && request.status === "pending" && (
                    <Select
                      value={request.status}
                      onValueChange={(value) =>
                        onStatusChange(request.id, value as ChangeOrderRequest["status"])
                      }
                    >
                      <SelectTrigger className="h-7 w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Approve</SelectItem>
                        <SelectItem value="rejected">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </TableCell>
              <TableCell>{request.requestedBy}</TableCell>
              <TableCell>
                {format(new Date(request.requestedDate), "MMM dd, yyyy")}
              </TableCell>
              <TableCell>
                {request.requiredDate
                  ? format(new Date(request.requiredDate), "MMM dd, yyyy")
                  : "-"}
              </TableCell>
              <TableCell>
                {request.revisionTime ? `${request.revisionTime} hrs` : "-"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {onViewDetails && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(request)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(request)}
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(request.id)}
                      title="Delete"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

