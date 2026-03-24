'use client';

import React from 'react';

interface TextViewerProps {
  content: string;
}

export default function TextViewer({ content }: TextViewerProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <pre className="whitespace-pre-wrap font-mono text-sm bg-neutral-background p-4 rounded-lg border border-ui">
        {content}
      </pre>
    </div>
  );
}
