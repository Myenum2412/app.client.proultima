'use client';

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  RefreshCw, 
  Download, 
  TrendingUp, 
  Eye, 
  Calendar as CalendarIcon,
  Filter,
  X,
  Building2,
  Users,
  Receipt,
  Tag,
  CalendarDays,
  CheckCircle2
} from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { CashSummaryCards } from '@/components/cashbook/cash-summary-cards';
import { TransactionDetailsDialog } from '@/components/cashbook/transaction-details-dialog';
import { DownloadTransactionPDF } from '@/components/cashbook/download-transaction-pdf';
import { ExportPDFDialog } from '@/components/cashbook/export-pdf-dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { useCashTransactions } from '@/hooks/use-cash-transactions';
import { useOpeningBalance } from '@/hooks/use-opening-balance';
import { useStaff } from '@/hooks/use-staff';
import { useSystemOptions } from '@/hooks/use-system-options';
import type { CashTransaction } from '@/types/cashbook';

// Helper function to generate month options
const generateMonthOptions = () => {
  const months = [];
  const currentDate = new Date();
  
  // Generate last 12 months + current month
  for (let i = 12; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const value = format(date, 'yyyy-MM');
    const label = format(date, 'MMMM yyyy');
    months.push({ value, label });
  }
  
  return months;
};

