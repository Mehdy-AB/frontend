'use client';

import React, { useState } from 'react';
import { X, Shield, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RoleDto } from '@/types/api';
import { notificationApiClient } from '@/api/notificationClient';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';
import ServerSearchInput from '@/components/main/ServerSearchInput';
import Pagination from '@/components/main/Pagination';
import { formatDate } from '@/lib/dateFormatter';

interface AssignUserRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (roleIds: string[]) => Promise<void>;
  userId: string;
  userName: string;
  currentRoles?: string[];
  loading?: boolean;
}

export default function AssignUserRolesModal({
  isOpen,
  onClose,
  onSubmit,
  userId,
  userName,
  currentRoles = [],
  loading = false
}: AssignUserRolesModalProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pageSize = 20;

  // Server-side search for available roles
  const {
    displayData: displayRoles,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalPages,
    totalElements,
    tableLoading,
    isLocalFiltering
  } = useServerSideSearch<RoleDto>({
    fetchFunction: async (page, searchTerm) => {
      return await notificationApiClient.getAvailableRolesForUser(userId, {
        page,
        size: pageSize,
        search: searchTerm
      });
    },
    searchFields: (role) => [role.name],
    debounceMs: 500
  });

  const handleToggleRole = (roleId: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSubmit = async () => {
    if (selectedRoles.length === 0) return;

    try {
      setIsSubmitting(true);
      await onSubmit(selectedRoles);
      setSelectedRoles([]);
      onClose();
    } catch (error) {
      console.error('Error assigning roles:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedRoles([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Assign Roles to User</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Assign roles to {userName}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Roles */}
        {currentRoles.length > 0 && (
          <div className="p-4 border-b bg-muted/30">
            <p className="text-sm font-medium mb-2">Current Roles ({currentRoles.length})</p>
            <div className="flex flex-wrap gap-2">
              {currentRoles.map(role => (
                <Badge key={role} variant="outline">
                  {role}
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
            placeholder="Search available roles..."
          />
          <p className="text-sm text-muted-foreground mt-2">
            {totalElements} available role{totalElements !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Selected Roles */}
        {selectedRoles.length > 0 && (
          <div className="p-4 border-b bg-muted/30">
            <p className="text-sm font-medium mb-2">
              Selected ({selectedRoles.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedRoles.map(roleId => {
                const role = displayRoles.find(r => r.id === roleId);
                return (
                  <Badge key={roleId} variant="default">
                    {role?.name || roleId}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Roles List */}
        <div className="flex-1 overflow-y-auto p-4">
          {tableLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : displayRoles.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No roles match your search' : 'No available roles to assign'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayRoles.map((role) => (
                <div
                  key={role.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedRoles.includes(role.id)
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleToggleRole(role.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <h3 className="font-medium">{role.name}</h3>
                        {role.isSystem && (
                          <Badge variant="outline" className="text-xs">System</Badge>
                        )}
                      </div>
                      {role.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {role.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{role.permissions?.length || 0} permissions</span>
                        <span>Created {formatDate(role.createdAt)}</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.id)}
                      onChange={() => handleToggleRole(role.id)}
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
            {selectedRoles.length} role{selectedRoles.length !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedRoles.length === 0 || isSubmitting}
            >
              {isSubmitting ? 'Assigning...' : `Assign ${selectedRoles.length} Role${selectedRoles.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

