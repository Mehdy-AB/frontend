'use client';

import { useState } from 'react';
import { Star, Download, Share2, MoreVertical, Copy, Trash2, Move, MessageSquare } from 'lucide-react';
import { DocumentViewDto } from '../../types/documentView';

interface DocumentActionsProps {
  document: DocumentViewDto;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onDownload: () => void;
  onShare: () => void;
  onCopyLink: () => void;
  onShowComments?: () => void;
  onMove?: () => void;
  onDelete?: () => void;
}

export default function DocumentActions({
  document,
  isFavorite,
  onToggleFavorite,
  onDownload,
  onShare,
  onCopyLink,
  onShowComments,
  onMove,
  onDelete
}: DocumentActionsProps) {
  const [showMoreActions, setShowMoreActions] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* Favorite Button */}
      <button
        onClick={onToggleFavorite}
        className={`p-2 rounded-lg transition-colors ${
          isFavorite 
            ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
            : 'text-neutral-text-light hover:text-yellow-600 hover:bg-yellow-50'
        }`}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
      </button>

      {/* Download Button */}
      <button
        onClick={onDownload}
        className="p-2 rounded-lg text-neutral-text-light hover:text-primary hover:bg-primary/10 transition-colors"
        title="Download document"
      >
        <Download className="h-5 w-5" />
      </button>

      {/* Share Button */}
      <button
        onClick={onShare}
        className="p-2 rounded-lg text-neutral-text-light hover:text-primary hover:bg-primary/10 transition-colors"
        title="Share document"
      >
        <Share2 className="h-5 w-5" />
      </button>

      {/* More Actions */}
      <div className="relative">
        <button
          onClick={() => setShowMoreActions(!showMoreActions)}
          className="p-2 rounded-lg text-neutral-text-light hover:text-neutral-text-dark hover:bg-neutral-background transition-colors"
          title="More actions"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
        
        {showMoreActions && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-ui rounded-lg shadow-lg z-10">
            <button
              onClick={() => {
                onCopyLink();
                setShowMoreActions(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-text-light hover:text-neutral-text-dark hover:bg-neutral-background"
            >
              <Copy className="h-4 w-4" />
              Copy Link
            </button>
            {onShowComments && (
              <button
                onClick={() => {
                  onShowComments();
                  setShowMoreActions(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-text-light hover:text-neutral-text-dark hover:bg-neutral-background"
              >
                <MessageSquare className="h-4 w-4" />
                Comments
              </button>
            )}
            {document.userPermissions?.canEdit && (
              <>
                <hr className="border-ui" />
                {onMove && (
                  <button
                    onClick={() => {
                      onMove();
                      setShowMoreActions(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-text-light hover:text-neutral-text-dark hover:bg-neutral-background"
                  >
                    <Move className="h-4 w-4" />
                    Move Document
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      onDelete();
                      setShowMoreActions(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Document
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
