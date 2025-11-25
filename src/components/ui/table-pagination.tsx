'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronFirst, ChevronLast } from 'lucide-react';

export interface TablePaginationProps {
  totalItems: number;
  currentPage: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  itemLabel?: string; // Optional label for items (default: "transactions")
}

export function TablePagination({
  totalItems,
  currentPage,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  itemLabel = 'transactions',
}: TablePaginationProps) {
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const startItem = totalItems > 0 ? startIndex + 1 : 0;

  const handleFirstPage = () => {
    if (currentPage > 1) {
      onPageChange(1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleLastPage = () => {
    if (currentPage < totalPages) {
      onPageChange(totalPages);
    }
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t">
      {/* Left: Rows per page selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Rows per page
        </span>
        <Select
          value={rowsPerPage.toString()}
          onValueChange={(value) => {
            onRowsPerPageChange(Number(value));
            onPageChange(1); // Reset to first page when changing rows per page
          }}
        >
          <SelectTrigger className="h-9 w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="30">30</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Center: Current visible range and page info */}
      <div className="flex items-center justify-center text-sm text-muted-foreground">
        <span>
          <span className="text-foreground font-medium">
            {startItem}–{endIndex}
          </span>{' '}
          of <span className="text-foreground font-medium">{totalItems}</span>{' '}
          {itemLabel}
        </span>
        <span className="mx-2">•</span>
        <span>
          Page <span className="text-foreground font-medium">{currentPage}</span> of{' '}
          <span className="text-foreground font-medium">{totalPages}</span>
        </span>
      </div>

      {/* Right: Pagination buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={handleFirstPage}
          disabled={currentPage === 1}
          aria-label="Go to first page"
        >
          <ChevronFirst className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={handleNextPage}
          disabled={currentPage === totalPages || totalPages === 0}
          aria-label="Go to next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={handleLastPage}
          disabled={currentPage === totalPages || totalPages === 0}
          aria-label="Go to last page"
        >
          <ChevronLast className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

