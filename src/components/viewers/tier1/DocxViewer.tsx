'use client';

import React from 'react';

interface DocxViewerProps {
  content: string; // HTML string from mammoth conversion
}

export default function DocxViewer({ content }: DocxViewerProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div
        key={content}
        className="prose max-w-none p-6 rounded-lg border border-ui shadow-sm"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
