'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { notificationApiClient } from '@/api/notificationClient';

interface RenameFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: number | null;
  currentName: string;
  onSuccess?: () => void;
}

export default function RenameFolderModal({ 
  isOpen, 
  onClose, 
  folderId, 
  currentName, 
  onSuccess 
}: RenameFolderModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // Set name when modal opens
  useEffect(() => {
    if (isOpen && currentName) {
      setName(currentName);
    }
  }, [isOpen, currentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Please enter a folder name');
      return;
    }

    if (!folderId) {
      alert('No folder selected');
      return;
    }

    if (name.trim() === currentName) {
      onClose();
      return;
    }

    try {
      setLoading(true);
      await notificationApiClient.renameFolder(folderId, name.trim());
      
      // Close modal and refresh
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error renaming folder:', error);
      alert('Failed to rename folder: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setName('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Folder</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter new folder name"
              disabled={loading}
              required
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
