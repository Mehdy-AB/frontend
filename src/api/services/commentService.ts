// api/services/commentService.ts
import { notificationApiClient } from '../notificationClient';
import { Comment, PageResponse } from '../../types/api';

export interface CommentRequest {
  entityType: 'DOCUMENT' | 'FOLDER';
  entityId: number;
  text: string;
  parentCommentId?: number;
}

export interface CommentUpdateRequest {
  text: string;
}

export interface CommentParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface CommentCountResponse {
  count: number;
}

class CommentService {
  /**
   * Add a new comment
   */
  async addComment(data: CommentRequest) {
    return notificationApiClient.addComment(data);
  }

  /**
   * Get comments for a specific entity (document or folder)
   */
  async getCommentsByEntity(
    entityType: 'DOCUMENT' | 'FOLDER', 
    entityId: number, 
    params?: CommentParams
  ): Promise<PageResponse<Comment>> {
    return notificationApiClient.getCommentsByEntity(entityType, entityId, params);
  }

  /**
   * Get comments by user ID
   */
  async getCommentsByUser(userId: string, params?: CommentParams): Promise<PageResponse<Comment>> {
    return notificationApiClient.getCommentsByUser(userId, params);
  }

  /**
   * Get current user's comments
   */
  async getMyComments(params?: CommentParams): Promise<PageResponse<Comment>> {
    return notificationApiClient.getMyComments(params);
  }

  /**
   * Get replies to a specific comment
   */
  async getCommentReplies(commentId: number, params?: CommentParams): Promise<PageResponse<Comment>> {
    return notificationApiClient.getCommentReplies(commentId, params);
  }

  /**
   * Get a specific comment by ID
   */
  async getComment(commentId: number): Promise<Comment> {
    return notificationApiClient.getComment(commentId);
  }

  /**
   * Update a comment's text
   */
  async updateComment(commentId: number, data: CommentUpdateRequest) {
    return notificationApiClient.updateComment(commentId, data);
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: number) {
    return notificationApiClient.deleteComment(commentId);
  }

  /**
   * Get comment count for an entity
   */
  async getCommentCount(entityType: 'DOCUMENT' | 'FOLDER', entityId: number): Promise<CommentCountResponse> {
    return notificationApiClient.getCommentCount(entityType, entityId);
  }

  /**
   * Get comment count for a user
   */
  async getUserCommentCount(userId: string): Promise<CommentCountResponse> {
    return notificationApiClient.getUserCommentCount(userId);
  }

  /**
   * Get current user's comment count
   */
  async getMyCommentCount(): Promise<CommentCountResponse> {
    return notificationApiClient.getMyCommentCount();
  }

  /**
   * Get all comments (admin only)
   */
  async getAllComments(params?: CommentParams): Promise<PageResponse<Comment>> {
    return notificationApiClient.getAllComments(params);
  }
}

// Create and export a singleton instance
export const commentService = new CommentService();
export default commentService;