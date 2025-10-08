// hooks/useDocumentOperations.ts
import { useState, useCallback } from 'react';
import { notificationApiClient } from '../api/notificationClient';
import AuditLogService from '../api/services/auditLogService';
import { commentService } from '../api/services/commentService';
import { favoriteService } from '../api/services/favoriteService';
import { DocumentViewDto } from '../types/documentView';
import { AuditLog, Comment } from '../types/api';

export const useDocumentOperations = (documentId: number) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState<boolean>(false);
  const [isLoadingComments, setIsLoadingComments] = useState<boolean>(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(false);

  // Fetch audit logs for the document
  const fetchAuditLogs = useCallback(async (docId: number) => {
    try {
      setIsLoadingAuditLogs(true);
      const response = await AuditLogService.getAuditLogsByEntity('DOCUMENT', docId.toString(), {
        page: 0,
        size: 50
      });
      setAuditLogs(response.content);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoadingAuditLogs(false);
    }
  }, []);

  // Fetch comments for the document
  const fetchComments = useCallback(async (docId: number) => {
    try {
      setIsLoadingComments(true);
      const response = await commentService.getCommentsByEntity('DOCUMENT', docId, {
        page: 0,
        size: 50,
        sortBy: 'createdAt',
        sortDir: 'desc'
      });
      setComments(response.content);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  }, []);

  // Check if document is favorite
  const checkFavoriteStatus = useCallback(async (docId: number) => {
    try {
      const response = await favoriteService.isFavorite(docId);
      setIsFavorite(response.isFavorite);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  }, []);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (document: DocumentViewDto) => {
    try {
      if (isFavorite) {
        await favoriteService.removeFromFavorites(document.documentId);
        setIsFavorite(false);
      } else {
        await favoriteService.addToFavorites(document.documentId);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [isFavorite]);

  // Add new comment
  const addComment = useCallback(async (document: DocumentViewDto, commentText: string) => {
    if (!commentText.trim()) return;
    
    try {
      await commentService.addComment({
        entityType: 'DOCUMENT',
        entityId: document.documentId,
        text: commentText.trim()
      });
      
      // Refresh comments
      await fetchComments(document.documentId);
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }, [fetchComments]);

  // Fetch document metadata (filing category and metadata)
  const fetchMetadata = useCallback(async (docId: number) => {
    try {
      setIsLoadingMetadata(true);
      // Fetch the document with updated metadata
      const documentResponse = await notificationApiClient.getDocument(docId);
      console.log('Fetched document metadata:', documentResponse);
      return documentResponse;
    } catch (error) {
      console.error('Error fetching metadata:', error);
      throw error;
    } finally {
      setIsLoadingMetadata(false);
    }
  }, []);

  // Update document name
  const updateDocumentName = useCallback(async (document: DocumentViewDto, newName: string) => {
    if (!newName.trim() || newName === document.name) return;
    
    try {
      // Here you would call the API to update the document name
      // await notificationApiClient.updateDocument(document.documentId, { name: newName.trim() });
      
      // For now, just return the updated document
      return { ...document, name: newName.trim() };
    } catch (error) {
      console.error('Error updating document name:', error);
      throw error;
    }
  }, []);

  // Handle file upload for document update
  const handleFileUpdate = useCallback(async (document: DocumentViewDto, file: File) => {
    try {
      // Here you would call the API to update the document file
      // await notificationApiClient.updateDocumentFile(document.documentId, file);
      
      // Refresh document data would be handled by the parent component
    } catch (error) {
      console.error('Error updating document file:', error);
      throw error;
    }
  }, []);

  // Download document
  const downloadDocument = useCallback(async (document: DocumentViewDto, version?: number) => {
    try {
      const downloadUrl = await notificationApiClient.downloadDocument(document.documentId, { version });
      
      // Log the download operation
      try {
        await notificationApiClient.fileDownloaded(document.documentId, { version });
      } catch (logError) {
        console.warn('Failed to log download operation:', logError);
        // Don't throw here as the download was successful
      }
      
      return downloadUrl;
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }, []);

  return {
    auditLogs,
    comments,
    isFavorite,
    isLoadingAuditLogs,
    isLoadingComments,
    isLoadingMetadata,
    fetchAuditLogs,
    fetchComments,
    fetchMetadata,
    checkFavoriteStatus,
    toggleFavorite,
    addComment,
    updateDocumentName,
    handleFileUpdate,
    downloadDocument
  };
};
