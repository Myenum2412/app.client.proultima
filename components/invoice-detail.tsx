"use client"

import { Invoice } from "@/lib/types/invoice"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

const getStatusBadgeVariant = (status: Invoice['status']) => {
  switch (status) {
    case 'Paid':
      return 'default'
    case 'Unpaid':
      return 'destructive'
    case 'Due Date Expected':
      return 'secondary'
    default:
      return 'secondary'
  }
}

const getStatusColorClass = (status: Invoice['status']) => {
  if (status === "Paid") {
    return "bg-green-500 hover:bg-green-600 text-white border-green-600"
  } else if (status === "Unpaid") {
    return "bg-red-500 hover:bg-red-600 text-white border-red-600"
  } else if (status === "Due Date Expected") {
    return "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600"
  }
  return ""
}

interface InvoiceDetailProps {
  invoice: Invoice
  onClose: () => void
}

export function InvoiceDetail({ invoice }: InvoiceDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{invoice.invoiceId}</h2>
          <p className="text-muted-foreground">{invoice.projectName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusBadgeVariant(invoice.status)} className={getStatusColorClass(invoice.status)}>
            {invoice.status}
          </Badge>
        </div>
      </div>

      {/* Details Table */}
      <div className="border rounded-lg">
        <Table>
          <TableBody>
            <TableRow>
              <TableHead className="w-1/3">Invoice ID</TableHead>
              <TableCell>{invoice.invoiceId}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead>Project Number</TableHead>
              <TableCell>{invoice.projectNumber}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead>Project Name</TableHead>
              <TableCell>{invoice.projectName}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead>Billed Tonnage</TableHead>
              <TableCell>{formatNumber(invoice.billedTonnage)}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead>Unit Price (Lump Sum)</TableHead>
              <TableCell>{formatCurrency(invoice.unitPriceLumpSum)}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead>Tons Billed Amount</TableHead>
              <TableCell>{formatCurrency(invoice.tonsBilledAmount)}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead>Billed Hours CO</TableHead>
              <TableCell>{formatNumber(invoice.billedHoursCO)}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead>CO Price</TableHead>
              <TableCell>{formatCurrency(invoice.coPrice)}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead>CO Billed Amount</TableHead>
              <TableCell>{formatCurrency(invoice.coBilledAmount)}</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="font-semibold">Total Amount Billed</TableHead>
              <TableCell className="font-semibold text-lg">
                {formatCurrency(invoice.totalAmountBilled)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(invoice.status)} className={getStatusColorClass(invoice.status)}>
                  {invoice.status}
                </Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead>Issue Date</TableHead>
              <TableCell>
                {format(new Date(invoice.issueDate), "MMMM dd, yyyy")}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead>Paid Date</TableHead>
              <TableCell>
                {invoice.paidDate
                  ? format(new Date(invoice.paidDate), "MMMM dd, yyyy")
                  : "-"}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

