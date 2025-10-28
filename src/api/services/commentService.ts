import { apiClient } from '../client';
import {
  Comment,
  CommentCreateReq,
  CommentUpdateReq,
  PageResponse,
  CommentCountResponse,
} from '../../types/api';

export class CommentService {
  private baseUrl = '/api/v1/comments';

  // Get comments for entity with pagination
  async getComments(
    entityType: string,
    entityId: number,
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Promise<PageResponse<Comment>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDirection,
    });

    return apiClient.get<PageResponse<Comment>>(`${this.baseUrl}/${entityType}/${entityId}?${params}`);
  }

  // Get comment by ID
  async getCommentById(commentId: number): Promise<Comment> {
    return apiClient.get<Comment>(`${this.baseUrl}/${commentId}`);
  }

  // Create new comment
  async createComment(commentData: CommentCreateReq): Promise<Comment> {
    return apiClient.post<Comment>(this.baseUrl, commentData);
  }

  // Update comment
  async updateComment(commentId: number, commentData: CommentUpdateReq): Promise<Comment> {
    return apiClient.put<Comment>(`${this.baseUrl}/${commentId}`, commentData);
  }

  // Delete comment
  async deleteComment(commentId: number): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/${commentId}`);
  }

  // Get comment replies
  async getCommentReplies(
    commentId: number,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<Comment>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<Comment>>(`${this.baseUrl}/${commentId}/replies?${params}`);
  }

  // Get comment count for entity
  async getCommentCount(entityType: string, entityId: number): Promise<CommentCountResponse> {
    return apiClient.get<CommentCountResponse>(`${this.baseUrl}/${entityType}/${entityId}/count`);
  }

  // Get comments by user
  async getCommentsByUser(
    userId: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<Comment>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<Comment>>(`${this.baseUrl}/user/${userId}?${params}`);
  }

  // Search comments
  async searchComments(
    query: string,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<Comment>> {
    const params = new URLSearchParams({
      query,
      page: page.toString(),
      size: size.toString(),
    });

    return apiClient.get<PageResponse<Comment>>(`${this.baseUrl}/search?${params}`);
  }

  // Get comment statistics
  async getCommentStatistics(): Promise<{
    totalComments: number;
    commentsByEntity: Record<string, number>;
    commentsByUser: Record<string, number>;
    averageCommentsPerEntity: number;
  }> {
    return apiClient.get(`${this.baseUrl}/statistics`);
  }

  // Get recent comments
  async getRecentComments(limit: number = 10): Promise<Comment[]> {
    return apiClient.get<Comment[]>(`${this.baseUrl}/recent`, {
      params: { limit },
    });
  }

  // Bulk operations
  async bulkDeleteComments(commentIds: number[]): Promise<void> {
    return apiClient.delete<void>(`${this.baseUrl}/bulk`, {
      data: { commentIds },
    });
  }

  // Get comment thread (comment with all replies)
  async getCommentThread(commentId: number): Promise<Comment> {
    return apiClient.get<Comment>(`${this.baseUrl}/${commentId}/thread`);
  }

  // Pin/unpin comment
  async toggleCommentPin(commentId: number, pinned: boolean): Promise<Comment> {
    return apiClient.patch<Comment>(`${this.baseUrl}/${commentId}/pin`, { pinned });
  }

  // Get pinned comments for entity
  async getPinnedComments(entityType: string, entityId: number): Promise<Comment[]> {
    return apiClient.get<Comment[]>(`${this.baseUrl}/${entityType}/${entityId}/pinned`);
  }
}

export const commentService = new CommentService();