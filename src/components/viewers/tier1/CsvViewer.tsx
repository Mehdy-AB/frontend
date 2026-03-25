'use client';

import React from 'react';

interface CsvViewerProps {
  content: Record<string, any>[];
}

export default function CsvViewer({ content }: CsvViewerProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="rounded-lg border border-ui shadow-sm">
        <div className="p-4 border-b border-ui">
          <h3 className="font-semibold text-neutral-text-dark">CSV Data</h3>
        </div>
        <div className="overflow-auto">
          <table className="viewer-table">
            <thead>
              <tr>
                {Object.keys(content[0] || {}).map((header, i) => (
                  <th key={i}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {content.slice(0, 100).map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((cell: any, j) => (
                    <td key={j}>{String(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {content.length > 100 && (
            <div className="p-4 text-center text-neutral-text-light">
              Showing first 100 rows of {content.length} total rows
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
