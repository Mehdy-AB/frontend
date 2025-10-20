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

interface SearchResultsGridProps {
  items: SearchResultItem[];
  formatFileSize: (bytes: number) => string;
  formatDate: (dateString: string) => string;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  showLoadingRows?: boolean;
}

const SearchResultsGrid = memo<SearchResultsGridProps>(({ 
  items, 
  formatFileSize, 
  formatDate, 
  openDropdownId, 
  setOpenDropdownId, 
  showLoadingRows = false 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <SearchResultCard 
          key={item.type === 'folder' ? `folder-${getItemId(item)}` : `document-${getItemId(item)}`}
          item={item} 
          formatFileSize={formatFileSize} 
          formatDate={formatDate}
          openDropdownId={openDropdownId}
          setOpenDropdownId={setOpenDropdownId}
        />
      ))}
      {/* Loading skeleton cards */}
      {showLoadingRows && Array.from({ length: 8 }).map((_, index) => (
        <div key={`skeleton-${index}`} className="bg-white rounded-2xl shadow-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gray-200 animate-pulse rounded-lg"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-3 w-24 bg-gray-200 animate-pulse rounded"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-gray-200 animate-pulse rounded"></div>
              <div className="h-3 w-3/4 bg-gray-200 animate-pulse rounded"></div>
            </div>
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-6 w-6 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

SearchResultsGrid.displayName = 'SearchResultsGrid';

// Search Result Card Component
const SearchResultCard = memo<{ 
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

  const content = (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 group h-full">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${
            isFolder ? 'bg-blue-100 group-hover:bg-blue-200' : 'bg-green-100 group-hover:bg-green-200'
          } transition-colors`}>
            {isFolder ? (
              <Folder className="h-7 w-7 text-blue-600" />
            ) : (
              <File className="h-7 w-7 text-green-600" />
            )}
          </div>
          <div className="relative">
            <button 
              ref={buttonRef}
              onClick={(e) => { e.preventDefault(); setOpenDropdownId(showMenu ? null : itemId); }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </button>
            
            {showMenu && (
              <SearchResultMenu 
                item={item} 
                onClose={() => setOpenDropdownId(null)}
                buttonRef={buttonRef}
              />
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {getHighlightedName()}
          </h3>
          <p className="text-sm text-gray-600 group-hover:text-blue-500 transition-colors line-clamp-2">
            {getHighlightedDescription()}
          </p>
          {!isFolder && (
            <p className="text-xs text-gray-500 uppercase font-medium">
              {getItemMimeType(item)?.split('/')[1]} • v{getItemVersionNumber(item)}
            </p>
          )}
          {getHighlightedMetadata()}
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatDate(updatedAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            {isFolder ? item.folder.isPublic : item.document.isPublic ? (
              <Globe className="h-4 w-4 text-green-500" />
            ) : (
              <Lock className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Badge variant={isFolder ? "default" : "secondary"} className="text-xs font-medium">
              {isFolder ? 'Folder' : 'Document'}
            </Badge>
            <span className="text-xs text-gray-500">{formatFileSize(size)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-semibold text-gray-700">{item.score.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return isFolder ? (
    <Link href={`/folders/${item.folder.id}`} className="cursor-pointer group">{content}</Link>
  ) : (
    <Link href={`/documents/${item.document.documentId}`} className="cursor-pointer group">{content}</Link>
  );
});

SearchResultCard.displayName = 'SearchResultCard';

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

export default SearchResultsGrid;
