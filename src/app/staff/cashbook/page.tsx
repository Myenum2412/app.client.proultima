'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Plus } from 'lucide-react';
import { CashSummaryCards } from '@/components/cashbook/cash-summary-cards';
import { TransactionDetailsDialog } from '@/components/cashbook/transaction-details-dialog';
import { DownloadTransactionPDF } from '@/components/cashbook/download-transaction-pdf';
import { ExportPDFDialog } from '@/components/cashbook/export-pdf-dialog';
import { AddCashTransactionDialog } from '@/components/staff/add-cash-transaction-dialog';
import { EditCashTransactionDialog } from '@/components/staff/edit-cash-transaction-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { useCashTransactions } from '@/hooks/use-cash-transactions';
import type { CashTransaction } from '@/types/cashbook';
import { DatePicker } from '@/components/ui/date-picker';
import { CalendarDays } from 'lucide-react';
import { format as formatDate } from 'date-fns';

export default function StaffCashbookPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<any>(null);
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(undefined);
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(undefined);
  const [billStatusFilter, setBillStatusFilter] = useState<string>('all');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<CashTransaction | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<CashTransaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fromStr = startDateFilter ? formatDate(startDateFilter, 'yyyy-MM-dd') : '';
    const toStr = endDateFilter ? formatDate(endDateFilter, 'yyyy-MM-dd') : '';
    setStartDate(fromStr);
    setEndDate(toStr);
  }, [startDateFilter, endDateFilter]);

  // Fetch staff details
  useEffect(() => {
    async function fetchStaff() {
      if (!user?.staffId) return;
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('id', user.staffId)
        .single();
      
      if (data && !error) {
        setStaff(data);
      }
    }
    
    fetchStaff();
  }, [user]);

  const branch = staff?.branch;
  
  const {
    transactions,
    expenseCategories,
    summary,
    isLoading,
    refetch,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    isDeleting,
  } = useCashTransactions(branch, startDate || undefined, endDate || undefined, {
    autoApprove: false,
    includePending: true,
    includeRejected: true,
  });

  const approvedTransactions = useMemo(
    () => transactions.filter((t) => t.verification_status === 'approved'),
    [transactions]
  );

  // Apply client-side filters
  const filteredTransactions = transactions.filter((t) => {
    if (billStatusFilter !== 'all' && t.bill_status !== billStatusFilter) return false;
    if (expenseCategoryFilter !== 'all' && t.nature_of_expense !== expenseCategoryFilter) return false;
    return true;
  });

  // Calculate running balances for transactions (approved only affect running balance)
  const transactionsWithBalance = useMemo(() => {
    if (!filteredTransactions.length) return [];
    
    let runningBalance = summary.opening_balance || 0;
    
    const sortedTransactions = [...filteredTransactions].sort(
      (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );
    
    return sortedTransactions.map(transaction => {
      if (transaction.verification_status === 'approved') {
        runningBalance = runningBalance + (transaction.cash_in || 0) - (transaction.cash_out || 0);
      }
      return {
        ...transaction,
        calculatedBalance: runningBalance,
      };
    }).reverse();
  }, [filteredTransactions, summary.opening_balance]);

  // Pagination logic
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return transactionsWithBalance.slice(startIndex, endIndex);
  }, [transactionsWithBalance, currentPage, rowsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [billStatusFilter, expenseCategoryFilter, startDateFilter, endDateFilter]);

  const handleClearFilters = () => {
    setStartDateFilter(undefined);
    setEndDateFilter(undefined);
    setBillStatusFilter('all');
    setExpenseCategoryFilter('all');
  };

  const handleEdit = (transaction: CashTransaction) => {
    setSelectedTransaction(transaction);
    setDetailsDialogOpen(false);
    // Small delay to allow details dialog to close smoothly
    setTimeout(() => {
    setEditDialogOpen(true);
    }, 150);
  };

  const handleDelete = (transaction: CashTransaction) => {
    setTransactionToDelete(transaction);
    setDetailsDialogOpen(false);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (transactionToDelete) {
      deleteTransaction(transactionToDelete.id);
      setDeleteConfirmOpen(false);
      setTransactionToDelete(null);
    }
  };

  if (!staff) {
    return (
      <div className="p-6">
        <p>Loading staff information...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cash Book - {branch} Branch</h1>
          <p className="text-muted-foreground">
            View all branch transactions and manage petty cash
          </p>
        </div>
        <div className="flex flex-row gap-2 max-sm:mt-5">
          <Button 
            variant="outline" 
            className="w-1/2 sm:w-auto"
            onClick={() => setExportDialogOpen(true)}
          >
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button 
            onClick={() => setAddDialogOpen(true)}
            className="w-1/2 sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      <CashSummaryCards summary={summary} />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter transactions by date, status, or category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Start Date Filter */}
              <div className="space-y-2">
                <Label htmlFor="start_date" className="text-sm font-medium flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  Start Date
                </Label>
                <DatePicker
                  date={startDateFilter}
                  onSelect={setStartDateFilter}
                  placeholder="Select start date"
                  className="h-10 w-full"
                />
              </div>

              {/* End Date Filter */}
              <div className="space-y-2">
                <Label htmlFor="end_date" className="text-sm font-medium flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  End Date
                </Label>
                <DatePicker
                  date={endDateFilter}
                  onSelect={setEndDateFilter}
                  placeholder="Select end date"
                  className="h-10 w-full"
                />
              </div>

              {/* Bill Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="bill_status" className="text-sm font-medium">Bill Status</Label>
                <Select value={billStatusFilter} onValueChange={setBillStatusFilter}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Expense Category Filter */}
              <div className="space-y-2">
                <Label htmlFor="expense_category" className="text-sm font-medium">Expense Category</Label>
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

            {/* Clear Filters Button */}
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Comprehensive view of cash transactions across all branches
          </CardDescription>
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
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="text-center p-4 text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((transaction, index) => {
                    const startIndex = (currentPage - 1) * rowsPerPage;
                    const serialNumber = startIndex + index + 1;
                    return (
                    <tr 
                      key={transaction.id} 
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setDetailsDialogOpen(true);
                      }}
                    >
                      <td className="p-2">{serialNumber}</td>
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
                        {transaction.calculatedBalance !== null
                          ? `₹${transaction.calculatedBalance.toLocaleString('en-IN')}`
                          : '—'}
                      </td>
                      <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <DownloadTransactionPDF 
                          transaction={transaction} 
                          calculatedBalance={transaction.calculatedBalance ?? undefined} 
                        />
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {filteredTransactions.length > 0 && (
            <TablePagination
              totalItems={transactionsWithBalance.length}
              currentPage={currentPage}
              rowsPerPage={rowsPerPage}
              onPageChange={setCurrentPage}
              onRowsPerPageChange={(newRowsPerPage) => {
                setRowsPerPage(newRowsPerPage);
                setCurrentPage(1);
              }}
              itemLabel="entries"
            />
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <TransactionDetailsDialog
        transaction={selectedTransaction}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Export PDF Dialog */}
      <ExportPDFDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        transactions={approvedTransactions}
        branches={[branch]}
        staff={staff ? [staff] : []}
      />

      {/* Add Transaction Dialog */}
      <AddCashTransactionDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        branch={branch || ''}
      />

      {/* Edit Transaction Dialog */}
      {selectedTransaction && (
        <EditCashTransactionDialog
          transaction={selectedTransaction}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={() => {
            refetch();
            // After successful edit, reopen details dialog to show updated information
            setTimeout(() => {
              setDetailsDialogOpen(true);
            }, 300);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {transactionToDelete && (
            <div className="space-y-2 py-4">
              <p className="text-sm text-muted-foreground">
                <strong>Voucher:</strong> {transactionToDelete.voucher_no}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Description:</strong> {transactionToDelete.primary_list}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Amount:</strong> ₹
                {(transactionToDelete.cash_in || transactionToDelete.cash_out || 0).toLocaleString('en-IN')}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

