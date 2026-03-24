'use client';

import React from 'react';
import { FileText, Download } from 'lucide-react';

interface UnsupportedViewerProps {
  mimeType: string;
  documentName: string;
  onDownload: () => void;
}

/**
 * Viewer for unsupported file types (archives, CAD, eBooks, PostScript, etc.)
 * Shows a download-only prompt since no in-browser preview is available.
 */
export default function UnsupportedViewer({ mimeType, documentName, onDownload }: UnsupportedViewerProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <FileText className="h-16 w-16 text-neutral-ui mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-text-dark mb-2">
          Preview Not Available
        </h3>
        <p className="text-neutral-text-light mb-2 max-w-md">
          This file type (<code className="text-xs bg-neutral-background px-1.5 py-0.5 rounded">{mimeType}</code>) cannot be previewed in the browser.
        </p>
        <p className="text-neutral-text-light mb-4 text-sm">
          Please download the file to view it with a compatible application.
        </p>
        <button
          onClick={onDownload}
          className="bg-primary text-surface px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Download className="h-4 w-4 inline mr-2" />
          Download to View
        </button>
      </div>
    </div>
  );
}
