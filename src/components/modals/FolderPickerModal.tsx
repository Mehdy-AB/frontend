'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Folder, ChevronRight, Search, Check, Home, Loader2 } from 'lucide-react';
import { notificationApiClient } from '@/api/notificationClient';
import { FolderRepoResDto, SortFields } from '@/types/api';
import Pagination from '../main/Pagination';

interface FolderPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (folderId: number, folderName: string, folderPath: string) => void;
}

interface BreadcrumbItem {
    id: number;
    name: string;
}

export default function FolderPickerModal({ isOpen, onClose, onSelect }: FolderPickerModalProps) {
    const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
    const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);
    const [selectedFolderPath, setSelectedFolderPath] = useState<string>('');

    const [foldersData, setFoldersData] = useState<FolderRepoResDto | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize] = useState(20);
    const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedFolderId(null);
            setSelectedFolderName(null);
            setSelectedFolderPath('');
            setSearchQuery('');
            setDebouncedQuery('');
            setCurrentPage(0);
            setCurrentFolderId(null);
            setBreadcrumbs([]);
        }
    }, [isOpen]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(0);
    }, [debouncedQuery]);

    // Build folder path from breadcrumbs
    const buildPath = useCallback(() => {
        if (breadcrumbs.length === 0) return '/';
        return '/' + breadcrumbs.map(b => b.name).join('/');
    }, [breadcrumbs]);

    // Load folders
    const loadFolders = useCallback(async () => {
        setLoading(true);
        try {
            let response: FolderRepoResDto;

            if (currentFolderId !== null) {
                // Fetch folder contents
                response = await notificationApiClient.getFolder(currentFolderId, {
                    page: currentPage,
                    size: pageSize,
                    showFolder: true,
                    name: debouncedQuery || undefined,
                    sort: SortFields.NAME,
                    desc: false
                });
            } else {
                // Fetch root repository
                const repoResponse = await notificationApiClient.getRepository({
                    page: currentPage,
                    size: pageSize,
                    name: debouncedQuery || undefined
                });
                // Convert PageResponse<FolderResDto> to FolderRepoResDto format
                response = {
                    folder: undefined,
                    folders: repoResponse.content || [],
                    documents: [],
                    pageable: {
                        pageNumber: repoResponse.number ?? currentPage,
                        pageSize: repoResponse.size ?? pageSize
                    },
                    totalElements: repoResponse.totalElements || 0,
                    totalPages: repoResponse.totalPages || 0
                };
            }

            setFoldersData(response);

            // Update breadcrumbs when navigating into a folder
            if (currentFolderId !== null && response.folder) {
                const existingIndex = breadcrumbs.findIndex(b => b.id === currentFolderId);
                if (existingIndex === -1) {
                    setBreadcrumbs(prev => [...prev, { id: response.folder!.id, name: response.folder!.name }]);
                }
            } else if (currentFolderId === null) {
                setBreadcrumbs([]);
            }
        } catch (error) {
            console.error('Error loading folders:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedQuery, currentFolderId, pageSize, breadcrumbs]);

    // Load folders when dependencies change
    useEffect(() => {
        if (isOpen) {
            loadFolders();
        }
    }, [isOpen, currentPage, debouncedQuery, currentFolderId]);

    // Navigate to folder
    const navigateToFolder = (folderId: number, folderName: string) => {
        setCurrentFolderId(folderId);
        setCurrentPage(0);
    };

    // Navigate back via breadcrumb
    const navigateBreadcrumb = (folderId: number | null, breadcrumbIndex?: number) => {
        if (folderId === null) {
            setCurrentFolderId(null);
            setBreadcrumbs([]);
        } else {
            setCurrentFolderId(folderId);
            if (breadcrumbIndex !== undefined) {
                setBreadcrumbs(prev => prev.slice(0, breadcrumbIndex + 1));
            }
        }
        setCurrentPage(0);
    };

    const handleSelect = () => {
        if (selectedFolderId && selectedFolderName) {
            onSelect(selectedFolderId, selectedFolderName, selectedFolderPath);
            onClose();
        }
    };

    const selectFolder = (folderId: number, folderName: string) => {
        setSelectedFolderId(folderId);
        setSelectedFolderName(folderName);
        // Build full path including this folder
        const path = currentFolderId === null
            ? `/${folderName}`
            : `${buildPath()}/${folderName}`;
        setSelectedFolderPath(path);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-w-[95vw] w-full overflow-hidden flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Folder className="h-5 w-5" />
                        Select Target Folder
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 flex flex-col flex-1 min-h-0">
                    <div className="flex flex-col border rounded-lg overflow-hidden flex-1 min-h-0">
                        {/* Search Bar */}
                        <div className="p-3 border-b bg-gray-50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search folders..."
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Breadcrumb Navigation */}
                        <div className="p-3 border-b bg-white flex items-center gap-2 text-sm overflow-x-auto">
                            <button
                                onClick={() => navigateBreadcrumb(null)}
                                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors flex-shrink-0 ${currentFolderId === null
                                    ? 'font-medium text-blue-600'
                                    : 'hover:bg-gray-100 text-gray-700'
                                    }`}
                            >
                                <Home className="h-4 w-4" />
                                <span>Root</span>
                            </button>

                            {breadcrumbs.map((crumb, index) => (
                                <div key={`${crumb.id}-${index}`} className="flex items-center gap-2 flex-shrink-0">
                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                    <button
                                        onClick={() => navigateBreadcrumb(crumb.id, index)}
                                        className={`px-2 py-1 rounded transition-colors truncate max-w-[150px] ${index === breadcrumbs.length - 1 && currentFolderId === crumb.id
                                            ? 'font-medium text-blue-600'
                                            : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                        title={crumb.name}
                                    >
                                        {crumb.name}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Folders List */}
                        <div className="flex-1 overflow-y-auto bg-white min-h-0">
                            {loading ? (
                                <div className="flex items-center justify-center p-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                </div>
                            ) : (foldersData?.folders || []).length === 0 ? (
                                <div className="p-4 text-center text-gray-500">
                                    No folders found
                                </div>
                            ) : (
                                <div className="p-2">
                                    {(foldersData?.folders || []).map(folder => {
                                        const isSelected = selectedFolderId === folder.id;
                                        return (
                                            <div
                                                key={folder.id}
                                                className={`flex items-center py-2 px-3 rounded-md transition-colors ${isSelected
                                                    ? 'bg-blue-100 border border-blue-300'
                                                    : 'hover:bg-gray-100'
                                                    }`}
                                            >
                                                <Folder className="h-4 w-4 mr-2 text-blue-500" />

                                                <div
                                                    className="flex-1 min-w-0 cursor-pointer"
                                                    onClick={() => selectFolder(folder.id, folder.name)}
                                                    onDoubleClick={(e) => {
                                                        e.stopPropagation();
                                                        navigateToFolder(folder.id, folder.name);
                                                    }}
                                                >
                                                    <div className="text-sm truncate">
                                                        {folder.name}
                                                    </div>
                                                </div>

                                                {isSelected && (
                                                    <Check className="h-4 w-4 text-blue-600 flex-shrink-0 mr-2" />
                                                )}

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigateToFolder(folder.id, folder.name);
                                                    }}
                                                    className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                                                    title="Navigate into folder"
                                                >
                                                    <ChevronRight className="h-4 w-4 text-gray-600" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {foldersData && foldersData.totalPages > 1 && (
                            <div className="p-3 border-t bg-gray-50">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={foldersData.totalPages}
                                    totalElements={foldersData.totalElements || 0}
                                    pageSize={pageSize}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        )}
                    </div>

                    {/* Selected Folder Display */}
                    {selectedFolderName && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-sm font-medium text-blue-900">Selected Folder:</div>
                            <div className="text-sm text-blue-700 mt-1">{selectedFolderPath}</div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSelect} disabled={!selectedFolderId}>
                        <Check className="h-4 w-4 mr-2" />
                        Select Folder
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
