'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Folder, File, ChevronRight, Search, Check } from 'lucide-react';
import { notificationApiClient } from '@/api/notificationClient';
import { FolderResDto, DocumentResponseDto, MovingType, AllowedFoldersToMove } from '@/types/api';

interface FolderActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: FolderResDto | null;
  document?: DocumentResponseDto | null;
  action: 'rename' | 'move' | null;
  onSuccess?: (updatedItem?: { id: number; name: string; type: 'folder' | 'document'; action: 'rename' | 'move' }) => void;
}

interface FolderTreeNode {
  id: number;
  name: string;
  path: string;
  description?: string;
  isPublic: boolean;
  size: number;
  createdAt: string;
  updatedAt: string;
  children: FolderTreeNode[];
  isExpanded: boolean;
  isSelected: boolean;
}

export default function FolderActionModal({ 
  isOpen, 
  onClose, 
  folder, 
  document,
  action, 
  onSuccess 
}: FolderActionModalProps) {
  const [newName, setNewName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [folderTree, setFolderTree] = useState<FolderTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [allFolders, setAllFolders] = useState<FolderTreeNode[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when modal opens/closes or action changes
  useEffect(() => {
    if (isOpen && (folder || document)) {
      const item = folder || document;
      if (item) {
        setNewName(item.name);
        setSelectedFolderId(null);
        setSearchQuery('');
        setExpandedFolders(new Set());
        
        if (action === 'move') {
          loadFolderTree();
        }
      }
    }
  }, [isOpen, folder, document, action]);

  // Function to filter folders locally
  const filterFoldersLocally = useCallback((query: string, folders: FolderTreeNode[]) => {
    if (!query.trim()) {
      return folders;
    }
    return folders.filter(folder => 
      folder.name.toLowerCase().includes(query.toLowerCase()) ||
      folder.path.toLowerCase().includes(query.toLowerCase())
    );
  }, []);

  // Handle search query changes with local filtering first, then server search
  useEffect(() => {
    if (!isOpen || action !== 'move' || (!folder && !document)) return;

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // First, filter locally for immediate response
    const localFiltered = filterFoldersLocally(searchQuery, allFolders);
    setFolderTree(localFiltered);

    // Then, after a delay, fetch from server
    const timeout = setTimeout(() => {
      if (searchQuery.trim()) {
        loadFolderTree(searchQuery);
      } else {
        loadFolderTree();
      }
    }, 300); // 300ms delay

    searchTimeoutRef.current = timeout;

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [searchQuery, isOpen, action, folder, document, filterFoldersLocally]); // Removed allFolders to prevent loop

  // Update display when allFolders changes (e.g., after initial load)
  useEffect(() => {
    if (allFolders.length > 0) {
      const localFiltered = filterFoldersLocally(searchQuery, allFolders);
      setFolderTree(localFiltered);
    }
  }, [allFolders, filterFoldersLocally, searchQuery]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const loadFolderTree = async (searchTerm?: string) => {
    try {
      setLoading(true);
      // Get available folders for moving the selected item
      const item = folder || document;
      if (!item) return;
      
      const itemId = folder ? folder.id : document!.folderId;
      const movingType = folder ? MovingType.FOLDER : MovingType.DOCUMENT;
      
      const response = await notificationApiClient.availableFolders(itemId, movingType, {
        page: 0,
        size: 1000, // Get all available folders
        name: searchTerm || undefined
      });
      
      // Build tree structure from the response content
      const folders = response.content || [];
      const tree = buildFolderTree(folders);
      
      if (!searchTerm) {
        // Store all folders for local filtering
        setAllFolders(tree);
      }
      setFolderTree(tree);
    } catch (error) {
      console.error('Error loading folder tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildFolderTree = (folders: AllowedFoldersToMove[]): FolderTreeNode[] => {
    const folderMap = new Map<number, FolderTreeNode>();
    const rootFolders: FolderTreeNode[] = [];

    // Create nodes for all folders
    folders.forEach(folder => {
      folderMap.set(folder.id, {
        id: folder.id,
        name: folder.name,
        path: folder.path || '',
        description: folder.description,
        isPublic: folder.isPublic,
        size: folder.size,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
        children: [],
        isExpanded: false,
        isSelected: false
      });
    });

    // Since AllowedFoldersToMove doesn't have parentId, we'll display them as a flat list
    // but we can still organize them by path if needed
    folders.forEach(folder => {
      const node = folderMap.get(folder.id);
      if (node) {
        // For now, add all folders as root folders since we don't have parent-child info
        rootFolders.push(node);
      }
    });

    return rootFolders;
  };

  const handleSubmit = async () => {
    if (!folder && !document) return;

    try {
      setLoading(true);

      if (action === 'rename') {
        const item = folder || document;
        if (!item || !newName.trim() || newName.trim() === item.name) {
          return;
        }
        
        if (folder) {
          await notificationApiClient.renameFolder(folder.id, newName.trim());
        } else if (document) {
          await notificationApiClient.renameDocument(document.documentId, newName.trim());
        }
      } else if (action === 'move') {
        if (!selectedFolderId) {
          return;
        }
        
        if (folder) {
          await notificationApiClient.moveFolder(folder.id, selectedFolderId);
        } else if (document) {
          await notificationApiClient.moveDocument(document.documentId, selectedFolderId);
        }
      }

      // Pass updated item information to success callback
      const updatedItem = {
        id: folder ? folder.id : document!.documentId,
        name: newName.trim(),
        type: folder ? 'folder' as const : 'document' as const,
        action: action as 'rename' | 'move'
      };
      onSuccess?.(updatedItem);
      onClose();
    } catch (error) {
      console.error(`Error ${action}ing item:`, error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolderExpansion = (folderId: number) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const selectFolder = (folderId: number) => {
    setSelectedFolderId(folderId);
  };

  const renderFolderNode = (node: FolderTreeNode) => {
    const isSelected = selectedFolderId === node.id;
    const isCurrentFolder = folder?.id === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center py-2 px-3 rounded-md cursor-pointer hover:bg-gray-100 transition-colors ${
            isSelected ? 'bg-blue-100 border border-blue-300' : ''
          } ${isCurrentFolder ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => {
            if (!isCurrentFolder) {
              selectFolder(node.id);
            }
          }}
        >
          <Folder className="h-4 w-4 mr-2 text-blue-500" />
          
          <div className="flex-1">
            <span className={`text-sm ${isCurrentFolder ? 'text-gray-400' : ''}`}>
              {node.name}
            </span>
            {node.path && (
              <div className="text-xs text-gray-500 mt-1">
                {node.path.includes('/') ? node.path.substring(node.path.indexOf('/') + 1) : node.path}
              </div>
            )}
          </div>
          
          {isSelected && (
            <Check className="h-4 w-4 text-blue-600" />
          )}
        </div>
      </div>
    );
  };

  // Use folderTree directly since filtering is handled in useEffect
  const filteredFolders = folderTree;

  const isSubmitDisabled = () => {
    const item = folder || document;
    if (action === 'rename') {
      return !newName.trim() || newName.trim() === item?.name || loading;
    } else if (action === 'move') {
      return !selectedFolderId || loading;
    }
    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {folder ? <Folder className="h-5 w-5" /> : <File className="h-5 w-5" />}
            {action === 'rename' 
              ? (folder ? 'Rename Folder' : 'Rename Document') 
              : (folder ? 'Move Folder' : 'Move Document')
            }
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {(folder || document) && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {folder ? <Folder className="h-5 w-5 text-blue-500" /> : <File className="h-5 w-5 text-green-500" />}
              <div>
                <p className="font-medium">{(folder || document)?.name}</p>
                <p className="text-sm text-gray-500">{folder?.path || document?.path}</p>
              </div>
            </div>
          )}

          {action === 'rename' && (
            <div className="space-y-2">
              <Label htmlFor="item-name">New {folder ? 'Folder' : 'Document'} Name</Label>
              <Input
                id="item-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={`Enter new ${folder ? 'folder' : 'document'} name`}
                className="w-full"
                autoFocus
              />
            </div>
          )}

          {action === 'move' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Destination Folder</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search folders..."
                    className="pl-10"
                  />
                </div>
              </div>

              {loading && (
                <div className="p-2 text-center text-gray-500 text-sm">
                  Loading folders...
                </div>
              )}
              
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {filteredFolders.length === 0 && !loading ? (
                  <div className="p-4 text-center text-gray-500">
                    No folders found
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredFolders.map(folder => renderFolderNode(folder))}
                  </div>
                )}
              </div>

              {selectedFolderId && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Selected: {folderTree.find(f => f.id === selectedFolderId)?.name}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitDisabled()}
              className="min-w-[100px]"
            >
              {loading ? 'Processing...' : action === 'rename' ? 'Rename' : 'Move'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
