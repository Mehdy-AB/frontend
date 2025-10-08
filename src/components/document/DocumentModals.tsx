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
  onMoveSuccess
}: DocumentModalsProps) {
  if (!document) return null;

  return (
    <>
      {/* Version History Modal */}
      <VersionHistoryModal
        document={document}
        isOpen={showVersionHistory}
        onClose={onCloseVersionHistory}
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
      />
    </>
  );
}
