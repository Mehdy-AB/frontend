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

  // Get comments for entity with pagination (legacy method)
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
      sortDir: sortDirection,
    });

    return apiClient.get<PageResponse<Comment>>(`${this.baseUrl}/entity/${entityType}/${entityId}?${params}`);
  }

  // Get comments for entity with pagination (with options object)
  async getCommentsByEntity(
    entityType: string,
    entityId: number,
    options?: {
      page?: number;
      size?: number;
      sortBy?: string;
      sortDir?: 'asc' | 'desc';
    }
  ): Promise<PageResponse<Comment>> {
    const params = new URLSearchParams({
      page: (options?.page ?? 0).toString(),
      size: (options?.size ?? 20).toString(),
      sortBy: options?.sortBy ?? 'createdAt',
      sortDir: options?.sortDir ?? 'desc',
    });

    return apiClient.get<PageResponse<Comment>>(`${this.baseUrl}/entity/${entityType}/${entityId}?${params}`);
  }

  // Get comment by ID
  async getCommentById(commentId: number): Promise<Comment> {
    return apiClient.get<Comment>(`${this.baseUrl}/${commentId}`);
  }

  // Add new comment (backend expects form parameters)
  async addComment(commentData: {
    entityType: string;
    entityId: number;
    text: string;
    parentId?: number;  // Changed from parentCommentId to match CommentCreateReq
    parentCommentId?: number;  // Keep for backward compatibility
  }): Promise<Comment> {
    const params = new URLSearchParams({
      entityType: commentData.entityType,
      entityId: commentData.entityId.toString(),
      text: commentData.text,
    });
    
    // Check both parentId and parentCommentId for compatibility
    const parentId = commentData.parentId || commentData.parentCommentId;
    if (parentId) {
      params.append('parentCommentId', parentId.toString());
    }

    return apiClient.post<Comment>(`${this.baseUrl}?${params.toString()}`, null);
  }

  // Create new comment (legacy method with body)
  async createComment(commentData: CommentCreateReq): Promise<Comment> {
    return apiClient.post<Comment>(this.baseUrl, commentData);
  }

  // Update comment (backend expects form parameter)
  async updateComment(commentId: number, textOrData: string | CommentUpdateReq): Promise<Comment> {
    const text = typeof textOrData === 'string' ? textOrData : textOrData.text;
    const params = new URLSearchParams({
      text: text,
    });
    return apiClient.put<Comment>(`${this.baseUrl}/${commentId}?${params.toString()}`, null);
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
    return apiClient.get<CommentCountResponse>(`${this.baseUrl}/entity/${entityType}/${entityId}/count`);
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
    return apiClient.get<Comment[]>(`${this.baseUrl}/entity/${entityType}/${entityId}/pinned`);
  }
}

export const commentService = new CommentService();