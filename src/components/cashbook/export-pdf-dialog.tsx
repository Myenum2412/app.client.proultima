"use client"

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Calendar as CalendarIcon, Building2, User, FileText } from 'lucide-react';
import { formatDate, generateFilename } from '@/utils/pdf-helpers';
import type { CashTransaction } from '@/types/cashbook';
import type { Staff } from '@/types/auth';
import { pdf } from '@react-pdf/renderer';
import { AllTransactionsPDFReport } from './all-transactions-pdf-report';
import { BranchPDFReport } from './branch-pdf-report';
import { StaffPDFReport } from './staff-pdf-report';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format as formatFn } from 'date-fns';

interface ExportPDFDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: CashTransaction[];
  branches: string[];
  staff: Staff[];
}

type ExportType = 'all' | 'branch' | 'staff';

export function ExportPDFDialog({
  open,
  onOpenChange,
  transactions,
  branches,
  staff,
}: ExportPDFDialogProps) {
  const [exportType, setExportType] = useState<ExportType>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [range, setRange] = useState<DateRange | undefined>();
  const [includeSummary, setIncludeSummary] = useState<boolean>(true);
  const [includeBalances, setIncludeBalances] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    const fromStr = range?.from ? formatFn(range.from, 'yyyy-MM-dd') : '';
    const toStr = range?.to ? formatFn(range.to, 'yyyy-MM-dd') : '';
    setStartDate(fromStr);
    setEndDate(toStr);
  }, [range?.from, range?.to]);

  // Calculate filtered transactions
  const getFilteredTransactions = () => {
    let filtered = [...transactions];

    // Filter by date range
    if (startDate && endDate) {
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.transaction_date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return transactionDate >= start && transactionDate <= end;
      });
    }

    // Filter by branch
    if (exportType === 'branch' && selectedBranch) {
      filtered = filtered.filter(t => t.branch === selectedBranch);
    }

    // Filter by staff
    if (exportType === 'staff' && selectedStaff) {
      filtered = filtered.filter(t => t.staff_id === selectedStaff);
    }

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();
  const selectedStaffData = staff.find(s => s.id === selectedStaff);

  // Calculate summary
  const summary = {
    totalTransactions: filteredTransactions.length,
    totalCashIn: filteredTransactions.reduce((sum, t) => sum + (t.cash_in || 0), 0),
    totalCashOut: filteredTransactions.reduce((sum, t) => sum + (t.cash_out || 0), 0),
    netAmount: filteredTransactions.reduce((sum, t) => sum + (t.cash_in || 0) - (t.cash_out || 0), 0),
  };


  const resetForm = () => {
    setExportType('all');
    setSelectedBranch('');
    setSelectedStaff('');
    setStartDate('');
    setEndDate('');
    setIncludeSummary(true);
    setIncludeBalances(true);
  };

  const handleExportClick = async () => {
    setIsGenerating(true);
    try {
      let doc;
      let filename: string;
      
      if (exportType === 'all') {
        doc = (
          <AllTransactionsPDFReport
            transactions={filteredTransactions}
            includeSummary={includeSummary}
            includeBalances={includeBalances}
          />
        );
        filename = generateFilename('all', 'all-transactions', startDate, endDate);
      } else if (exportType === 'branch') {
        if (!selectedBranch) {
          toast.error('Please select a branch');
          return;
        }
        doc = (
          <BranchPDFReport
            transactions={filteredTransactions}
            branchName={selectedBranch}
            includeSummary={includeSummary}
            includeBalances={includeBalances}
          />
        );
        filename = generateFilename('branch', selectedBranch, startDate, endDate);
      } else if (exportType === 'staff') {
        if (!selectedStaff || !selectedStaffData) {
          toast.error('Please select a staff member');
          return;
        }
        doc = (
          <StaffPDFReport
            transactions={filteredTransactions}
            staff={selectedStaffData}
            startDate={startDate}
            endDate={endDate}
            includeSummary={includeSummary}
            includeBalances={includeBalances}
          />
        );
        filename = generateFilename('staff', selectedStaffData.employee_id || 'staff', startDate, endDate);
      } else {
        toast.error('Invalid export type');
        return;
      }
      
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('PDF exported successfully!');
      onOpenChange(false);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        } as React.CSSProperties}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export PDF Report
          </DialogTitle>
          <DialogDescription>
            Customize your PDF export with filters and options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <Button
                  variant={exportType === 'all' ? 'default' : 'outline'}
                  onClick={() => setExportType('all')}
                  className="h-auto p-3 sm:p-4 flex flex-col items-center gap-2 min-w-0"
                >
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="font-medium text-xs sm:text-sm text-center">All Transactions</span>
                </Button>

                <Button
                  variant={exportType === 'branch' ? 'default' : 'outline'}
                  onClick={() => setExportType('branch')}
                  className="h-auto p-3 sm:p-4 flex flex-col items-center gap-2 min-w-0"
                >
                  <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="font-medium text-xs sm:text-sm text-center">Branch Report</span>
                </Button>

                <Button
                  variant={exportType === 'staff' ? 'default' : 'outline'}
                  onClick={() => setExportType('staff')}
                  className="h-auto p-3 sm:p-4 flex flex-col items-center gap-2 min-w-0"
                >
                  <User className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="font-medium text-xs sm:text-sm text-center">Staff History</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Branch Filter */}
              {exportType === 'branch' && (
                <div className="space-y-2">
                  <Label htmlFor="branch-select">Select Branch</Label>
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Staff Filter */}
              {exportType === 'staff' && (
                <div className="space-y-2">
                  <Label htmlFor="staff-select">Select Staff</Label>
                  <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.employee_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Date Range */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <Label htmlFor="start-date" className="text-xs sm:text-sm font-medium">
                      Start Date
                    </Label>
                <Popover>
                  <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left font-normal h-9 sm:h-10 text-xs sm:text-sm"
                          id="start-date"
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 opacity-60 flex-shrink-0" />
                          <span className="truncate">
                            {range?.from
                              ? formatFn(range.from, 'MMM d, yyyy')
                              : 'Select start date'}
                          </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="start">
                    <Calendar
                          mode="single"
                          selected={range?.from}
                          onSelect={(date) => {
                            setRange({
                              from: date,
                              to: range?.to,
                            });
                          }}
                      defaultMonth={range?.from ?? new Date()}
                      className="rounded-lg border bg-card p-3 shadow-sm"
                    />
                  </PopoverContent>
                </Popover>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <Label htmlFor="end-date" className="text-xs sm:text-sm font-medium">
                      End Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left font-normal h-9 sm:h-10 text-xs sm:text-sm"
                          id="end-date"
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 opacity-60 flex-shrink-0" />
                          <span className="truncate">
                            {range?.to
                              ? formatFn(range.to, 'MMM d, yyyy')
                              : 'Select end date'}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3" align="start">
                        <Calendar
                          mode="single"
                          selected={range?.to}
                          onSelect={(date) => {
                            setRange({
                              from: range?.from,
                              to: date,
                            });
                          }}
                          defaultMonth={range?.to ?? range?.from ?? new Date()}
                          className="rounded-lg border bg-card p-3 shadow-sm"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-summary"
                    checked={includeSummary}
                    onCheckedChange={(checked) => setIncludeSummary(checked as boolean)}
                  />
                  <Label htmlFor="include-summary">Include summary section</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-balances"
                    checked={includeBalances}
                    onCheckedChange={(checked) => setIncludeBalances(checked as boolean)}
                  />
                  <Label htmlFor="include-balances">Show opening/closing balances</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Export Type:</span>
                  <Badge variant="secondary">
                    {exportType === 'all' && 'All Transactions'}
                    {exportType === 'branch' && `Branch: ${selectedBranch || 'Not selected'}`}
                    {exportType === 'staff' && `Staff: ${selectedStaffData?.name || 'Not selected'}`}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Date Range:</span>
                  <span className="text-sm">
                    {startDate && endDate 
                      ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                      : 'All dates'
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Transactions:</span>
                  <Badge variant="outline">{summary.totalTransactions} transactions</Badge>
                </div>

                {summary.totalTransactions > 0 && (
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Cash In:</span>
                      <span className="text-green-600 font-medium">
                        ₹{summary.totalCashIn.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Cash Out:</span>
                      <span className="text-red-600 font-medium">
                        ₹{summary.totalCashOut.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Net Amount:</span>
                      <span className={summary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ₹{summary.netAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            
            {/* Single Export PDF Button */}
            <Button 
              onClick={handleExportClick}
              disabled={isGenerating || summary.totalTransactions === 0 || 
                (exportType === 'branch' && !selectedBranch) ||
                (exportType === 'staff' && !selectedStaff)}
              className="min-w-[120px]"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
