'use client';

import React from 'react';
import { DocumentResponseDto } from '@/types/api';

interface PdfViewerProps {
  document: DocumentResponseDto;
  downloadUrl: string;
  content: string; // URL to PDF
  onLoadComplete?: () => void;
  onError?: (error: string) => void;
}

export default function PdfViewer({ document, downloadUrl, content, onLoadComplete, onError }: PdfViewerProps) {
  return (
    <div className="flex justify-center h-full">
      <iframe
        key={content}
        src={`${content}#view=FitH`}
        className="pdf-viewer-iframe w-full h-full"
        title={`PDF Viewer - ${document.name}`}
        onLoad={() => onLoadComplete?.()}
        onError={() => onError?.('Failed to load PDF. Please try downloading the file.')}
      />
    </div>
  );
}
