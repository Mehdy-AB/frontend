'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail, User, Users, Clock, Paperclip, ChevronDown, ChevronUp,
  Shield, FileText, AlertTriangle, ExternalLink, Archive,
  ArrowUpRight, Tag
} from 'lucide-react';
import { emailCaptureService, EmailDocumentResponse, LinkedAttachment } from '@/api/services/emailCaptureService';

interface EmailDocumentViewerProps {
  documentId: number;
  onAttachmentClick?: (documentId: number) => void;
}

/**
 * Enterprise Email Document Viewer.
 * Renders parsed email metadata, body (in sandboxed iframe), and linked attachments.
 */
export default function EmailDocumentViewer({ documentId, onAttachmentClick }: EmailDocumentViewerProps) {
  const [emailDoc, setEmailDoc] = useState<EmailDocumentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [bodyView, setBodyView] = useState<'html' | 'text'>('html');

  useEffect(() => {
    loadEmailDocument();
  }, [documentId]);

  const loadEmailDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      const doc = await emailCaptureService.getEmailDocument(documentId);
      setEmailDoc(doc);
      // Default to text view if no HTML body
      if (!doc.bodyHtml || doc.bodyHtml.trim() === '') {
        setBodyView('text');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load email document');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-neutral-text-light">Loading email...</p>
        </div>
      </div>
    );
  }

  if (error || !emailDoc) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
          <p className="text-error mb-2">{error || 'Email not found'}</p>
          <p className="text-neutral-text-light text-sm">This document may not be an email.</p>
        </div>
      </div>
    );
  }

  const importanceBadge = getImportanceBadge(emailDoc.importance);

  return (
    <div className="h-full flex flex-col bg-surface overflow-hidden">
      {/* ──── EMAIL HEADER ──── */}
      <div className="flex-shrink-0 border-b border-neutral-ui/20 bg-surface-raised">
        {/* Subject + Importance */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-neutral-text truncate">
                {emailDoc.subject || '(No Subject)'}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {importanceBadge}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  <Tag className="h-3 w-3" />
                  {emailDoc.contentType}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-bg text-neutral-text-light text-xs rounded-full">
                  {emailDoc.originalFormat}
                </span>
                {emailDoc.contentImmutable && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success text-xs font-medium rounded-full">
                    <Shield className="h-3 w-3" />
                    Archived
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* From / To / Date */}
        <div className="px-5 pb-3 space-y-1.5">
          {/* From */}
          <div className="flex items-center gap-2 text-sm">
            <User className="h-3.5 w-3.5 text-neutral-text-light flex-shrink-0" />
            <span className="text-neutral-text-light w-12">From:</span>
            <span className="text-neutral-text font-medium truncate">{emailDoc.fromAddress}</span>
          </div>

          {/* To */}
          <div className="flex items-start gap-2 text-sm">
            <Users className="h-3.5 w-3.5 text-neutral-text-light flex-shrink-0 mt-0.5" />
            <span className="text-neutral-text-light w-12">To:</span>
            <span className="text-neutral-text truncate">
              {emailDoc.toAddresses?.join(', ') || '—'}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-3.5 w-3.5 text-neutral-text-light flex-shrink-0" />
            <span className="text-neutral-text-light w-12">Date:</span>
            <span className="text-neutral-text">
              {emailDoc.sentAt ? new Date(emailDoc.sentAt).toLocaleString() : '—'}
            </span>
          </div>

          {/* Expandable details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark mt-1 transition-colors"
          >
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showDetails ? 'Hide details' : 'Show details'}
          </button>

          {showDetails && (
            <div className="mt-2 pl-6 space-y-1.5 text-sm border-l-2 border-primary/20 ml-2">
              {emailDoc.ccAddresses && emailDoc.ccAddresses.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-neutral-text-light w-12">CC:</span>
                  <span className="text-neutral-text">{emailDoc.ccAddresses.join(', ')}</span>
                </div>
              )}
              {emailDoc.bccAddresses && emailDoc.bccAddresses.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-neutral-text-light w-12">BCC:</span>
                  <span className="text-neutral-text">{emailDoc.bccAddresses.join(', ')}</span>
                </div>
              )}
              {emailDoc.receivedAt && (
                <div className="flex items-center gap-2">
                  <span className="text-neutral-text-light w-16">Received:</span>
                  <span className="text-neutral-text">{new Date(emailDoc.receivedAt).toLocaleString()}</span>
                </div>
              )}
              {emailDoc.messageId && (
                <div className="flex items-start gap-2">
                  <span className="text-neutral-text-light w-16">Msg-ID:</span>
                  <span className="text-neutral-text text-xs font-mono break-all">{emailDoc.messageId}</span>
                </div>
              )}
              {emailDoc.archivedAt && (
                <div className="flex items-center gap-2">
                  <span className="text-neutral-text-light w-16">Archived:</span>
                  <span className="text-neutral-text">{new Date(emailDoc.archivedAt).toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-neutral-text-light w-16">Source:</span>
                <span className="text-neutral-text">{emailDoc.sourceType?.replace(/_/g, ' ')}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ──── ATTACHMENTS BAR ──── */}
      {emailDoc.hasAttachments && emailDoc.linkedAttachments && emailDoc.linkedAttachments.length > 0 && (
        <div className="flex-shrink-0 border-b border-neutral-ui/20 px-5 py-2 bg-neutral-bg/50">
          <div className="flex items-center gap-2 mb-1.5">
            <Paperclip className="h-3.5 w-3.5 text-neutral-text-light" />
            <span className="text-xs font-medium text-neutral-text-light">
              {emailDoc.attachmentCount} attachment{emailDoc.attachmentCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {emailDoc.linkedAttachments.map((att: LinkedAttachment) => (
              <button
                key={att.documentId}
                onClick={() => onAttachmentClick?.(att.documentId)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-neutral-ui/30 rounded-md
                  text-xs text-neutral-text hover:bg-primary/5 hover:border-primary/30 transition-all group"
              >
                <FileText className="h-3 w-3 text-neutral-text-light group-hover:text-primary" />
                <span className="truncate max-w-[180px]">{att.name}</span>
                <span className="text-neutral-text-light">{formatBytes(att.sizeBytes)}</span>
                <ArrowUpRight className="h-3 w-3 text-neutral-text-light group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ──── BODY VIEW TOGGLE ──── */}
      <div className="flex-shrink-0 px-5 py-1.5 border-b border-neutral-ui/20 flex items-center gap-2">
        <button
          onClick={() => setBodyView('html')}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${
            bodyView === 'html'
              ? 'bg-primary text-white'
              : 'text-neutral-text-light hover:bg-neutral-bg'
          }`}
          disabled={!emailDoc.bodyHtml || emailDoc.bodyHtml.trim() === ''}
        >
          Rich Text
        </button>
        <button
          onClick={() => setBodyView('text')}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${
            bodyView === 'text'
              ? 'bg-primary text-white'
              : 'text-neutral-text-light hover:bg-neutral-bg'
          }`}
        >
          Plain Text
        </button>
      </div>

      {/* ──── EMAIL BODY ──── */}
      <div className="flex-1 overflow-auto">
        {bodyView === 'html' && emailDoc.bodyHtml && emailDoc.bodyHtml.trim() !== '' ? (
          <iframe
            srcDoc={emailDoc.bodyHtml}
            sandbox="allow-same-origin"
            className="w-full h-full border-0"
            title="Email body"
            style={{ minHeight: '400px' }}
          />
        ) : (
          <pre className="p-5 text-sm text-neutral-text whitespace-pre-wrap font-sans leading-relaxed">
            {emailDoc.bodyText || '(No body content)'}
          </pre>
        )}
      </div>
    </div>
  );
}

// ==================== HELPERS ====================

function getImportanceBadge(importance: string) {
  switch (importance) {
    case 'HIGH':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-error/10 text-error text-xs font-medium rounded-full">
          <AlertTriangle className="h-3 w-3" />
          High Priority
        </span>
      );
    case 'LOW':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-bg text-neutral-text-light text-xs rounded-full">
          Low Priority
        </span>
      );
    default:
      return null;
  }
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
