"use client"

import { Invoice } from "@/lib/types/invoice"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { CreditCard, Download, Printer, Mail, FileText, Calendar, AlertCircle, CheckCircle2 } from "lucide-react"
import { useState } from "react"

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

interface SelectedInvoicesSummaryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedInvoices: Invoice[]
}

export function SelectedInvoicesSummary({
  open,
  onOpenChange,
  selectedInvoices,
}: SelectedInvoicesSummaryProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [discount, setDiscount] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)

  const totalValue = selectedInvoices.reduce((sum, invoice) => {
    return sum + (invoice.totalAmountBilled || 0)
  }, 0)

  const totalTonnage = selectedInvoices.reduce((sum, invoice) => {
    return sum + (invoice.billedTonnage || 0)
  }, 0)

  const totalHours = selectedInvoices.reduce((sum, invoice) => {
    return sum + (invoice.billedHoursCO || 0)
  }, 0)

  const statusCounts = selectedInvoices.reduce((acc, invoice) => {
    acc[invoice.status] = (acc[invoice.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Calculate due dates and overdue invoices
  const overdueInvoices = selectedInvoices.filter((invoice) => {
    const issueDate = new Date(invoice.issueDate)
    const dueDate = new Date(issueDate)
    dueDate.setDate(dueDate.getDate() + 30)
    return dueDate < new Date() && invoice.status !== 'Paid'
  })

  const discountAmount = discount ? parseFloat(discount) || 0 : 0
  const finalAmount = totalValue - discountAmount

  const handlePayNow = async () => {
    setIsProcessing(true)
    try {
      // Payment functionality
      console.log('Processing payment for:', {
        invoices: selectedInvoices.map(inv => inv.invoiceId),
        paymentMethod,
        amount: finalAmount,
        notes
      })
      // Add payment logic here
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API call
      setIsProcessing(false)
      onOpenChange(false)
    } catch (error) {
      setIsProcessing(false)
      console.error('Payment failed:', error)
    }
  }

  const handleExport = () => {
    // Export functionality
    console.log('Exporting invoices:', selectedInvoices.map(inv => inv.invoiceId))
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSendEmail = () => {
    // Send email functionality
    console.log('Sending email for invoices:', selectedInvoices.map(inv => inv.invoiceId))
  }

  // Get all invoice numbers
  const invoiceNumbers = selectedInvoices.map(invoice => invoice.invoiceId).join(", ")
  
  // Calculate average invoice amount
  const averageAmount = selectedInvoices.length > 0 ? totalValue / selectedInvoices.length : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[99vw] lg:min-w-[800px] h-[90vh] max-h-[850px] flex flex-col p-0 overflow-y-auto">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">Selected Invoices Summary</DialogTitle>
              <DialogDescription className="text-base">
                Overview of {selectedInvoices.length} selected invoice{selectedInvoices.length !== 1 ? 's' : ''}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendEmail}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6">
            {/* Invoice Numbers */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
              <p className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-400">Invoice Numbers</p>
              <p className="text-base font-medium break-words text-gray-900 dark:text-gray-100">{invoiceNumbers}</p>
            </div>

            {/* Summary Cards - Only 2 cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Invoice Value</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{formatCurrency(totalValue)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg: {formatCurrency(averageAmount)}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 rounded-lg p-5 border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Tonnage</p>
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">{formatNumber(totalTonnage)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Hours: {formatNumber(totalHours)}</p>
              </div>
            </div>

            {/* Alerts and Warnings */}
            {overdueInvoices.length > 0 && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                    {overdueInvoices.length} Overdue Invoice{overdueInvoices.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                    These invoices have passed their due date and require immediate attention.
                  </p>
                </div>
              </div>
            )}

            {/* Payment Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="payment-method" className="text-sm font-semibold mb-2 block">
                    Payment Method
                  </Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="payment-method">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit-card">Credit Card</SelectItem>
                      <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="wire-transfer">Wire Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discount" className="text-sm font-semibold mb-2 block">
                    Discount / Adjustment ($)
                  </Label>
                  <Input
                    id="discount"
                    type="number"
                    placeholder="0.00"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes" className="text-sm font-semibold mb-2 block">
                  Payment Notes / Reference
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add payment notes or reference number..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            <Separator />

            {/* Status Breakdown */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
              <p className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">Status Breakdown</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <Badge
                    key={status}
                    variant={getStatusBadgeVariant(status as Invoice['status'])}
                    className={getStatusColorClass(status as Invoice['status'])}
                  >
                    {status}: {count}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Invoice Details Table - Only 3 columns */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800">
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Invoice ID</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Project Number</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Project Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">{invoice.invoiceId}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{invoice.projectNumber}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{invoice.projectName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Subtotal</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(totalValue)}</p>
                </div>
                {discountAmount > 0 && (
                  <>
                    <Separator orientation="vertical" className="h-8" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Discount</p>
                      <p className="text-lg font-semibold text-red-600 dark:text-red-400">-{formatCurrency(discountAmount)}</p>
                    </div>
                  </>
                )}
                <Separator orientation="vertical" className="h-8" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(finalAmount)}</p>
                </div>
              </div>
              {selectedInvoices.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedInvoices.length} invoice{selectedInvoices.length !== 1 ? 's' : ''} ready for payment
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayNow}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isProcessing || !paymentMethod}
              >
                {isProcessing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

