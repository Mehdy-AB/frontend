'use client';

import React, { useRef, useEffect } from 'react';
import { Music } from 'lucide-react';
import { DocumentResponseDto } from '@/types/api';

interface AudioViewerProps {
  document: DocumentResponseDto;
  content: string; // URL to audio
  mimeType: string;
}

/**
 * HTML5 audio player for Tier 3 audio files (MP3, WAV, FLAC, etc.)
 */
export default function AudioViewer({ document, content, mimeType }: AudioViewerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [content]);

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Music className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-lg font-medium text-neutral-text-dark">{document.name}</h3>
        <p className="text-sm text-neutral-text-light mt-1">{mimeType}</p>
      </div>
      <audio
        ref={audioRef}
        controls
        className="w-full"
        preload="metadata"
      >
        <source src={content} type={mimeType} />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
