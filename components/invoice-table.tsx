"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
} from "@tanstack/react-table"
import { Invoice, InvoiceFilters as InvoiceFiltersType } from "@/lib/types/invoice"
import { useInvoices, useUpdateInvoice } from "@/hooks/use-invoices-optimized"
import { toast } from "sonner"
import { LoadingState } from "@/components/ui/loading-state"
import { ErrorState } from "@/components/ui/error-state"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { InvoiceDetail } from "@/components/invoice-detail"
import { InvoiceForm } from "@/components/invoice-form"
import { SelectedInvoicesSummary } from "@/components/selected-invoices-summary"
import { UnpaidInvoicesPopup } from "@/components/unpaid-invoices-popup"
import { useCreatePaymentOrder, useVerifyPayment } from "@/hooks/use-payment"
import { openRazorpayCheckout } from "@/lib/services/razorpay-client"
import { ChevronDown, Filter, Download, CalendarIcon, CreditCard, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

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

function getStatusBadgeVariant(status: Invoice['status']): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Paid":
      return "default" // Will be styled green
    case "Unpaid":
      return "destructive" // Will be styled red
    case "Due Date Expected":
      return "secondary" // Will be styled yellow
    default:
      return "default"
  }
}

interface InvoiceTableProps {
  onFiltersChange?: (filters: InvoiceFiltersType) => void
  showTitle?: boolean
  initialInvoices?: Invoice[]
}

