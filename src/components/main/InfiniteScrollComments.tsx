/**
 * Example implementation of InfiniteScrollContainer for comments
 * This shows how to use the infinite scroll with the comment system
 */

'use client';

import { useRef } from 'react';
import InfiniteScrollContainer from './InfiniteScrollContainer';
import { Comment } from '../../types/api';
import { commentService } from '../../api/services/commentService';
import { MessageSquare, Edit3, Trash2, Reply } from 'lucide-react';
import { formatDate } from '../../utils/documentUtils';
import UserAvatar from './UserAvatar';
import { useInfiniteScroll } from './useInfiniteScroll';

interface InfiniteScrollCommentsProps {
  entityType: 'DOCUMENT' | 'FOLDER';
  entityId: number;
  entityName: string;
  canComment?: boolean;
  onEdit?: (comment: Comment) => void;
  onDelete?: (comment: Comment) => void;
  onReply?: (comment: Comment) => void;
  canEditComment?: (comment: Comment) => boolean;
}

export function InfiniteScrollComments({
  entityType,
  entityId,
  entityName,
  canComment = true,
  onEdit,
  onDelete,
  onReply,
  canEditComment
}: InfiniteScrollCommentsProps) {
  const scrollUtilsRef = useRef<ReturnType<typeof useInfiniteScroll<Comment>> | null>(null);

  /** Fetch function for comments */
  const fetchComments = async (page: number, size: number) => {
    const response = await commentService.getCommentsByEntity(
      entityType,
      entityId,
      {
        page,
        size,
        sortBy: 'createdAt',
        sortDir: 'desc'
      }
    );
    
    // PageResponse already has the correct structure
    return response;
  };

  /** Render a single comment */
  const renderComment = (comment: Comment, index: number) => {
    const userDetails = comment.user || comment.createdBy;
    const canEdit = canEditComment ? canEditComment(comment) : false;

    return (
      <div className="bg-surface border border-ui rounded-lg p-4 hover:shadow-sm transition-shadow">
        <div className="flex gap-3 mb-3">
          {userDetails && (
            <UserAvatar user={userDetails} size="md" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <div>
                <div className="font-medium text-sm text-neutral-text-dark">
                  {userDetails?.displayName || 
                    `${userDetails?.firstName || ''} ${userDetails?.lastName || ''}`.trim() || 
                    userDetails?.username ||
                    'Unknown User'
                  }
                </div>
                <div className="text-xs text-neutral-text-light">
                  {userDetails?.email && (
                    <span className="text-blue-600">{userDetails.email}</span>
                  )}
                  {userDetails?.email && ' • '}
                  {formatDate(comment.createdAt)}
                  {comment.isEdited && (
                    <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                      edited
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onReply && (
                  <button 
                    onClick={() => onReply(comment)}
                    className="p-1 text-neutral-text-light hover:text-neutral-text-dark transition-colors"
                    title="Reply"
                  >
                    <Reply className="h-4 w-4" />
                  </button>
                )}
                {canEdit && onEdit && (
                  <button 
                    onClick={() => onEdit(comment)}
                    className="p-1 text-neutral-text-light hover:text-neutral-text-dark transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                )}
                {canEdit && onDelete && (
                  <button 
                    onClick={() => onDelete(comment)}
                    className="p-1 text-error hover:bg-error/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comment Text */}
        <div className="text-sm text-neutral-text-dark whitespace-pre-wrap leading-relaxed">
          {comment.text}
        </div>
      </div>
    );
  };

  /** Loading skeleton */
  const loadingSkeleton = (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border border-ui rounded-lg p-4 animate-pulse">
          <div className="flex gap-3 mb-3">
            <div className="h-8 w-8 bg-neutral-ui rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-neutral-ui rounded w-1/3"></div>
              <div className="h-3 bg-neutral-ui rounded w-1/4"></div>
            </div>
          </div>
          <div className="h-4 bg-neutral-ui rounded w-full mb-2"></div>
          <div className="h-4 bg-neutral-ui rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );

  /** Empty state */
  const emptyState = (
    <div className="text-center py-8 text-neutral-text-light">
      <div className="bg-neutral-background rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <MessageSquare className="h-8 w-8 opacity-50" />
      </div>
      <p className="text-sm font-medium mb-1">No comments yet</p>
      <p className="text-xs">Be the first to share your thoughts about {entityName}</p>
    </div>
  );

  return (
    <InfiniteScrollContainer<Comment>
      fetchFunction={fetchComments}
      pageSize={20}
      renderItem={renderComment}
      loadingComponent={loadingSkeleton}
      emptyComponent={emptyState}
      className="h-full"
      itemsClassName="space-y-4"
      threshold={100}
      keyExtractor={(comment) => comment.id.toString()}
      onInfiniteScrollInit={(utils) => {
        scrollUtilsRef.current = utils;
      }}
    />
  );
}

export default InfiniteScrollComments;

