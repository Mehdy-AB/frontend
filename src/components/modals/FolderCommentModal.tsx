// components/modals/FolderCommentModal.tsx
'use client';

import { X } from 'lucide-react';
import { FolderResDto } from '../../types/api';
import  CommentSection from '../comments/CommentSection';

interface FolderCommentModalProps {
  folder: FolderResDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function FolderCommentModal({ folder, isOpen, onClose }: FolderCommentModalProps) {
  if (!isOpen || !folder) return null;

  return (
    <div className="fixed inset-0 bg-black opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-ui">
          <div>
            <h3 className="text-lg font-semibold text-neutral-text-dark">
              Comments for {folder.name}
            </h3>
            <p className="text-sm text-neutral-text-light">
              {folder.description || 'No description available'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-background rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 120px)' }}>
          <CommentSection 
            entityType="FOLDER"
            entityId={folder.id}
            entityName={folder.name}
            canComment={folder.userPermissions?.canEdit}
            showHeader={false}
            maxHeight="100%"
          />
        </div>
      </div>
    </div>
  );
}