export function InvoiceTable({ onFiltersChange, showTitle = true, initialInvoices }: InvoiceTableProps = {}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    unitPriceLumpSum: false,
    tonsBilledAmount: false,
    coBilledAmount: false,
    totalAmountBilled: false,
    status: true,
    paidDate: false,
  })
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSelectedSummaryOpen, setIsSelectedSummaryOpen] = useState(false)
  const [isUnpaidPopupOpen, setIsUnpaidPopupOpen] = useState(false)
  const [processingPaymentInvoiceId, setProcessingPaymentInvoiceId] = useState<string | null>(null)
  const [filters, setFilters] = useState<InvoiceFiltersType>({})
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices || [])

  // Fetch invoices from Supabase (client-side fallback if initialInvoices not provided)
  const { data: supabaseInvoices = [], isLoading, error: invoicesError } = useInvoices(filters)

  // Create stable filter key to detect filter changes
  const filtersKey = useMemo(() => {
    return JSON.stringify({
      status: filters.status,
      issueDate: filters.issueDate,
    })
  }, [filters.status, filters.issueDate?.from, filters.issueDate?.to])
  
  const prevFiltersKeyRef = useRef<string>('')
  const prevSupabaseLengthRef = useRef<number>(0)
  const prevInitialLengthRef = useRef<number>(0)
  
  // Update invoices when data or filters change
  useEffect(() => {
    // Compute hasFilters from filtersKey (empty object string means no filters)
    const hasFilters = filtersKey !== '{}'
    const filtersChanged = prevFiltersKeyRef.current !== filtersKey
    const supabaseChanged = prevSupabaseLengthRef.current !== supabaseInvoices.length
    const initialChanged = prevInitialLengthRef.current !== (initialInvoices?.length || 0)
    
    // If filters are applied, always use filtered data from API
    if (hasFilters) {
      if (filtersChanged || supabaseChanged) {
        setInvoices(supabaseInvoices)
        prevSupabaseLengthRef.current = supabaseInvoices.length
        prevFiltersKeyRef.current = filtersKey
      }
      return
    }
    
    // If no filters and we have initial data, use it
    if (initialInvoices && initialInvoices.length > 0) {
      if (filtersChanged || (initialChanged && prevFiltersKeyRef.current === '')) {
        setInvoices(initialInvoices)
        prevInitialLengthRef.current = initialInvoices.length
        prevFiltersKeyRef.current = filtersKey
      }
      return
    }
    
    // Otherwise use Supabase data (when no initial data)
    if (supabaseInvoices.length > 0 && supabaseChanged) {
      setInvoices(supabaseInvoices)
      prevSupabaseLengthRef.current = supabaseInvoices.length
    }
    
    if (filtersChanged) {
      prevFiltersKeyRef.current = filtersKey
    }
  }, [supabaseInvoices, initialInvoices, filtersKey]) // Removed filters to prevent infinite loop
  const updateInvoice = useUpdateInvoice()
  const createOrder = useCreatePaymentOrder()
  const verifyPayment = useVerifyPayment()

  // Notify parent component when filters change
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters)
    }
  }, [filters, onFiltersChange])

  // Log for debugging
  useEffect(() => {
    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
    }
    if (!isLoading && invoices.length === 0) {
      console.warn('No invoices found. Check:', {
        filters,
        error: invoicesError,
        message: 'Table might be empty or RLS is blocking access'
      })
    }
  }, [invoices, isLoading, invoicesError, filters])

  const handleRowClick = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsDetailOpen(true)
  }, [])

  const handlePayNow = useCallback(async (invoice: Invoice, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    
    // Check if invoice is already paid
    if (invoice.status === 'Paid') {
      toast.error('This invoice has already been paid')
      return
    }

    // Validate CO price
    const paymentAmount = invoice.coPrice || 0
    if (paymentAmount <= 0) {
      toast.error('Invalid payment amount. CO price is not set for this invoice.')
      return
    }

    setProcessingPaymentInvoiceId(invoice.id)

    try {
      // Step 1: Create Razorpay order
      const orderResponse = await createOrder.mutateAsync({
        invoiceId: invoice.id,
        amount: paymentAmount,
      })

      if (!orderResponse || !orderResponse.orderId || !orderResponse.keyId) {
        throw new Error('Invalid order response from server')
      }

      // Step 2: Open Razorpay checkout directly
      await openRazorpayCheckout({
        key: orderResponse.keyId,
        amount: Math.round(paymentAmount * 100), // Convert to paise
        currency: orderResponse.currency || 'INR',
        name: 'Invoice Payment',
        description: `Payment for Invoice #${invoice.invoiceId} - ${invoice.projectName}`,
        order_id: orderResponse.orderId,
        handler: async (response) => {
          // Step 3: Verify payment on success
          try {
            const result = await verifyPayment.mutateAsync({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              invoiceId: invoice.id,
            })
            // Update local invoice state immediately for instant UI feedback
            setInvoices((prev) =>
              prev.map((inv) =>
                inv.id === invoice.id
                  ? { ...inv, status: 'Paid' as const, paidDate: new Date().toISOString() }
                  : inv
              )
            )
            // Success - invoice list will refresh automatically via the hook
          } catch (error) {
            console.error('Payment verification error:', error)
            // Error toast is handled by the hook
          } finally {
            setProcessingPaymentInvoiceId(null)
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPaymentInvoiceId(null)
            console.log('Payment cancelled by user')
          },
        },
      })
    } catch (error) {
      console.error('Payment initiation error:', error)
      // Error toast is handled by the hook's onError
      setProcessingPaymentInvoiceId(null)
    }
  }, [createOrder, verifyPayment])

  const handleExport = useCallback(() => {
    // Export functionality
    // toast.info('Export functionality coming soon')
  }, [])

  // Update filters when date range or status changes
  const prevDateRangeRef = useRef<{ from?: Date; to?: Date }>({})
  const prevStatusFilterRef = useRef<string>('all')
  
  useEffect(() => {
    const dateRangeChanged = 
      prevDateRangeRef.current.from !== dateRange.from ||
      prevDateRangeRef.current.to !== dateRange.to
    const statusFilterChanged = prevStatusFilterRef.current !== statusFilter
    
    // Only update if something actually changed
    if (!dateRangeChanged && !statusFilterChanged) {
      return
    }
    
    const newFilters: InvoiceFiltersType = {}
    
    if (dateRange.from || dateRange.to) {
      newFilters.issueDate = {
        from: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        to: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
      }
    }

    // Only add status filter if not "all"
    if (statusFilter && statusFilter !== 'all') {
      newFilters.status = statusFilter as Invoice['status']
    }

    setFilters(newFilters)
    prevDateRangeRef.current = { from: dateRange.from, to: dateRange.to }
    prevStatusFilterRef.current = statusFilter
  }, [dateRange, statusFilter])

  const columns: ColumnDef<Invoice>[] = useMemo(
    () => [
      {
        id: "select",
        enableHiding: false,
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="h-4 w-4"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4"
          />
        ),
      },
      {
        accessorKey: "invoiceId",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const currentSort = column.getIsSorted()
              if (currentSort === false) {
                // First click: sort descending (high to low)
                column.toggleSorting(true)
              } else {
                // Toggle between desc and asc
                column.toggleSorting(currentSort === "desc")
              }
            }}
            className="h-8 px-2 text-xs font-medium hover:bg-transparent"
          >
            Invoice #
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("invoiceId")}</div>
        ),
      },
      {
        accessorKey: "projectNumber",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const currentSort = column.getIsSorted()
              if (currentSort === false) {
                // First click: sort descending (high to low)
                column.toggleSorting(true)
              } else {
                // Toggle between desc and asc
                column.toggleSorting(currentSort === "desc")
              }
            }}
            className="h-8 px-2 text-xs font-medium hover:bg-transparent"
          >
            Project #
          </Button>
        ),
      },
      {
        accessorKey: "projectName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const currentSort = column.getIsSorted()
              if (currentSort === false) {
                // First click: sort descending (high to low)
                column.toggleSorting(true)
              } else {
                // Toggle between desc and asc
                column.toggleSorting(currentSort === "desc")
              }
            }}
            className="h-8 px-2 text-xs font-medium hover:bg-transparent"
          >
            Project Name
          </Button>
        ),
      },
      {
        accessorKey: "billedTonnage",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const currentSort = column.getIsSorted()
              if (currentSort === false) {
                // First click: sort descending (high to low)
                column.toggleSorting(true)
              } else {
                // Toggle between desc and asc
                column.toggleSorting(currentSort === "desc")
              }
            }}
            className="h-8 px-2 text-xs font-medium hover:bg-transparent"
          >
            Billed Tonnage
          </Button>
        ),
        cell: ({ row }) => formatNumber(row.getValue("billedTonnage")),
      },
      {
        accessorKey: "billedHoursCO",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const currentSort = column.getIsSorted()
              if (currentSort === false) {
                // First click: sort descending (high to low)
                column.toggleSorting(true)
              } else {
                // Toggle between desc and asc
                column.toggleSorting(currentSort === "desc")
              }
            }}
            className="h-8 px-2 text-xs font-medium hover:bg-transparent"
          >
            Billed Hours (CO)
          </Button>
        ),
        cell: ({ row }) => formatNumber(row.getValue("billedHoursCO")),
      },
      {
        accessorKey: "unitPriceLumpSum",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const currentSort = column.getIsSorted()
              if (currentSort === false) {
                // First click: sort descending (high to low)
                column.toggleSorting(true)
              } else {
                // Toggle between desc and asc
                column.toggleSorting(currentSort === "desc")
              }
            }}
            className="h-8 px-2 text-xs font-medium hover:bg-transparent"
          >
            Unit Price
          </Button>
        ),
        cell: ({ row }) => formatCurrency(row.getValue("unitPriceLumpSum")),
      },
      {
        accessorKey: "tonsBilledAmount",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const currentSort = column.getIsSorted()
              if (currentSort === false) {
                // First click: sort descending (high to low)
                column.toggleSorting(true)
              } else {
                // Toggle between desc and asc
                column.toggleSorting(currentSort === "desc")
              }
            }}
            className="h-8 px-2 text-xs font-medium hover:bg-transparent"
          >
            Tons Billed Amount
          </Button>
        ),
        cell: ({ row }) => formatCurrency(row.getValue("tonsBilledAmount")),
      },
      {
        accessorKey: "coPrice",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const currentSort = column.getIsSorted()
              if (currentSort === false) {
                // First click: sort descending (high to low)
                column.toggleSorting(true)
              } else {
                // Toggle between desc and asc
                column.toggleSorting(currentSort === "desc")
              }
            }}
            className="h-8 px-2 text-xs font-medium hover:bg-transparent"
          >
            CO Price
          </Button>
        ),
        cell: ({ row }) => formatCurrency(row.getValue("coPrice")),
      },
      {
        accessorKey: "coBilledAmount",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const currentSort = column.getIsSorted()
              if (currentSort === false) {
                // First click: sort descending (high to low)
                column.toggleSorting(true)
              } else {
                // Toggle between desc and asc
                column.toggleSorting(currentSort === "desc")
              }
            }}
            className="h-8 px-2 text-xs font-medium hover:bg-transparent"
          >
            CO Billed Amount
          </Button>
        ),
        cell: ({ row }) => formatCurrency(row.getValue("coBilledAmount")),
      },
      {
        accessorKey: "totalAmountBilled",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const currentSort = column.getIsSorted()
              if (currentSort === false) {
                // First click: sort descending (high to low)
                column.toggleSorting(true)
              } else {
                // Toggle between desc and asc
                column.toggleSorting(currentSort === "desc")
              }
            }}
            className="h-8 px-2 text-xs font-medium hover:bg-transparent"
          >
            Total Amount
          </Button>
        ),
        cell: ({ row }) => formatCurrency(row.getValue("totalAmountBilled")),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const currentSort = column.getIsSorted()
              if (currentSort === false) {
                // First click: sort descending (high to low)
                column.toggleSorting(true)
              } else {
                // Toggle between desc and asc
                column.toggleSorting(currentSort === "desc")
              }
            }}
            className="h-8 px-2 text-xs font-medium hover:bg-transparent"
          >
            Status
          </Button>
        ),
        cell: ({ row }) => {
          const status = row.getValue("status") as Invoice['status']
          
          // Badge styling - solid for Paid, minimal for others
          let badgeClass = ""
          if (status === "Paid") {
            badgeClass = "bg-green-600 text-white border-transparent hover:bg-green-700"
          } else if (status === "Unpaid") {
            badgeClass = "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800"
          } else if (status === "Due Date Expected") {
            badgeClass = "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800"
          }
          
          return (
            <Badge 
              variant={status === "Paid" ? "default" : "outline"} 
              className={cn("text-xs font-normal", badgeClass)}
            >
              {status}
            </Badge>
          )
        },
      },
      {
        accessorKey: "paidDate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const currentSort = column.getIsSorted()
              if (currentSort === false) {
                // First click: sort descending (high to low)
                column.toggleSorting(true)
              } else {
                // Toggle between desc and asc
                column.toggleSorting(currentSort === "desc")
              }
            }}
            className="h-8 px-2 text-xs font-medium hover:bg-transparent"
          >
            Paid Date
          </Button>
        ),
        cell: ({ row }) => {
          const date = row.getValue("paidDate") as string | null
          return date ? format(new Date(date), "MMM dd, yyyy") : "-"
        },
      },
      {
        accessorKey: "issueDate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => {
              const currentSort = column.getIsSorted()
              if (currentSort === false) {
                // First click: sort descending (high to low)
                column.toggleSorting(true)
              } else {
                // Toggle between desc and asc
                column.toggleSorting(currentSort === "desc")
              }
            }}
            className="h-8 px-2 text-xs font-medium hover:bg-transparent"
          >
            Issue Date
          </Button>
        ),
        cell: ({ row }) => {
          const date = row.getValue("issueDate") as string
          return format(new Date(date), "MMM dd, yyyy")
        },
      },
      {
        id: "actions",
        enableHiding: false,
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => {
          const invoice = row.original
          const isPaid = invoice.status === "Paid"
          
          if (isPaid) {
            return <div className="text-center text-muted-foreground text-sm">-</div>
          }
          
          const isProcessingThisInvoice = processingPaymentInvoiceId === invoice.id
          
          return (
            <div className="flex justify-center">
              <Button
                size="sm"
                onClick={(e) => handlePayNow(invoice, e)}
                disabled={isProcessingThisInvoice}
                className="gap-2 bg-green-700 hover:bg-green-800 text-white border-green-600"
              >
                {isProcessingThisInvoice ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Pay Now
                  </>
                )}
              </Button>
            </div>
          )
        },
      },
    ],
    [handlePayNow, processingPaymentInvoiceId]
  )

  const table = useReactTable({
    data: invoices,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // Get selected invoice objects (after table is created)
  const selectedInvoices = useMemo(() => {
    return Object.keys(rowSelection)
      .map((rowId) => {
        const row = table.getRow(rowId)
        return row?.original
      })
      .filter((invoice): invoice is Invoice => invoice !== undefined)
  }, [rowSelection, table])

  // Get unpaid invoices
  const unpaidInvoices = useMemo(() => {
    return invoices.filter((invoice) => invoice.status === 'Unpaid')
  }, [invoices])

  // Calculate selected invoices
  const selectedCount = selectedInvoices.length
  const selectedTotal = selectedInvoices.reduce((sum, invoice) => {
    return sum + (invoice.totalAmountBilled || 0)
  }, 0)

  // Handle checkbox selection - show summary popup only when 2+ rows are selected
  useEffect(() => {
    if (selectedCount >= 2) {
      setIsSelectedSummaryOpen(true)
    } else {
      setIsSelectedSummaryOpen(false)
    }
  }, [selectedCount])

  const filteredRows = table.getFilteredRowModel().rows
  const totalInvoices = filteredRows.length
  const startRow = table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1
  const endRow = Math.min(startRow + table.getState().pagination.pageSize - 1, totalInvoices)
  const hasNoData = !invoices || invoices.length === 0
  const isLoadingData = !initialInvoices && isLoading && invoices.length === 0

  return (
    <div className="w-full space-y-4">
      {/* Header with Title and Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showTitle && <h2 className="text-2xl font-bold">Invoices</h2>}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">{selectedCount} selected</span>
              <span>•</span>
              <span className="font-semibold text-foreground">{formatCurrency(selectedTotal)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Date Range Filter - Minimal */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" />
                {dateRange.from && dateRange.to
                  ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
                  : dateRange.from
                  ? format(dateRange.from, "MMM d")
                  : "Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  setDateRange({
                    from: range?.from,
                    to: range?.to,
                  })
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Status Filter - Minimal */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[110px] text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Unpaid">Unpaid</SelectItem>
              <SelectItem value="Due Date Expected">Due Date Expected</SelectItem>
            </SelectContent>
          </Select>

          {/* Column Visibility - Minimal Icon Button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Filter className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="end">
              <div className="space-y-1">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Columns</div>
                <ScrollArea className="h-[250px]">
                  <div className="space-y-0.5">
                    {[
                      { id: "invoiceId", label: "Invoice ID" },
                      { id: "projectNumber", label: "Project #" },
                      { id: "projectName", label: "Project Name" },
                      { id: "billedTonnage", label: "Billed Tonnage" },
                      { id: "billedHoursCO", label: "Billed Hours (CO)" },
                      { id: "unitPriceLumpSum", label: "Unit Price" },
                      { id: "tonsBilledAmount", label: "Tons Billed Amount" },
                      { id: "coPrice", label: "CO Price" },
                      { id: "coBilledAmount", label: "CO Billed Amount" },
                      { id: "totalAmountBilled", label: "Total Amount" },
                      { id: "status", label: "Status" },
                      { id: "paidDate", label: "Paid Date" },
                      { id: "issueDate", label: "Issue Date" },
                    ]
                      .map(({ id, label }) => {
                        const column = table.getColumn(id)
                        if (!column || !column.getCanHide()) return null
                        
                        return (
                          <div
                            key={id}
                            className="flex items-center space-x-2 px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer"
                            onClick={() => column.toggleVisibility(!column.getIsVisible())}
                          >
                            <Checkbox
                              checked={column.getIsVisible()}
                              onCheckedChange={(value) => column.toggleVisibility(!!value)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-3.5 w-3.5"
                            />
                            <label
                              className="text-xs font-normal leading-none cursor-pointer flex-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {label}
                            </label>
                          </div>
                        )
                      })
                      .filter(Boolean)}
                  </div>
                </ScrollArea>
              </div>
            </PopoverContent>
          </Popover>

          {/* Export - Minimal Icon Button */}
          <Button variant="ghost" size="sm" onClick={handleExport} className="h-8 w-8 p-0">
            <Download className="h-3.5 w-3.5" />
          </Button>

          {/* Unpaid - Minimal Badge Style */}
          {unpaidInvoices.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsUnpaidPopupOpen(true)}
              className="h-8 gap-1.5 text-xs"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
              {unpaidInvoices.length}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden flex flex-col" style={{ maxHeight: '600px' }}>
        <div 
          className="flex-1 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <Table className="min-w-full">
            <TableHeader className="sticky top-0 z-10 bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="h-10 text-xs font-medium text-muted-foreground">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoadingData ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <p className="text-sm text-muted-foreground">Loading invoices...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : !initialInvoices && invoicesError ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-sm font-medium text-destructive">Failed to load invoices</p>
                      <p className="text-xs text-muted-foreground">
                        {invoicesError instanceof Error ? invoicesError.message : "An error occurred"}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.reload()}
                        className="mt-2"
                      >
                        Retry
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-sm font-medium">No invoices found</p>
                      <p className="text-xs text-muted-foreground">
                        {Object.keys(filters).length > 0 
                          ? "Try adjusting your filters to see more results"
                          : "Create your first invoice to get started"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination - Fixed at bottom of table container */}
      <div className="bg-background border-t flex items-center justify-between px-2 py-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {totalInvoices > 0 ? `${startRow}-${endRow} of ${totalInvoices} invoices` : "1-0 of 0 invoices"}
          </div>
          <div className="text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            {"<<"}
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            {"<"}
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            {">"}
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            {">>"}
          </Button>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-6xl lg:min-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              View and manage invoice information
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <InvoiceDetail
              invoice={selectedInvoice}
              onClose={() => setIsDetailOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedInvoice ? "Edit Invoice" : "Create New Invoice"}
            </DialogTitle>
            <DialogDescription>
              {selectedInvoice
                ? "Update invoice information"
                : "Fill in the details to create a new invoice"}
            </DialogDescription>
          </DialogHeader>
          <InvoiceForm
            invoice={selectedInvoice}
            onSuccess={() => {
              setIsFormOpen(false)
              setSelectedInvoice(null)
            }}
            onCancel={() => {
              setIsFormOpen(false)
              setSelectedInvoice(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Selected Invoices Summary Dialog */}
      <SelectedInvoicesSummary
        open={isSelectedSummaryOpen}
        onOpenChange={setIsSelectedSummaryOpen}
        selectedInvoices={selectedInvoices}
      />

      {/* Unpaid Invoices Popup */}
      <UnpaidInvoicesPopup
        open={isUnpaidPopupOpen}
        onOpenChange={setIsUnpaidPopupOpen}
        unpaidInvoices={unpaidInvoices}
      />
    </div>
  )
}
