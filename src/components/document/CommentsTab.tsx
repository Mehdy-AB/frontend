// components/document/CommentsTab.tsx
'use client';

import { MessageSquare, User, MoreVertical } from 'lucide-react';
import { DocumentViewDto } from '../../types/documentView';
import { Comment } from '../../types/api';
import { formatDate } from '../../utils/documentUtils';

interface CommentsTabProps {
  document: DocumentViewDto;
  comments: Comment[];
  isLoading: boolean;
  newComment: string;
  setNewComment: (comment: string) => void;
  isAddingComment: boolean;
  onAddComment: () => void;
}

export default function CommentsTab({ 
  document, 
  comments, 
  isLoading, 
  newComment, 
  setNewComment, 
  isAddingComment, 
  onAddComment 
}: CommentsTabProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-neutral-ui rounded w-32 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-ui rounded-lg p-4">
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
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Add Comment Form */}
      <div className="bg-neutral-background rounded-lg p-4">
        <h3 className="font-medium text-neutral-text-dark mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Add Comment
        </h3>
        <div className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts about this document..."
            className="w-full p-3 border border-ui rounded-lg text-sm text-neutral-text-dark placeholder-neutral-text-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-surface"
            rows={3}
          />
          <div className="flex justify-between items-center">
            <div className="text-xs text-neutral-text-light">
              {newComment.length}/500 characters
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setNewComment('')}
                disabled={!newComment.trim()}
                className="px-3 py-1 text-sm text-neutral-text-light hover:text-neutral-text-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Clear
              </button>
              <button
                onClick={onAddComment}
                disabled={!newComment.trim() || isAddingComment}
                className="flex items-center gap-2 bg-primary text-surface px-4 py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {isAddingComment ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-surface"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4" />
                    Add Comment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div>
        <h3 className="font-medium text-neutral-text-dark mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments ({comments.length})
        </h3>
        {comments.length === 0 ? (
          <div className="text-center py-12 text-neutral-text-light">
            <div className="bg-neutral-background rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 opacity-50" />
            </div>
            <p className="text-sm font-medium mb-1">No comments yet</p>
            <p className="text-xs">Be the first to share your thoughts about this document</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-surface border border-ui rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex gap-3 mb-3">
                  <div className="h-10 w-10 bg-primary-light rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <div className="font-medium text-sm text-neutral-text-dark">
                          {comment.username}
                        </div>
                        <div className="text-xs text-neutral-text-light">
                          {formatDate(comment.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {comment.updatedAt !== comment.createdAt && (
                          <span className="text-xs text-neutral-text-light bg-neutral-background px-2 py-1 rounded">
                            edited
                          </span>
                        )}
                        <button className="p-1 text-neutral-text-light hover:text-neutral-text-dark transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-neutral-text-dark whitespace-pre-wrap leading-relaxed">
                  {comment.text}
                </div>
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 ml-4 space-y-3">
                    <div className="text-xs text-neutral-text-light font-medium">
                      {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                    </div>
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="bg-neutral-background border-l-2 border-primary pl-3 py-3 rounded-r-lg">
                        <div className="flex gap-2 mb-2">
                          <div className="h-6 w-6 bg-primary-light rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-3 w-3 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-xs text-neutral-text-dark">
                              {reply.username}
                            </div>
                            <div className="text-xs text-neutral-text-light">
                              {formatDate(reply.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-neutral-text-dark whitespace-pre-wrap leading-relaxed">
                          {reply.text}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-ui">
                  <button className="text-xs text-primary hover:text-primary-dark transition-colors">
                    Reply
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
