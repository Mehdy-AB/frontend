import React from 'react';
import { UnifiedComments, EntityType } from '@/components/comments/UnifiedComments';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityType;
  entityId: number;
  entityName: string;
  canComment?: boolean;
  isLoading?: boolean;
}

export function CommentsModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName,
  canComment = true,
  isLoading = false
}: CommentsModalProps) {
  if (!isOpen) return null;

  return (
    <UnifiedComments
      entityType={entityType}
      entityId={entityId}
      entityName={entityName}
      displayMode="modal"
      canComment={canComment}
      isLoading={isLoading}
      onClose={onClose}
    />
  );
}
