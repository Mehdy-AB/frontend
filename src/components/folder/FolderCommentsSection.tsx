import React from 'react';
import { FolderResDto } from '@/types/api';
import { UnifiedComments } from '@/components/comments/UnifiedComments';

interface FolderCommentsSectionProps {
  showCommentsSection: boolean;
  onToggleCommentsSection: () => void;
  folder: FolderResDto;
  isLoading?: boolean;
}

export function FolderCommentsSection({
  showCommentsSection,
  onToggleCommentsSection,
  folder,
  isLoading = false
}: FolderCommentsSectionProps) {
  return (
    <UnifiedComments
      entityType="FOLDER"
      entityId={folder.id}
      entityName={folder.name}
      displayMode="sidebar"
      canComment={folder.userPermissions?.canEdit}
      isLoading={isLoading}
      isExpanded={showCommentsSection}
      onToggleExpanded={onToggleCommentsSection}
      maxHeight="300px"
    />
  );
}
