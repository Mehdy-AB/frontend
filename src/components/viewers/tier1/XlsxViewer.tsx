'use client';

import React from 'react';

interface SheetData {
  name: string;
  data: Record<string, any>[];
}

interface XlsxViewerProps {
  content: SheetData[];
}

export default function XlsxViewer({ content }: XlsxViewerProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="space-y-6">
        {content.map((sheet, index) => (
          <div key={index} className="rounded-lg border border-ui shadow-sm">
            <div className="p-4 border-b border-ui">
              <h3 className="font-semibold text-neutral-text-dark">{sheet.name}</h3>
            </div>
            <div className="overflow-auto">
              <table className="viewer-table">
                <thead>
                  <tr>
                    {Object.keys(sheet.data[0] || {}).map((header, i) => (
                      <th key={i}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sheet.data.slice(0, 100).map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((cell: any, j) => (
                        <td key={j}>{String(cell)}</td>
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
  );
}
