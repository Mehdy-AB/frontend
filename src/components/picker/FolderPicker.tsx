import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Folder, FolderOpen } from 'lucide-react';
import { folderService } from '@/api/services/folderService';
import { FolderResDto } from '@/types/api';

interface FolderPickerProps {
    onSelect: (folder: { id: number; name: string }) => void;
    selectedFolderId: number | null;
    selectedFolderName: string;
}

export function FolderPicker({ onSelect, selectedFolderId, selectedFolderName }: FolderPickerProps) {
    const [showDialog, setShowDialog] = useState(false);
    const [folders, setFolders] = useState<FolderResDto[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (showDialog) {
            loadFolders();
        }
    }, [showDialog]);

    const loadFolders = async () => {
        try {
            setLoading(true);
            const response = await folderService.getMyRepository(0, 1000); // Get up to 1000 folders
            setFolders(response.content);
        } catch (error) {
            console.error('Error loading folders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectFolder = (folder: FolderResDto) => {
        onSelect({ id: folder.id, name: folder.name });
        setShowDialog(false);
    };

    return (
        <>
            <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(true)}
                className="w-full justify-start"
            >
                <Folder className="mr-2 h-4 w-4" />
                {selectedFolderName || 'Select a folder...'}
            </Button>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-2xl max-h-[600px] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Select Folder</DialogTitle>
                        <DialogDescription>
                            Choose a folder to watch for new documents
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Loading folders...
                            </div>
                        ) : folders.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No folders available
                            </div>
                        ) : (
                            folders.map((folder) => (
                                <div
                                    key={folder.id}
                                    onClick={() => handleSelectFolder(folder)}
                                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${selectedFolderId === folder.id ? 'bg-primary/10 border-primary' : ''
                                        }`}
                                >
                                    <FolderOpen className="h-5 w-5 text-primary" />
                                    <div className="flex-1">
                                        <p className="font-medium">{folder.name}</p>
                                        {folder.path && (
                                            <p className="text-xs text-muted-foreground">{folder.path}</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
