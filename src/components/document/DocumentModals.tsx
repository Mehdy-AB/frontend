'use client';

import { DocumentViewDto } from '../../types/documentView';
import {
  VersionHistoryModal
} from './index';
import UploadVersionModal from '../modals/UploadVersionModal';
import EditDocumentModal from '../modals/EditDocumentModal';
import FolderActionModal from '../modals/FolderActionModal';

interface DocumentModalsProps {
  document: DocumentViewDto | null;
  showVersionHistory: boolean;
  showManagePermissions: boolean;
  showUploadVersion: boolean;
  showMoveDocument: boolean;
  onCloseVersionHistory: () => void;
  onCloseManagePermissions: () => void;
  onCloseUploadVersion: () => void;
  onCloseMoveDocument: () => void;
  onVersionUploadSuccess?: () => void;
  onMoveSuccess?: () => void;
  onOptimisticFileUpdate?: (file: File) => void;
  onRestoreVersion?: (versionId: number, versionNumber: number) => Promise<void>;
}

export default function DocumentModals({
  document,
  showVersionHistory,
  showManagePermissions,
  showUploadVersion,
  showMoveDocument,
  onCloseVersionHistory,
  onCloseManagePermissions,
  onCloseUploadVersion,
  onCloseMoveDocument,
  onVersionUploadSuccess,
  onMoveSuccess,
  onOptimisticFileUpdate,
  onRestoreVersion
}: DocumentModalsProps) {
  if (!document) return null;

  return (
    <>
      {/* Version History Modal */}
      <VersionHistoryModal
        document={document}
        isOpen={showVersionHistory}
        onClose={onCloseVersionHistory}
        onRestoreVersion={onRestoreVersion}
      />

      {/* Edit Document Modal (for sharing/permissions) */}
      <EditDocumentModal
        isOpen={showManagePermissions}
        onClose={onCloseManagePermissions}
        document={document}
        onSuccess={() => {
          onCloseManagePermissions();
          // Optionally refresh document data
        }}
      />

      {/* Move Document Modal */}
      <FolderActionModal
        isOpen={showMoveDocument}
        onClose={onCloseMoveDocument}
        folder={null}
        document={document}
        action="move"
        onSuccess={(updatedItem) => {
          onCloseMoveDocument();
          if (onMoveSuccess) {
            onMoveSuccess();
          }
        }}
      />

      {/* Upload New Version Modal */}
      <UploadVersionModal
        isOpen={showUploadVersion}
        onClose={onCloseUploadVersion}
        documentId={document.documentId}
        onSuccess={onVersionUploadSuccess}
        onOptimisticUpdate={onOptimisticFileUpdate}
      />
    </>
  );
}
