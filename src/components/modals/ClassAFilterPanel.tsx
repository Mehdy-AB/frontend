'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, X } from 'lucide-react';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from '@/components/ui/badge';
import { notificationApiClient } from '@/api/notificationClient';
import { FilingCategoryResponseDto } from '@/types/api';
import { SearchSelect } from '@/components/main/SearchSelect';

export interface ClassAFilters {
  query?: string;
  userId?: string;
  categoryId?: number;
  dateFrom?: string;
  dateTo?: string;
  exactDate?: string;
}

interface ClassAFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: ClassAFilters) => void;
  currentFilters: ClassAFilters;
}

export default function ClassAFilterPanel({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
}: ClassAFilterPanelProps) {
  const [filters, setFilters] = React.useState<ClassAFilters>(currentFilters);
  const [selectedCategory, setSelectedCategory] = useState<FilingCategoryResponseDto | null>(null);

  // Load selected category when filters change
  useEffect(() => {
    if (filters.categoryId && isOpen) {
      const loadCategory = async () => {
        try {
          const response = await notificationApiClient.getAllFilingCategories({ size: 100 }, { silent: true });
          const category = response.content?.find(c => c.id === filters.categoryId);
          setSelectedCategory(category || null);
        } catch (error) {
          console.error('Error loading category:', error);
        }
      };
      loadCategory();
    } else {
      setSelectedCategory(null);
    }
  }, [filters.categoryId, isOpen]);

  // Sync internal state when external filters change
  React.useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters, isOpen]);

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    const emptyFilters = {};
    setFilters(emptyFilters);
    setSelectedCategory(null);
    onApplyFilters(emptyFilters);
    onClose();
  };

  const handleCategorySelect = (category: FilingCategoryResponseDto) => {
    setSelectedCategory(category);
    setFilters(prev => ({ ...prev, categoryId: category.id }));
  };

  const handleCategoryRemove = () => {
    setSelectedCategory(null);
    setFilters(prev => ({ ...prev, categoryId: undefined }));
  };

  const handleDateTimeSelect = (field: 'dateFrom' | 'dateTo' | 'exactDate', date: Date | undefined) => {
    setFilters(prev => ({
      ...prev,
      [field]: date ? date.toISOString() : undefined
    }));
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "PPP p"); // Date with time
  };

  const getActiveCount = () => {
    return Object.values(filters).filter(v => v !== undefined && v !== '').length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6 border-b border-gray-100">
          <DialogTitle className="text-xl font-semibold">Filter Documents</DialogTitle>
          <DialogDescription>
            Refine your search with specific criteria.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* General Search */}
          <div className="space-y-2">
            <Label htmlFor="query">General Search</Label>
            <Input
              id="query"
              placeholder="Search by document name (starts with)..."
              value={filters.query || ''}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">Searches document names that start with the entered text</p>
          </div>

          {/* Document Model */}
          <div className="space-y-2">
            <Label htmlFor="categoryId">Document Model</Label>
            {selectedCategory ? (
              <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{selectedCategory.name}</div>
                  {selectedCategory.description && (
                    <div className="text-xs text-gray-500 mt-1">{selectedCategory.description}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCategoryRemove}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <SearchSelect
                openUpward={false}
                items={[]}
                fetchFunction={async (query: string) => {
                  const response = await notificationApiClient.getAllFilingCategories(
                    { size: 100, search: query },
                    { silent: true }
                  );
                  return response.content || [];
                }}
                onSelect={handleCategorySelect}
                placeholder="Search document models..."
                displayField="name"
                descriptionField="description"
                debounceMs={300}
              />
            )}
          </div>

          {/* Date Time Range Section */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Date & Time Range</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !filters.dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? formatDateTime(filters.dateFrom) : <span>Pick date & time</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3 space-y-3">
                      <Calendar
                        mode="single"
                        selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const current = filters.dateFrom ? new Date(filters.dateFrom) : new Date();
                            const newDate = new Date(date);
                            // If no existing date, set to start of day; otherwise preserve time
                            if (!filters.dateFrom) {
                              newDate.setHours(0, 0, 0, 0);
                            } else {
                              newDate.setHours(current.getHours(), current.getMinutes(), current.getSeconds());
                            }
                            handleDateTimeSelect('dateFrom', newDate);
                          } else {
                            handleDateTimeSelect('dateFrom', undefined);
                          }
                        }}
                        initialFocus
                      />
                      <div className="space-y-2">
                        <Label className="text-xs">Time</Label>
                        <Input
                          type="time"
                          value={filters.dateFrom ? new Date(filters.dateFrom).toTimeString().slice(0, 5) : '00:00'}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(':');
                            if (filters.dateFrom) {
                              const date = new Date(filters.dateFrom);
                              date.setHours(parseInt(hours), parseInt(minutes));
                              handleDateTimeSelect('dateFrom', date);
                            } else {
                              // If no date selected, create a new date with today's date and selected time
                              const date = new Date();
                              date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                              handleDateTimeSelect('dateFrom', date);
                            }
                          }}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !filters.dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo ? formatDateTime(filters.dateTo) : <span>Pick date & time</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3 space-y-3">
                      <Calendar
                        mode="single"
                        selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const current = filters.dateTo ? new Date(filters.dateTo) : new Date();
                            const newDate = new Date(date);
                            // If no existing date, set to end of day; otherwise preserve time
                            if (!filters.dateTo) {
                              newDate.setHours(23, 59, 59, 999);
                            } else {
                              newDate.setHours(current.getHours(), current.getMinutes(), current.getSeconds());
                            }
                            handleDateTimeSelect('dateTo', newDate);
                          } else {
                            handleDateTimeSelect('dateTo', undefined);
                          }
                        }}
                        initialFocus
                      />
                      <div className="space-y-2">
                        <Label className="text-xs">Time</Label>
                        <Input
                          type="time"
                          value={filters.dateTo ? new Date(filters.dateTo).toTimeString().slice(0, 5) : '23:59'}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(':');
                            if (filters.dateTo) {
                              const date = new Date(filters.dateTo);
                              date.setHours(parseInt(hours), parseInt(minutes));
                              handleDateTimeSelect('dateTo', date);
                            } else {
                              // If no date selected, create a new date with today's date and selected time
                              const date = new Date();
                              date.setHours(parseInt(hours), parseInt(minutes), 59, 999);
                              handleDateTimeSelect('dateTo', date);
                            }
                          }}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Exact Date & Time */}
          <div className="space-y-2">
            <Label>Exact Date & Time</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal h-10",
                    !filters.exactDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.exactDate ? formatDateTime(filters.exactDate) : <span>Pick specific date & time</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 space-y-3">
                  <Calendar
                    mode="single"
                    selected={filters.exactDate ? new Date(filters.exactDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const current = filters.exactDate ? new Date(filters.exactDate) : new Date();
                        const newDate = new Date(date);
                        // If no existing date, set to current time; otherwise preserve time
                        if (!filters.exactDate) {
                          newDate.setHours(current.getHours(), current.getMinutes(), current.getSeconds());
                        } else {
                          newDate.setHours(current.getHours(), current.getMinutes(), current.getSeconds());
                        }
                        handleDateTimeSelect('exactDate', newDate);
                      } else {
                        handleDateTimeSelect('exactDate', undefined);
                      }
                    }}
                    initialFocus
                  />
                  <div className="space-y-2">
                    <Label className="text-xs">Time</Label>
                    <Input
                      type="time"
                      value={filters.exactDate ? new Date(filters.exactDate).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5)}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        if (filters.exactDate) {
                          const date = new Date(filters.exactDate);
                          date.setHours(parseInt(hours), parseInt(minutes));
                          handleDateTimeSelect('exactDate', date);
                        } else {
                          // If no date selected, create a new date with today's date and selected time
                          const date = new Date();
                          date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                          handleDateTimeSelect('exactDate', date);
                        }
                      }}
                      className="h-8"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter className="pt-6 border-t border-gray-100 flex-col sm:flex-row gap-3 sm:gap-0">
          <Button variant="outline" onClick={handleClear} className="w-full sm:w-auto">
            Clear Filters
          </Button>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleApply} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              Apply Filters
              {getActiveCount() > 0 && (
                <Badge variant="secondary" className="ml-2 bg-blue-500 text-white hover:bg-blue-500">
                  {getActiveCount()}
                </Badge>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
