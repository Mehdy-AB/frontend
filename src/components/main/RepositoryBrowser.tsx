'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Folder,
    FileText,
    Search,
    ChevronRight,
    Home,
    Download,
    ExternalLink,
    Users as UsersIcon,
    Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { notificationApiClient } from '@/api/notificationClient';
import { FolderRepoResDto, SortFields, DocumentResponseDto } from '@/types/api';
import { formatDate } from '@/lib/dateFormatter';
import Pagination from '@/components/main/Pagination';

interface RepositoryBrowserProps {
    userId: string;
    className?: string;
}

interface BreadcrumbItem {
    id: number;
    name: string;
}

export default function RepositoryBrowser({ userId, className = '' }: RepositoryBrowserProps) {
    const router = useRouter();

    // State
    const [data, setData] = useState<FolderRepoResDto | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Navigation & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize] = useState(20);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Reset page on search
    useEffect(() => {
        setCurrentPage(0);
    }, [debouncedQuery]);

    // Load Data - Only fetch user's root folders
    const loadData = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);
        try {
            // Fetch user's root folders list with pagination
            const responseData = await notificationApiClient.getUserRepository(userId, {
                page: currentPage,
                size: pageSize,
                name: debouncedQuery || undefined,
                sort: SortFields.NAME,
                desc: false
            });

            if (responseData && responseData.content) {
                // Transform the root folders into a format compatible with FolderRepoResDto
                const rootFolders = responseData.content;

                setData({
                    folders: rootFolders,
                    documents: [],
                    pageable: { pageNumber: responseData.number || 0, pageSize: responseData.size || pageSize },
                    totalElements: responseData.totalElements || rootFolders.length,
                    totalPages: responseData.totalPages || 1
                });
            } else {
                // No repository found
                setData({
                    folders: [],
                    documents: [],
                    pageable: { pageNumber: 0, pageSize: pageSize },
                    totalElements: 0,
                    totalPages: 0
                });
            }

        } catch (err: any) {
            console.error('Error loading repository:', err);
            setError('Failed to load repository contents');
        } finally {
            setLoading(false);
        }
    }, [userId, currentPage, pageSize, debouncedQuery]);

    useEffect(() => {
        loadData();
    }, [loadData]);


    // Handlers
    const handleFolderClick = (folderId: number) => {
        // Navigate to the folder details page
        router.push(`/folders/${folderId}`);
    };

    const handleBreadcrumbClick = (id: number) => {
        // Navigate to the folder details page
        router.push(`/folders/${id}`);
    };

    const handleOpenDocument = (docId: string) => {
        router.push(`/documents/${docId}`);
    };

    const handleDownloadDocument = async (doc: DocumentResponseDto) => {
        try {
            const documentId = Number(doc.documentId);
            await notificationApiClient.downloadDocument(documentId);
        } catch (error) {
            console.error('Error downloading document:', error);
        }
    };


    return (
        <div className={`space-y-4 ${className}`}>
            {/* Top Bar: Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search repositories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Content Area */}
            <div className="border rounded-lg min-h-[400px] bg-background">
                {loading && !data ? ( // Only show full loader if initial load
                    <div className="flex items-center justify-center h-[400px]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-destructive">
                        <p>{error}</p>
                        <Button variant="outline" size="sm" onClick={() => loadData()} className="mt-4">Retry</Button>
                    </div>
                ) : (
                    <div className="flex flex-col h-full bg-white">
                        {/* Table */}
                        <div className="flex-1 overflow-auto">
                            {loading && !data ? (
                                <div className="flex items-center justify-center h-[400px]">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : !loading && data?.folders.length === 0 && data?.documents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <Folder className="h-12 w-12 opacity-20 mb-2" />
                                    <p>This folder is empty</p>
                                </div>
                            ) : (
                                <table className="w-full relative">
                                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                                        <tr>
                                            <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide w-[300px]">Name</th>
                                            <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Size</th>
                                            <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Created At</th>
                                            <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide w-[120px]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Folders */}
                                        {data?.folders.map(folder => (
                                            <tr
                                                key={`folder-${folder.id}`}
                                                className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                                                onClick={() => handleFolderClick(folder.id)}
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <Folder className="h-5 w-5 text-blue-500" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-medium text-gray-900 truncate">{folder.name}</div>
                                                            {folder.description && (
                                                                <div className="text-sm text-gray-500 truncate">{folder.description}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm text-gray-600">
                                                    —
                                                </td>
                                                <td className="p-4 text-sm text-gray-600">
                                                    {formatDate(folder.createdAt)}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8"
                                                            onClick={(e) => { e.stopPropagation(); handleFolderClick(folder.id); }}
                                                        >
                                                            <ExternalLink className="h-4 w-4 text-gray-500" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}

                                        {/* Documents */}
                                        {data?.documents.map(doc => (
                                            <tr
                                                key={`doc-${doc.documentId}`}
                                                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <FileText className="h-5 w-5 text-green-500" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-medium text-gray-900 truncate">{doc.title}</div>
                                                            {doc.description && (
                                                                <div className="text-sm text-gray-500 truncate">{doc.description}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm text-gray-600">
                                                    —
                                                </td>
                                                <td className="p-4 text-sm text-gray-600">
                                                    {formatDate(doc.createdAt)}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-1">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-8 w-8"
                                                                    onClick={(e) => { e.stopPropagation(); handleDownloadDocument(doc); }}
                                                                >
                                                                    <Download className="h-4 w-4 text-gray-500" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Download</p></TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-8 w-8"
                                                                    onClick={(e) => { e.stopPropagation(); handleOpenDocument(String(doc.documentId)); }}
                                                                >
                                                                    <ExternalLink className="h-4 w-4 text-gray-500" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Open</TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}

                                        {/* Loading rows */}
                                        {loading && [...Array(3)].map((_, i) => (
                                            <tr key={`loading-${i}`} className="border-b border-gray-100">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
                                                        <div className="space-y-2">
                                                            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                                                            <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Pagination */}
                        <div className="p-4 border-t bg-gray-50">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={data?.totalPages || 0}
                                onPageChange={setCurrentPage}
                                pageSize={pageSize}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
