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
  // The path now starts with user UUID, then folder names
  // Format: "uuid.folder1.folder2.subfolder"
  const pathSegments = folderPath.split('.').filter(segment => segment.trim() !== '');
  
  // Check if current user is the owner
  const isOwner = currentUserId === folderOwnerId;
  
  // Check if first segment is a UUID (supports both dash and underscore formats)
  // Format 1: "8fec38ca-8f8b-44a4-90fe-bd6c5161e028" (with dashes)
  // Format 2: "8fec38ca_8f8b_44a4_90fe_bd6c5161e028" (with underscores)
  const uuidPatternDash = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const uuidPatternUnderscore = /^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$/i;
  const firstSegmentIsUuid = pathSegments.length > 0 && 
    (uuidPatternDash.test(pathSegments[0]) || uuidPatternUnderscore.test(pathSegments[0]));
  
  // Skip the UUID segment if it exists (it's the user's root folder identifier)
  const folderSegments = firstSegmentIsUuid ? pathSegments.slice(1) : pathSegments;
  
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
      {folderSegments.map((segment, index) => {
        const isLastSegment = index === folderSegments.length - 1;
        // Build cumulative path: include UUID if it exists, then folder segments
        const segmentsToInclude = firstSegmentIsUuid 
          ? [pathSegments[0], ...folderSegments.slice(0, index + 1)]
          : folderSegments.slice(0, index + 1);
        const cumulativePath = segmentsToInclude.join('.');
        
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
