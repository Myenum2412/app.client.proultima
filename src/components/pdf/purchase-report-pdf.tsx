import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import type { PurchaseRequisition } from '@/types/maintenance';

// Register fonts - TEMPORARILY DISABLED FOR TESTING
// Font.register({
//   family: 'Inter',
//   fonts: [
//     { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2' },
//     { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2', fontWeight: 'bold' },
//   ],
// });

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    // fontFamily: 'Inter', // Commented out for testing
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #E5E7EB',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  summary: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottom: '1 solid #D1D5DB',
  },
  tableHeaderCell: {
    padding: 8,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    borderRight: '1 solid #D1D5DB',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #E5E7EB',
  },
  tableCell: {
    padding: 8,
    fontSize: 9,
    color: '#374151',
    borderRight: '1 solid #E5E7EB',
  },
  statusBadge: {
    padding: '2 6',
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  statusApproved: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  statusRejected: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
  },
  adminResponse: {
    fontSize: 8,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#9CA3AF',
    borderTop: '1 solid #E5E7EB',
    paddingTop: 10,
  },
});

interface PurchaseReportPDFProps {
  requests: PurchaseRequisition[];
}

export function PurchaseReportPDF({ requests }: PurchaseReportPDFProps) {
  // console.log('📄 PDF Component received requests:', requests);
  // console.log('📄 PDF Component requests count:', requests.length);
  
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return [styles.statusBadge, styles.statusPending];
      case 'approved':
        return [styles.statusBadge, styles.statusApproved];
      case 'rejected':
        return [styles.statusBadge, styles.statusRejected];
      default:
        return [styles.statusBadge];
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { color: '#92400E', backgroundColor: '#FEF3C7' };
      case 'approved': return { color: '#065F46', backgroundColor: '#D1FAE5' };
      case 'rejected': return { color: '#DC2626', backgroundColor: '#FEE2E2' };
      default: return { color: '#374151' };
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const approvedRequests = requests.filter(r => r.status === 'approved').length;
  const rejectedRequests = requests.filter(r => r.status === 'rejected').length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Purchase Requisitions Report</Text>
          <Text style={styles.subtitle}>Purchase Requests and Approval Status</Text>
          <Text style={styles.date}>
            Generated on {format(new Date(), 'MMMM dd, yyyy')}
          </Text>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Requests:</Text>
            <Text style={styles.summaryValue}>{requests.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pending:</Text>
            <Text style={styles.summaryValue}>{pendingRequests}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Approved:</Text>
            <Text style={styles.summaryValue}>{approvedRequests}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Rejected:</Text>
            <Text style={styles.summaryValue}>{rejectedRequests}</Text>
          </View>
        </View>

        {/* Requests Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '8%' }]}>#</Text>
            <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Purchase Item</Text>
            <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Description</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Status</Text>
            <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Date</Text>
            <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Admin Response</Text>
          </View>

          {requests.map((request, index) => (
            <View key={request.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '8%' }]}>{index + 1}</Text>
              <Text style={[styles.tableCell, { width: '25%' }]}>{request.purchase_item}</Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>{request.description || '-'}</Text>
              <Text style={[styles.tableCell, { width: '15%', ...getStatusColor(request.status) }]}>
                {request.status}
              </Text>
              <Text style={[styles.tableCell, { width: '12%' }]}>
                {format(new Date(request.requested_date), 'MMM dd')}
              </Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>
                {request.admin_notes || request.rejection_reason || '-'}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This report was generated automatically by the Pro-Ultima Staff Portal
        </Text>
      </Page>
    </Document>
  );
}
