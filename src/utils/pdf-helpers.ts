/**
 * PDF Helper Functions
 * Utilities for PDF generation, image handling, and formatting
 */

// Currency formatting for PDFs
export const formatINR = (amount: number): string => {
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: 'decimal'
  });
};

// Date formatting for PDF
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Date formatting for filename
export const formatDateForFilename = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Generate filename for different export types
export const generateFilename = (
  type: 'all' | 'branch' | 'staff',
  identifier: string,
  startDate?: string,
  endDate?: string
): string => {
  const today = new Date();
  const timestamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  // Sanitize identifier (remove spaces, special chars)
  const sanitizedId = identifier.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
  
  switch (type) {
    case 'all':
      return `cashbook-all-transactions-${timestamp}.pdf`;
    case 'branch':
      return `cashbook-${sanitizedId}-${timestamp}.pdf`;
    case 'staff':
      return `cashbook-${sanitizedId}-${timestamp}.pdf`;
    default:
      return `cashbook-export-${timestamp}.pdf`;
  }
};

// Calculate summary for transactions
export const calculateTransactionSummary = (transactions: any[]) => {
  const totalCashIn = transactions.reduce((sum, t) => sum + (t.cash_in || 0), 0);
  const totalCashOut = transactions.reduce((sum, t) => sum + (t.cash_out || 0), 0);
  const transactionCount = transactions.length;
  
  return {
    totalCashIn,
    totalCashOut,
    transactionCount,
    netAmount: totalCashIn - totalCashOut
  };
};

// Get status color for PDF
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'Paid':
      return { backgroundColor: '#dcfce7', color: '#166534' };
    case 'Pending':
      return { backgroundColor: '#fef3c7', color: '#92400e' };
    case 'Cancelled':
      return { backgroundColor: '#fee2e2', color: '#991b1b' };
    default:
      return { backgroundColor: '#f3f4f6', color: '#374151' };
  }
};

// Common PDF styles
export const commonStyles = {
  page: {
    flexDirection: 'column' as const,
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
    position: 'relative' as const,
    minHeight: '100%',
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#1e40af',
    marginBottom: 5,
  },
  companySubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#1e40af',
    textAlign: 'center' as const,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: '#1e40af',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  row: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 6,
    paddingVertical: 3,
  },
  rowLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 'bold' as const,
    width: '40%',
  },
  rowValue: {
    fontSize: 11,
    color: '#1e293b',
    width: '60%',
    textAlign: 'right' as const,
  },
  // Table styles for better alignment
  table: {
    width: '100%',
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row' as const,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
    fontWeight: 'bold' as const,
  },
  tableCell: {
    fontSize: 9,
    color: '#1e293b',
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  tableCellHeader: {
    fontSize: 9,
    fontWeight: 'bold' as const,
    color: '#1e40af',
    paddingHorizontal: 4,
    paddingVertical: 3,
    textAlign: 'center' as const,
  },
  // Compact table column widths
  tableColDate: { width: '12%', textAlign: 'center' as const },
  tableColVoucher: { width: '15%', textAlign: 'center' as const },
  tableColStaff: { width: '18%', textAlign: 'left' as const },
  tableColDescription: { width: '25%', textAlign: 'left' as const },
  tableColCashOut: { width: '12%', textAlign: 'right' as const },
  tableColCashIn: { width: '12%', textAlign: 'right' as const },
  tableColBalance: { width: '12%', textAlign: 'right' as const },
  footer: {
    position: 'absolute' as const,
    bottom: 20,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 5,
  },
  generatedText: {
    fontSize: 9,
    color: '#94a3b8',
    fontStyle: 'italic' as const,
  },
};
