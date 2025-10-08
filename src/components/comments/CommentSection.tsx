// components/comments/CommentSection.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, 
  User, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Reply,
  Send,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Comment, UserDto } from '../../types/api';
import { commentService, CommentRequest, CommentUpdateRequest } from '../../api/services/commentService';
import { UserService } from '../../api/services/userService';
import { formatDate } from '../../utils/documentUtils';
import { CommentDeleteModal } from '../modals/CommentDeleteModal';
import { useSession } from 'next-auth/react';

interface CommentSectionProps {
  entityType: 'DOCUMENT' | 'FOLDER';
  entityId: number;
  entityName: string;
  canComment?: boolean;
  showHeader?: boolean;
  maxHeight?: string;
}

interface CommentWithReplies extends Comment {
  replies?: CommentWithReplies[];
  showReplies?: boolean;
  isEditing?: boolean;
  isReplying?: boolean;
  userDetails?: UserDto;
}

export default function CommentSection({ 
  entityType, 
  entityId, 
  entityName,
  canComment = true,
  showHeader = true,
}: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isAddingReply, setIsAddingReply] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<{ id: number; text: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userCache, setUserCache] = useState<Map<string, UserDto>>(new Map());

  // Check if current user can edit/delete a comment
  const canEditComment = (comment: Comment): boolean => {
    return session?.user?.id === comment.userId;
  };

  // Fetch user details
  const fetchUserDetails = useCallback(async (userId: string): Promise<UserDto | null> => {
    if (userCache.has(userId)) {
      return userCache.get(userId) || null;
    }

    try {
      const userDetails = await UserService.getUserById(userId);
      if (userDetails) {
        setUserCache(prev => new Map(prev).set(userId, userDetails));
        return userDetails;
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
    return null;
  }, [userCache]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!entityId) {
      console.error('fetchComments: entityId is null or undefined!');
      return;
    }
    
    try {
      setLoading(true);
      const response = await commentService.getCommentsByEntity(entityType, entityId, {
        page: 0,
        size: 50,
        sortBy: 'createdAt',
        sortDir: 'desc'
      });
      
      // Group comments and replies
      const mainComments = response.content.filter(comment => !comment.parentCommentId);
      const replies = response.content.filter(comment => comment.parentCommentId);
      
      const commentsWithReplies = await Promise.all(
        mainComments.map(async (comment) => {
          const userDetails = await fetchUserDetails(comment.userId);
          
          // Check if replies are nested in the comment object or separate
          let commentReplies = comment.replies || [];
          
          // If no nested replies, get replies by parentCommentId
          if (commentReplies.length === 0) {
            commentReplies = replies.filter(reply => reply.parentCommentId === comment.id);
          }
          
          // Fetch user details for replies
          const repliesWithUserDetails = await Promise.all(
            commentReplies.map(async (reply) => {
              const replyUserDetails = await fetchUserDetails(reply.userId);
              return {
                ...reply,
                userDetails: replyUserDetails || undefined,
                showReplies: false,
                isEditing: false,
                isReplying: false
              };
            })
          );

          return {
            ...comment,
            replies: repliesWithUserDetails,
            showReplies: false, // Show replies by default if they exist
            isEditing: false,
            isReplying: false,
            userDetails: userDetails || undefined
          };
        })
      );
      
      setComments(commentsWithReplies);
      setCommentCount(response.totalElements);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  // Fetch comment count
  const fetchCommentCount = useCallback(async () => {
    try {
      const response = await commentService.getCommentCount(entityType, entityId);
      setCommentCount(response.count);
    } catch (error) {
      console.error('Error fetching comment count:', error);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Add new comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !canComment) return;
    
    if (!entityId) {
      console.error('entityId is null or undefined!');
      return;
    }
    
    try {
      setIsAddingComment(true);
      const commentData: CommentRequest = {
        entityType,
        entityId,
        text: newComment.trim()
      };
      
      await commentService.addComment(commentData);
      setNewComment('');
      await fetchComments();
      await fetchCommentCount();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsAddingComment(false);
    }
  };

  // Update comment
  const handleUpdateComment = async (commentId: number) => {
    if (!editingText.trim()) return;
    
    try {
      const updateData: CommentUpdateRequest = {
        text: editingText.trim()
      };
      
      await commentService.updateComment(commentId, updateData);
      setEditingComment(null);
      setEditingText('');
      await fetchComments();
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  // Show delete confirmation modal
  const showDeleteConfirmation = (commentId: number, commentText: string) => {
    // Find the comment to check ownership
    const comment = comments.find(c => c.id === commentId) || 
                   comments.find(c => c.replies?.some(r => r.id === commentId))?.replies?.find(r => r.id === commentId);
    
    if (!comment || !canEditComment(comment)) return;
    
    setCommentToDelete({ id: commentId, text: commentText });
    setShowDeleteModal(true);
  };

  // Delete comment
  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    
    try {
      setIsDeleting(true);
      await commentService.deleteComment(commentToDelete.id);
      await fetchComments();
      await fetchCommentCount();
      setShowDeleteModal(false);
      setCommentToDelete(null);
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setCommentToDelete(null);
  };

  // Add reply
  const handleAddReply = async (parentCommentId: number) => {
    if (!replyText.trim() || !canComment) return;
    
    try {
      setIsAddingReply(true);
      const commentData: CommentRequest = {
        entityType,
        entityId,
        text: replyText.trim(),
        parentCommentId
      };
      
      await commentService.addComment(commentData);
      setReplyText('');
      setReplyingTo(null);
      await fetchComments();
      await fetchCommentCount();
    } catch (error) {
      console.error('Error adding reply:', error);
    } finally {
      setIsAddingReply(false);
    }
  };

  // Toggle replies visibility
  const toggleReplies = (commentId: number) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, showReplies: !comment.showReplies }
        : comment
    ));
  };

  // Start editing
  const startEditing = (comment: Comment) => {
    if (!canEditComment(comment)) return;
    setEditingComment(comment.id);
    setEditingText(comment.text);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingComment(null);
    setEditingText('');
  };

  // Start replying
  const startReplying = (commentId: number) => {
    setReplyingTo(commentId);
    setReplyText('');
  };

  // Cancel replying
  const cancelReplying = () => {
    setReplyingTo(null);
    setReplyText('');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h3 className="font-medium">Comments</h3>
            <div className="h-4 w-8 bg-neutral-ui rounded animate-pulse"></div>
          </div>
        )}
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
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full" style={{  overflowY: 'auto' }}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h3 className="font-medium">Comments</h3>
            <span className="text-sm text-neutral-text-light">({commentCount})</span>
          </div>
        </div>
      )}

      {/* Add Comment Form */}
      {canComment && (
        <div className="bg-neutral-background rounded-lg p-4">
          <div className="space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={`Add a comment about ${entityName}...`}
              className="w-full p-3 border border-ui rounded-lg text-sm text-neutral-text-dark placeholder-neutral-text-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-surface"
              rows={3}
              maxLength={500}
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
                  onClick={handleAddComment}
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
                      <Send className="h-4 w-4" />
                      Add Comment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-neutral-text-light">
            <div className="bg-neutral-background rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 opacity-50" />
            </div>
            <p className="text-sm font-medium mb-1">No comments yet</p>
            <p className="text-xs">Be the first to share your thoughts about {entityName}</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-surface border border-ui rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex gap-3 mb-3">
                <div className="h-10 w-10 bg-primary-light rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <div className="font-medium text-sm text-neutral-text-dark">
                        {comment.userDetails ? 
                          `${comment.userDetails.firstName} ${comment.userDetails.lastName}` : 
                          comment.username
                        }
                      </div>
                      <div className="text-xs text-neutral-text-light">
                        {comment.userDetails?.email && (
                          <span className="text-blue-600">{comment.userDetails.email}</span>
                        )}
                        {comment.userDetails?.email && ' • '}
                        {formatDate(comment.createdAt)}
                        {comment.isEdited && (
                          <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                            edited
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => startReplying(comment.id)}
                        className="p-1 text-neutral-text-light hover:text-neutral-text-dark transition-colors"
                        title="Reply"
                      >
                        <Reply className="h-4 w-4" />
                      </button>
                      {canEditComment(comment) && (
                        <>
                          <button 
                            onClick={() => startEditing(comment)}
                            className="p-1 text-neutral-text-light hover:text-neutral-text-dark transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => showDeleteConfirmation(comment.id, comment.text)}
                            className="p-1 text-error hover:bg-error/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Comment Text */}
              {editingComment === comment.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="w-full p-3 border border-ui rounded-lg text-sm text-neutral-text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-surface"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-neutral-text-light">
                      {editingText.length}/500 characters
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-1 text-sm text-neutral-text-light hover:text-neutral-text-dark transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdateComment(comment.id)}
                        disabled={!editingText.trim()}
                        className="px-3 py-1 bg-primary text-surface rounded text-sm hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-neutral-text-dark whitespace-pre-wrap leading-relaxed">
                  {comment.text}
                </div>
              )}

              {/* Replies Section */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => toggleReplies(comment.id)}
                    className="flex items-center gap-2 text-xs text-primary hover:text-primary-dark transition-colors mb-3"
                  >
                    {comment.showReplies ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                  </button>
                  
                  {comment.showReplies && (
                    <div className="ml-4 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="bg-neutral-background border-l-2 border-primary pl-3 py-3 rounded-r-lg">
                          <div className="flex gap-2 mb-2">
                            <div className="h-6 w-6 bg-primary-light rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="h-3 w-3 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-xs text-neutral-text-dark">
                                {reply.userDetails ? 
                                  `${reply.userDetails.firstName} ${reply.userDetails.lastName}` : 
                                  reply.username
                                }
                              </div>
                              <div className="text-xs text-neutral-text-light">
                                {reply.userDetails?.email && (
                                  <span className="text-blue-600">{reply.userDetails.email}</span>
                                )}
                                {reply.userDetails?.email && ' • '}
                                {formatDate(reply.createdAt)}
                                {reply.isEdited && (
                                  <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                    edited
                                  </span>
                                )}
                              </div>
                            </div>
                            {canEditComment(reply) && (
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => startEditing(reply)}
                                  className="p-1 text-neutral-text-light hover:text-neutral-text-dark transition-colors"
                                  title="Edit"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </button>
                                <button 
                                  onClick={() => showDeleteConfirmation(reply.id, reply.text)}
                                  className="p-1 text-error hover:bg-error/10 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-neutral-text-dark whitespace-pre-wrap leading-relaxed">
                            {reply.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reply Form */}
              {replyingTo === comment.id && (
                <div className="mt-4 ml-4 bg-neutral-background rounded-lg p-3">
                  <div className="space-y-3">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${comment.username}...`}
                      className="w-full p-2 border border-ui rounded text-sm text-neutral-text-dark placeholder-neutral-text-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-surface"
                      rows={2}
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-neutral-text-light">
                        {replyText.length}/500 characters
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={cancelReplying}
                          className="px-2 py-1 text-xs text-neutral-text-light hover:text-neutral-text-dark transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAddReply(comment.id)}
                          disabled={!replyText.trim() || isAddingReply}
                          className="flex items-center gap-1 bg-primary text-surface px-3 py-1 rounded text-xs hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isAddingReply ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-surface"></div>
                              Adding...
                            </>
                          ) : (
                            <>
                              <Send className="h-3 w-3" />
                              Reply
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <CommentDeleteModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={handleDeleteComment}
        isLoading={isDeleting}
        commentText={commentToDelete?.text}
      />
    </div>
  );
}


