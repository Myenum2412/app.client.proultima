import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { AssetRequest } from '@/types/index';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #E5E7EB',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
    padding: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingVertical: 3,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    width: '40%',
  },
  detailValue: {
    fontSize: 12,
    color: '#111827',
    width: '60%',
  },
  badge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },
  systemBadge: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
  },
  commonBadge: {
    backgroundColor: '#6B7280',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  approvedBadge: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  rejectedBadge: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: '1 solid #E5E7EB',
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
});

interface AssetRequestPDFReportProps {
  request: AssetRequest;
}

export function AssetRequestPDFReport({ request }: AssetRequestPDFReportProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return [styles.statusBadge, styles.pendingBadge];
      case 'approved':
        return [styles.statusBadge, styles.approvedBadge];
      case 'rejected':
        return [styles.statusBadge, styles.rejectedBadge];
      default:
        return [styles.statusBadge];
    }
  };

  return (
    <Document>
      <Page style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Asset Request Report</Text>
          <Text style={styles.subtitle}>
            {request.request_type === 'system' ? 'System Asset Request' : 'Common Purchase Request'}
          </Text>
        </View>

        {/* Request Type and Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Request Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Request Type:</Text>
            <Text style={[styles.badge, request.request_type === 'system' ? styles.systemBadge : styles.commonBadge]}>
              {request.request_type === 'system' ? 'System' : 'Common'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={getStatusBadgeStyle(request.status)}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Requested Date:</Text>
            <Text style={styles.detailValue}>{formatDate(request.requested_date)}</Text>
          </View>
          {request.approved_at && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Approved Date:</Text>
              <Text style={styles.detailValue}>{formatDate(request.approved_at)}</Text>
            </View>
          )}
        </View>

        {/* Staff Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Staff Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Staff Name:</Text>
            <Text style={styles.detailValue}>{request.staff_name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Branch:</Text>
            <Text style={styles.detailValue}>{request.branch}</Text>
          </View>
          {request.staff?.email && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{request.staff.email}</Text>
            </View>
          )}
        </View>

        {/* Product Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Product Name:</Text>
            <Text style={styles.detailValue}>{request.product_name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>{request.quantity}</Text>
          </View>
        </View>

        {/* Type-specific Information */}
        {request.request_type === 'system' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Asset Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Condition:</Text>
              <Text style={styles.detailValue}>{request.condition || 'Not specified'}</Text>
            </View>
            {request.additional_notes && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Additional Notes:</Text>
                <Text style={styles.detailValue}>{request.additional_notes}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Common Purchase Details</Text>
            {request.shop_contact && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Shop Contact:</Text>
                <Text style={styles.detailValue}>{request.shop_contact}</Text>
              </View>
            )}
            {request.serial_no && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Serial Number:</Text>
                <Text style={styles.detailValue}>{request.serial_no}</Text>
              </View>
            )}
            {request.brand_name && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Brand Name:</Text>
                <Text style={styles.detailValue}>{request.brand_name}</Text>
              </View>
            )}
            {request.warranty && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Warranty:</Text>
                <Text style={styles.detailValue}>{request.warranty}</Text>
              </View>
            )}
            {request.specification && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Specification:</Text>
                <Text style={styles.detailValue}>{request.specification}</Text>
              </View>
            )}
            {request.price && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Price:</Text>
                <Text style={styles.detailValue}>₹{request.price.toFixed(2)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Images Information */}
        {request.image_urls && request.image_urls.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attached Images</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Number of Images:</Text>
              <Text style={styles.detailValue}>{request.image_urls.length}</Text>
            </View>
          </View>
        )}

        {/* Admin Response */}
        {(request.admin_notes || request.rejection_reason) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Response</Text>
            {request.admin_notes && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Admin Notes:</Text>
                <Text style={styles.detailValue}>{request.admin_notes}</Text>
              </View>
            )}
            {request.rejection_reason && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rejection Reason:</Text>
                <Text style={styles.detailValue}>{request.rejection_reason}</Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.footer}>
          Generated on {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </Page>
    </Document>
  );
}




