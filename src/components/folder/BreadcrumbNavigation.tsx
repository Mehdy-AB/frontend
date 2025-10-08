import React from 'react';
import Link from 'next/link';

interface BreadcrumbNavigationProps {
  breadcrumbPath: string[];
  onNavigateToPath: (index: number) => void;
  currentFolderName: string;
}

export function BreadcrumbNavigation({ 
  breadcrumbPath, 
  onNavigateToPath, 
  currentFolderName 
}: BreadcrumbNavigationProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-neutral-text-light mb-4">
      {breadcrumbPath.map((segment, index) => (
        <React.Fragment key={index}>
          {index === 0 && segment === "My Folders" ? (
            <Link href="/folders" className="hover:text-neutral-text-dark transition-colors">
              My Folders
            </Link>
          ) : 
            index !== breadcrumbPath.length - 1 ? 
            (<button
              onClick={() => onNavigateToPath(index)}
              className="cursor-pointer hover:text-neutral-text-dark transition-colors hover:underline"
            >
              {segment}
            </button>) : (<span className="text-neutral-text-dark font-medium">{currentFolderName}</span>)
          }
          {index < breadcrumbPath.length - 1 && <span>›</span>}
        </React.Fragment>
      ))}
    </div>
  );
}
