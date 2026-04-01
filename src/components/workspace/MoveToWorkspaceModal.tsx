'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, FolderInput, Globe, ChevronRight, FolderOpen, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    workspaceService, WorkspaceDto, WorkspaceStatsDto,
} from '@/api/services/workspaceService';

interface MoveToWorkspaceModalProps {
    open: boolean;
    onClose: () => void;
    /** Item being moved */
    itemName: string;
    itemType: 'folder' | 'document';
    /** Called after user confirms — parent should call folder service move() */
    onConfirm: (workspaceId: string, targetFolderId: number) => void;
}

interface FolderNode {
    id: number;
    name: string;
    parentId: number | null;
}

export default function MoveToWorkspaceModal({ open, onClose, itemName, itemType, onConfirm }: MoveToWorkspaceModalProps) {
    const [step, setStep] = useState<'workspace' | 'folder'>('workspace');
    const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceDto | null>(null);
    const [folders, setFolders] = useState<FolderNode[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch user's workspaces
    useEffect(() => {
        if (!open) return;
        setStep('workspace');
        setSelectedWorkspace(null);
        setSelectedFolderId(null);
        setError('');
        (async () => {
            setLoading(true);
            try {
                const res = await workspaceService.getMyWorkspaces(0, 100);
                setWorkspaces(res.content);
            } catch {
                setError('Failed to load workspaces');
            } finally {
                setLoading(false);
            }
        })();
    }, [open]);

    // Fetch root folders of selected workspace
    const loadWorkspaceFolders = useCallback(async (ws: WorkspaceDto) => {
        setLoading(true);
        try {
            const res = await workspaceService.listWorkspaceFolders(ws.id, { page: 0, size: 100 });
            // The root folder is the workspace's rootFolderId
            const folderItems = (res.content as FolderNode[]) || [];
            setFolders(folderItems);
            // Default select root folder
            setSelectedFolderId(ws.rootFolderId);
        } catch {
            setError('Failed to load workspace folders');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSelectWorkspace = (ws: WorkspaceDto) => {
        setSelectedWorkspace(ws);
        setStep('folder');
        loadWorkspaceFolders(ws);
    };

    const handleConfirm = () => {
        if (!selectedWorkspace || selectedFolderId === null) return;
        onConfirm(selectedWorkspace.id, selectedFolderId);
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[80vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-500 rounded-xl flex items-center justify-center">
                            <FolderInput className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Move to Workspace</h2>
                            <p className="text-sm text-gray-500">
                                Moving <span className="font-medium text-gray-700">{itemName}</span> ({itemType})
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Step indicator */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                    <div className={`flex items-center gap-1.5 text-sm font-medium ${step === 'workspace' ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${step === 'workspace' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
                        Workspace
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                    <div className={`flex items-center gap-1.5 text-sm font-medium ${step === 'folder' ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${step === 'folder' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                        Target Folder
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : step === 'workspace' ? (
                        <div className="space-y-2">
                            {workspaces.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <Globe className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                                    <p className="text-sm">You are not a member of any workspace</p>
                                </div>
                            ) : (
                                workspaces.map(ws => (
                                    <button key={ws.id} type="button" onClick={() => handleSelectWorkspace(ws)}
                                        className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left group">
                                        <div className="h-10 w-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Globe className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-gray-900 truncate group-hover:text-blue-600">{ws.name}</p>
                                            <p className="text-xs text-gray-400 font-mono">{ws.code}</p>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-400" />
                                    </button>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {/* Root folder option */}
                            {selectedWorkspace?.rootFolderId && (
                                <button type="button"
                                    onClick={() => setSelectedFolderId(selectedWorkspace.rootFolderId!)}
                                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${selectedFolderId === selectedWorkspace.rootFolderId
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-100 hover:border-blue-200'}`}>
                                    <FolderOpen className="h-5 w-5 text-blue-500" />
                                    <div>
                                        <p className="font-medium text-gray-900">📁 Root Folder</p>
                                        <p className="text-xs text-gray-400">Move directly to workspace root</p>
                                    </div>
                                    {selectedFolderId === selectedWorkspace.rootFolderId && (
                                        <CheckCircle className="h-5 w-5 text-blue-500 ml-auto" />
                                    )}
                                </button>
                            )}
                            {/* Sub-folders */}
                            {folders.map((f: FolderNode) => (
                                <button key={f.id} type="button" onClick={() => setSelectedFolderId(f.id)}
                                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${selectedFolderId === f.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-100 hover:border-blue-200'}`}>
                                    <FolderOpen className="h-5 w-5 text-blue-400" />
                                    <p className="font-medium text-gray-700">{f.name}</p>
                                    {selectedFolderId === f.id && (
                                        <CheckCircle className="h-5 w-5 text-blue-500 ml-auto" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />{error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <div>
                        {step === 'folder' && (
                            <Button variant="outline" onClick={() => setStep('workspace')} className="rounded-xl">
                                Back
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
                        {step === 'folder' && (
                            <Button onClick={handleConfirm}
                                disabled={selectedFolderId === null}
                                className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-6">
                                Move Here
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
