import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Folder, Home, ChevronRight, Check, Loader2, Share2, X, Search } from 'lucide-react';
import { folderService } from '@/api/services/folderService';
import { FolderRepoResDto, FolderResDto } from '@/types/api';
import Pagination from '@/components/main/Pagination';

interface FolderPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (folderId: number, folderName: string) => void;
    selectedFolderId?: number | null;
}

export function FolderPickerModal({ isOpen, onClose, onSelect, selectedFolderId }: FolderPickerModalProps) {
    const [activeTab, setActiveTab] = useState<'folders' | 'shared'>('folders');

    // My Folders state
    const [myFoldersCurrentFolderId, setMyFoldersCurrentFolderId] = useState<number | null>(null);
    const [myFoldersBreadcrumbs, setMyFoldersBreadcrumbs] = useState<{ id: number; name: string }[]>([]);
    const [myFoldersSearchQuery, setMyFoldersSearchQuery] = useState('');
    const [myFoldersCurrentPage, setMyFoldersCurrentPage] = useState(0);
    const [myFoldersData, setMyFoldersData] = useState<FolderRepoResDto | null>(null);
    const [myFoldersLoading, setMyFoldersLoading] = useState(false);
    const myFoldersPageSize = 10;

    // Shared Folders state
    const [sharedCurrentFolderId, setSharedCurrentFolderId] = useState<number | null>(null);
    const [sharedBreadcrumbs, setSharedBreadcrumbs] = useState<{ id: number; name: string }[]>([]);
    const [sharedSearchQuery, setSharedSearchQuery] = useState('');
    const [sharedCurrentPage, setSharedCurrentPage] = useState(0);
    const [sharedData, setSharedData] = useState<FolderRepoResDto | null>(null);
    const [sharedLoading, setSharedLoading] = useState(false);
    const sharedPageSize = 10;

    // Load My Folders
    useEffect(() => {
        if (isOpen && activeTab === 'folders') {
            loadMyFolders();
        }
    }, [isOpen, activeTab, myFoldersCurrentFolderId, myFoldersSearchQuery, myFoldersCurrentPage]);

    // Load Shared Folders
    useEffect(() => {
        if (isOpen && activeTab === 'shared') {
            loadSharedFolders();
        }
    }, [isOpen, activeTab, sharedCurrentFolderId, sharedSearchQuery, sharedCurrentPage]);

    const loadMyFolders = async () => {
        try {
            setMyFoldersLoading(true);
            let data: FolderRepoResDto;
            if (myFoldersCurrentFolderId) {
                data = await folderService.getFolderContents(
                    myFoldersCurrentFolderId,
                    myFoldersCurrentPage,
                    myFoldersPageSize,
                    myFoldersSearchQuery || undefined,
                    true
                );
            } else {
                // Use getMyRepository for root level
                const response = await folderService.getMyRepository(
                    myFoldersCurrentPage,
                    myFoldersPageSize,
                    myFoldersSearchQuery || undefined
                );

                // Convert PageResponse to FolderRepoResDto
                data = {
                    folders: response.content,
                    documents: [],
                    pageable: {
                        pageNumber: response.number,
                        pageSize: response.size
                    },
                    totalElements: response.totalElements,
                    totalPages: response.totalPages
                };
            }
            setMyFoldersData(data);
        } catch (error) {
            console.error('Error loading folders:', error);
        } finally {
            setMyFoldersLoading(false);
        }
    };

    const loadSharedFolders = async () => {
        try {
            setSharedLoading(true);
            const data = await folderService.getSharedFolders(
                sharedCurrentPage,
                sharedPageSize,
                sharedSearchQuery || undefined,
                true
            );
            setSharedData(data);
        } catch (error) {
            console.error('Error loading shared folders:', error);
        } finally {
            setSharedLoading(false);
        }
    };

    const navigateToMyFolder = (folderId: number, folderName: string) => {
        setMyFoldersCurrentFolderId(folderId);
        setMyFoldersBreadcrumbs(prev => [...prev, { id: folderId, name: folderName }]);
        setMyFoldersCurrentPage(0);
    };

    const navigateMyFoldersBreadcrumb = (folderId: number | null, index?: number) => {
        if (folderId === null) {
            setMyFoldersCurrentFolderId(null);
            setMyFoldersBreadcrumbs([]);
        } else {
            setMyFoldersCurrentFolderId(folderId);
            if (index !== undefined) {
                setMyFoldersBreadcrumbs(prev => prev.slice(0, index + 1));
            }
        }
        setMyFoldersCurrentPage(0);
    };

    const navigateToSharedFolder = (folderId: number, folderName: string) => {
        setSharedCurrentFolderId(folderId);
        setSharedBreadcrumbs(prev => [...prev, { id: folderId, name: folderName }]);
        setSharedCurrentPage(0);
    };

    const navigateSharedBreadcrumb = (folderId: number | null, index?: number) => {
        if (folderId === null) {
            setSharedCurrentFolderId(null);
            setSharedBreadcrumbs([]);
        } else {
            setSharedCurrentFolderId(folderId);
            if (index !== undefined) {
                setSharedBreadcrumbs(prev => prev.slice(0, index + 1));
            }
        }
        setSharedCurrentPage(0);
    };

    const handleFolderSelect = (folderId: number, folderName: string) => {
        onSelect(folderId, folderName);
        handleClose();
    };

    const handleClose = () => {
        // Reset state
        setMyFoldersCurrentFolderId(null);
        setMyFoldersBreadcrumbs([]);
        setMyFoldersSearchQuery('');
        setMyFoldersCurrentPage(0);
        setSharedCurrentFolderId(null);
        setSharedBreadcrumbs([]);
        setSharedSearchQuery('');
        setSharedCurrentPage(0);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
                <DialogHeader className="p-6 border-b">
                    <DialogTitle className="text-lg font-semibold">Select Folder for Workflow Trigger</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* Tab Selection */}
                    <div className="flex gap-2 border-b mb-4">
                        <button
                            onClick={() => setActiveTab('folders')}
                            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'folders'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Folder className="h-4 w-4" />
                                My Folders
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('shared')}
                            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'shared'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Share2 className="h-4 w-4" />
                                Shared with Me
                            </div>
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'folders' ? (
                        <div className="flex flex-col border rounded-lg overflow-hidden">
                            {/* Search Bar */}
                            <div className="p-3 border-b bg-gray-50">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        value={myFoldersSearchQuery}
                                        onChange={(e) => setMyFoldersSearchQuery(e.target.value)}
                                        placeholder="Search folders..."
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            {/* Breadcrumb Navigation */}
                            <div className="p-3 border-b bg-white flex items-center gap-2 text-sm overflow-x-auto">
                                <button
                                    onClick={() => navigateMyFoldersBreadcrumb(null)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded transition-colors flex-shrink-0 ${myFoldersCurrentFolderId === null
                                        ? 'font-medium text-blue-600'
                                        : 'hover:bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    <Home className="h-4 w-4" />
                                    <span>Root</span>
                                </button>

                                {myFoldersBreadcrumbs.map((crumb, index) => (
                                    <div key={`${crumb.id}-${index}`} className="flex items-center gap-2 flex-shrink-0">
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                        <button
                                            onClick={() => navigateMyFoldersBreadcrumb(crumb.id, index)}
                                            className={`px-2 py-1 rounded transition-colors truncate max-w-[150px] ${index === myFoldersBreadcrumbs.length - 1 && myFoldersCurrentFolderId === crumb.id
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
                            <div className="flex-1 overflow-y-auto bg-white min-h-[300px] max-h-[400px]">
                                {myFoldersLoading ? (
                                    <div className="flex items-center justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                    </div>
                                ) : myFoldersData && myFoldersData.folders && myFoldersData.folders.length > 0 ? (
                                    <div className="p-2">
                                        {myFoldersData.folders.map((folder) => {
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
                                                        onClick={() => handleFolderSelect(folder.id, folder.name)}
                                                    >
                                                        <div className="text-sm truncate">{folder.name}</div>
                                                        {folder.description && (
                                                            <div className="text-xs text-gray-500 mt-1 truncate">{folder.description}</div>
                                                        )}
                                                    </div>

                                                    {isSelected && (
                                                        <Check className="h-4 w-4 text-blue-600 flex-shrink-0 mr-2" />
                                                    )}

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigateToMyFolder(folder.id, folder.name);
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
                                ) : (
                                    <div className="p-4 text-center text-gray-500">No folders found</div>
                                )}
                            </div>

                            {/* Pagination */}
                            {myFoldersData && myFoldersData.totalPages > 1 && (
                                <div className="p-3 border-t bg-gray-50">
                                    <Pagination
                                        currentPage={myFoldersCurrentPage}
                                        totalPages={myFoldersData.totalPages}
                                        totalElements={myFoldersData.totalElements || 0}
                                        pageSize={myFoldersPageSize}
                                        onPageChange={setMyFoldersCurrentPage}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col border rounded-lg overflow-hidden">
                            {/* Search Bar */}
                            <div className="p-3 border-b bg-gray-50">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        value={sharedSearchQuery}
                                        onChange={(e) => setSharedSearchQuery(e.target.value)}
                                        placeholder="Search shared folders..."
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            {/* Breadcrumb Navigation */}
                            <div className="p-3 border-b bg-white flex items-center gap-2 text-sm overflow-x-auto">
                                <button
                                    onClick={() => navigateSharedBreadcrumb(null)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded transition-colors flex-shrink-0 ${sharedCurrentFolderId === null
                                        ? 'font-medium text-blue-600'
                                        : 'hover:bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    <Home className="h-4 w-4" />
                                    <span>Root</span>
                                </button>

                                {sharedBreadcrumbs.map((crumb, index) => (
                                    <div key={`${crumb.id}-${index}`} className="flex items-center gap-2 flex-shrink-0">
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                        <button
                                            onClick={() => navigateSharedBreadcrumb(crumb.id, index)}
                                            className={`px-2 py-1 rounded transition-colors truncate max-w-[150px] ${index === sharedBreadcrumbs.length - 1 && sharedCurrentFolderId === crumb.id
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
                            <div className="flex-1 overflow-y-auto bg-white min-h-[300px] max-h-[400px]">
                                {sharedLoading ? (
                                    <div className="flex items-center justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                    </div>
                                ) : sharedData && sharedData.folders && sharedData.folders.length > 0 ? (
                                    <div className="p-2">
                                        {sharedData.folders.map((folder) => {
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
                                                        onClick={() => handleFolderSelect(folder.id, folder.name)}
                                                    >
                                                        <div className="text-sm truncate">{folder.name}</div>
                                                        {folder.description && (
                                                            <div className="text-xs text-gray-500 mt-1 truncate">{folder.description}</div>
                                                        )}
                                                    </div>

                                                    {isSelected && (
                                                        <Check className="h-4 w-4 text-blue-600 flex-shrink-0 mr-2" />
                                                    )}

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigateToSharedFolder(folder.id, folder.name);
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
                                ) : (
                                    <div className="p-4 text-center text-gray-500">No folders found</div>
                                )}
                            </div>

                            {/* Pagination */}
                            {sharedData && sharedData.totalPages > 1 && (
                                <div className="p-3 border-t bg-gray-50">
                                    <Pagination
                                        currentPage={sharedCurrentPage}
                                        totalPages={sharedData.totalPages}
                                        totalElements={sharedData.totalElements || 0}
                                        pageSize={sharedPageSize}
                                        onPageChange={setSharedCurrentPage}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
