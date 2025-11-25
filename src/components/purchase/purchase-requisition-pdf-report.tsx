"use client"

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { formatDate, commonStyles } from '@/utils/pdf-helpers';
import type { PurchaseRequisition } from '@/types/maintenance';

// Register fonts for better PDF rendering
Font.register({
  family: 'Helvetica',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
  fontWeight: 'normal',
});
Font.register({
  family: 'Helvetica-Bold',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
  fontWeight: 'bold',
});

interface PurchaseRequisitionPDFReportProps {
  requisition: PurchaseRequisition;
}

const styles = StyleSheet.create({
  ...commonStyles,
  page: {
    ...commonStyles.page,
    paddingBottom: 50, // Make space for fixed footer
  },
  header: {
    ...commonStyles.header,
    backgroundColor: '#fef3c7', // Light yellow background
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#0f172a',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#334155',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 10,
    color: '#64748b',
    width: '35%',
    fontFamily: 'Helvetica-Bold',
  },
  detailValue: {
    fontSize: 10,
    color: '#1e293b',
    width: '65%',
  },
  statusSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 15,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#475569',
    fontFamily: 'Helvetica-Bold',
  },
  statusValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  approvedStatus: {
    color: '#16a34a',
    backgroundColor: '#dcfce7',
    padding: 4,
    borderRadius: 4,
  },
  rejectedStatus: {
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    padding: 4,
    borderRadius: 4,
  },
  pendingStatus: {
    color: '#d97706',
    backgroundColor: '#fef3c7',
    padding: 4,
    borderRadius: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 5,
  },
  generatedText: {
    fontSize: 9,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
});

export function PurchaseRequisitionPDFReport({ requisition }: PurchaseRequisitionPDFReportProps) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return styles.approvedStatus;
      case 'rejected':
        return styles.rejectedStatus;
      case 'pending':
        return styles.pendingStatus;
      default:
        return styles.pendingStatus;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>PROULTIMA</Text>
          <Text style={styles.reportTitle}>Purchase Requisition Report</Text>
        </View>

        {/* Title */}
        {/* <Text style={styles.title}>Requisition ID: {requisition.id}</Text> */}

        {/* Requisition Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requisition Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Request Date:</Text>
            <Text style={styles.detailValue}>{formatDate(requisition.requested_date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Staff Name:</Text>
            <Text style={styles.detailValue}>{requisition.staff?.name || requisition.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Employee ID:</Text>
            <Text style={styles.detailValue}>{requisition.staff?.employee_id || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Designation:</Text>
            <Text style={styles.detailValue}>{requisition.designation}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Department:</Text>
            <Text style={styles.detailValue}>{requisition.department}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Branch:</Text>
            <Text style={styles.detailValue}>{requisition.branch}</Text>
          </View>
        </View>

        {/* Purchase Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purchase Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Purchase Item:</Text>
            <Text style={styles.detailValue}>{requisition.purchase_item}</Text>
          </View>
          {requisition.description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description:</Text>
              <Text style={styles.detailValue}>{requisition.description}</Text>
            </View>
          )}
          {requisition.quotation_urls && requisition.quotation_urls.length > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quotations:</Text>
              <Text style={styles.detailValue}>{requisition.quotation_urls.length} file(s) attached</Text>
            </View>
          )}
        </View>

        {/* Status Information */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Status Information</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Approval Status:</Text>
            <Text style={[styles.statusValue, getStatusStyle(requisition.status)]}>
              {requisition.status.charAt(0).toUpperCase() + requisition.status.slice(1)}
            </Text>
          </View>
          {requisition.approved_by && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Approved By:</Text>
              <Text style={styles.detailValue}>{requisition.admin?.name || requisition.approved_by}</Text>
            </View>
          )}
          {requisition.approved_at && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Approved At:</Text>
              <Text style={styles.detailValue}>{formatDate(requisition.approved_at)}</Text>
            </View>
          )}
          {requisition.rejection_reason && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rejection Reason:</Text>
              <Text style={styles.detailValue}>{requisition.rejection_reason}</Text>
            </View>
          )}
          {requisition.admin_notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Admin Notes:</Text>
              <Text style={styles.detailValue}>{requisition.admin_notes}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on {new Date().toLocaleString('en-IN')}
          </Text>
          <Text style={styles.generatedText}>
            PROULTIMA Purchase Requisition Report
          </Text>
        </View>
      </Page>
    </Document>
  );
}
