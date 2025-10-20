'use client';

import React, { memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchPaginationProps {
  totalPages: number;
  currentPage: number;
  totalElements: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const SearchPagination = memo<SearchPaginationProps>(({
  totalPages,
  currentPage,
  totalElements,
  itemsPerPage,
  onPageChange
}) => {
  if (totalPages <= 1) return null;

  const startItem = currentPage * itemsPerPage + 1;
  const endItem = Math.min((currentPage + 1) * itemsPerPage, totalElements);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {startItem}-{endItem} of {totalElements} results
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          {[...Array(Math.min(totalPages, 5))].map((_, i) => {
            const pageNumber = currentPage > 2 ? currentPage - 2 + i : i;
            if (pageNumber >= totalPages) return null;
            return (
              <Button
                key={pageNumber}
                variant={currentPage === pageNumber ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNumber)}
                className="w-9"
              >
                {pageNumber + 1}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
});

SearchPagination.displayName = 'SearchPagination';

export default SearchPagination;
