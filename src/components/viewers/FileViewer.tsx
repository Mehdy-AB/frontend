'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import {
  FileText,
  File,
  Download,
  AlertCircle
} from 'lucide-react';
import { DocumentResponseDto } from '../../types/api';

// Tier 1 viewers
import PdfViewer from './tier1/PdfViewer';
import ImageViewer from './tier1/ImageViewer';
import TextViewer from './tier1/TextViewer';
import DocxViewer from './tier1/DocxViewer';
import XlsxViewer from './tier1/XlsxViewer';
import CsvViewer from './tier1/CsvViewer';

// Tier 2 viewers
import UnsupportedViewer from './tier2/UnsupportedViewer';

// Tier 3 viewers
import VideoViewer from './tier3/VideoViewer';
import AudioViewer from './tier3/AudioViewer';

// Specialized viewers
import EmailDocumentViewer from './EmailDocumentViewer';

interface FileViewerProps {
  document: DocumentResponseDto;
  downloadUrl: string;
  onError?: (error: string) => void;
  optimisticFile?: File;
  refreshTrigger?: number;
  onRef?: (refreshFn: () => void) => void;
}

type ViewerType = 'pdf' | 'image' | 'text' | 'docx' | 'xlsx' | 'csv' | 'video' | 'audio' | 'email' | 'unsupported';

interface FileContent {
  type: ViewerType;
  content: any;
  error?: string;
}

/**
 * Determine the viewer type from a MIME type string.
 */
function getViewerType(mimeType: string): ViewerType {
  const mime = mimeType.toLowerCase();

  // PDF
  if (mime.includes('pdf')) return 'pdf';

  // Images
  if (mime.startsWith('image/')) return 'image';

  // Video
  if (mime.startsWith('video/')) return 'video';

  // Audio
  if (mime.startsWith('audio/')) return 'audio';

  // CSV (check before text/plain)
  if (mime.includes('csv')) return 'csv';

  // Plain text, JSON, XML, YAML, Markdown
  if (mime.includes('text/plain') || mime.includes('text/markdown') ||
      mime.includes('application/json') || mime.includes('application/xml') ||
      mime.includes('text/xml') || mime.includes('text/yaml') ||
      mime.includes('application/x-yaml')) return 'text';

  // Word documents
  if (mime.includes('word') || mime.includes('wordprocessingml') ||
      mime.includes('opendocument.text') || mime.includes('msword')) return 'docx';

  // Excel spreadsheets
  if (mime.includes('excel') || mime.includes('spreadsheet') ||
      mime.includes('spreadsheetml')) return 'xlsx';

  // PowerPoint — treated as docx-like for now (mammoth won't render it, so fallback to unsupported)
  if (mime.includes('powerpoint') || mime.includes('presentationml') ||
      mime.includes('opendocument.presentation')) return 'unsupported';

  // RTF — treat as text
  if (mime.includes('rtf')) return 'text';

  // Email files (.eml / .msg)
  if (mime.includes('message/rfc822') || mime.includes('vnd.ms-outlook')) return 'email';

  // Archives, CAD, eBook, PostScript, binary — no preview
  return 'unsupported';
}

