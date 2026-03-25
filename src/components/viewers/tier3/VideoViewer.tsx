'use client';

import React, { useRef, useEffect } from 'react';
import { DocumentResponseDto } from '@/types/api';

interface VideoViewerProps {
  document: DocumentResponseDto;
  content: string; // URL to video
  mimeType: string;
}

/**
 * HTML5 video player for Tier 3 media files (MP4, WebM, etc.)
 */
export default function VideoViewer({ document, content, mimeType }: VideoViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Reset video when content changes
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [content]);

  return (
    <div className="flex justify-center items-start max-w-4xl mx-auto">
      <video
        ref={videoRef}
        controls
        className="w-full rounded-lg shadow-lg"
        preload="metadata"
      >
        <source src={content} type={mimeType} />
        Your browser does not support the video element.
      </video>
    </div>
  );
}
