'use client';

import React, { memo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  MoreVertical,
  Lock,
  Globe,
  Download,
  Share2,
  Edit,
  Trash2,
  Eye,
  Clock,
  Star,
  Folder,
  File
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import UserAvatar from '@/components/main/UserAvatar';

// Unified interface for search results
type SearchResultItem = (any & { type: 'folder' }) | (any & { type: 'document' });

// Helper functions to access properties safely
const getItemId = (item: SearchResultItem): string => {
  return item.type === 'folder' ? item.folder.id.toString() : item.document.documentId.toString();
};

const getItemName = (item: SearchResultItem): string => {
  return item.type === 'folder' ? item.folder.name : item.document.name;
};

const getItemSize = (item: SearchResultItem): number => {
  return item.type === 'folder' ? (item.folder.size || 0) : (item.document.sizeBytes || 0);
};

const getItemUpdatedAt = (item: SearchResultItem): string => {
  return item.type === 'folder' ? item.folder.updatedAt : item.document.updatedAt;
};

const getItemMimeType = (item: SearchResultItem): string | undefined => {
  return item.type === 'document' ? item.document.mimeType : undefined;
};

const getItemVersionNumber = (item: SearchResultItem): number | undefined => {
  return item.type === 'document' ? item.document.versionNumber : undefined;
};

interface SearchResultsTableProps {
  items: SearchResultItem[];
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  showLoadingRows?: boolean;
}

const SearchResultsTable = memo<SearchResultsTableProps>(({
  items,
  formatFileSize,
  formatDate,
  openDropdownId,
  setOpenDropdownId,
  showLoadingRows = false
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide w-[300px]">Name</th>
              <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
              <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Owner</th>
              <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Creator</th>
              <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Size</th>
              <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Last Modified</th>
              <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Relevance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => (
              <SearchResultRow
                key={item.type === 'folder' ? `folder-${getItemId(item)}` : `document-${getItemId(item)}`}
                item={item}
                formatFileSize={formatFileSize}
                formatDate={formatDate}
                openDropdownId={openDropdownId}
                setOpenDropdownId={setOpenDropdownId}
              />
            ))}
            {/* Loading skeleton rows */}
            {showLoadingRows && Array.from({ length: 5 }).map((_, index) => (
              <tr key={`skeleton-${index}`} className="border-b border-gray-200">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-lg"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-40 bg-gray-200 animate-pulse rounded"></div>
                      <div className="h-3 w-32 bg-gray-200 animate-pulse rounded"></div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full"></div>
                    <div className="space-y-1">
                      <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                      <div className="h-3 w-32 bg-gray-200 animate-pulse rounded"></div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full"></div>
                    <div className="space-y-1">
                      <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                      <div className="h-3 w-32 bg-gray-200 animate-pulse rounded"></div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
                </td>
                <td className="p-4">
                  <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                </td>
                <td className="p-4">
                  <div className="h-6 w-12 bg-gray-200 animate-pulse rounded"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

SearchResultsTable.displayName = 'SearchResultsTable';

// Search Result Row Component
const SearchResultRow = memo<{
  item: SearchResultItem;
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
}>(({ item, formatFileSize, formatDate, openDropdownId, setOpenDropdownId }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isFolder = item.type === 'folder';
  const itemId = getItemId(item);
  const showMenu = openDropdownId === itemId;
  const size = getItemSize(item);
  const updatedAt = getItemUpdatedAt(item);

  // Get highlighted text for display
  const getHighlightedName = () => {
    if (item.highlight?.name) {
      return <span dangerouslySetInnerHTML={{ __html: item.highlight.name }} />;
    }
    return getItemName(item);
  };

  const getHighlightedDescription = () => {
    if (item.highlight?.description) {
      return <span dangerouslySetInnerHTML={{ __html: item.highlight.description }} />;
    }
    return isFolder ? item.folder.description : item.document.description;
  };

  // Get highlighted metadata fields
  const getHighlightedMetadata = () => {
    const highlights = [];

    if (item.highlight?.['metadata.categoryName']) {
      highlights.push(
        <div key="category" className="text-xs text-blue-600">
          <strong>Category:</strong> <span dangerouslySetInnerHTML={{ __html: item.highlight['metadata.categoryName'] }} />
        </div>
      );
    }

    if (item.highlight?.['metadata.key']) {
      highlights.push(
        <div key="key" className="text-xs text-green-600">
          <strong>Key:</strong> <span dangerouslySetInnerHTML={{ __html: item.highlight['metadata.key'] }} />
        </div>
      );
    }

    if (item.highlight?.['metadata.value']) {
      highlights.push(
        <div key="value" className="text-xs text-purple-600">
          <strong>Value:</strong> <span dangerouslySetInnerHTML={{ __html: item.highlight['metadata.value'] }} />
        </div>
      );
    }

    if (item.highlight?.ocrText) {
      highlights.push(
        <div key="ocr" className="text-xs text-orange-600">
          <strong>OCR:</strong> <span dangerouslySetInnerHTML={{ __html: item.highlight.ocrText }} />
        </div>
      );
    }

    return highlights.length > 0 ? (
      <div className="mt-1 space-y-1">
        {highlights}
      </div>
    ) : null;
  };

  const creator = isFolder ? item.folder.createdBy : item.document.createdBy;
  const owner = isFolder ? item.folder.ownedBy : item.document.ownedBy;

  return (
    <tr className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 group transition-colors">
      <td className="p-4 max-w-[300px]">
        {isFolder ? (
          <Link href={`/folders/${item.folder.id}`} className="flex cursor-pointer group items-center gap-3">
            <div className="relative h-10 w-10 bg-primary-light rounded-lg flex items-center justify-center shrink-0">
              <Folder className="h-5 w-5 text-primary" />
              <div className="absolute -bottom-1 -right-1 rounded-full p-0.5">
                {item.folder.public ? (
                  <Globe className="h-3 w-3 text-success" />
                ) : (
                  <Lock className="h-3 w-3 text-neutral-text-light" />
                )}
              </div>
            </div>
            <div className="min-w-0">
              <div className="font-medium text-neutral-text-dark group-hover:underline group-hover:text-primary truncate">
                {getHighlightedName()}
              </div>
              <div className="text-sm text-neutral-text-light group-hover:underline group-hover:text-primary truncate">
                {getHighlightedDescription()}
              </div>
              {getHighlightedMetadata()}
            </div>
          </Link>
        ) : (
          <Link href={`/documents/${item.document.documentId}`} className="flex cursor-pointer group items-center gap-3">
            <div className="relative h-10 w-10 bg-primary-light rounded-lg flex items-center justify-center shrink-0">
              <File className="h-5 w-5 text-primary" />
              <div className="absolute -bottom-1 -right-1 rounded-full p-0.5">
                {item.document.isPublic ? (
                  <Globe className="h-3 w-3 text-success" />
                ) : (
                  <Lock className="h-3 w-3 text-neutral-text-light" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-neutral-text-dark group-hover:underline group-hover:text-primary truncate">
                {getHighlightedName()}
              </div>
              <div className="text-sm text-neutral-text-light group-hover:underline group-hover:text-primary truncate">
                {getItemMimeType(item)?.split('/')[1].toUpperCase()} • v{getItemVersionNumber(item)}
              </div>
              {getHighlightedMetadata()}
            </div>
          </Link>
        )}
      </td>
      <td className="p-4">
        <Badge variant={isFolder ? "default" : "secondary"} className="text-xs font-medium">
          {isFolder ? 'Folder' : 'Document'}
        </Badge>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <UserAvatar user={owner} size="sm" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-neutral-text-light">
              {owner.firstName} {owner.lastName}
            </span>
            <span className="text-xs text-neutral-text-light">{owner.email}</span>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <UserAvatar user={creator} size="sm" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-neutral-text-light">
              {creator.firstName} {creator.lastName}
            </span>
            <span className="text-xs text-neutral-text-light">{creator.email}</span>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="text-sm text-neutral-text-light">{formatFileSize(size)}</div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-neutral-text-light">{formatDate(updatedAt)}</span>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-semibold text-gray-700">{item.score.toFixed(2)}</span>
        </div>
      </td>
    </tr>
  );
});

SearchResultRow.displayName = 'SearchResultRow';

// Search Result Menu Component
const SearchResultMenu = memo<{
  item: SearchResultItem;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}>(({ item, onClose, buttonRef }) => {
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const isFolder = item.type === 'folder';

  React.useEffect(() => {
    if (buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right - 192 + window.scrollX // 192px is the width of the dropdown
      });
    }
  }, [buttonRef]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-result-menu-dropdown')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const menuContent = (
    <div className="search-result-menu-dropdown fixed w-56 bg-white border border-gray-200 rounded-xl shadow-xl" style={{ zIndex: 9999, top: position.top, left: position.left }}>
      {!isFolder && (
        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-t-xl transition-colors">
          <Eye className="h-4 w-4" />
          Preview Document
        </button>
      )}
      <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">
        <Download className="h-4 w-4" />
        Download
      </button>
      <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">
        <Share2 className="h-4 w-4" />
        Share
      </button>
      <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors">
        <Edit className="h-4 w-4" />
        Edit
      </button>
      <hr className="border-gray-200" />
      <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-b-xl transition-colors">
        <Trash2 className="h-4 w-4" />
        Move to Trash
      </button>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(menuContent, document.body) : null;
});

SearchResultMenu.displayName = 'SearchResultMenu';

export default SearchResultsTable;
