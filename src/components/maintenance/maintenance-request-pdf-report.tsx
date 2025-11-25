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
import type { MaintenanceRequest } from '@/types/maintenance';

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

interface MaintenanceRequestPDFReportProps {
  request: MaintenanceRequest;
}

const styles = StyleSheet.create({
  ...commonStyles,
  page: {
    ...commonStyles.page,
    paddingBottom: 50, // Make space for fixed footer
  },
  header: {
    ...commonStyles.header,
    backgroundColor: '#f0fdf4', // Light green background
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
  runningStatus: {
    color: '#16a34a',
    backgroundColor: '#dcfce7',
    padding: 4,
    borderRadius: 4,
  },
  notRunningStatus: {
    color: '#dc2626',
    backgroundColor: '#fee2e2',
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

export function MaintenanceRequestPDFReport({ request }: MaintenanceRequestPDFReportProps) {
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

  const getRunningStatusStyle = (status: string) => {
    switch (status) {
      case 'running':
        return styles.runningStatus;
      case 'not_running':
        return styles.notRunningStatus;
      default:
        return styles.notRunningStatus;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>PROULTIMA</Text>
          <Text style={styles.reportTitle}>Maintenance Request Report</Text>
        </View>

        {/* Title */}
        {/* <Text style={styles.title}>Request ID: {request.id}</Text> */}

        {/* Request Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Request Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Request Date:</Text>
            <Text style={styles.detailValue}>{formatDate(request.requested_date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Staff Name:</Text>
            <Text style={styles.detailValue}>{request.staff?.name || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Employee ID:</Text>
            <Text style={styles.detailValue}>{request.staff?.employee_id || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Branch:</Text>
            <Text style={styles.detailValue}>{request.branch}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Report Month:</Text>
            <Text style={styles.detailValue}>{request.report_month}</Text>
          </View>
        </View>

        {/* System Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Serial Number:</Text>
            <Text style={styles.detailValue}>{request.serial_number || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Workstation:</Text>
            <Text style={styles.detailValue}>{request.workstation_number || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Brand:</Text>
            <Text style={styles.detailValue}>{request.brand_name || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Condition:</Text>
            <Text style={styles.detailValue}>{request.condition}</Text>
          </View>
          {request.date_of_purchase && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Purchase Date:</Text>
              <Text style={styles.detailValue}>{formatDate(request.date_of_purchase)}</Text>
            </View>
          )}
          {request.contact_name && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contact Name:</Text>
              <Text style={styles.detailValue}>{request.contact_name}</Text>
            </View>
          )}
          {request.contact_number && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contact Number:</Text>
              <Text style={styles.detailValue}>{request.contact_number}</Text>
            </View>
          )}
          {request.warranty_end_date && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Warranty End:</Text>
              <Text style={styles.detailValue}>{formatDate(request.warranty_end_date)}</Text>
            </View>
          )}
        </View>

        {/* Status Information */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Status Information</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Running Status:</Text>
            <Text style={[styles.statusValue, getRunningStatusStyle(request.running_status)]}>
              {request.running_status === 'running' ? 'Running' : 'Not Running'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Approval Status:</Text>
            <Text style={[styles.statusValue, getStatusStyle(request.status)]}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </Text>
          </View>
          {request.approved_by && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Approved By:</Text>
              <Text style={styles.detailValue}>{request.approver?.name || request.approved_by}</Text>
            </View>
          )}
          {request.approved_at && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Approved At:</Text>
              <Text style={styles.detailValue}>{formatDate(request.approved_at)}</Text>
            </View>
          )}
          {request.rejection_reason && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rejection Reason:</Text>
              <Text style={styles.detailValue}>{request.rejection_reason}</Text>
            </View>
          )}
          {request.admin_notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Admin Notes:</Text>
              <Text style={styles.detailValue}>{request.admin_notes}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on {new Date().toLocaleString('en-IN')}
          </Text>
          <Text style={styles.generatedText}>
            PROULTIMA Maintenance Request Report
          </Text>
        </View>
      </Page>
    </Document>
  );
}
