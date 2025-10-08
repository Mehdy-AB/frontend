// components/document/ManagePermissionsModal.tsx
'use client';

import { X } from 'lucide-react';
import { DocumentViewDto } from '../../types/documentView';

interface ManagePermissionsModalProps {
  document: DocumentViewDto;
  isOpen: boolean;
  onClose: () => void;
}

export default function ManagePermissionsModal({ document, isOpen, onClose }: ManagePermissionsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-text-dark">Manage Permissions</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-background rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="p-4 border border-ui rounded-lg">
            <h4 className="font-medium text-neutral-text-dark mb-3">Document Access</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-text-light">Public Access</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked={document.isPublic} />
                  <div className="w-11 h-6 bg-neutral-ui peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-ui after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
          <div className="p-4 border border-ui rounded-lg">
            <h4 className="font-medium text-neutral-text-dark mb-3">User Permissions</h4>
            <div className="text-sm text-neutral-text-light">
              <p>Manage who can view, edit, and share this document.</p>
              <button className="mt-2 px-3 py-1 bg-primary text-surface rounded text-xs hover:bg-primary-dark transition-colors">
                Add Users
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
