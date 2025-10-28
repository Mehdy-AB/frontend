'use client';

import React, { useState } from 'react';
import { X, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { GroupDto } from '@/types/api';
import { notificationApiClient } from '@/api/notificationClient';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import Pagination from '@/components/main/Pagination';
import { formatDate } from '@/lib/dateFormatter';

interface AssignUserGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (groupIds: string[]) => Promise<void>;
  userId: string;
  userName: string;
  currentGroups?: string[];
  loading?: boolean;
}

export default function AssignUserGroupsModal({
  isOpen,
  onClose,
  onSubmit,
  userId,
  userName,
  currentGroups = [],
  loading = false
}: AssignUserGroupsModalProps) {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pageSize = 20;

  // Server-side search for available groups
  const {
    displayData: displayGroups,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalPages,
    totalElements,
    tableLoading,
    isLocalFiltering
  } = useServerSideSearch<GroupDto>({
    fetchFunction: async (page, searchTerm) => {
      return await notificationApiClient.getAvailableGroupsForUser(userId, {
        page,
        size: pageSize,
        search: searchTerm
      });
    },
    searchFields: (group) => [group.name],
    debounceMs: 500
  });

  const handleToggleGroup = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSubmit = async () => {
    if (selectedGroups.length === 0) return;

    try {
      setIsSubmitting(true);
      await onSubmit(selectedGroups);
      setSelectedGroups([]);
      onClose();
    } catch (error) {
      console.error('Error assigning groups:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedGroups([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Assign Groups to User</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Assign groups to {userName}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Groups */}
        {currentGroups.length > 0 && (
          <div className="p-4 border-b bg-muted/30">
            <p className="text-sm font-medium mb-2">Current Groups ({currentGroups.length})</p>
            <div className="flex flex-wrap gap-2">
              {currentGroups.map(group => (
                <Badge key={group} variant="outline">
                  {group}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="p-4 border-b">
          <ServerSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search available groups..."
          />
          <p className="text-sm text-muted-foreground mt-2">
            {totalElements} available group{totalElements !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Selected Groups */}
        {selectedGroups.length > 0 && (
          <div className="p-4 border-b bg-muted/30">
            <p className="text-sm font-medium mb-2">
              Selected ({selectedGroups.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedGroups.map(groupId => {
                const group = displayGroups.find(g => g.id === groupId);
                return (
                  <Badge key={groupId} variant="default">
                    {group?.name || groupId}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto p-4">
          {tableLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : displayGroups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No groups match your search' : 'No available groups to assign'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayGroups.map((group) => (
                <div
                  key={group.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedGroups.includes(group.id)
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleToggleGroup(group.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <h3 className="font-medium">{group.name}</h3>
                      </div>
                      {group.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {group.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{group.userCount || 0} members</span>
                        <span>Created {formatDate(group.createdAt)}</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(group.id)}
                      onChange={() => handleToggleGroup(group.id)}
                      className="mt-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 pb-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t bg-muted/30">
          <p className="text-sm text-muted-foreground">
            {selectedGroups.length} group{selectedGroups.length !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedGroups.length === 0 || isSubmitting}
            >
              {isSubmitting ? 'Assigning...' : `Assign ${selectedGroups.length} Group${selectedGroups.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

