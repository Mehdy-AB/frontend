'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Zap, Folder, FileType, Search, Loader2, ChevronRight, Home, ChevronLeft as ChevronLeftIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { folderService } from '@/api/services/folderService';
import { filingCategoryService } from '@/api/services/filingCategoryService';
import { FolderResDto, FilingCategoryResponseDto } from '@/types/api';
import { WorkflowNodeData } from '../nodes/types';
// ChevronLeft is already imported above as ChevronLeftIcon

interface TriggerNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

type TriggerType = 'FOLDER' | 'MODEL' | null;

export default function TriggerNodeModal({ isOpen, onClose, nodeData, onSave }: TriggerNodeModalProps) {
    const [triggerType, setTriggerType] = useState<TriggerType>(null);

    // Folder state
    const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
    const [selectedFolderName, setSelectedFolderName] = useState<string>('');
    const [folders, setFolders] = useState<FolderResDto[]>([]);
    const [folderLoading, setFolderLoading] = useState(false);
    const [folderPage, setFolderPage] = useState(0);
    const [folderTotalPages, setFolderTotalPages] = useState(1);
    const [breadcrumbs, setBreadcrumbs] = useState<{ id: number | null; name: string }[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);

    // Model state
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
    const [categories, setCategories] = useState<FilingCategoryResponseDto[]>([]);
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');
    const [categoryPage, setCategoryPage] = useState(0);
    const [categoryTotalPages, setCategoryTotalPages] = useState(1);

    // Initialize from nodeData
    useEffect(() => {
        if (isOpen) {
            if (nodeData.triggerFolderId) {
                setTriggerType('FOLDER');
                setSelectedFolderId(nodeData.triggerFolderId);
                setSelectedFolderName(nodeData.triggerFolderName || '');
            } else if (nodeData.triggerCategoryId) {
                setTriggerType('MODEL');
                setSelectedCategoryId(nodeData.triggerCategoryId);
                setSelectedCategoryName(nodeData.triggerCategoryName || '');
            }
        }
    }, [isOpen, nodeData]);

    // Load folders
    const loadFolders = useCallback(async (parentId: number | null = null, page = 0) => {
        setFolderLoading(true);
        try {
            const response = await folderService.getMyRepository(page, 10);
            setFolders(response.content);
            setFolderTotalPages(response.totalPages);
            setFolderPage(page);
        } catch (error) {
            console.error('Failed to load folders:', error);
        } finally {
            setFolderLoading(false);
        }
    }, []);

    // Load categories
    const loadCategories = useCallback(async (search = '', page = 0) => {
        setCategoryLoading(true);
        try {
            const response = search
                ? await filingCategoryService.searchFilingCategories(search, page, 10)
                : await filingCategoryService.getAllFilingCategories({ page, size: 10 });
            setCategories(response.content);
            setCategoryTotalPages(response.totalPages);
            setCategoryPage(page);
        } catch (error) {
            console.error('Failed to load categories:', error);
        } finally {
            setCategoryLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen && triggerType === 'FOLDER') {
            loadFolders(currentFolderId, folderPage);
        }
    }, [isOpen, triggerType, currentFolderId, folderPage, loadFolders]);

    useEffect(() => {
        if (isOpen && triggerType === 'MODEL') {
            loadCategories(categorySearch, categoryPage);
        }
    }, [isOpen, triggerType, categorySearch, categoryPage, loadCategories]);

    const navigateToFolder = (folderId: number | null, folderName: string) => {
        setCurrentFolderId(folderId);
        setFolderPage(0);
        if (folderId === null) {
            setBreadcrumbs([]);
        } else {
            setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
        }
    };

    const navigateToBreadcrumb = (index: number) => {
        const crumb = breadcrumbs[index];
        setCurrentFolderId(crumb?.id ?? null);
        setFolderPage(0);
        setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    };

    const handleSave = () => {
        const data: Partial<WorkflowNodeData> = {};

        if (triggerType === 'FOLDER' && selectedFolderId) {
            data.triggerType = 'FOLDER';
            data.triggerFolderId = selectedFolderId;
            data.triggerFolderName = selectedFolderName;
            data.triggerCategoryId = undefined;
            data.triggerCategoryName = undefined;
        } else if (triggerType === 'MODEL' && selectedCategoryId) {
            data.triggerType = 'MODEL';
            data.triggerCategoryId = selectedCategoryId;
            data.triggerCategoryName = selectedCategoryName;
            data.triggerFolderId = undefined;
            data.triggerFolderName = undefined;
        }

        onSave(data);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Configure Trigger</h3>
                            <p className="text-sm text-gray-500">Set when this workflow starts</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Trigger Type Selection */}
                    <div>
                        <Label className="text-sm font-medium mb-3 block">Trigger Type</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setTriggerType('FOLDER')}
                                className={`p-4 rounded-xl border-2 transition-all ${triggerType === 'FOLDER'
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <Folder className={`w-6 h-6 mx-auto mb-2 ${triggerType === 'FOLDER' ? 'text-green-600' : 'text-gray-400'}`} />
                                <div className={`text-sm font-medium ${triggerType === 'FOLDER' ? 'text-green-700' : 'text-gray-600'}`}>
                                    Folder Upload
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Trigger on file upload
                                </div>
                            </button>
                            <button
                                onClick={() => setTriggerType('MODEL')}
                                className={`p-4 rounded-xl border-2 transition-all ${triggerType === 'MODEL'
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <FileType className={`w-6 h-6 mx-auto mb-2 ${triggerType === 'MODEL' ? 'text-green-600' : 'text-gray-400'}`} />
                                <div className={`text-sm font-medium ${triggerType === 'MODEL' ? 'text-green-700' : 'text-gray-600'}`}>
                                    Document Model
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Trigger by category
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Folder Selection */}
                    {triggerType === 'FOLDER' && (
                        <div>
                            <Label className="text-sm font-medium mb-2 block">Select Folder</Label>

                            {/* Breadcrumbs */}
                            <div className="flex items-center gap-1 text-sm text-gray-600 mb-3 flex-wrap">
                                <button
                                    onClick={() => { setCurrentFolderId(null); setBreadcrumbs([]); setFolderPage(0); }}
                                    className="hover:text-green-600 flex items-center gap-1"
                                >
                                    <Home className="w-4 h-4" />
                                    <span>Root</span>
                                </button>
                                {breadcrumbs.map((crumb, idx) => (
                                    <div key={crumb.id} className="flex items-center gap-1">
                                        <ChevronRight className="w-3 h-3" />
                                        <button
                                            onClick={() => navigateToBreadcrumb(idx)}
                                            className="hover:text-green-600"
                                        >
                                            {crumb.name}
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Folder List */}
                            <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                                {folderLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                                    </div>
                                ) : folders.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 text-sm">
                                        No folders found
                                    </div>
                                ) : (
                                    folders.map((folder) => (
                                        <div
                                            key={folder.id}
                                            className={`flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer ${selectedFolderId === folder.id ? 'bg-green-50' : ''
                                                }`}
                                        >
                                            <button
                                                onClick={() => {
                                                    setSelectedFolderId(folder.id);
                                                    setSelectedFolderName(folder.name);
                                                }}
                                                className="flex items-center gap-2 flex-1"
                                            >
                                                <Folder className={`w-4 h-4 ${selectedFolderId === folder.id ? 'text-green-600' : 'text-yellow-500'}`} />
                                                <span className="text-sm truncate">{folder.name}</span>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {folderTotalPages > 1 && (
                                <div className="mt-3 flex items-center justify-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setFolderPage(p => Math.max(0, p - 1))}
                                        disabled={folderPage === 0}
                                    >
                                        <ChevronLeftIcon className="w-4 h-4" />
                                    </Button>
                                    <span className="text-sm text-gray-600">
                                        {folderPage + 1} / {folderTotalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setFolderPage(p => Math.min(folderTotalPages - 1, p + 1))}
                                        disabled={folderPage >= folderTotalPages - 1}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}

                            {selectedFolderId && (
                                <div className="mt-3 p-2 bg-green-50 rounded-lg text-sm text-green-700">
                                    Selected: <strong>{selectedFolderName}</strong>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Model Selection */}
                    {triggerType === 'MODEL' && (
                        <div>
                            <Label className="text-sm font-medium mb-2 block">Select Document Model</Label>

                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search models..."
                                    value={categorySearch}
                                    onChange={(e) => { setCategorySearch(e.target.value); setCategoryPage(0); }}
                                    className="pl-10"
                                />
                            </div>

                            <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                                {categoryLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                                    </div>
                                ) : categories.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 text-sm">
                                        No models found
                                    </div>
                                ) : (
                                    categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                setSelectedCategoryId(cat.id);
                                                setSelectedCategoryName(cat.name);
                                            }}
                                            className={`w-full flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-gray-50 text-left ${selectedCategoryId === cat.id ? 'bg-green-50' : ''
                                                }`}
                                        >
                                            <FileType className={`w-4 h-4 ${selectedCategoryId === cat.id ? 'text-green-600' : 'text-gray-400'}`} />
                                            <div>
                                                <div className="text-sm font-medium">{cat.name}</div>
                                                {cat.description && (
                                                    <div className="text-xs text-gray-500 truncate max-w-[250px]">
                                                        {cat.description}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>

                            {categoryTotalPages > 1 && (
                                <div className="mt-3 flex items-center justify-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCategoryPage(p => Math.max(0, p - 1))}
                                        disabled={categoryPage === 0}
                                    >
                                        <ChevronLeftIcon className="w-4 h-4" />
                                    </Button>
                                    <span className="text-sm text-gray-600">
                                        {categoryPage + 1} / {categoryTotalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCategoryPage(p => Math.min(categoryTotalPages - 1, p + 1))}
                                        disabled={categoryPage >= categoryTotalPages - 1}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}

                            {selectedCategoryId && (
                                <div className="mt-3 p-2 bg-green-50 rounded-lg text-sm text-green-700">
                                    Selected: <strong>{selectedCategoryName}</strong>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!triggerType || (triggerType === 'FOLDER' && !selectedFolderId) || (triggerType === 'MODEL' && !selectedCategoryId)}
                        className="bg-green-500 hover:bg-green-600"
                    >
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
