'use client';

import { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TransactionPDFReceipt } from './transaction-pdf-receipt';
import type { CashTransaction } from '@/types/cashbook';

interface DownloadTransactionPDFProps {
  transaction: CashTransaction;
  calculatedBalance?: number;
}

export function DownloadTransactionPDF({ transaction, calculatedBalance }: DownloadTransactionPDFProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const fileName = `receipt-${transaction.voucher_no}-${formatDate(transaction.transaction_date)}.pdf`;

  const handleDownloadStart = () => {
    setIsGenerating(true);
    toast.info('Generating PDF...');
  };

  const handleDownloadComplete = () => {
    setIsGenerating(false);
    toast.success('PDF downloaded successfully!');
  };

  const handleDownloadError = (error: Error) => {
    setIsGenerating(false);
    console.error('PDF generation error:', error);
    toast.error('Failed to generate PDF. Please try again.');
  };

  return (
    <PDFDownloadLink
      document={<TransactionPDFReceipt transaction={transaction} calculatedBalance={calculatedBalance} />}
      fileName={fileName}
      className="inline-block"
    >
      {({ loading, error }) => {
        if (error) {
          handleDownloadError(error);
          return (
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="h-8 w-8 p-0"
              title="PDF generation failed"
            >
              <Download className="h-4 w-4 text-red-500" />
            </Button>
          );
        }

        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-muted"
            disabled={loading || isGenerating}
            onClick={handleDownloadStart}
            title="Download PDF Receipt"
          >
            {loading || isGenerating ? (
              <Download className="h-4 w-4" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        );
      }}
    </PDFDownloadLink>
  );
}
