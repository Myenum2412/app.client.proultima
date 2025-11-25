import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';
import type { CashTransaction } from '@/types/cashbook';
import { formatINR, formatDate, getStatusColor, commonStyles } from '@/utils/pdf-helpers';

// Register fonts for better PDF rendering
Font.register({
  family: 'Helvetica',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
});

interface TransactionPDFReceiptProps {
  transaction: CashTransaction;
  calculatedBalance?: number;
  images?: string[];
}

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
    textAlign: 'center',
  },
  receiptSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center',
    marginTop: 5,
  },
  imageSection: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  imageContainer: {
    marginBottom: 15,
    alignItems: 'center',
  },
  image: {
    maxWidth: '80%',
    maxHeight: 300,
    objectFit: 'contain',
  },
  imageLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 5,
    textAlign: 'center',
  },
  voucherSection: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    border: '1 solid #e2e8f0',
  },
  voucherNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center',
    marginBottom: 10,
  },
  voucherLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
  },
  rowLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'bold',
    width: '40%',
  },
  rowValue: {
    fontSize: 12,
    color: '#1e293b',
    width: '60%',
    textAlign: 'right',
  },
  amountSection: {
    backgroundColor: '#f1f5f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  cashOutRow: {
    backgroundColor: '#fef2f2',
    borderLeft: '4 solid #ef4444',
  },
  cashInRow: {
    backgroundColor: '#f0fdf4',
    borderLeft: '4 solid #22c55e',
  },
  balanceRow: {
    backgroundColor: '#eff6ff',
    borderLeft: '4 solid #3b82f6',
    borderTop: '1 solid #3b82f6',
    borderRight: '1 solid #3b82f6',
    borderBottom: '1 solid #3b82f6',
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statusBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    border: '1 solid #d1d5db',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  descriptionSection: {
    backgroundColor: '#fafafa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 1.5,
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    border: '1 solid #c7d2fe',
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#3730a3',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 5,
  },
  footerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 2,
  },
  footerValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  generatedText: {
    fontSize: 9,
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 5,
  },
});

export function TransactionPDFReceipt({ transaction, calculatedBalance, images = [] }: TransactionPDFReceiptProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>ProUltima Task Management System</Text>
          <Text style={styles.receiptSubtitle}>CASH TRANSACTION RECEIPT</Text>
        </View>

        {/* Voucher Number
        <View style={styles.voucherSection}>
          <Text style={styles.voucherLabel}>VOUCHER NUMBER</Text>
          <Text style={styles.voucherNumber}>{transaction.voucher_no}</Text>
        </View> */}

        {/* Transaction Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Details</Text>
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Date:</Text>
            <Text style={styles.rowValue}>{formatDate(transaction.transaction_date)}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Branch:</Text>
            <Text style={styles.rowValue}>{transaction.branch}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Staff:</Text>
            <Text style={styles.rowValue}>
              {transaction.staff?.name || 'Unknown'}
              {transaction.staff?.employee_id && ` (${transaction.staff.employee_id})`}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Status:</Text>
            <View style={[styles.statusBadge, getStatusColor(transaction.bill_status)]}>
              <Text style={[styles.statusText, { color: getStatusColor(transaction.bill_status).color }]}>
                {transaction.bill_status}
              </Text>
            </View>
          </View>
        </View>

        {/* Description & Category */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Description & Category</Text>
          <Text style={styles.descriptionText}>{transaction.primary_list}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{transaction.nature_of_expense}</Text>
          </View>
          {transaction.notes && (
            <Text style={[styles.descriptionText, { marginTop: 10, fontStyle: 'italic' }]}>
              Notes: {transaction.notes}
            </Text>
          )}
        </View>

        {/* Amount Breakdown */}
        <View style={styles.amountSection}>
          <Text style={styles.sectionTitle}>Amount Breakdown</Text>
          
          {transaction.cash_out > 0 && (
            <View style={[styles.amountRow, styles.cashOutRow]}>
              <Text style={styles.amountLabel}>Cash Out:</Text>
              <Text style={styles.amountValue}>{formatINR(transaction.cash_out)}</Text>
            </View>
          )}
          
          {transaction.cash_in > 0 && (
            <View style={[styles.amountRow, styles.cashInRow]}>
              <Text style={styles.amountLabel}>Cash In:</Text>
              <Text style={styles.amountValue}>{formatINR(transaction.cash_in)}</Text>
            </View>
          )}
          
          <View style={[styles.amountRow, styles.balanceRow]}>
            <Text style={styles.amountLabel}>Current Balance:</Text>
            <Text style={styles.amountValue}>{formatINR(calculatedBalance ?? transaction.balance)}</Text>
          </View>
        </View>

        {/* Supporting Proofs Images */}
        {images && images.length > 0 && (
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>Supporting Proofs</Text>
            {images.map((imageUrl, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image
                  src={imageUrl}
                  style={styles.image}
                />
                <Text style={styles.imageLabel}>Attachment {index + 1}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <View style={styles.footerColumn}>
              <Text style={styles.footerLabel}>Voucher Number</Text>
              <Text style={styles.footerValue}>{transaction.voucher_no}</Text>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerLabel}>Date</Text>
              <Text style={styles.footerValue}>{formatDate(transaction.transaction_date)}</Text>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerLabel}>Branch</Text>
              <Text style={styles.footerValue}>{transaction.branch}</Text>
            </View>
            <View style={styles.footerColumn}>
              <Text style={styles.footerLabel}>Status</Text>
              <Text style={styles.footerValue}>{transaction.bill_status}</Text>
            </View>
          </View>
          <Text style={styles.generatedText}>
            Generated on {new Date().toLocaleString('en-IN')} - This is a computer-generated receipt
          </Text>
        </View>
      </Page>
    </Document>
  );
}
