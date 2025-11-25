'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, User as UserIcon, Users, Shield, Search } from 'lucide-react';
import { UserDto, RoleDto, GroupDto, StepAssignmentResponse } from '@/types/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notificationApiClient } from '@/api/notificationClient';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ReassignStepDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReassign: (assignments: any[], reason: string) => Promise<void>;
  stepName?: string;
  currentAssignments?: StepAssignmentResponse[];
}

type GranteeType = 'USER' | 'GROUP' | 'ROLE';

interface AssignmentItem {
  id: string;
  type: GranteeType;
  entity: UserDto | GroupDto | RoleDto;
  canEdit: boolean;
}

const EMPTY_ASSIGNMENTS: StepAssignmentResponse[] = [];

export function ReassignStepDialog({
  isOpen,
  onClose,
  onReassign,
  stepName,
  currentAssignments = EMPTY_ASSIGNMENTS,
}: ReassignStepDialogProps) {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search state
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<GranteeType | null>(null);
  const [searchResults, setSearchResults] = useState<(UserDto | GroupDto | RoleDto)[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize assignments from props
  useEffect(() => {
    if (isOpen && currentAssignments) {
      const initialAssignments: AssignmentItem[] = [];
      currentAssignments.forEach(a => {
        if (a.user) {
          initialAssignments.push({ id: `USER-${a.user.id}`, type: 'USER', entity: a.user, canEdit: a.canEdit });
        } else if (a.group) {
          initialAssignments.push({ id: `GROUP-${a.group.id}`, type: 'GROUP', entity: a.group, canEdit: a.canEdit });
        } else if (a.role) {
          initialAssignments.push({ id: `ROLE-${a.role.id}`, type: 'ROLE', entity: a.role, canEdit: a.canEdit });
        }
      });
      setAssignments(initialAssignments);
    } else if (!isOpen) {
      setAssignments([]);
      setReason('');
    }
  }, [isOpen, currentAssignments]);

  // Search logic
  useEffect(() => {
    if (!selectedType) return;

    const performSearch = async () => {
      setIsSearching(true);
      try {
        let results: any[] = [];
        const term = searchQuery.trim() || undefined;

        if (selectedType === 'USER') {
          const res = await notificationApiClient.getAllUsers({ page: 0, size: 20, search: term }, { silent: true });
          results = res.content;
        } else if (selectedType === 'GROUP') {
          const res = await notificationApiClient.getAllGroups({ page: 0, size: 20, name: term }, { silent: true });
          results = res.content;
        } else if (selectedType === 'ROLE') {
          const res = await notificationApiClient.getAllRoles({ page: 0, size: 20, name: term }, { silent: true });
          results = res.content;
        }

        // Filter out already assigned
        const assignedIds = new Set(assignments.filter(a => a.type === selectedType).map(a => a.entity.id));
        setSearchResults(results.filter(r => !assignedIds.has(r.id)));
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedType, assignments]);

  const handleStartAdd = (type: GranteeType) => {
    setSelectedType(type);
    setSearchQuery('');
    setShowSearchDropdown(true);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handleAddAssignment = (entity: UserDto | GroupDto | RoleDto) => {
    if (!selectedType) return;

    const newItem: AssignmentItem = {
      id: `${selectedType}-${entity.id}`,
      type: selectedType,
      entity,
      canEdit: true
    };

    setAssignments([...assignments, newItem]);
    setShowSearchDropdown(false);
    setSelectedType(null);
  };

  const handleRemoveAssignment = (id: string) => {
    setAssignments(assignments.filter(a => a.id !== id));
  };

  const handleSubmit = async () => {
    if (assignments.length === 0) return;

    setIsSubmitting(true);
    try {
      // Format for API: needs to match what the backend expects for reassign
      // The backend likely expects a list of objects with assigneeType and assigneeId
      const formattedAssignments = assignments.map(a => {
        const base = {
          assigneeType: a.type,
          canEdit: a.canEdit
        };

        if (a.type === 'USER') {
          return { ...base, userId: a.entity.id };
        } else if (a.type === 'ROLE') {
          return { ...base, roleId: a.entity.id };
        } else {
          return { ...base, groupId: a.entity.id };
        }
      });

      await onReassign(formattedAssignments, reason);
      onClose();
    } catch (error) {
      console.error('Failed to reassign step:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to render entity name/avatar
  const renderEntity = (item: AssignmentItem) => {
    if (item.type === 'USER') {
      const user = item.entity as UserDto;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user.imgUrl} />
            <AvatarFallback className="text-[10px]">{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
          </Avatar>
          <span>{user.displayName || user.username}</span>
        </div>
      );
    } else if (item.type === 'GROUP') {
      const group = item.entity as GroupDto;
      return (
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center">
            <Users className="h-3 w-3 text-purple-600" />
          </div>
          <span>{group.name}</span>
        </div>
      );
    } else {
      const role = item.entity as RoleDto;
      return (
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
            <Shield className="h-3 w-3 text-blue-600" />
          </div>
          <span>{role.name}</span>
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Reassign Step</DialogTitle>
          <DialogDescription>
            Modify assignments for <span className="font-semibold">{stepName}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Add Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleStartAdd('USER')} className="gap-2">
              <UserIcon className="h-4 w-4" /> Add User
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleStartAdd('GROUP')} className="gap-2">
              <Users className="h-4 w-4" /> Add Group
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleStartAdd('ROLE')} className="gap-2">
              <Shield className="h-4 w-4" /> Add Role
            </Button>
          </div>

          {/* Search Dropdown Area */}
          {showSearchDropdown && (
            <div className="border rounded-md p-4 bg-muted/30 space-y-3 animate-in fade-in-50 zoom-in-95">
              <div className="flex items-center justify-between">
                <Label>Select {selectedType === 'USER' ? 'User' : selectedType === 'GROUP' ? 'Group' : 'Role'}</Label>
                <Button variant="ghost" size="sm" onClick={() => setShowSearchDropdown(false)} className="h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="h-[200px] border rounded-md bg-background overflow-y-auto">
                <div className="p-2 space-y-1">
                  {isSearching ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No results found</div>
                  ) : (
                    searchResults.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => handleAddAssignment(item)}
                        className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-md text-sm text-left transition-colors"
                      >
                        {selectedType === 'USER' ? (
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={item.imgUrl} />
                            <AvatarFallback>{item.firstName?.[0]}</AvatarFallback>
                          </Avatar>
                        ) : selectedType === 'GROUP' ? (
                          <Users className="h-4 w-4 text-purple-500" />
                        ) : (
                          <Shield className="h-4 w-4 text-blue-500" />
                        )}
                        <span>{item.displayName || item.username || item.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Current Assignments List */}
          <div className="space-y-3">
            <Label>Current Assignments ({assignments.length})</Label>
            {assignments.length === 0 ? (
              <div className="text-sm text-muted-foreground italic p-4 border border-dashed rounded-md text-center">
                No assignments yet. Add users, groups, or roles above.
              </div>
            ) : (
              <div className="space-y-2">
                {assignments.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-card border rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-16 justify-center text-[10px]">
                        {item.type}
                      </Badge>
                      {renderEntity(item)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveAssignment(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label>Reason (Optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you modifying these assignments?"
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={assignments.length === 0 || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Assignments'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