export default function AdminCashbookPage() {
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [billStatusFilter, setBillStatusFilter] = useState<string>('all');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<CashTransaction | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { staff } = useStaff();
  const { openingBalances } = useOpeningBalance();
  const { branches: systemBranches } = useSystemOptions();
  
  const {
    transactions,
    expenseCategories,
    summary,
    isLoading,
    refetch,
  } = useCashTransactions(
    selectedBranch !== 'all' ? selectedBranch : undefined,
    startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
    endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
    {
      includePending: true,
      includeRejected: true,
    }
  );

  const approvedTransactions = useMemo(
    () => transactions.filter((t) => t.verification_status === 'approved'),
    [transactions]
  );

  // Get branches from system options (fallback to staff branches if not configured)
  const branches = systemBranches.length > 0 
    ? systemBranches 
    : Array.from(new Set(staff.map(s => s.branch).filter(Boolean))) as string[];

  // Calculate grand total when "All Branches" is selected
  const grandTotal = useMemo(() => {
    if (selectedBranch !== 'all') return null;
    
    // Sum ALL opening balances directly from database, not just staff branches
    const allOpeningBalances = openingBalances.reduce((sum, ob) => {
      return sum + (ob.opening_balance || 0);
    }, 0);
    
    const approvedTotals = approvedTransactions.reduce((acc, t) => {
      acc.cash_in += t.cash_in || 0;
      acc.cash_out += t.cash_out || 0;
      return acc;
    }, { cash_in: 0, cash_out: 0 });
    
    return {
      opening_balance: allOpeningBalances,
      total_cash_in: approvedTotals.cash_in,
      total_cash_out: approvedTotals.cash_out,
      closing_balance: allOpeningBalances + approvedTotals.cash_in - approvedTotals.cash_out,
      transaction_count: approvedTransactions.length,
    };
  }, [selectedBranch, openingBalances, approvedTransactions]);

  // Apply client-side filters
  const filteredTransactions = transactions.filter((t) => {
    if (selectedStaff !== 'all' && t.staff_id !== selectedStaff) return false;
    if (billStatusFilter !== 'all' && t.bill_status !== billStatusFilter) return false;
    if (expenseCategoryFilter !== 'all' && t.nature_of_expense !== expenseCategoryFilter) return false;
    if (verificationFilter !== 'all' && t.verification_status !== verificationFilter) return false;
    return true;
  });

  // Calculate running balances for transactions
  const transactionsWithBalance = useMemo(() => {
    if (!filteredTransactions.length) return [];
    
    let runningBalance = 0;
    
    if (selectedBranch === 'all') {
      runningBalance = grandTotal?.opening_balance || 0;
    } else {
      const branchBalance = openingBalances.find(
        ob => ob.branch.toLowerCase() === selectedBranch.toLowerCase()
      );
      runningBalance = branchBalance?.opening_balance || 0;
    }
    
    // Sort ascending by date for proper balance calculation (oldest to newest)
    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
      const dateA = new Date(a.transaction_date).getTime();
      const dateB = new Date(b.transaction_date).getTime();
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      // Same date: sort by created_at ascending (older first for balance calculation)
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    
    // Calculate balances (must be done in chronological order)
    const transactionsWithBalances = sortedTransactions.map(transaction => {
      if (transaction.verification_status === 'approved') {
        runningBalance = runningBalance + (transaction.cash_in || 0) - (transaction.cash_out || 0);
      }
      return {
        ...transaction,
        calculatedBalance: runningBalance
      };
    });
    
    // Re-sort for display: newest first by date, then by time for same-day transactions
    return transactionsWithBalances.sort((a, b) => {
      const dateA = new Date(a.transaction_date).getTime();
      const dateB = new Date(b.transaction_date).getTime();
      if (dateA !== dateB) {
        return dateB - dateA; // Descending: newer dates first
      }
      // Same date: sort by created_at descending (newer time first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [filteredTransactions, selectedBranch, openingBalances, grandTotal]);

  // Pagination logic
  const totalPages = Math.ceil(transactionsWithBalance.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTransactions = transactionsWithBalance.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBranch, selectedStaff, selectedMonth, startDate, endDate, billStatusFilter, expenseCategoryFilter, verificationFilter]);

  // Adjust current page if it's out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    
    if (month === 'all') {
      setStartDate(undefined);
      setEndDate(undefined);
    } else {
      const [year, monthNum] = month.split('-');
      const startOfMonth = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const endOfMonth = new Date(parseInt(year), parseInt(monthNum), 0);
      
      setStartDate(startOfMonth);
      setEndDate(endOfMonth);
    }
  };

  // Helper function to count active filters
  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedBranch !== 'all') count++;
    if (selectedStaff !== 'all') count++;
    if (selectedMonth !== 'all') count++;
    if (startDate) count++;
    if (endDate) count++;
    if (billStatusFilter !== 'all') count++;
    if (expenseCategoryFilter !== 'all') count++;
    if (verificationFilter !== 'all') count++;
    return count;
  };

  const handleClearFilters = () => {
    setSelectedBranch('all');
    setSelectedStaff('all');
    setSelectedMonth('all');
    setStartDate(undefined);
    setEndDate(undefined);
    setBillStatusFilter('all');
    setExpenseCategoryFilter('all');
    setVerificationFilter('all');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cash Book - Admin View</h1>
          <p className="text-muted-foreground">
            View and manage cash transactions across all branches
          </p>
        </div>
        <div className="flex flex-row gap-2">
          <Select value={selectedMonth} onValueChange={handleMonthChange}>
            <SelectTrigger >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Monthly" />
            </SelectTrigger>
            <SelectContent >
              <SelectItem value="all">All Months</SelectItem>
              {generateMonthOptions().map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          
          <Button 
            variant="outline" 
            className="w-auto"
            onClick={() => setExportDialogOpen(true)}
          >
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Grand Total Card - Only show when "All Branches" is selected */}
      {selectedBranch === 'all' && grandTotal && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Grand Total - All Branches
            </CardTitle>
            <CardDescription>
              Combined cash summary across all branches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Opening Balance</p>
                <p className="text-xl font-bold text-blue-600">
                  ₹{grandTotal.opening_balance.toLocaleString('en-IN', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Cash In</p>
                <p className="text-xl font-bold text-green-600">
                  +₹{grandTotal.total_cash_in.toLocaleString('en-IN', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Cash Out</p>
                <p className="text-xl font-bold text-red-600">
                  -₹{grandTotal.total_cash_out.toLocaleString('en-IN', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                <p className={`text-xl font-bold ${
                  grandTotal.closing_balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ₹{grandTotal.closing_balance.toLocaleString('en-IN', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Transactions</p>
                <p className="text-xl font-bold">
                  {grandTotal.transaction_count}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards - Show only when a specific branch is selected */}
      {selectedBranch !== 'all' && (
        <CashSummaryCards summary={summary} />
      )}

      <Card className="border-2 border-muted/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Filter className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Filters</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Refine your transaction search
                </CardDescription>
              </div>
            </div>
            {getActiveFiltersCount() > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1">
                  {getActiveFiltersCount()} Active
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filter Grid - Responsive layout: 2 cols on mobile, 3 on md, 4 on lg, 6 on xl */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
            {/* Branch Filter */}
            <div className="space-y-2">
              <Label htmlFor="branch" className="text-xs font-medium flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                Branch
              </Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Staff Filter */}
            <div className="space-y-2">
              <Label htmlFor="staff" className="text-xs font-medium flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                Staff
              </Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="All Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date Filter */}
            <div className="space-y-2">
              <Label htmlFor="start_date" className="text-xs font-medium flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                Start Date
              </Label>
              <DatePicker
                date={startDate}
                onSelect={(date) => {
                  setStartDate(date);
                  if (date) setSelectedMonth('all');
                }}
                placeholder="Select start date"
                className="h-10 w-full text-xs"
              />
            </div>

            {/* End Date Filter */}
            <div className="space-y-2">
              <Label htmlFor="end_date" className="text-xs font-medium flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                End Date
              </Label>
              <DatePicker
                date={endDate}
                onSelect={(date) => {
                  setEndDate(date);
                  if (date) setSelectedMonth('all');
                }}
                placeholder="Select end date"
                className="h-10 w-full text-xs"
              />
            </div>

            {/* Bill Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="bill_status" className="text-xs font-medium flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                Bill Status
              </Label>
              <Select value={billStatusFilter} onValueChange={setBillStatusFilter}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  {/* <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem> */}
                  <SelectItem value="Yet to pay">Yet to pay</SelectItem>
                  <SelectItem value="Refund">Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Verification Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="verification_status" className="text-xs font-medium flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                Verification
              </Label>
              <Select value={verificationFilter} onValueChange={(value) => setVerificationFilter(value as 'all' | 'approved' | 'pending' | 'rejected')}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Expense Category Filter */}
            <div className="space-y-2">
              <Label htmlFor="expense_category" className="text-xs font-medium flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                Category
              </Label>
              <Select value={expenseCategoryFilter} onValueChange={setExpenseCategoryFilter}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Chips */}
          {getActiveFiltersCount() > 0 && (
            <div className="pt-2 border-t">
              <div className="flex flex-wrap gap-2">
                {selectedBranch !== 'all' && (
                  <Badge variant="secondary" className="px-3 py-1 text-xs">
                    <Building2 className="h-3 w-3 mr-1" />
                    {selectedBranch}
                    <button
                      onClick={() => setSelectedBranch('all')}
                      className="ml-1.5 hover:bg-muted-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                
                {selectedStaff !== 'all' && (
                  <Badge variant="secondary" className="px-3 py-1 text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {staff.find(s => s.id === selectedStaff)?.name || 'Staff'}
                    <button
                      onClick={() => setSelectedStaff('all')}
                      className="ml-1.5 hover:bg-muted-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                
                {selectedMonth !== 'all' && (
                  <Badge variant="secondary" className="px-3 py-1 text-xs">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {generateMonthOptions().find(m => m.value === selectedMonth)?.label || 'Month'}
                    <button
                      onClick={() => {
                        setSelectedMonth('all');
                        setStartDate(undefined);
                        setEndDate(undefined);
                      }}
                      className="ml-1.5 hover:bg-muted-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                
                {startDate && selectedMonth === 'all' && (
                  <Badge variant="secondary" className="px-3 py-1 text-xs">
                    <CalendarDays className="h-3 w-3 mr-1" />
                    From: {format(startDate, 'MMM dd, yyyy')}
                    <button
                      onClick={() => setStartDate(undefined)}
                      className="ml-1.5 hover:bg-muted-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                
                {endDate && selectedMonth === 'all' && (
                  <Badge variant="secondary" className="px-3 py-1 text-xs">
                    <CalendarDays className="h-3 w-3 mr-1" />
                    To: {format(endDate, 'MMM dd, yyyy')}
                    <button
                      onClick={() => setEndDate(undefined)}
                      className="ml-1.5 hover:bg-muted-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                
                {billStatusFilter !== 'all' && (
                  <Badge variant="secondary" className="px-3 py-1 text-xs">
                    <Receipt className="h-3 w-3 mr-1" />
                    Bill: {billStatusFilter}
                    <button
                      onClick={() => setBillStatusFilter('all')}
                      className="ml-1.5 hover:bg-muted-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                
                {verificationFilter !== 'all' && (
                  <Badge variant="secondary" className="px-3 py-1 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Status: {verificationFilter}
                    <button
                      onClick={() => setVerificationFilter('all')}
                      className="ml-1.5 hover:bg-muted-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                
                {expenseCategoryFilter !== 'all' && (
                  <Badge variant="secondary" className="px-3 py-1 text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {expenseCategoryFilter}
                    <button
                      onClick={() => setExpenseCategoryFilter('all')}
                      className="ml-1.5 hover:bg-muted-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>
              Comprehensive view of cash transactions across all branches
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">S.No</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Voucher</th>
                  <th className="text-left p-2">Branch</th>
                  <th className="text-left p-2">Staff</th>
                  <th className="text-left p-2">Bill Status</th>
                  <th className="text-left p-2">Verification</th>
                  <th className="text-left p-2">Description</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-right p-2">Cash Out</th>
                  <th className="text-right p-2">Cash In</th>
                  <th className="text-right p-2">Balance</th>
                  <th className="text-center p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={13} className="text-center p-4">
                      Loading transactions...
                    </td>
                  </tr>
                ) : transactionsWithBalance.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="text-center p-4 text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((transaction, index) => (
                    <tr 
                      key={transaction.id} 
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setDetailsDialogOpen(true);
                      }}
                    >
                      <td className="p-2">{startIndex + index + 1}</td>
                      <td className="p-2 text-sm">
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                      </td>
                      <td className="p-2 font-mono text-xs">{transaction.voucher_no}</td>
                      <td className="p-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {transaction.branch}
                        </span>
                      </td>
                      <td className="p-2 text-sm">{transaction.staff?.name || 'Unknown'}</td>
                      <td className="p-2">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs ${
                            transaction.bill_status === 'Paid'
                              ? 'bg-green-100 text-green-800'
                              : transaction.bill_status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : transaction.bill_status === 'Yet to pay'
                              ? 'bg-orange-100 text-orange-800'
                              : transaction.bill_status === 'Refund'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {transaction.bill_status}
                        </span>
                      </td>
                      <td className="p-2">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs ${
                            transaction.verification_status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : transaction.verification_status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {transaction.verification_status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-2 text-sm">{transaction.primary_list}</td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {transaction.nature_of_expense}
                      </td>
                      <td className="p-2 text-right text-red-600 font-medium">
                        {transaction.cash_out > 0 ? `₹${transaction.cash_out.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="p-2 text-right text-green-600 font-medium">
                        {transaction.cash_in > 0 ? `₹${transaction.cash_in.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="p-2 text-right font-bold">
                        {transaction.calculatedBalance !== undefined
                          ? `₹${transaction.calculatedBalance.toLocaleString('en-IN')}`
                          : '—'}
                      </td>
                      <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <DownloadTransactionPDF 
                          transaction={transaction} 
                          calculatedBalance={transaction.calculatedBalance} 
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <TablePagination
            totalItems={transactionsWithBalance.length}
            currentPage={currentPage}
            rowsPerPage={pageSize}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={(newPageSize) => {
              setPageSize(newPageSize);
              setCurrentPage(1);
            }}
            itemLabel="transactions"
          />
        </CardContent>
      </Card>

      {/* Branch-wise Summary */}
      {selectedBranch === 'all' && (
        <Card>
          <CardHeader>
            <CardTitle>Branch-wise Summary</CardTitle>
            <CardDescription>Cash flow breakdown by branch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {branches.map((branch) => {
                const branchTransactions = approvedTransactions.filter(t => t.branch === branch);
                const branchOpeningBalance = openingBalances.find(ob => ob.branch.toLowerCase() === branch.toLowerCase())?.opening_balance || 0;
                const branchCashIn = branchTransactions.reduce((sum, t) => sum + (t.cash_in || 0), 0);
                const branchCashOut = branchTransactions.reduce((sum, t) => sum + (t.cash_out || 0), 0);
                const branchCurrentBalance = branchOpeningBalance + branchCashIn - branchCashOut;

                return (
                  <div key={branch} className="p-4 border rounded-lg space-y-4">
                    {/* Branch Header */}
                    <div>
                      <p className="font-medium text-lg">{branch}</p>
                      <p className="text-sm text-muted-foreground">
                        {branchTransactions.length} transactions
                      </p>
                    </div>
                    
                    {/* Financial Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Opening Balance</p>
                        <p className="font-medium text-blue-600">
                          ₹{branchOpeningBalance.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Cash In</p>
                        <p className="font-medium text-green-600">
                          +₹{branchCashIn.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Cash Out</p>
                        <p className="font-medium text-red-600">
                          -₹{branchCashOut.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Current Balance</p>
                        <p className={`font-bold ${branchCurrentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{branchCurrentBalance.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Details Dialog */}
      <TransactionDetailsDialog
        transaction={selectedTransaction}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />

      {/* Export PDF Dialog */}
      <ExportPDFDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        transactions={approvedTransactions}
        branches={branches}
        staff={staff}
      />
    </div>
  );
}



