'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useCashTransactions } from '@/hooks/use-cash-transactions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { DatePicker } from '@/components/ui/date-picker';
import { CalendarDays, CheckCircle2, XCircle, Loader2, RefreshCw, Eye } from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { CashTransaction } from '@/types/cashbook';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getSignedUrlsFromServer } from '@/lib/storage-utils';
import { TransactionDetailsDialog } from '@/components/cashbook/transaction-details-dialog';


export default function AccountingApprovalsPage() {
  const { user } = useAuth();
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(undefined);
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(undefined);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [actionDialog, setActionDialog] = useState<'approve' | 'reject' | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<CashTransaction | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [proofPreview, setProofPreview] = useState<CashTransaction | null>(null);
  const [activeProofUrl, setActiveProofUrl] = useState<string | null>(null);
  const [signedProofMap, setSignedProofMap] = useState<Record<string, string[]>>({});
  const [loadingProofs, setLoadingProofs] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Handle date filter changes
  useEffect(() => {
    const fromStr = startDateFilter ? formatDate(startDateFilter, 'yyyy-MM-dd') : '';
    const toStr = endDateFilter ? formatDate(endDateFilter, 'yyyy-MM-dd') : '';
    setStartDate(fromStr);
    setEndDate(toStr);
  }, [startDateFilter, endDateFilter]);

  if (!user) {
    return (
      <div className="p-6">
        <p>Loading...</p>
      </div>
    );
  }

  if (user.role?.toLowerCase() !== 'accountant') {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Restricted</CardTitle>
            <CardDescription>This area is available only for accountants.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const {
    transactions,
    isLoading,
    refetch,
  } = useCashTransactions(branchFilter !== 'all' ? branchFilter : undefined, startDate || undefined, endDate || undefined, {
    includePending: true,
    includeRejected: true,
  });

  const branches = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.branch) set.add(t.branch);
    });
    return Array.from(set).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (statusFilter !== 'all' && t.verification_status !== statusFilter) return false;
      return true;
    });
  }, [transactions, statusFilter]);

  const pendingCount = transactions.filter((t) => t.verification_status === 'pending').length;

  const statusSummary = useMemo(() => {
    return {
      pending: transactions.filter((t) => t.verification_status === 'pending').length,
      approved: transactions.filter((t) => t.verification_status === 'approved').length,
      rejected: transactions.filter((t) => t.verification_status === 'rejected').length,
    };
  }, [transactions]);

  const hasActiveFilters = branchFilter !== 'all' || statusFilter !== 'pending' || Boolean(startDate) || Boolean(endDate);

  const statusOptions: Array<{ value: 'pending' | 'approved' | 'rejected' | 'all'; label: string }> = [
    { value: 'pending', label: `Pending (${statusSummary.pending})` },
    { value: 'approved', label: `Approved (${statusSummary.approved})` },
    { value: 'rejected', label: `Rejected (${statusSummary.rejected})` },
    { value: 'all', label: `All (${transactions.length})` },
  ];

  const openActionDialog = (action: 'approve' | 'reject', transaction: CashTransaction) => {
    setSelectedTransaction(transaction);
    setNotes('');
    setActionDialog(action);
  };

  const handleAction = async () => {
    if (!selectedTransaction || !actionDialog) return;
    if (actionDialog === 'reject' && !notes.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = actionDialog === 'approve'
        ? '/api/cashbook/transactions/approve'
        : '/api/cashbook/transactions/reject';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTransaction.id,
          note: notes.trim(),
          verifier_id: user.staffId,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to submit decision');
      }

      toast.success(actionDialog === 'approve' ? 'Transaction approved' : 'Transaction rejected');
      setActionDialog(null);
      setSelectedTransaction(null);
      setNotes('');
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
    }
  };

  const resetFilters = () => {
    setBranchFilter('all');
    setStatusFilter('pending');
    setStartDateFilter(undefined);
    setEndDateFilter(undefined);
    setStartDate('');
    setEndDate('');
  };

  const formatCurrency = (value?: number | null) => {
    if (!value || value === 0) return '₹0.00';
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const openProofPreview = useCallback(async (transaction: CashTransaction) => {
    setProofPreview(transaction);
    setActiveProofUrl(null);

    if (!transaction.attachment_urls?.length) return;
    if (signedProofMap[transaction.id]) return;

    setLoadingProofs(true);
    setProofError(null);
    try {
      const signedUrls = await getSignedUrlsFromServer('cash-receipts', transaction.attachment_urls, 60 * 10);
      setSignedProofMap((prev) => ({ ...prev, [transaction.id]: signedUrls }));
    } catch (error) {
      console.error('Failed to load signed proof URLs:', error);
      setProofError('Unable to fetch secure proof links. Falling back to original URLs.');
      setSignedProofMap((prev) => ({ ...prev, [transaction.id]: transaction.attachment_urls || [] }));
    } finally {
      setLoadingProofs(false);
    }
  }, [signedProofMap]);

  const getRowAccent = (status?: string | null) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50/70';
      case 'rejected':
        return 'bg-rose-50/70';
      default:
        return '';
    }
  };

  const resolveMovement = (transaction: CashTransaction) => {
    if (transaction.cash_in && transaction.cash_in > 0) {
      return {
        tone: 'text-green-600',
        amount: formatCurrency(transaction.cash_in),
        label: 'Cash In',
        prefix: '+',
      };
    }

    if (transaction.cash_out && transaction.cash_out > 0) {
      return {
        tone: 'text-red-600',
        amount: formatCurrency(transaction.cash_out),
        label: 'Cash Out',
        prefix: '-',
      };
    }

    return {
      tone: 'text-muted-foreground',
      amount: '₹0.00',
      label: 'No movement',
      prefix: '',
    };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transaction Approvals</h1>
          <p className="text-muted-foreground">Review and verify staff cash transactions before they hit the cashbook.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-muted-foreground/10 bg-muted/30">
          <CardContent className="flex flex-col gap-2 pt-6">
            <span className="text-sm text-muted-foreground">Pending reviews</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold">{statusSummary.pending}</span>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                Awaiting action
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Transactions needing verification. Approve to post or reject with feedback.
            </p>
          </CardContent>
        </Card>
        <Card className="border-muted-foreground/10">
          <CardContent className="flex flex-col gap-2 pt-6">
            <span className="text-sm text-muted-foreground">Approved this period</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-green-600">{statusSummary.approved}</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Posted
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Entries moved into the branch cashbook and reflected in balances.
            </p>
          </CardContent>
        </Card>
        <Card className="border-muted-foreground/10">
          <CardContent className="flex flex-col gap-2 pt-6">
            <span className="text-sm text-muted-foreground">Rejected this period</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-red-600">{statusSummary.rejected}</span>
              <Badge variant="secondary" className="bg-red-100 text-red-700">
                Sent back
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Ensure rejections include helpful notes so staff can resubmit correctly.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Refine the approval queue.</CardDescription>
          </div>
          <CardAction>
            <Button variant="outline" size="sm" onClick={resetFilters} disabled={!hasActiveFilters}>
              Reset filters
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Filter Buttons - Mobile optimized */}
          <div className="w-full">
            <Label className="text-xs font-medium text-muted-foreground mb-2 block">Status</Label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={statusFilter === option.value ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(option.value)}
                  className="flex-1 sm:flex-none"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Filter Grid - Responsive layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Branch Filter */}
            <div className="space-y-2">
              <Label htmlFor="branch" className="text-sm font-medium flex items-center gap-1.5">
                Branch
              </Label>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Approval queue</CardTitle>
            <CardDescription>Approve or reject staff cash transactions.</CardDescription>
          </div>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-background">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Voucher</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Submitted by</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Movement</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verifier notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                      No transactions match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => {
                    const movement = resolveMovement(transaction);
                    const submittedAt = new Date(transaction.transaction_date);

                    return (
                      <TableRow 
                        key={transaction.id} 
                        className={`${getRowAccent(transaction.verification_status)} cursor-pointer hover:bg-muted/50`}
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setDetailsDialogOpen(true);
                        }}
                      >
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">{submittedAt.toLocaleDateString('en-IN')}</span>
                            <span className="text-xs text-muted-foreground">{submittedAt.toLocaleTimeString('en-IN')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-muted/70 font-mono">
                            {transaction.voucher_no || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{transaction.branch || '—'}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">{transaction.staff?.name || 'Unknown staff'}</span>
                            {transaction.staff?.employee_id && (
                              <span className="text-xs text-muted-foreground">ID: {transaction.staff.employee_id}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5 text-sm">
                            <span className="font-medium text-foreground">{transaction.primary_list || '—'}</span>
                            <span className="text-xs text-muted-foreground">
                              {transaction.nature_of_expense || 'No additional context provided'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className={`text-sm font-semibold ${movement.tone}`}>
                              {movement.prefix}
                              {movement.amount}
                            </span>
                            <span className="text-xs text-muted-foreground uppercase">{movement.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {transaction.attachment_urls?.length ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openProofPreview(transaction)}
                            >
                              <Eye className="mr-2 h-4 w-4" /> View ({transaction.attachment_urls.length})
                            </Button>
                          ) : (
                            <Badge variant="outline" className="bg-muted/70 text-muted-foreground">
                              No proof
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{statusBadge(transaction.verification_status)}</TableCell>
                        <TableCell className="max-w-xs text-xs text-muted-foreground">
                          {transaction.verification_notes?.length ? transaction.verification_notes : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              disabled={transaction.verification_status !== 'pending'}
                              onClick={() => openActionDialog('approve', transaction)}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={transaction.verification_status !== 'pending'}
                              onClick={() => openActionDialog('reject', transaction)}
                            >
                              <XCircle className="mr-2 h-4 w-4" /> Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(actionDialog)} onOpenChange={(open) => {
        if (!open) {
          setActionDialog(null);
          setSelectedTransaction(null);
          setNotes('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionDialog === 'approve' ? 'Approve transaction' : 'Reject transaction'}</DialogTitle>
            <DialogDescription>
              {actionDialog === 'approve'
                ? 'Confirm this entry to move it into the official cashbook.'
                : 'Provide a reason so the submitter understands why it was rejected.'}
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-3">
              <div className="text-sm">
                <div className="font-medium">{selectedTransaction.primary_list}</div>
                <div className="text-muted-foreground">
                  {new Date(selectedTransaction.transaction_date).toLocaleString()} · {selectedTransaction.branch}
                </div>
                <div className="text-muted-foreground text-xs">
                  Submitted by {selectedTransaction.staff?.name || 'Unknown staff'}
                </div>
              </div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={actionDialog === 'approve' ? 'Optional note for the submitter…' : 'Why is this transaction being rejected?'}
                required={actionDialog === 'reject'}
              />
            </div>
          )}
          <DialogFooter className="justify-end gap-2">
            <Button variant="outline" onClick={() => setActionDialog(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleAction} disabled={submitting} variant={actionDialog === 'approve' ? 'default' : 'destructive'}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : actionDialog === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={proofPreview !== null} onOpenChange={(open) => {
        if (!open) {
          setProofPreview(null);
          setActiveProofUrl(null);
          setProofError(null);
        }
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Proof attachments</DialogTitle>
            <DialogDescription>
              {proofPreview ? `${proofPreview.attachment_urls?.length || 0} file(s) attached to voucher ${proofPreview.voucher_no}` : 'Attached files'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-2">
            {loadingProofs ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading proofs…
              </div>
            ) : (
              (() => {
                const proofUrls = proofPreview
                  ? signedProofMap[proofPreview.id] || proofPreview.attachment_urls || []
                  : [];

                if (!proofUrls.length) {
                  return <p className="text-sm text-muted-foreground">No supporting files attached to this transaction.</p>;
                }

                return (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {proofUrls.map((url, index) => {
                      const isImage = url.match(/\.(png|jpe?g|webp|gif)$/i);
                      const isPdf = url.toLowerCase().includes('.pdf');

                      return (
                        <div key={index} className="rounded-lg border bg-muted/30 p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-medium text-muted-foreground truncate max-w-[75%]">
                              {`Attachment ${index + 1}`}
                            </div>
                            <Badge variant="secondary">{isPdf ? 'PDF' : isImage ? 'Image' : 'File'}</Badge>
                          </div>

                          {isImage ? (
                            <button
                              type="button"
                              className="relative block overflow-hidden rounded-md border bg-background"
                              onClick={() => setActiveProofUrl(url)}
                            >
                              <img
                                src={url}
                                alt={`Attachment ${index + 1}`}
                                className="h-48 w-full object-cover"
                              />
                            </button>
                          ) : (
                            <div className="rounded-md bg-background p-4 text-xs text-muted-foreground">
                              Preview unavailable. Use the buttons below to open or download this file.
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button asChild variant="outline" size="sm" className="flex-1">
                              <a href={url} target="_blank" rel="noopener noreferrer">
                                Open
                              </a>
                            </Button>
                            <Button asChild size="sm" className="flex-1">
                              <a href={url} download>
                                Download
                              </a>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </ScrollArea>
          {proofError ? (
            <p className="text-xs text-destructive">{proofError}</p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProofPreview(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={activeProofUrl !== null} onOpenChange={(open) => {
        if (!open) {
          setActiveProofUrl(null);
        }
      }}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Attachment preview</DialogTitle>
          </DialogHeader>
          {activeProofUrl && (
            <div className="flex flex-col gap-3">
              <img src={activeProofUrl} alt="Proof" className="max-h-[70vh] w-full object-contain rounded-md border" />
              <div className="flex justify-end gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={activeProofUrl} target="_blank" rel="noopener noreferrer">Open in new tab</a>
                </Button>
                <Button asChild size="sm">
                  <a href={activeProofUrl} download>Download</a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transaction Details Dialog */}
      <TransactionDetailsDialog
        transaction={selectedTransaction}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onEdit={undefined} // No edit functionality in approvals page
        onDelete={undefined} // No delete functionality in approvals page
      />
    </div>
  );
}
