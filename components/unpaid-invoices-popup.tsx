"use client"

import { Invoice } from "@/lib/types/invoice"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

const getStatusColorClass = (status: Invoice['status']) => {
  if (status === "Unpaid") {
    return "bg-red-500 hover:bg-red-600 text-white border-red-600"
  }
  return ""
}

interface UnpaidInvoicesPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unpaidInvoices: Invoice[]
}

export function UnpaidInvoicesPopup({
  open,
  onOpenChange,
  unpaidInvoices,
}: UnpaidInvoicesPopupProps) {
  const totalOutstanding = unpaidInvoices.reduce((sum, invoice) => {
    return sum + (invoice.totalAmountBilled || 0)
  }, 0)

  // Calculate due date (assuming it's 30 days from issue date, or use paidDate logic)
  const getDueDate = (invoice: Invoice) => {
    if (invoice.paidDate) {
      return null // Already paid
    }
    // Calculate due date as 30 days from issue date
    const issueDate = new Date(invoice.issueDate)
    const dueDate = new Date(issueDate)
    dueDate.setDate(dueDate.getDate() + 30)
    return dueDate
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Unpaid Invoices</DialogTitle>
          <DialogDescription>
            {unpaidInvoices.length} unpaid invoice{unpaidInvoices.length !== 1 ? 's' : ''} • Total Outstanding: {formatCurrency(totalOutstanding)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 border border-red-200 dark:border-red-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Outstanding Amount</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalOutstanding)}
                </p>
              </div>
              <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 text-white">
                {unpaidInvoices.length} Unpaid
              </Badge>
            </div>
          </div>

          {/* Unpaid Invoices Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-red-50 dark:bg-red-950/20">
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Project Number</TableHead>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Outstanding Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unpaidInvoices.length > 0 ? (
                  unpaidInvoices.map((invoice) => {
                    const dueDate = getDueDate(invoice)
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceId}</TableCell>
                        <TableCell>{invoice.projectNumber}</TableCell>
                        <TableCell>{invoice.projectName}</TableCell>
                        <TableCell className="font-semibold text-red-600 dark:text-red-400">
                          {formatCurrency(invoice.totalAmountBilled)}
                        </TableCell>
                        <TableCell>
                          {dueDate ? (
                            <div>
                              <p>{format(dueDate, "MMM dd, yyyy")}</p>
                              {dueDate < new Date() && (
                                <Badge variant="destructive" className="mt-1 text-xs">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="destructive"
                            className={getStatusColorClass(invoice.status)}
                          >
                            {invoice.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No unpaid invoices found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

