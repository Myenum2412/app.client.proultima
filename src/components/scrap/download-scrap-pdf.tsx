'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { ScrapRequest } from '@/types/scrap';
import { exportScrapReportPDF } from '@/lib/pdf/exportScrapReport';

interface DownloadScrapPDFProps {
  request: ScrapRequest;
}

export function DownloadScrapPDF({ request }: DownloadScrapPDFProps) {
  const handleDownload = () => {
    exportScrapReportPDF(request);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDownload}
      title="Download PDF"
    >
      <Download className="h-4 w-4" />
    </Button>
  );
}
