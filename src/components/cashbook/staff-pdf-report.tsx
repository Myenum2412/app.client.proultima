"use client"

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { formatINR, formatDate, commonStyles } from '@/utils/pdf-helpers';
import type { CashTransaction } from '@/types/cashbook';
import type { Staff } from '@/types/auth';

interface StaffPDFReportProps {
  transactions: CashTransaction[];
  staff: Staff;
  startDate?: string;
  endDate?: string;
  includeSummary?: boolean;
  includeBalances?: boolean;
}

const styles = StyleSheet.create({
  ...commonStyles,
  staffHeader: {
    backgroundColor: '#f0fdf4',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    border: '1pt solid #22c55e',
  },
  staffTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#15803d',
    marginBottom: 8,
  },
  staffSubtitle: {
    fontSize: 12,
    color: '#166534',
    marginBottom: 5,
  },
  staffDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  staffInfo: {
    flex: 1,
  },
  staffLabel: {
    fontSize: 10,
    color: '#166534',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  staffValue: {
    fontSize: 11,
    color: '#15803d',
    marginBottom: 5,
  },
  summaryCard: {
    backgroundColor: '#f0f9ff',
    padding: 15,
    borderRadius: 6,
    marginBottom: 20,
    border: '1pt solid #0ea5e9',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingVertical: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#0c4a6e',
    fontWeight: 'bold',
  },
  summaryValue: {
    fontSize: 11,
    color: '#0c4a6e',
    fontWeight: 'bold',
  },
  transactionTable: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#15803d',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tableCell: {
    fontSize: 9,
    color: '#374151',
    textAlign: 'center',
  },
  tableCellLeft: {
    fontSize: 9,
    color: '#374151',
    textAlign: 'left',
  },
  amountCell: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  cashInAmount: {
    color: '#059669',
  },
  cashOutAmount: {
    color: '#dc2626',
  },
  balanceAmount: {
    color: '#1e40af',
  },
  statusCell: {
    fontSize: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  statusPaid: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusCancelled: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  statusYetToPay: {
    backgroundColor: '#fed7aa',
    color: '#9a3412',
  },
  statusRefund: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  noDataText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
});

