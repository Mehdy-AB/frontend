import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface BreadcrumbNavigationProps {
  folderPath: string; // The full path like "a/b/c/foldername"
  folderOwnerId: string;
  folderOwnerDisplayName: string;
  currentFolderName: string;
  onNavigateToPath: (path: string) => void;
}

export function BreadcrumbNavigation({ 
  folderPath,
  folderOwnerId,
  folderOwnerDisplayName,
  currentFolderName,
  onNavigateToPath
}: BreadcrumbNavigationProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  
  // Return null if folderPath is not available yet
  if (!folderPath) {
    return null;
  }
  
  // Parse the path into segments using dot separator (ltree format)
  // The path is in format like "mehdi.q.subfolder"
  const pathSegments = folderPath.split('.').filter(segment => segment.trim() !== '');
  
  // Check if current user is the owner
  const isOwner = currentUserId === folderOwnerId;
  
  return (
    <div className="flex items-center gap-2 text-sm text-neutral-text-light mb-4">
      {/* First segment: "my repo" or owner display name */}
      {isOwner ? (
        <Link href="/folders" className="hover:text-neutral-text-dark transition-colors">
          my repo
        </Link>
      ) : (
        <span className="text-neutral-text-dark">
          {folderOwnerDisplayName}
        </span>
      )}
      
      {/* Path segments with cumulative links */}
      {pathSegments.map((segment, index) => {
        const isLastSegment = index === pathSegments.length - 1;
        // Build cumulative path with dot separator (ltree format)
        const cumulativePath = pathSegments.slice(0, index + 1).join('.');
        
        return (
          <React.Fragment key={index}>
            <span>›</span>
            {isLastSegment ? (
              // Last segment (current folder) - no link
              <span className="text-neutral-text-dark font-medium">
                {currentFolderName}
              </span>
            ) : (
              // Intermediate segments - with cumulative links
              <button
                onClick={() => onNavigateToPath(cumulativePath)}
                className="cursor-pointer hover:text-neutral-text-dark transition-colors hover:underline"
              >
                {segment}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
