'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Folder, File, Loader2 } from 'lucide-react';
import { notificationApiClient } from '@/api/notificationClient';
import { FolderResDto, DocumentResponseDto } from '@/types/api';
import UserAvatar from '../main/UserAvatar';

interface RenameModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: FolderResDto | DocumentResponseDto | null;
    itemType: 'folder' | 'document';
    onSuccess?: (updatedItem: { id: number; name: string; type: 'folder' | 'document'; action: 'rename' }) => void;
}

export default function RenameModal({
    isOpen,
    onClose,
    item,
    itemType,
    onSuccess
}: RenameModalProps) {
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && item) {
            setNewName(item.name);
        }
    }, [isOpen, item]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!item) return;

        try {
            setLoading(true);

            if (!newName.trim() || newName.trim() === item.name) {
                onClose();
                return;
            }

            if (itemType === 'folder') {
                const folder = item as FolderResDto;
                await notificationApiClient.renameFolder(folder.id, newName.trim());
            } else {
                const document = item as DocumentResponseDto;
                await notificationApiClient.renameDocument(document.documentId, newName.trim());
            }

            const updatedItem = {
                id: itemType === 'folder' ? (item as FolderResDto).id : (item as DocumentResponseDto).documentId,
                name: newName.trim(),
                type: itemType,
                action: 'rename' as const
            };

            onSuccess?.(updatedItem);
            onClose();
        } catch (error) {
            console.error('Error renaming item:', error);
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
    const isSubmitDisabled = !newName.trim() || (item && newName.trim() === item.name) || loading;

    if (!item) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {itemType === 'folder' ? <Folder className="h-5 w-5" /> : <File className="h-5 w-5" />}
                        Rename {itemType === 'folder' ? 'Folder' : 'Document'}
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
                            <p className="font-medium truncate select-text">{item.name}</p>
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
                        <Label htmlFor="item-name">New Name</Label>
                        {itemType === 'document' ? (
                            <div className="space-y-2">
                                {(() => {
                                    const currentName = item.name;
                                    const lastDotIndex = currentName.lastIndexOf('.');
                                    const hasExtension = lastDotIndex > 0;
                                    const extension = hasExtension ? currentName.substring(lastDotIndex) : '';

                                    const currentInputValue = newName.endsWith(extension)
                                        ? newName.substring(0, newName.length - extension.length)
                                        : newName.replace(/\.[^.]*$/, '');

                                    return (
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1">
                                                <Input
                                                    id="item-name"
                                                    type="text"
                                                    value={currentInputValue}
                                                    onChange={(e) => {
                                                        const newValue = e.target.value;
                                                        const cleanValue = newValue.replace(/\.[^.]*$/, '');
                                                        setNewName(cleanValue + extension);
                                                    }}
                                                    placeholder="Enter new name"
                                                    maxLength={255 - extension.length}
                                                    autoFocus
                                                />
                                            </div>
                                            {hasExtension && (
                                                <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700 font-medium whitespace-nowrap">
                                                    {extension}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                                <p className="text-xs text-gray-500">
                                    File extension is preserved.
                                </p>
                            </div>
                        ) : (
                            <Input
                                id="item-name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Enter new folder name"
                                maxLength={255}
                                autoFocus
                            />
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitDisabled}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Renaming...
                                </>
                            ) : (
                                'Rename'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
