import React from 'react';

export function FolderDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-4 bg-neutral-ui rounded w-32 animate-pulse"></div>
      
      <div className="bg-surface rounded-lg border border-ui p-6 animate-pulse">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 bg-neutral-ui rounded-lg"></div>
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-neutral-ui rounded w-64"></div>
            <div className="h-4 bg-neutral-ui rounded w-full"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 bg-neutral-ui rounded w-16"></div>
                  <div className="h-4 bg-neutral-ui rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-surface rounded-lg border border-ui p-4 animate-pulse">
            <div className="h-6 bg-neutral-ui rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-neutral-ui rounded w-full mb-4"></div>
            <div className="flex justify-between">
              <div className="h-4 bg-neutral-ui rounded w-20"></div>
              <div className="h-4 bg-neutral-ui rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FolderDetailsLoadingSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-surface rounded-lg border border-ui p-4 animate-pulse">
            <div className="flex items-start justify-between mb-3">
              <div className="h-12 w-12 bg-neutral-ui rounded-lg"></div>
              <div className="h-4 w-4 bg-neutral-ui rounded"></div>
            </div>
            <div className="h-6 bg-neutral-ui rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-neutral-ui rounded w-full mb-4"></div>
            <div className="flex justify-between">
              <div className="h-4 bg-neutral-ui rounded w-20"></div>
              <div className="h-4 bg-neutral-ui rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-surface border border-ui rounded-lg">
      <table className="w-full relative" style={{ zIndex: 1 }}>
        <thead className="bg-neutral-background">
          <tr>
            <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Name</th>
            <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Owner</th>
            <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Size</th>
            <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Last Modified</th>
            <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Version</th>
            <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Visibility</th>
            <th className="text-left p-4 text-sm font-medium text-neutral-text-dark">Actions</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i} className="border-b border-ui last:border-b-0">
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-neutral-ui rounded-lg animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-neutral-ui rounded w-32 animate-pulse"></div>
                    <div className="h-3 bg-neutral-ui rounded w-24 animate-pulse"></div>
                  </div>
                </div>
              </td>
              <td className="p-4">
                <div className="h-4 bg-neutral-ui rounded w-20 animate-pulse"></div>
              </td>
              <td className="p-4">
                <div className="h-4 bg-neutral-ui rounded w-16 animate-pulse"></div>
              </td>
              <td className="p-4">
                <div className="h-4 bg-neutral-ui rounded w-20 animate-pulse"></div>
              </td>
              <td className="p-4">
                <div className="h-4 bg-neutral-ui rounded w-12 animate-pulse"></div>
              </td>
              <td className="p-4">
                <div className="h-4 bg-neutral-ui rounded w-16 animate-pulse"></div>
              </td>
              <td className="p-4">
                <div className="h-4 bg-neutral-ui rounded w-4 animate-pulse"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
