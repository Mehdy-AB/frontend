'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Bell, Search, Loader2, User as UserIcon, Shield, Users, Check, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { userManagementService } from '@/api/services/userManagementService';
import { roleManagementService } from '@/api/services/roleManagementService';
import { groupManagementService } from '@/api/services/groupManagementService';
import { UserDto, RoleDto, GroupDto } from '@/types/api';
import { WorkflowNodeData, NotificationRecipient } from '../nodes/types';
import UserAvatar from '@/components/main/UserAvatar';

interface NotificationNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

type EntityType = 'USER' | 'ROLE' | 'GROUP';

export default function NotificationNodeModal({ isOpen, onClose, nodeData, onSave }: NotificationNodeModalProps) {
    const [activeTab, setActiveTab] = useState<EntityType>('USER');
    const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [searchResults, setSearchResults] = useState<(UserDto | RoleDto | GroupDto)[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Search entities
    const searchEntities = useCallback(async () => {
        setLoading(true);
        try {
            let results: (UserDto | RoleDto | GroupDto)[] = [];
            const query = debouncedQuery?.trim() || '';

            if (activeTab === 'USER') {
                // Use getUsers for empty query, searchUsers for search
                if (query) {
                    const response = await userManagementService.searchUsers(query, undefined, 0, 10);
                    results = response?.content || [];
                } else {
                    const response = await userManagementService.getUsers(0, 10);
                    results = response?.content || [];
                }
            } else if (activeTab === 'ROLE') {
                const response = await roleManagementService.getRoles(0, 10, 'name', 'asc', query || undefined);
                results = response?.content || [];
            } else if (activeTab === 'GROUP') {
                const response = await groupManagementService.getGroups(0, 10, 'name', 'asc', query || undefined);
                results = response?.content || [];
            }

            // Filter out already added recipients
            const existingIds = new Set(recipients.map(r => r.id));
            results = results.filter(r => !existingIds.has(r.id));

            setSearchResults(results);
            setShowDropdown(true);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    }, [debouncedQuery, activeTab, recipients]);

    useEffect(() => {
        if (isOpen) {
            searchEntities();
        }
    }, [searchEntities, isOpen]);

    // Initialize from nodeData
    useEffect(() => {
        if (isOpen) {
            setRecipients(nodeData.recipients || []);
            setNotificationTitle(nodeData.notificationTitle || '');
            setNotificationMessage(nodeData.notificationMessage || '');
            // Trigger initial search and show dropdown
            setShowDropdown(true);
            setSearchQuery('');
        }
    }, [isOpen, nodeData]);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addRecipient = (entity: UserDto | RoleDto | GroupDto) => {
        const name = 'username' in entity
            ? (entity as UserDto).displayName || (entity as UserDto).username
            : entity.name;

        const newRecipient: NotificationRecipient = {
            id: entity.id,
            type: activeTab,
            name,
            entity,
        };

        setRecipients([...recipients, newRecipient]);
        setSearchQuery('');
        setSearchResults([]);
        setShowDropdown(false);
    };

    const removeRecipient = (id: string) => {
        setRecipients(recipients.filter(r => r.id !== id));
    };

    const handleSave = () => {
        onSave({
            recipients,
            notificationTitle,
            notificationMessage,
        });
        onClose();
    };

    const getEntityIcon = (type: EntityType) => {
        switch (type) {
            case 'USER': return <UserIcon className="w-4 h-4" />;
            case 'ROLE': return <Shield className="w-4 h-4" />;
            case 'GROUP': return <Users className="w-4 h-4" />;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-amber-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                            <Bell className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Configure Notification</h3>
                            <p className="text-sm text-gray-500">Set recipients and message</p>
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
                    {/* Recipients Section */}
                    <div>
                        <Label className="text-sm font-medium mb-3 block">Recipients</Label>

                        {/* Tabs */}
                        <div className="flex gap-1 mb-3 bg-gray-100 p-1 rounded-lg">
                            {(['USER', 'ROLE', 'GROUP'] as EntityType[]).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        setActiveTab(type);
                                        setSearchQuery('');
                                        setSearchResults([]);
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeTab === type
                                        ? 'bg-white text-amber-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                >
                                    {getEntityIcon(type)}
                                    {type === 'USER' ? 'Users' : type === 'ROLE' ? 'Roles' : 'Groups'}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative" ref={dropdownRef}>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder={`Search ${activeTab.toLowerCase()}s...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setShowDropdown(true)}
                                    className="pl-10"
                                />
                                {loading && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                                )}
                            </div>

                            {/* Dropdown - Show when open and there are results or loading */}
                            {showDropdown && (searchResults.length > 0 || loading) && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {loading && searchResults.length === 0 && (
                                        <div className="px-4 py-3 text-center text-gray-500 text-sm">
                                            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" />
                                            Loading...
                                        </div>
                                    )}
                                    {!loading && searchResults.length === 0 && (
                                        <div className="px-4 py-3 text-center text-gray-500 text-sm">
                                            No {activeTab.toLowerCase()}s found
                                        </div>
                                    )}
                                    {searchResults.map((entity) => {
                                        const name = 'username' in entity
                                            ? (entity as UserDto).displayName || (entity as UserDto).username
                                            : entity.name;
                                        const subtitle = 'email' in entity ? (entity as UserDto).email : undefined;

                                        return (
                                            <button
                                                key={entity.id}
                                                onClick={() => addRecipient(entity)}
                                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                                            >
                                                {'username' in entity ? (
                                                    <UserAvatar user={entity as UserDto} size="sm" />
                                                ) : (
                                                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                                                        {getEntityIcon(activeTab)}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{name}</p>
                                                    {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
                                                </div>
                                                <Plus className="w-4 h-4 text-gray-400" />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Selected Recipients */}
                        {recipients.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {recipients.map((recipient) => (
                                    <div
                                        key={recipient.id}
                                        className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg"
                                    >
                                        {recipient.type === 'USER' && recipient.entity ? (
                                            <UserAvatar user={recipient.entity as UserDto} size="sm" />
                                        ) : (
                                            <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center text-amber-700">
                                                {getEntityIcon(recipient.type)}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{recipient.name}</p>
                                            <p className="text-xs text-amber-600">{recipient.type}</p>
                                        </div>
                                        <button
                                            onClick={() => removeRecipient(recipient.id)}
                                            className="p-1 hover:bg-amber-200 rounded text-amber-600 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {recipients.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg mt-3">
                                No recipients added yet
                            </p>
                        )}
                    </div>

                    {/* Message Section */}
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="notification-title">Notification Title</Label>
                            <Input
                                id="notification-title"
                                value={notificationTitle}
                                onChange={(e) => setNotificationTitle(e.target.value)}
                                placeholder="e.g., Document Approval Required"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Available variables: {'{{document.name}}'}, {'{{document.category}}'}
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="notification-message">Message</Label>
                            <Textarea
                                id="notification-message"
                                value={notificationMessage}
                                onChange={(e) => setNotificationMessage(e.target.value)}
                                placeholder="Enter notification message..."
                                rows={4}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={recipients.length === 0}
                        className="bg-amber-500 hover:bg-amber-600"
                    >
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
