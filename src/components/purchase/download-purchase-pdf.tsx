"use client"

import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PurchaseRequisitionPDFReport } from './purchase-requisition-pdf-report';
import type { PurchaseRequisition } from '@/types/maintenance';
import { formatDateForFilename } from '@/utils/pdf-helpers';

interface DownloadPurchasePDFProps {
  requisition: PurchaseRequisition;
}

export function DownloadPurchasePDF({ requisition }: DownloadPurchasePDFProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadClick = async () => {
    setIsGenerating(true);
    try {
      const doc = <PurchaseRequisitionPDFReport requisition={requisition} />;
      const filename = `purchase-requisition-${requisition.id}-${formatDateForFilename(requisition.requested_date)}.pdf`;
      
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('Purchase requisition PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-primary"
      disabled={isGenerating}
      onClick={handleDownloadClick}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </Button>
  );
}
