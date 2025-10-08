// components/document/DocumentViewSkeleton.tsx
'use client';

export default function DocumentViewSkeleton() {
  return (
    <div className="flex h-screen bg-neutral-background">
      <div className="flex-1 flex flex-col">
        <div className="bg-surface border-b border-ui p-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-neutral-ui rounded"></div>
            <div>
              <div className="h-6 bg-neutral-ui rounded w-64 mb-2"></div>
              <div className="h-4 bg-neutral-ui rounded w-48"></div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="h-[600px] w-full max-w-4xl bg-neutral-ui rounded animate-pulse"></div>
        </div>
      </div>
      <div className="w-80 bg-surface border-l border-ui animate-pulse">
        <div className="p-4 border-b border-ui">
          <div className="h-6 bg-neutral-ui rounded w-32"></div>
        </div>
        <div className="p-4 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 bg-neutral-ui rounded w-full"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
