'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Folder, File, Loader2, FileText } from 'lucide-react';
import { folderService } from '@/api/services/folderService';
import { FolderResDto, DocumentResponseDto } from '@/types/api';
import UserAvatar from '../main/UserAvatar';

interface ChangeDescriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: FolderResDto | DocumentResponseDto | null;
    itemType: 'folder' | 'document';
    onSuccess?: (updatedItem: { id: number; description: string; type: 'folder' | 'document'; action: 'change-description' }) => void;
}

export default function ChangeDescriptionModal({
    isOpen,
    onClose,
    item,
    itemType,
    onSuccess
}: ChangeDescriptionModalProps) {
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && item) {
            setDescription(item.description || '');
        }
    }, [isOpen, item]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!item) return;

        try {
            setLoading(true);

            // If description hasn't changed, just close
            if (description.trim() === (item.description || '')) {
                onClose();
                return;
            }

            if (itemType === 'folder') {
                const folder = item as FolderResDto;
                await folderService.changeDescription(folder.id, description.trim());
            } else {
                // TODO: Implement document description change if needed/supported
                // For now, only folder description is requested
                console.warn('Document description change not yet implemented');
            }

            const updatedItem = {
                id: itemType === 'folder' ? (item as FolderResDto).id : (item as DocumentResponseDto).documentId,
                description: description.trim(),
                type: itemType,
                action: 'change-description' as const
            };

            onSuccess?.(updatedItem);
            onClose();
        } catch (error) {
            console.error('Error changing description:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFormattedPath = () => {
        if (!item?.path) return '';

        const parts = item.path.split('.');
        if (parts.length <= 1) return item.path;

        // Get username from ownedBy
        const username = item.ownedBy?.displayName || item.ownedBy?.username || 'Unknown';

        // Remove ownerId (first part) and join with slashes
        const pathParts = parts.slice(1).join(' / ');
        return `${username} / ${pathParts}`;
    };
    if (!item) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Change Description
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {itemType === 'folder' ? (
                            <Folder className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        ) : (
                            <File className="h-5 w-5 text-green-500 flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                                                        {item.ownedBy && (
                                                                                            <div className="flex-shrink-0" title={item.ownedBy.displayName || item.ownedBy.username}>
                                                                                                <UserAvatar user={item.ownedBy} size="xs" />
                                                                                            </div>
                                                                                        )}
                                                                                        <span className="truncate select-text">
                                                                                            {getFormattedPath()}
                                                                                        </span>
                                                                                    </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="item-description">Description</Label>
                        <Input
                            id="item-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter description"
                            maxLength={500}
                            autoFocus
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
