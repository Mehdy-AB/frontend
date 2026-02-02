'use client';

import { useState, useEffect, useRef } from 'react';
import { Star, Download, Share2, MoreVertical, Copy, Trash2, Move, MessageSquare, Edit3, Upload } from 'lucide-react';
import { DocumentViewDto } from '../../types/documentView';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  onRename?: () => void;
  onUploadVersion?: () => void;
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
  onDelete,
  onRename,
  onUploadVersion
}: DocumentActionsProps) {
  const [showMoreActions, setShowMoreActions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || !showMoreActions) {
      return;
    }

    // Use window.document to avoid shadowing by the 'document' prop
    const doc = window.document;
    if (!doc) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setShowMoreActions(false);
      }
    };

    // Use a try-catch to handle any potential issues
    try {
      doc.addEventListener('mousedown', handleClickOutside);
    } catch (error) {
      console.warn('Failed to add event listener:', error);
    }

    return () => {
      try {
        doc.removeEventListener('mousedown', handleClickOutside);
      } catch (error) {
        console.warn('Failed to remove event listener:', error);
      }
    };
  }, [showMoreActions]);

  return (
    <div className="flex items-center gap-2">
      {/* Favorite Button */}
      <button
        onClick={onToggleFavorite}
        className={`p-2 rounded-lg transition-colors ${isFavorite
            ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
            : 'text-neutral-text-light hover:text-yellow-600 hover:bg-yellow-50'
          }`}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
      </button>

      {/* Download Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onDownload}
            disabled={!document.userPermissions?.canView}
            className={`p-2 rounded-lg transition-colors ${document.userPermissions?.canView
                ? 'text-neutral-text-light hover:text-primary hover:bg-primary/10'
                : 'text-gray-300 cursor-not-allowed'
              }`}
            title={document.userPermissions?.canView ? "Download document" : "You don't have permission to download this document"}
          >
            <Download className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        {!document.userPermissions?.canView && (
          <TooltipContent>
            <p>You don't have permission to download this document</p>
          </TooltipContent>
        )}
      </Tooltip>

      {/* Share Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onShare}
            disabled={!document.userPermissions?.canManagePermissions}
            className={`p-2 rounded-lg transition-colors ${document.userPermissions?.canManagePermissions
                ? 'text-neutral-text-light hover:text-primary hover:bg-primary/10'
                : 'text-gray-300 cursor-not-allowed'
              }`}
            title={document.userPermissions?.canManagePermissions ? "Share document" : "You don't have permission to manage permissions"}
          >
            <Share2 className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        {!document.userPermissions?.canManagePermissions && (
          <TooltipContent>
            <p>You don't have permission to manage permissions for this document</p>
          </TooltipContent>
        )}
      </Tooltip>

      {/* More Actions */}
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setShowMoreActions(!showMoreActions)}
          className="p-2 rounded-lg text-neutral-text-light hover:text-neutral-text-dark hover:bg-neutral-background transition-colors"
          title="More actions"
        >
          <MoreVertical className="h-5 w-5" />
        </button>

        {showMoreActions && (
          <div
            ref={menuRef}
            className="absolute right-0 top-full mt-1 w-48 bg-surface border border-ui rounded-lg shadow-lg z-10"
          >
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
            <>
              <hr className="border-ui" />
              {onRename && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        if (document.userPermissions?.canEdit) {
                          onRename();
                          setShowMoreActions(false);
                        }
                      }}
                      disabled={!document.userPermissions?.canEdit}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${document.userPermissions?.canEdit
                          ? 'text-neutral-text-light hover:text-neutral-text-dark hover:bg-neutral-background'
                          : 'text-gray-400 cursor-not-allowed'
                        }`}
                    >
                      <Edit3 className="h-4 w-4" />
                      Rename Document
                    </button>
                  </TooltipTrigger>
                  {!document.userPermissions?.canEdit && (
                    <TooltipContent>
                      <p>You don't have permission to edit this document</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              )}
              {onUploadVersion && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        if (document.userPermissions?.canEdit) {
                          onUploadVersion();
                          setShowMoreActions(false);
                        }
                      }}
                      disabled={!document.userPermissions?.canEdit}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${document.userPermissions?.canEdit
                          ? 'text-neutral-text-light hover:text-neutral-text-dark hover:bg-neutral-background'
                          : 'text-gray-400 cursor-not-allowed'
                        }`}
                    >
                      <Upload className="h-4 w-4" />
                      Upload New Version
                    </button>
                  </TooltipTrigger>
                  {!document.userPermissions?.canEdit && (
                    <TooltipContent>
                      <p>You don't have permission to edit this document</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              )}

              {onMove && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        if (document.userPermissions?.canEdit) {
                          onMove();
                          setShowMoreActions(false);
                        }
                      }}
                      disabled={!document.userPermissions?.canEdit}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${document.userPermissions?.canEdit
                          ? 'text-neutral-text-light hover:text-neutral-text-dark hover:bg-neutral-background'
                          : 'text-gray-400 cursor-not-allowed'
                        }`}
                    >
                      <Move className="h-4 w-4" />
                      Move Document
                    </button>
                  </TooltipTrigger>
                  {!document.userPermissions?.canEdit && (
                    <TooltipContent>
                      <p>You don't have permission to edit this document</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        if (document.userPermissions?.canDelete) {
                          onDelete();
                          setShowMoreActions(false);
                        }
                      }}
                      disabled={!document.userPermissions?.canDelete}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${document.userPermissions?.canDelete
                          ? 'text-error hover:bg-error/10'
                          : 'text-gray-400 cursor-not-allowed'
                        }`}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Document
                    </button>
                  </TooltipTrigger>
                  {!document.userPermissions?.canDelete && (
                    <TooltipContent>
                      <p>You don't have permission to delete this document</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              )}
            </>
          </div>
        )}
      </div>
    </div>
  );
}
