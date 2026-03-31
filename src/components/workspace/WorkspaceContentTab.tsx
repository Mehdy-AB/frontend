'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    FolderOpen, Search, Plus, Upload, RefreshCw, Home, ChevronRight, Folder
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { FolderResDto, DocumentResponseDto } from '@/types/api';
import { UnifiedTableView } from '@/components/folder';
import FileUploadModal from '@/components/modals/FileUploadModal';

type TableItem = (FolderResDto & { type: 'folder' }) | (DocumentResponseDto & { type: 'document' });

interface BreadcrumbItem {
    id: number;
    name: string;
}

interface WorkspaceContentTabProps {
    workspaceName: string;
    folders: FolderResDto[];
    documents: DocumentResponseDto[];
    currentFolderId: number | null;
    breadcrumbs: BreadcrumbItem[];
    contentSearch: string;
    contentLoading: boolean;
    showCreateFolder: boolean;
    newFolderName: string;
    onContentSearchChange: (v: string) => void;
    onRefresh: () => void;
    onCreateFolder: () => void;
    onSetShowCreateFolder: (v: boolean) => void;
    onNewFolderNameChange: (v: string) => void;
    onNavigateToFolder: (folderId: number, folderName: string) => void;
    onNavigateToBreadcrumb: (index: number) => void;
    folderData: { folder?: FolderResDto } | null;
    onUploadSuccess: () => void;
}

export default function WorkspaceContentTab({
    workspaceName,
    folders,
    documents,
    currentFolderId,
    breadcrumbs,
    contentSearch,
    contentLoading,
    showCreateFolder,
    newFolderName,
    onContentSearchChange,
    onRefresh,
    onCreateFolder,
    onSetShowCreateFolder,
    onNewFolderNameChange,
    onNavigateToFolder,
    onNavigateToBreadcrumb,
    folderData,
    onUploadSuccess,
}: WorkspaceContentTabProps) {
    const router = useRouter();
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Format helpers
    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
    const formatFileSize = (bytes: number) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // Build unified table items
    const tableItems: TableItem[] = [
        ...folders.map(f => ({ ...f, type: 'folder' as const })),
        ...documents.map(d => ({ ...d, type: 'document' as const })),
    ];

    // Handlers for table row actions
    const handleView = (item: TableItem) => {
        if (item.type === 'folder') {
            onNavigateToFolder(item.id, item.name);
        } else {
            router.push(`/documents/${item.documentId}`);
        }
    };

    const handleDownload = (item: TableItem) => {
        if (item.type === 'document') {
            window.open(`/documents/${item.documentId}/download`, '_blank');
        }
    };

    return (
        <div className="space-y-4">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1 text-sm">
                <button onClick={() => onNavigateToBreadcrumb(-1)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                    <Home className="h-3.5 w-3.5" /><span className="font-medium">{workspaceName}</span>
                </button>
                {breadcrumbs.map((bc, i) => (
                    <div key={bc.id} className="flex items-center gap-1">
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                        <button onClick={() => onNavigateToBreadcrumb(i)}
                            className="px-2 py-1 rounded-lg hover:bg-blue-50 text-blue-600 font-medium transition-colors">
                            {bc.name}
                        </button>
                    </div>
                ))}
                {breadcrumbs.length > 0 && folderData?.folder && (
                    <div className="flex items-center gap-1">
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                        <span className="px-2 py-1 font-medium text-gray-900">{folderData.folder.name}</span>
                    </div>
                )}
            </div>

            {/* Content Toolbar */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input value={contentSearch} onChange={e => onContentSearchChange(e.target.value)}
                        placeholder="Search files and folders..."
                        className="pl-10 h-10 rounded-xl border-gray-200" />
                </div>
                <Button size="sm" variant="outline" onClick={onRefresh}
                    className="rounded-xl h-10 px-4 border-blue-200 text-blue-600">
                    <RefreshCw className="h-4 w-4 mr-1" />Refresh
                </Button>
                <Button size="sm" variant="outline" onClick={() => onSetShowCreateFolder(true)}
                    className="rounded-xl h-10 px-4 border-blue-200 text-blue-600">
                    <Plus className="h-4 w-4 mr-1" />New Folder
                </Button>
                <Button size="sm" onClick={() => setShowUploadModal(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-10 px-4">
                    <Upload className="h-4 w-4 mr-1" />Upload
                </Button>
            </div>

            {/* Create Folder Inline */}
            {showCreateFolder && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <Folder className="h-5 w-5 text-blue-500" />
                    <Input value={newFolderName} onChange={e => onNewFolderNameChange(e.target.value)}
                        placeholder="Folder name..."
                        className="flex-1 h-9 rounded-lg border-blue-200"
                        onKeyDown={e => e.key === 'Enter' && onCreateFolder()} />
                    <Button size="sm" onClick={onCreateFolder}
                        className="bg-blue-500 text-white rounded-lg text-xs h-9">Create</Button>
                    <Button size="sm" variant="outline" onClick={() => { onSetShowCreateFolder(false); onNewFolderNameChange(''); }}
                        className="rounded-lg text-xs h-9">Cancel</Button>
                </div>
            )}

            {/* Content Table */}
            {contentLoading ? (
                <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <UnifiedTableView
                            items={tableItems}
                            formatFileSize={formatFileSize}
                            formatDate={formatDate}
                            currentFolderId={currentFolderId || 0}
                            onView={handleView}
                            onDownload={handleDownload}
                            openDropdownId={openDropdownId}
                            setOpenDropdownId={setOpenDropdownId}
                            showOwner={false}
                        />
                        {tableItems.length === 0 && (
                            <div className="px-4 py-16 text-center">
                                <FolderOpen className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                                <h3 className="text-sm font-semibold text-gray-900 mb-1">No content yet</h3>
                                <p className="text-sm text-gray-400 mb-4">Upload documents or create folders to get started</p>
                                <div className="flex items-center justify-center gap-3">
                                    <Button size="sm" variant="outline" onClick={() => onSetShowCreateFolder(true)}
                                        className="rounded-xl text-xs">
                                        <Plus className="h-3.5 w-3.5 mr-1" />New Folder
                                    </Button>
                                    <Button size="sm" onClick={() => setShowUploadModal(true)}
                                        className="bg-blue-500 text-white rounded-xl text-xs">
                                        <Upload className="h-3.5 w-3.5 mr-1" />Upload
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Upload Modal */}
            {showUploadModal && currentFolderId && (
                <FileUploadModal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    folderId={currentFolderId}
                    onSuccess={() => { setShowUploadModal(false); onUploadSuccess(); }}
                />
            )}
        </div>
    );
}
