"use client"

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
import { Eye, Package, CheckCircle2, Clock, XCircle, Edit, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export interface ChangeOrderAllocation {
  id: string
  allocationNumber: string
  requestId: string
  coNumber: string
  project: string
  projectNumber: string
  description: string
  status: "allocated" | "in-transit" | "delivered" | "completed" | "cancelled"
  allocatedTo: string
  allocatedDate: string
  expectedDeliveryDate?: string
  actualDeliveryDate?: string
  location?: string
  revisionTime?: number
  notes?: string
}

interface ChangeOrderAllocationsTableProps {
  allocations: ChangeOrderAllocation[]
  onViewDetails?: (allocation: ChangeOrderAllocation) => void
  onEdit?: (allocation: ChangeOrderAllocation) => void
  onDelete?: (id: string) => void
}

export function ChangeOrderAllocationsTable({
  allocations,
  onViewDetails,
  onEdit,
  onDelete,
}: ChangeOrderAllocationsTableProps) {
  const getStatusBadge = (status: ChangeOrderAllocation["status"]) => {
    const config = {
      allocated: {
        variant: "secondary" as const,
        icon: Package,
        label: "Allocated",
        color: "text-blue-600",
      },
      "in-transit": {
        variant: "default" as const,
        icon: Clock,
        label: "In Transit",
        color: "text-yellow-600",
      },
      delivered: {
        variant: "default" as const,
        icon: CheckCircle2,
        label: "Delivered",
        color: "text-green-600",
      },
      completed: {
        variant: "default" as const,
        icon: CheckCircle2,
        label: "Completed",
        color: "text-green-600",
      },
      cancelled: {
        variant: "destructive" as const,
        icon: XCircle,
        label: "Cancelled",
        color: "text-red-600",
      },
    }

    const { variant, icon: Icon, label, color } = config[status]
    return (
      <Badge variant={variant} className={cn("capitalize", color)}>
        <Icon className="mr-1 h-3 w-3" />
        {label}
      </Badge>
    )
  }

  if (allocations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No change order allocations found</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-green-50 dark:bg-green-950/20">
            <TableHead className="text-green-700 dark:text-green-300 font-semibold">
              Allocation ID
            </TableHead>
            <TableHead className="text-green-700 dark:text-green-300 font-semibold">CO Number</TableHead>
            <TableHead className="text-green-700 dark:text-green-300 font-semibold">Request ID</TableHead>
            <TableHead className="text-green-700 dark:text-green-300 font-semibold">Project</TableHead>
            <TableHead className="text-green-700 dark:text-green-300 font-semibold">Description</TableHead>
            <TableHead className="text-green-700 dark:text-green-300 font-semibold">Status</TableHead>
            <TableHead className="text-green-700 dark:text-green-300 font-semibold">Allocated To</TableHead>
            <TableHead className="text-green-700 dark:text-green-300 font-semibold">Allocated Date</TableHead>
            <TableHead className="text-green-700 dark:text-green-300 font-semibold">Expected Delivery</TableHead>
            <TableHead className="text-green-700 dark:text-green-300 font-semibold">Location</TableHead>
            <TableHead className="text-green-700 dark:text-green-300 font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allocations.map((allocation) => (
            <TableRow key={allocation.id} className="border-b">
              <TableCell className="font-medium">{allocation.allocationNumber}</TableCell>
              <TableCell>{allocation.coNumber}</TableCell>
              <TableCell>{allocation.requestId}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{allocation.project}</div>
                  <div className="text-sm text-muted-foreground">{allocation.projectNumber}</div>
                </div>
              </TableCell>
              <TableCell className="max-w-xs">
                <div className="truncate" title={allocation.description}>
                  {allocation.description}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(allocation.status)}</TableCell>
              <TableCell>{allocation.allocatedTo}</TableCell>
              <TableCell>
                {format(new Date(allocation.allocatedDate), "MMM dd, yyyy")}
              </TableCell>
              <TableCell>
                {allocation.expectedDeliveryDate
                  ? format(new Date(allocation.expectedDeliveryDate), "MMM dd, yyyy")
                  : "-"}
              </TableCell>
              <TableCell>{allocation.location || "-"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {onViewDetails && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(allocation)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(allocation)}
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(allocation.id)}
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

