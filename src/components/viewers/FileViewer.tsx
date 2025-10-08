'use client';

import React, { useState, useEffect } from 'react';
import ImageGallery from 'react-image-gallery';
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

interface FileViewerProps {
  document: DocumentResponseDto;
  downloadUrl: string;
  onError?: (error: string) => void;
}

interface FileContent {
  type: 'pdf' | 'image' | 'text' | 'docx' | 'xlsx' | 'csv' | 'unsupported';
  content: any;
  error?: string;
}

export default function FileViewer({ document, downloadUrl, onError }: FileViewerProps) {
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFileContent();
  }, [downloadUrl]);

  const loadFileContent = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`);
      }

      const mimeType = document.mimeType.toLowerCase();
      let content: FileContent;

      if (mimeType.includes('pdf')) {
        content = {
          type: 'pdf',
          content: downloadUrl
        };
      } else if (mimeType.includes('image')) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        content = {
          type: 'image',
          content: [{
            original: imageUrl,
            thumbnail: imageUrl
          }]
        };
      } else if (mimeType.includes('text/plain') || mimeType.includes('text/csv')) {
        const text = await response.text();
        if (mimeType.includes('csv')) {
          const parsed = Papa.parse(text, { header: true });
          content = {
            type: 'csv',
            content: parsed.data
          };
        } else {
          content = {
            type: 'text',
            content: text
          };
        }
      } else if (mimeType.includes('word') || mimeType.includes('docx')) {
        const arrayBuffer = await response.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        content = {
          type: 'docx',
          content: result.value
        };
      } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || 
                 mimeType.includes('xlsx') || mimeType.includes('xls')) {
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheets = workbook.SheetNames.map(name => ({
          name,
          data: XLSX.utils.sheet_to_json(workbook.Sheets[name])
        }));
        content = {
          type: 'xlsx',
          content: sheets
        };
      } else {
        content = {
          type: 'unsupported',
          content: null,
          error: `File type ${mimeType} is not supported for preview`
        };
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
    window.document.body.removeChild(link);
  };

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

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}


      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4">
        {fileContent.type === 'pdf' && (
          <div className="flex justify-center h-full">
            <div className="w-full h-full">
              <iframe
                src={fileContent.content}
                className="pdf-viewer-iframe"
                title={`PDF Viewer - ${document.name}`}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setError('Failed to load PDF. Please try downloading the file.');
                  setLoading(false);
                }}
              />
            </div>
          </div>
        )}

        {fileContent.type === 'image' && (
          <div className="flex justify-center">
            <ImageGallery
              items={fileContent.content}
              showThumbnails={true}
              showFullscreenButton={true}
              showPlayButton={false}
              showNav={true}
              autoPlay={false}
            />
          </div>
        )}

        {fileContent.type === 'text' && (
          <div className="max-w-4xl mx-auto">
            <pre className="whitespace-pre-wrap font-mono text-sm bg-neutral-background p-4 rounded-lg border border-ui">
              {fileContent.content}
            </pre>
          </div>
        )}

        {fileContent.type === 'docx' && (
          <div className="max-w-4xl mx-auto">
            <div 
              className="prose max-w-none p-6 rounded-lg border border-ui shadow-sm"
              dangerouslySetInnerHTML={{ __html: fileContent.content }}
            />
          </div>
        )}

        {fileContent.type === 'xlsx' && (
          <div className="max-w-6xl mx-auto">
            <div className="space-y-6">
              {fileContent.content.map((sheet: any, index: number) => (
                <div key={index} className=" rounded-lg border border-ui shadow-sm">
                  <div className="p-4 border-b border-ui">
                    <h3 className="font-semibold text-neutral-text-dark">{sheet.name}</h3>
                  </div>
                  <div className="overflow-auto">
                <table className="viewer-table">
                  <thead>
                    <tr>
                      {Object.keys(sheet.data[0] || {}).map((header, i) => (
                        <th key={i}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.data.slice(0, 100).map((row: any, i: number) => (
                      <tr key={i}>
                        {Object.values(row).map((cell: any, j: number) => (
                          <td key={j}>
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                    {sheet.data.length > 100 && (
                      <div className="p-4 text-center text-neutral-text-light">
                        Showing first 100 rows of {sheet.data.length} total rows
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {fileContent.type === 'csv' && (
          <div className="max-w-6xl mx-auto">
            <div className=" rounded-lg border border-ui shadow-sm">
              <div className="p-4 border-b border-ui">
                <h3 className="font-semibold text-neutral-text-dark">CSV Data</h3>
              </div>
              <div className="overflow-auto">
                <table className="viewer-table">
                  <thead>
                    <tr>
                      {Object.keys(fileContent.content[0] || {}).map((header, i) => (
                        <th key={i}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fileContent.content.slice(0, 100).map((row: any, i: number) => (
                      <tr key={i}>
                        {Object.values(row).map((cell: any, j: number) => (
                          <td key={j}>
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {fileContent.content.length > 100 && (
                  <div className="p-4 text-center text-neutral-text-light">
                    Showing first 100 rows of {fileContent.content.length} total rows
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {fileContent.type === 'unsupported' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="h-16 w-16 text-neutral-ui mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-text-dark mb-2">
                Preview Not Available
              </h3>
              <p className="text-neutral-text-light mb-4 max-w-md">
                {fileContent.error || 'This file type cannot be previewed in the browser.'}
              </p>
              <button
                onClick={handleDownload}
                className="bg-primary text-surface px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
              >
                <Download className="h-4 w-4 inline mr-2" />
                Download to View
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
