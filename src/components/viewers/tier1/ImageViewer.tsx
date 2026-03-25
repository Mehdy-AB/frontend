'use client';

import React from 'react';
import { DocumentResponseDto } from '@/types/api';

interface ImageViewerProps {
  document: DocumentResponseDto;
  content: string; // Object URL or image URL
}

export default function ImageViewer({ document, content }: ImageViewerProps) {
  return (
    <div className="flex justify-center items-start">
      <img
        src={content}
        alt={document.name}
        className="max-w-full h-auto rounded-lg shadow-lg"
      />
    </div>
  );
}
