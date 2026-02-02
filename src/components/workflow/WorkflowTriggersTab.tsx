import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Zap,
    Plus,
    Folder,
    Trash2,
    Play,
    Pause,
    AlertCircle,
    Loader2,
    FolderOpen,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { useNotifications } from '@/hooks/useNotifications';
import { WorkflowTriggerResponse, FilingCategoryResponseDto } from '@/types/api';
import FolderPickerModal from '@/components/modals/FolderPickerModal';
import { filingCategoryService } from '@/api/services/filingCategoryService';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';
import ServerSearchInput from '@/components/main/ServerSearchInput';

interface WorkflowTriggersTabProps {
    workflowId: number;
}

export default function WorkflowTriggersTab({ workflowId }: WorkflowTriggersTabProps) {
    const { showSuccess, showError } = useNotifications();
    const [triggers, setTriggers] = useState<WorkflowTriggerResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [triggerToDelete, setTriggerToDelete] = useState<WorkflowTriggerResponse | null>(null);

    // Add Trigger State
    const [triggerType, setTriggerType] = useState<'FOLDER' | 'MODEL'>('FOLDER');
    const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
    const [selectedFolderName, setSelectedFolderName] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showFolderPicker, setShowFolderPicker] = useState(false);

    // Model Trigger State
    const [modelTriggerCategoryId, setModelTriggerCategoryId] = useState<number | null>(null);
    const [modelTriggerCategoryName, setModelTriggerCategoryName] = useState<string>('');
    const [showModelSearch, setShowModelSearch] = useState(false);

    const {
        displayData: displayCategories,
        loading: modelSearchLoading,
        searchQuery: modelSearchQuery,
        setSearchQuery: setModelSearchQuery,
        fetchData: fetchCategories
    } = useServerSideSearch<FilingCategoryResponseDto>({
        fetchFunction: async (page, searchTerm) => {
            if (searchTerm) {
                return await filingCategoryService.searchFilingCategories(searchTerm, page, 20);
            } else {
                return await filingCategoryService.getAllFilingCategories({ page, size: 20 });
            }
        },
        searchFields: (category) => [category.name, category.description || '']
    });

    // Close model search dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (showModelSearch && !target.closest('.model-search-container')) {
                setShowModelSearch(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showModelSearch]);

    useEffect(() => {
        loadTriggers();
    }, [workflowId]);

    const loadTriggers = async () => {
        try {
            setLoading(true);
            const data = await workflowAdminService.getWorkflowTriggers(workflowId);
            setTriggers(data);
        } catch (error) {
            console.error('Error loading triggers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTrigger = async () => {
        if (triggerType === 'FOLDER' && !selectedFolderId) {
            showError('Validation Error', 'Please select a folder');
            return;
        }

        if (triggerType === 'MODEL' && !modelTriggerCategoryId) {
            showError('Validation Error', 'Please select a model');
            return;
        }

        try {
            setIsSubmitting(true);
            await workflowAdminService.addWorkflowTrigger({
                workflowId,
                triggerType,
                folderId: selectedFolderId || undefined,
                categoryId: modelTriggerCategoryId || undefined,
            });
            showSuccess('Trigger Added', 'Workflow trigger added successfully');
            setShowAddModal(false);
            resetForm();
            loadTriggers();
        } catch (error: any) {
            showError('Error', error?.response?.data?.message || 'Failed to add trigger');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTrigger = async () => {
        if (!triggerToDelete) return;

        try {
            await workflowAdminService.deleteWorkflowTrigger(triggerToDelete.id);
            showSuccess('Trigger Removed', 'Workflow trigger removed successfully');
            setShowDeleteModal(false);
            setTriggerToDelete(null);
            loadTriggers();
        } catch (error: any) {
            showError('Error', error?.response?.data?.message || 'Failed to remove trigger');
        }
    };

    const handleToggleActive = async (trigger: WorkflowTriggerResponse) => {
        try {
            await workflowAdminService.updateWorkflowTrigger(trigger.id, {
                isActive: !trigger.isActive,
            });
            showSuccess(
                'Updated',
                `Trigger ${!trigger.isActive ? 'activated' : 'deactivated'} successfully`
            );
            loadTriggers();
        } catch (error: any) {
            showError('Error', error?.response?.data?.message || 'Failed to update trigger');
        }
    };

    const resetForm = () => {
        setTriggerType('FOLDER');
        setSelectedFolderId(null);
        setSelectedFolderName('');
        setModelTriggerCategoryId(null);
        setModelTriggerCategoryName('');
        setModelSearchQuery('');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Zap className="h-5 w-5 text-yellow-500" />
                                Workflow Triggers
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Configure how this workflow is automatically triggered
                            </CardDescription>
                        </div>
                        <Button onClick={() => setShowAddModal(true)} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Trigger
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {triggers.length > 0 ? (
                        <div className="space-y-3">
                            {triggers.map((trigger) => (
                                <div
                                    key={trigger.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${trigger.isActive ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'
                                            }`}>
                                            {trigger.triggerType === 'FOLDER' ? (
                                                <Folder className="h-5 w-5" />
                                            ) : (
                                                <Zap className="h-5 w-5" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold flex items-center gap-2">
                                                {trigger.triggerType === 'FOLDER' ? 'Folder Watch' : 'Model Trigger'}
                                                <Badge variant={trigger.isActive ? 'default' : 'secondary'} className="text-xs">
                                                    {trigger.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </h4>
                                            <p className="text-sm text-muted-foreground">
                                                {trigger.triggerType === 'FOLDER'
                                                    ? `Triggers when a document is uploaded to "${trigger.folderName || 'Unknown Folder'}"`
                                                    : `Triggers when a document uses model "${trigger.categoryName || 'Unknown Model'}"`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleToggleActive(trigger)}
                                            title={trigger.isActive ? 'Deactivate' : 'Activate'}
                                        >
                                            {trigger.isActive ? (
                                                <Pause className="h-4 w-4 text-orange-500" />
                                            ) : (
                                                <Play className="h-4 w-4 text-green-500" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setTriggerToDelete(trigger);
                                                setShowDeleteModal(true);
                                            }}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">No triggers configured</p>
                            <p className="text-sm mt-1">
                                Add a trigger to automatically start this workflow when documents are uploaded
                            </p>
                            <Button onClick={() => setShowAddModal(true)} className="mt-4" variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Trigger
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Trigger Modal - Enhanced Design */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                <Zap className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl">Add Workflow Trigger</DialogTitle>
                                <DialogDescription className="mt-1">
                                    Configure when this workflow should automatically start
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Trigger Type</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${triggerType === 'FOLDER' ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'hover:bg-gray-50'
                                        }`}
                                    onClick={() => {
                                        setTriggerType('FOLDER');
                                        setModelTriggerCategoryId(null);
                                        setModelTriggerCategoryName('');
                                    }}
                                >
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${triggerType === 'FOLDER' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        <Folder className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">Folder Watch</div>
                                        <div className="text-xs text-muted-foreground">Monitor a folder</div>
                                    </div>
                                    {triggerType === 'FOLDER' && <div className="ml-auto h-2 w-2 rounded-full bg-blue-500" />}
                                </div>

                                <div
                                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${triggerType === 'MODEL' ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'hover:bg-gray-50'
                                        }`}
                                    onClick={() => {
                                        setTriggerType('MODEL');
                                        setSelectedFolderId(null);
                                        setSelectedFolderName('');
                                    }}
                                >
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${triggerType === 'MODEL' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        <Zap className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">Model Trigger</div>
                                        <div className="text-xs text-muted-foreground">Based on category</div>
                                    </div>
                                    {triggerType === 'MODEL' && <div className="ml-auto h-2 w-2 rounded-full bg-blue-500" />}
                                </div>
                            </div>
                        </div>

                        {triggerType === 'FOLDER' && (
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Target Folder</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowFolderPicker(true)}
                                    className="w-full justify-start text-left font-normal"
                                >
                                    <Folder className="mr-2 h-4 w-4" />
                                    {selectedFolderName || "Select a folder..."}
                                </Button>
                                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-blue-900">
                                        The workflow will start automatically for any document uploaded to this folder.
                                    </p>
                                </div>
                            </div>
                        )}

                        {triggerType === 'MODEL' && (
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Select Model</Label>
                                <div className="relative model-search-container">
                                    <ServerSearchInput
                                        value={modelSearchQuery}
                                        onChange={(value) => {
                                            setModelSearchQuery(value);
                                            setShowModelSearch(true);
                                        }}
                                        onFocus={() => {
                                            setShowModelSearch(true);
                                            if (modelSearchQuery === '' && displayCategories.length === 0) {
                                                fetchCategories();
                                            }
                                        }}
                                        placeholder={modelTriggerCategoryName || "Search models..."}
                                        className="w-full"
                                    />
                                    {showModelSearch && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {modelSearchLoading ? (
                                                <div className="flex items-center justify-center p-4">
                                                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                                </div>
                                            ) : displayCategories.length > 0 ? (
                                                displayCategories.map((category) => (
                                                    <button
                                                        key={category.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setModelTriggerCategoryId(category.id);
                                                            setModelTriggerCategoryName(category.name);
                                                            setModelSearchQuery('');
                                                            setShowModelSearch(false);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-200 last:border-b-0"
                                                    >
                                                        <div className="font-medium">{category.name}</div>
                                                        {category.description && (
                                                            <div className="text-xs text-gray-500">{category.description}</div>
                                                        )}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-gray-500 text-sm">No models found</div>
                                            )}
                                        </div>
                                    )}
                                    {modelTriggerCategoryId && (
                                        <div className="mt-2 flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                            <span className="text-sm font-medium flex-1">{modelTriggerCategoryName}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setModelTriggerCategoryId(null);
                                                    setModelTriggerCategoryName('');
                                                    setModelSearchQuery('');
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-blue-900">
                                        The workflow will start automatically when a document is created with this filing category.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowAddModal(false);
                                resetForm();
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddTrigger}
                            disabled={
                                isSubmitting ||
                                (triggerType === 'FOLDER' && !selectedFolderId) ||
                                (triggerType === 'MODEL' && !modelTriggerCategoryId)
                            }
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Trigger
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Folder Picker Modal */}
            <FolderPickerModal
                isOpen={showFolderPicker}
                onClose={() => setShowFolderPicker(false)}
                onSelect={(folderId, folderName, _folderPath) => {
                    setSelectedFolderId(folderId);
                    setSelectedFolderName(folderName);
                }}
            />

            {/* Delete Confirmation Modal */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Trigger</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove this trigger? The workflow will no longer start automatically for this condition.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteTrigger}>
                            Remove
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
