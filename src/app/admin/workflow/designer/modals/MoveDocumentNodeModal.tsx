'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, FolderInput, Search, Loader2, Folder, Home, ChevronRight, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { folderService } from '@/api/services/folderService';
import { FolderRepoResDto, FolderResDto } from '@/types/api';
import Pagination from '@/components/main/Pagination';
import { WorkflowNodeData } from '../nodes/types';

interface MoveDocumentNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

export default function MoveDocumentNodeModal({ isOpen, onClose, nodeData, onSave }: MoveDocumentNodeModalProps) {
    const [activeTab, setActiveTab] = useState<'folders' | 'shared'>('folders');

    // My Folders state
    const [myFoldersData, setMyFoldersData] = useState<FolderRepoResDto | null>(null);
    const [myFoldersLoading, setMyFoldersLoading] = useState(false);
    const [myFoldersCurrentFolderId, setMyFoldersCurrentFolderId] = useState<number | null>(null);
    const [myFoldersBreadcrumbs, setMyFoldersBreadcrumbs] = useState<Array<{ id: number; name: string }>>([]);
    const [myFoldersSearchQuery, setMyFoldersSearchQuery] = useState('');
    const [myFoldersCurrentPage, setMyFoldersCurrentPage] = useState(0);

    // Shared Folders state
    const [sharedData, setSharedData] = useState<FolderRepoResDto | null>(null);
    const [sharedLoading, setSharedLoading] = useState(false);
    const [sharedCurrentFolderId, setSharedCurrentFolderId] = useState<number | null>(null);
    const [sharedBreadcrumbs, setSharedBreadcrumbs] = useState<Array<{ id: number; name: string }>>([]);
    const [sharedSearchQuery, setSharedSearchQuery] = useState('');
    const [sharedCurrentPage, setSharedCurrentPage] = useState(0);

    const [selectedFolder, setSelectedFolder] = useState<{ id: number; name: string; path?: string } | null>(null);
    const pageSize = 20;

    // Load My Folders
    const loadMyFolders = useCallback(async () => {
        setMyFoldersLoading(true);
        try {
            if (myFoldersCurrentFolderId) {
                // Loading subfolder contents
                const response = await folderService.getFolderContents(
                    myFoldersCurrentFolderId,
                    myFoldersCurrentPage,
                    pageSize,
                    myFoldersSearchQuery || undefined,
                    true // showFolder
                );
                setMyFoldersData(response);
            } else {
                // Loading root repository
                const response = await folderService.getMyRepository(
                    myFoldersCurrentPage,
                    pageSize,
                    myFoldersSearchQuery || undefined
                );
                // Transform PageResponse<FolderResDto> to FolderRepoResDto format
                setMyFoldersData({
                    folders: response.content,
                    documents: [],
                    totalElements: response.totalElements,
                    totalPages: response.totalPages,
                    pageable: {
                        pageNumber: response.number,
                        pageSize: response.size,
                    },
                } as any);
            }
        } catch (error) {
            console.error('Failed to load folders:', error);
        } finally {
            setMyFoldersLoading(false);
        }
    }, [myFoldersCurrentFolderId, myFoldersCurrentPage, myFoldersSearchQuery]);

    // Load Shared Folders
    const loadSharedFolders = useCallback(async () => {
        setSharedLoading(true);
        try {
            if (sharedCurrentFolderId) {
                // Loading subfolder contents
                const response = await folderService.getFolderContents(
                    sharedCurrentFolderId,
                    sharedCurrentPage,
                    pageSize,
                    sharedSearchQuery || undefined,
                    true // showFolder
                );
                setSharedData(response);
            } else {
                // Loading shared root folders
                const response = await folderService.getSharedFolders(
                    sharedCurrentPage,
                    pageSize,
                    sharedSearchQuery || undefined
                );
                setSharedData(response);
            }
        } catch (error) {
            console.error('Failed to load shared folders:', error);
        } finally {
            setSharedLoading(false);
        }
    }, [sharedCurrentFolderId, sharedCurrentPage, sharedSearchQuery]);

    useEffect(() => {
        if (isOpen && activeTab === 'folders') {
            loadMyFolders();
        }
    }, [isOpen, activeTab, loadMyFolders]);

    useEffect(() => {
        if (isOpen && activeTab === 'shared') {
            loadSharedFolders();
        }
    }, [isOpen, activeTab, loadSharedFolders]);

    // Initialize from nodeData
    useEffect(() => {
        if (isOpen && nodeData.destinationFolderId) {
            setSelectedFolder({
                id: nodeData.destinationFolderId,
                name: nodeData.destinationFolderName || 'Selected Folder',
                path: nodeData.destinationFolderPath,
            });
        }
    }, [isOpen, nodeData]);

    const navigateToFolder = (folderId: number, folderName: string, isShared: boolean) => {
        if (isShared) {
            setSharedBreadcrumbs([...sharedBreadcrumbs, { id: folderId, name: folderName }]);
            setSharedCurrentFolderId(folderId);
            setSharedCurrentPage(0);
        } else {
            setMyFoldersBreadcrumbs([...myFoldersBreadcrumbs, { id: folderId, name: folderName }]);
            setMyFoldersCurrentFolderId(folderId);
            setMyFoldersCurrentPage(0);
        }
    };

    const navigateBreadcrumb = (index: number | null, isShared: boolean) => {
        if (isShared) {
            if (index === null) {
                setSharedBreadcrumbs([]);
                setSharedCurrentFolderId(null);
            } else {
                setSharedBreadcrumbs(sharedBreadcrumbs.slice(0, index + 1));
                setSharedCurrentFolderId(sharedBreadcrumbs[index].id);
            }
            setSharedCurrentPage(0);
        } else {
            if (index === null) {
                setMyFoldersBreadcrumbs([]);
                setMyFoldersCurrentFolderId(null);
            } else {
                setMyFoldersBreadcrumbs(myFoldersBreadcrumbs.slice(0, index + 1));
                setMyFoldersCurrentFolderId(myFoldersBreadcrumbs[index].id);
            }
            setMyFoldersCurrentPage(0);
        }
    };

    const handleFolderSelect = (folder: FolderResDto) => {
        setSelectedFolder({
            id: folder.id,
            name: folder.name,
            path: folder.path,
        });
    };

    const handleSave = () => {
        if (selectedFolder) {
            onSave({
                destinationFolderId: selectedFolder.id,
                destinationFolderName: selectedFolder.name,
                destinationFolderPath: selectedFolder.path,
            });
        }
        onClose();
    };

    if (!isOpen) return null;

    const currentData = activeTab === 'folders' ? myFoldersData : sharedData;
    const currentLoading = activeTab === 'folders' ? myFoldersLoading : sharedLoading;
    const currentBreadcrumbs = activeTab === 'folders' ? myFoldersBreadcrumbs : sharedBreadcrumbs;
    const currentFolderId = activeTab === 'folders' ? myFoldersCurrentFolderId : sharedCurrentFolderId;
    const currentPage = activeTab === 'folders' ? myFoldersCurrentPage : sharedCurrentPage;
    const setCurrentPage = activeTab === 'folders' ? setMyFoldersCurrentPage : setSharedCurrentPage;
    const searchQuery = activeTab === 'folders' ? myFoldersSearchQuery : sharedSearchQuery;
    const setSearchQuery = activeTab === 'folders' ? setMyFoldersSearchQuery : setSharedSearchQuery;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-emerald-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                            <FolderInput className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Select Destination Folder</h3>
                            <p className="text-sm text-gray-500">Choose where to move the document</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b px-6 pt-4">
                    <button
                        onClick={() => setActiveTab('folders')}
                        className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'folders'
                            ? 'border-emerald-600 text-emerald-600'
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
                            ? 'border-emerald-600 text-emerald-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Share2 className="h-4 w-4" />
                            Shared with Me
                        </div>
                    </button>
                </div>

                {/* Search & Breadcrumbs */}
                <div className="p-4 border-b space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search folders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-1 text-sm overflow-x-auto">
                        <button
                            onClick={() => navigateBreadcrumb(null, activeTab === 'shared')}
                            className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 ${!currentFolderId ? 'text-emerald-600 font-medium' : 'text-gray-600'
                                }`}
                        >
                            <Home className="w-4 h-4" />
                            <span>Root</span>
                        </button>
                        {currentBreadcrumbs.map((crumb, index) => (
                            <div key={crumb.id} className="flex items-center">
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                <button
                                    onClick={() => navigateBreadcrumb(index, activeTab === 'shared')}
                                    className={`px-2 py-1 rounded hover:bg-gray-100 ${index === currentBreadcrumbs.length - 1
                                        ? 'text-emerald-600 font-medium'
                                        : 'text-gray-600'
                                        }`}
                                >
                                    {crumb.name}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {currentLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        </div>
                    ) : !currentData || currentData.folders.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Folder className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No folders found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {currentData.folders.map((folder) => (
                                <div
                                    key={folder.id}
                                    className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${selectedFolder?.id === folder.id
                                        ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                                        : 'border-gray-200 hover:border-emerald-300'
                                        }`}
                                    onClick={() => handleFolderSelect(folder)}
                                    onDoubleClick={() => navigateToFolder(folder.id, folder.name, activeTab === 'shared')}
                                >
                                    {selectedFolder?.id === folder.id && (
                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                    <Folder className="w-10 h-10 text-emerald-500 mb-2" />
                                    <p className="font-medium text-sm truncate">{folder.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{folder.path}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {currentData && currentData.totalPages > 1 && (
                    <div className="border-t p-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={currentData.totalPages}
                            totalElements={currentData.totalElements}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}

                {/* Selected Preview */}
                {selectedFolder && (
                    <div className="border-t p-4 bg-emerald-50">
                        <div className="flex items-center gap-4">
                            <Folder className="w-10 h-10 text-emerald-500" />
                            <div className="flex-1">
                                <p className="font-semibold">{selectedFolder.name}</p>
                                <p className="text-sm text-gray-500">{selectedFolder.path}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!selectedFolder}
                        className="bg-emerald-500 hover:bg-emerald-600"
                    >
                        Select Folder
                    </Button>
                </div>
            </div>
        </div>
    );
}
