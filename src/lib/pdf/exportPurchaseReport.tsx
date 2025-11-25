import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { PurchaseReportPDF } from '@/components/pdf/purchase-report-pdf';
import { formatDateForFilename } from '@/utils/pdf-helpers';
import { toast } from 'sonner';
import type { PurchaseRequisition } from '@/types/maintenance';

export async function exportPurchaseReport(requests: PurchaseRequisition[]) {
  try {
    // console.log('Exporting PDF with data:', requests);
    // console.log('Data count:', requests.length);
    if (requests.length > 0) {
      // console.log('First item:', requests[0]);
    }
    
    const doc = <PurchaseReportPDF requests={requests} />;
    const filename = `purchase-report-${formatDateForFilename(new Date().toISOString())}.pdf`;
    
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Purchase report exported successfully!');
  } catch (error) {
    console.error('PDF generation error:', error);
    toast.error('Failed to generate PDF. Please try again.');
  }
}
