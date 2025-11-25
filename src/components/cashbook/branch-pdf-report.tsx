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

interface BranchPDFReportProps {
  transactions: CashTransaction[];
  branchName: string;
  includeSummary?: boolean;
  includeBalances?: boolean;
}

const styles = StyleSheet.create({
  ...commonStyles,
  branchHeader: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    border: '1pt solid #e2e8f0',
  },
  branchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  branchSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 10,
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
    backgroundColor: '#1e40af',
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
  noDataText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
});

export function BranchPDFReport({
  transactions,
  branchName,
  includeSummary = true,
  includeBalances = true,
}: BranchPDFReportProps) {
  // Calculate summary
  const summary = {
    totalTransactions: transactions.length,
    totalCashIn: transactions.reduce((sum, t) => sum + (t.cash_in || 0), 0),
    totalCashOut: transactions.reduce((sum, t) => sum + (t.cash_out || 0), 0),
    netAmount: transactions.reduce((sum, t) => sum + (t.cash_in || 0) - (t.cash_out || 0), 0),
  };

  const formatDateForTable = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>PROULTIMA</Text>
            <Text style={styles.companySubtitle}>Cash Transaction Report</Text>
          </View>
          <View>
            <Text style={styles.generatedText}>
              Generated: {new Date().toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Branch Header */}
        <View style={styles.branchHeader}>
          <Text style={styles.branchTitle}>{branchName} Branch Report</Text>
          <Text style={styles.branchSubtitle}>
            Report Period: {transactions.length > 0 
              ? `${formatDate(transactions[0].transaction_date)} - ${formatDate(transactions[transactions.length - 1].transaction_date)}`
              : 'No transactions'
            }
          </Text>
        </View>

        {/* Summary Section */}
        {includeSummary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Branch Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Transactions:</Text>
              <Text style={styles.summaryValue}>{summary.totalTransactions}</Text>
            </View>
            <View style={styles.summaryRow}>
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
              <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Date</Text>
              <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Voucher</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Staff</Text>
              <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Description</Text>
              <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Cash In</Text>
              <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Cash Out</Text>
              <Text style={[styles.tableHeaderCell, { width: '14%' }]}>Balance</Text>
            </View>

            {/* Table Rows */}
            {transactions.map((transaction, index) => (
              <View key={transaction.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '15%' }]}>
                  {formatDateForTable(transaction.transaction_date)}
                </Text>
                <Text style={[styles.tableCell, { width: '12%' }]}>
                  {transaction.voucher_no}
                </Text>
                <Text style={[styles.tableCellLeft, { width: '20%' }]}>
                  {transaction.staff?.name || 'N/A'}
                </Text>
                <Text style={[styles.tableCellLeft, { width: '15%' }]}>
                  {transaction.primary_list.length > 20 
                    ? `${transaction.primary_list.substring(0, 20)}...`
                    : transaction.primary_list
                  }
                </Text>
                <Text style={[styles.tableCell, styles.amountCell, styles.cashInAmount, { width: '12%' }]}>
                  {transaction.cash_in > 0 ? formatINR(transaction.cash_in) : '-'}
                </Text>
                <Text style={[styles.tableCell, styles.amountCell, styles.cashOutAmount, { width: '12%' }]}>
                  {transaction.cash_out > 0 ? formatINR(transaction.cash_out) : '-'}
                </Text>
                <Text style={[styles.tableCell, styles.amountCell, styles.balanceAmount, { width: '14%' }]}>
                  {formatINR(transaction.balance)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noDataText}>
            <Text>No transactions found for this branch</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            PROULTIMA - {branchName} Branch Cash Report
          </Text>
          <Text style={styles.generatedText}>
            Generated on {new Date().toLocaleString('en-IN')} | 
            {summary.totalTransactions} transactions | 
            Net: {formatINR(summary.netAmount)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