export default function FileViewer({
  document,
  downloadUrl,
  onError,
  optimisticFile,
  refreshTrigger,
  onRef
}: FileViewerProps) {
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Manual refresh function
  const refreshContent = useCallback(() => {
    console.log('Manual refresh triggered');
    setFileContent(null);
    setLoading(true);
    setError(null);

    if (optimisticFile) {
      loadOptimisticFileContent(optimisticFile);
    } else {
      loadFileContent();
    }
  }, [optimisticFile, downloadUrl, document.mimeType]);

  // Expose refresh function to parent
  useEffect(() => {
    if (onRef) {
      onRef(refreshContent);
    }
  }, [onRef, refreshContent]);

  useEffect(() => {
    console.log('FileViewer useEffect triggered:', { downloadUrl, optimisticFile: !!optimisticFile, mimeType: document.mimeType, refreshTrigger });
    refreshContent();
  }, [downloadUrl, optimisticFile, document.mimeType, refreshTrigger, refreshContent]);

  /**
   * Load content from an optimistic (local) File object.
   */
  const loadOptimisticFileContent = async (file: File) => {
    try {
      setLoading(true);
      setError(null);

      const mimeType = file.type.toLowerCase();
      const viewerType = getViewerType(mimeType);
      let content: FileContent;

      switch (viewerType) {
        case 'pdf': {
          content = { type: 'pdf', content: URL.createObjectURL(file) };
          break;
        }
        case 'image': {
          content = { type: 'image', content: URL.createObjectURL(file) };
          break;
        }
        case 'video': {
          content = { type: 'video', content: URL.createObjectURL(file) };
          break;
        }
        case 'audio': {
          content = { type: 'audio', content: URL.createObjectURL(file) };
          break;
        }
        case 'csv': {
          const text = await file.text();
          const parsed = Papa.parse(text, { header: true });
          content = { type: 'csv', content: parsed.data };
          break;
        }
        case 'text': {
          const text = await file.text();
          content = { type: 'text', content: text };
          break;
        }
        case 'docx': {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          content = { type: 'docx', content: result.value };
          break;
        }
        case 'xlsx': {
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const sheets = workbook.SheetNames.map(name => ({
            name,
            data: XLSX.utils.sheet_to_json(workbook.Sheets[name])
          }));
          content = { type: 'xlsx', content: sheets };
          break;
        }
        default: {
          content = {
            type: 'unsupported',
            content: null,
            error: `File type ${mimeType} is not supported for preview`
          };
        }
      }

      setFileContent(content);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load file';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load content from a remote URL (download endpoint).
   */
  const loadFileContent = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading file content from URL:', downloadUrl);
      const mimeType = document.mimeType.toLowerCase();
      const viewerType = getViewerType(mimeType);

      // For types that need the raw URL (pdf, video, audio) — skip fetch
      if (viewerType === 'pdf') {
        setFileContent({ type: 'pdf', content: downloadUrl });
        setLoading(false);
        return;
      }

      if (viewerType === 'video') {
        setFileContent({ type: 'video', content: downloadUrl });
        setLoading(false);
        return;
      }

      if (viewerType === 'audio') {
        setFileContent({ type: 'audio', content: downloadUrl });
        setLoading(false);
        return;
      }

      // Email — EmailDocumentViewer fetches its own data via the email capture API
      if (viewerType === 'email') {
        setFileContent({ type: 'email', content: null });
        setLoading(false);
        return;
      }

      if (viewerType === 'unsupported') {
        setFileContent({ type: 'unsupported', content: null, error: `File type ${mimeType} is not supported for preview` });
        setLoading(false);
        return;
      }

      // Fetch the file for remaining types
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`);
      }

      let content: FileContent;

      switch (viewerType) {
        case 'image': {
          const blob = await response.blob();
          content = { type: 'image', content: URL.createObjectURL(blob) };
          break;
        }
        case 'csv': {
          const text = await response.text();
          const parsed = Papa.parse(text, { header: true });
          content = { type: 'csv', content: parsed.data };
          break;
        }
        case 'text': {
          const text = await response.text();
          content = { type: 'text', content: text };
          break;
        }
        case 'docx': {
          const arrayBuffer = await response.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          content = { type: 'docx', content: result.value };
          break;
        }
        case 'xlsx': {
          const arrayBuffer = await response.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const sheets = workbook.SheetNames.map(name => ({
            name,
            data: XLSX.utils.sheet_to_json(workbook.Sheets[name])
          }));
          content = { type: 'xlsx', content: sheets };
          break;
        }
        default: {
          content = { type: 'unsupported', content: null, error: `File type ${mimeType} is not supported for preview` };
        }
      }

      setFileContent(content);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load file';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = downloadUrl;
    link.download = document.name;
    window.document.body.appendChild(link);
    link.click();
    window.document.removeChild(link);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-text-light">Loading file...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
          <p className="text-error mb-4">{error}</p>
          <button
            onClick={handleDownload}
            className="bg-primary text-surface px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Download className="h-4 w-4 inline mr-2" />
            Download File
          </button>
        </div>
      </div>
    );
  }

  // No content
  if (!fileContent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <File className="h-12 w-12 text-neutral-ui mx-auto mb-4" />
          <p className="text-neutral-text-light">No content to display</p>
        </div>
      </div>
    );
  }

  // Render the appropriate viewer based on type
  return (
    <div className="h-full flex flex-col">
      <div ref={contentRef} className="flex-1 overflow-auto p-4">
        {fileContent.type === 'pdf' && (
          <PdfViewer
            document={document}
            downloadUrl={downloadUrl}
            content={fileContent.content}
            onError={(err) => setError(err)}
          />
        )}

        {fileContent.type === 'image' && (
          <ImageViewer document={document} content={fileContent.content} />
        )}

        {fileContent.type === 'text' && (
          <TextViewer content={fileContent.content} />
        )}

        {fileContent.type === 'docx' && (
          <DocxViewer content={fileContent.content} />
        )}

        {fileContent.type === 'xlsx' && (
          <XlsxViewer content={fileContent.content} />
        )}

        {fileContent.type === 'csv' && (
          <CsvViewer content={fileContent.content} />
        )}

        {fileContent.type === 'video' && (
          <VideoViewer
            document={document}
            content={fileContent.content}
            mimeType={document.mimeType}
          />
        )}

        {fileContent.type === 'audio' && (
          <AudioViewer
            document={document}
            content={fileContent.content}
            mimeType={document.mimeType}
          />
        )}

        {fileContent.type === 'email' && (
          <EmailDocumentViewer
            documentId={document.documentId}
          />
        )}

        {fileContent.type === 'unsupported' && (
          <UnsupportedViewer
            mimeType={document.mimeType}
            documentName={document.name}
            onDownload={handleDownload}
          />
        )}
      </div>
    </div>
  );
}
