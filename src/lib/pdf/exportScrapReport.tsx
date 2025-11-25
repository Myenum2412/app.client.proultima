import { pdf } from '@react-pdf/renderer';
import { ScrapRequest } from '@/types/scrap';
import { ScrapReportPDF } from '@/components/pdf/scrap-report-pdf';

export async function exportScrapReportPDF(request: ScrapRequest) {
  try {
    const blob = await pdf(<ScrapReportPDF request={request} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scrap-request-${request.id.slice(0, 8)}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
