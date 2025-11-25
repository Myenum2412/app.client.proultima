'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AssetRequest } from '@/types/index';

interface DownloadAssetPDFProps {
  request: AssetRequest;
}

export function DownloadAssetPDF({ request }: DownloadAssetPDFProps) {
  const handleDownload = () => {
    // TODO: Implement PDF download logic
    console.log('Download asset PDF:', request.id);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDownload}
      className="h-8 w-8 p-0"
    >
      <Download className="h-4 w-4" />
    </Button>
  );
}