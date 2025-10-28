'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EditRoleData) => Promise<void>;
  role: any;
  loading?: boolean;
}

export interface EditRoleData {
  name: string;
  description?: string;
}

export default function EditRoleModal({ isOpen, onClose, onSubmit, role, loading = false }: EditRoleModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen && role) {
      setName(role.name);
      setDescription(role.description || '');
    }
  }, [isOpen, role]);

  if (!isOpen || !role) return null;

  const isSystemRole = (role as any).isSystem || false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name, description });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Edit Role</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isSystemRole ? `Edit details for "${role.name}" (System Role)` : `Update role details`}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Role Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSystemRole}
              className="mt-1"
            />
            {isSystemRole && (
              <p className="text-xs text-muted-foreground mt-1">
                System roles cannot be renamed
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              disabled={isSystemRole}
              className="mt-1"
            />
            {isSystemRole && (
              <p className="text-xs text-muted-foreground mt-1">
                System role descriptions are fixed
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