export function StaffPDFReport({
  transactions,
  staff,
  startDate,
  endDate,
  includeSummary = true,
  includeBalances = true,
}: StaffPDFReportProps) {
  // Calculate summary
  const summary = {
    totalTransactions: transactions.length,
    totalCashIn: transactions.reduce((sum, t) => sum + (t.cash_in || 0), 0),
    totalCashOut: transactions.reduce((sum, t) => sum + (t.cash_out || 0), 0),
    netAmount: transactions.reduce((sum, t) => sum + (t.cash_in || 0) - (t.cash_out || 0), 0),
    paidTransactions: transactions.filter(t => t.bill_status === 'Paid').length,
    pendingTransactions: transactions.filter(t => t.bill_status === 'Pending').length,
    cancelledTransactions: transactions.filter(t => t.bill_status === 'Cancelled').length,
  };

  const formatDateForTable = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Paid':
        return [styles.statusCell, styles.statusPaid];
      case 'Pending':
        return [styles.statusCell, styles.statusPending];
      case 'Cancelled':
        return [styles.statusCell, styles.statusCancelled];
      case 'Yet to pay':
        return [styles.statusCell, styles.statusYetToPay];
      case 'Refund':
        return [styles.statusCell, styles.statusRefund];
      default:
        return styles.statusCell;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>PROULTIMA</Text>
            <Text style={styles.companySubtitle}>Individual Staff Report</Text>
          </View>
          <View>
            <Text style={styles.generatedText}>
              Generated: {new Date().toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Staff Header */}
        <View style={styles.staffHeader}>
          <Text style={styles.staffTitle}>{staff.name} - Transaction History</Text>
          <Text style={styles.staffSubtitle}>
            Employee ID: {staff.employee_id} | Department: {staff.department}
          </Text>
          <Text style={styles.staffSubtitle}>
            Branch: {staff.branch} | Email: {staff.email}
          </Text>
          {startDate && endDate && (
            <Text style={styles.staffSubtitle}>
              Report Period: {formatDate(startDate)} - {formatDate(endDate)}
            </Text>
          )}
        </View>

        {/* Summary Section */}
        {includeSummary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Transaction Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Transactions:</Text>
              <Text style={styles.summaryValue}>{summary.totalTransactions}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Paid Transactions:</Text>
              <Text style={[styles.summaryValue, styles.cashInAmount]}>
                {summary.paidTransactions}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pending Transactions:</Text>
              <Text style={[styles.summaryValue, styles.cashOutAmount]}>
                {summary.pendingTransactions}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Cancelled Transactions:</Text>
              <Text style={[styles.summaryValue, styles.statusCancelled]}>
                {summary.cancelledTransactions}
              </Text>
            </View>
            <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#0ea5e9', paddingTop: 8, marginTop: 5 }]}>
              <Text style={styles.summaryLabel}>Total Cash In:</Text>
              <Text style={[styles.summaryValue, styles.cashInAmount]}>
                {formatINR(summary.totalCashIn)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Cash Out:</Text>
              <Text style={[styles.summaryValue, styles.cashOutAmount]}>
                {formatINR(summary.totalCashOut)}
              </Text>
            </View>
            <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#0ea5e9', paddingTop: 8, marginTop: 5 }]}>
              <Text style={styles.summaryLabel}>Net Amount:</Text>
              <Text style={[styles.summaryValue, styles.balanceAmount]}>
                {formatINR(summary.netAmount)}
              </Text>
            </View>
          </View>
        )}

        {/* Transactions Table */}
        {transactions.length > 0 ? (
          <View style={styles.transactionTable}>
            <Text style={styles.sectionTitle}>Transaction Details</Text>
            
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Date</Text>
              <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Voucher</Text>
              <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Description</Text>
              <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Category</Text>
              <Text style={[styles.tableHeaderCell, { width: '10%' }]}>Cash In</Text>
              <Text style={[styles.tableHeaderCell, { width: '10%' }]}>Cash Out</Text>
              <Text style={[styles.tableHeaderCell, { width: '10%' }]}>Balance</Text>
              <Text style={[styles.tableHeaderCell, { width: '10%' }]}>Status</Text>
              <Text style={[styles.tableHeaderCell, { width: '9%' }]}>Branch</Text>
            </View>

            {/* Table Rows */}
            {transactions.map((transaction, index) => (
              <View key={transaction.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '12%' }]}>
                  {formatDateForTable(transaction.transaction_date)}
                </Text>
                <Text style={[styles.tableCell, { width: '12%' }]}>
                  {transaction.voucher_no}
                </Text>
                <Text style={[styles.tableCellLeft, { width: '15%' }]}>
                  {transaction.primary_list.length > 15 
                    ? `${transaction.primary_list.substring(0, 15)}...`
                    : transaction.primary_list
                  }
                </Text>
                <Text style={[styles.tableCellLeft, { width: '12%' }]}>
                  {transaction.nature_of_expense.length > 10 
                    ? `${transaction.nature_of_expense.substring(0, 10)}...`
                    : transaction.nature_of_expense
                  }
                </Text>
                <Text style={[styles.tableCell, styles.amountCell, styles.cashInAmount, { width: '10%' }]}>
                  {transaction.cash_in > 0 ? formatINR(transaction.cash_in) : '-'}
                </Text>
                <Text style={[styles.tableCell, styles.amountCell, styles.cashOutAmount, { width: '10%' }]}>
                  {transaction.cash_out > 0 ? formatINR(transaction.cash_out) : '-'}
                </Text>
                <Text style={[styles.tableCell, styles.amountCell, styles.balanceAmount, { width: '10%' }]}>
                  {formatINR(transaction.balance)}
                </Text>
                <Text style={[styles.tableCell, { width: '10%' }]}>
                  <Text style={getStatusStyle(transaction.bill_status)}>
                    {transaction.bill_status}
                  </Text>
                </Text>
                <Text style={[styles.tableCell, { width: '9%' }]}>
                  {transaction.branch}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noDataText}>
            <Text>No transactions found for this staff member</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            PROULTIMA - Individual Staff Report
          </Text>
          <Text style={styles.generatedText}>
            Generated on {new Date().toLocaleString('en-IN')} | 
            {summary.totalTransactions} transactions | 
            Staff: {staff.name} ({staff.employee_id})
          </Text>
        </View>
      </Page>
    </Document>
  );
}
