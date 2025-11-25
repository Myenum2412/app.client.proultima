import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ScrapRequest } from '@/types/scrap';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #333',
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    borderBottom: '1 solid #ddd',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: '40%',
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
  },
  value: {
    width: '60%',
    fontSize: 10,
    color: '#1a1a1a',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  statusPending: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
  statusApproved: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusRejected: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  scrapWorking: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  scrapDamaged: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  scrapBeyondRepair: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    borderTop: '1 solid #ddd',
    paddingTop: 10,
  },
  responseBox: {
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 4,
    marginTop: 5,
    fontSize: 10,
    color: '#374151',
  },
});

interface ScrapReportPDFProps {
  request: ScrapRequest;
}

export function ScrapReportPDF({ request }: ScrapReportPDFProps) {
  const getStatusStyle = (status: string) => {
    const styles_map: Record<string, any> = {
      pending: styles.statusPending,
      approved: styles.statusApproved,
      rejected: styles.statusRejected,
    };
    return [styles.statusBadge, styles_map[status] || styles.statusPending];
  };

  const getScrapStatusStyle = (scrapStatus: string) => {
    const styles_map: Record<string, any> = {
      working: styles.scrapWorking,
      damaged: styles.scrapDamaged,
      beyond_repair: styles.scrapBeyondRepair,
    };
    return [styles.statusBadge, styles_map[scrapStatus] || styles.scrapWorking];
  };

  const getScrapStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      working: 'Working',
      damaged: 'Damaged',
      beyond_repair: 'Beyond Repair',
    };
    return labels[status] || status;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Scrap Request Report</Text>
          <Text style={styles.subtitle}>
            Generated on {format(new Date(), 'dd MMM yyyy, hh:mm a')}
          </Text>
        </View>

        {/* Request Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Request Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Request ID:</Text>
            <Text style={styles.value}>{request.id.slice(0, 8)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Requested Date:</Text>
            <Text style={styles.value}>
              {format(new Date(request.requested_date), 'dd MMM yyyy, hh:mm a')}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <View style={getStatusStyle(request.status)}>
              <Text>{request.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Submitter Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Submitter Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{request.submitter_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Type:</Text>
            <Text style={styles.value}>{request.submitter_type.toUpperCase()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Branch:</Text>
            <Text style={styles.value}>{request.branch}</Text>
          </View>
        </View>

        {/* Equipment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipment Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Brand Name:</Text>
            <Text style={styles.value}>{request.brand_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Workstation Number:</Text>
            <Text style={styles.value}>{request.workstation_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>User Name:</Text>
            <Text style={styles.value}>{request.users_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Serial Number:</Text>
            <Text style={styles.value}>{request.serial_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Scrap Status:</Text>
            <View style={getScrapStatusStyle(request.scrap_status)}>
              <Text>{getScrapStatusLabel(request.scrap_status).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Images Information */}
        {request.images && request.images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attached Images</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Number of Images:</Text>
              <Text style={styles.value}>{request.images.length}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.value}>
                Note: Images can be viewed in the digital version of this request.
              </Text>
            </View>
          </View>
        )}

        {/* Admin Response */}
        {request.admin_response && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Response</Text>
            <View style={styles.responseBox}>
              <Text>{request.admin_response}</Text>
            </View>
            {request.updated_at && (
              <View style={styles.row}>
                <Text style={styles.label}>Responded At:</Text>
                <Text style={styles.value}>
                  {format(new Date(request.updated_at), 'dd MMM yyyy, hh:mm a')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This is a system-generated report. No signature is required.</Text>
          <Text>Pro Ultima - Scrap Request Management System</Text>
        </View>
      </Page>
    </Document>
  );
}
