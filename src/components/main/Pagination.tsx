'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number; // zero-based
  totalPages: number;
  totalElements?: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i);

  const canPrev = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  return (
    <div className="flex items-center justify-between py-4">
      <div className="text-sm text-muted-foreground">
        {typeof totalElements === 'number'
          ? `Page ${currentPage + 1} of ${totalPages} • ${totalElements} items`
          : `Page ${currentPage + 1} of ${totalPages}`}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!canPrev}
          onClick={() => canPrev && onPageChange(currentPage - 1)}
        >
          Prev
        </Button>

        <div className="flex items-center gap-1">
          {pages.map((p) => (
            <Button
              key={p}
              variant={p === currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={!canNext}
          onClick={() => canNext && onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}


