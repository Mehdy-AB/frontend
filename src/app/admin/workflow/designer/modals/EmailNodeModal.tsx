'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Mail, Search, Loader2, User as UserIcon, Shield, Users, Check, Plus, Trash2, Paperclip } from 'lucide-react';
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

interface EmailNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: WorkflowNodeData;
    onSave: (updatedData: Partial<WorkflowNodeData>) => void;
}

type EntityType = 'USER' | 'ROLE' | 'GROUP';

export default function EmailNodeModal({ isOpen, onClose, nodeData, onSave }: EmailNodeModalProps) {
    const [activeTab, setActiveTab] = useState<EntityType>('USER');
    const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
    const [ccRecipients, setCcRecipients] = useState<NotificationRecipient[]>([]);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [attachDocument, setAttachDocument] = useState(false);
    const [showCc, setShowCc] = useState(false);
    const [addingTo, setAddingTo] = useState<'to' | 'cc'>('to');

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
            const allRecipients = [...recipients, ...ccRecipients];
            const existingIds = new Set(allRecipients.map(r => r.id));
            results = results.filter(r => !existingIds.has(r.id));

            setSearchResults(results);
            setShowDropdown(true);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    }, [debouncedQuery, activeTab, recipients, ccRecipients]);

    useEffect(() => {
        if (isOpen) {
            searchEntities();
        }
    }, [searchEntities, isOpen]);

    // Initialize from nodeData
    useEffect(() => {
        if (isOpen) {
            setRecipients(nodeData.emailRecipients || []);
            setCcRecipients(nodeData.ccRecipients || []);
            setEmailSubject(nodeData.emailSubject || '');
            setEmailBody(nodeData.emailBody || '');
            setAttachDocument(nodeData.attachDocument || false);
            setShowCc((nodeData.ccRecipients?.length || 0) > 0);
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

        if (addingTo === 'to') {
            setRecipients([...recipients, newRecipient]);
        } else {
            setCcRecipients([...ccRecipients, newRecipient]);
        }

        setSearchQuery('');
        setSearchResults([]);
        setShowDropdown(false);
    };

    const removeRecipient = (id: string, from: 'to' | 'cc') => {
        if (from === 'to') {
            setRecipients(recipients.filter(r => r.id !== id));
        } else {
            setCcRecipients(ccRecipients.filter(r => r.id !== id));
        }
    };

    const handleSave = () => {
        onSave({
            emailRecipients: recipients,
            ccRecipients,
            emailSubject,
            emailBody,
            attachDocument,
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

    const renderRecipientList = (list: NotificationRecipient[], from: 'to' | 'cc') => {
        if (list.length === 0) return null;

        return (
            <div className="flex flex-wrap gap-2 mt-2">
                {list.map((recipient) => (
                    <div
                        key={recipient.id}
                        className="flex items-center gap-1.5 px-2 py-1 bg-sky-100 text-sky-800 rounded-full text-sm"
                    >
                        {recipient.type === 'USER' && recipient.entity ? (
                            <UserAvatar user={recipient.entity as UserDto} size="xs" />
                        ) : (
                            getEntityIcon(recipient.type)
                        )}
                        <span>{recipient.name}</span>
                        <button
                            onClick={() => removeRecipient(recipient.id, from)}
                            className="p-0.5 hover:bg-sky-200 rounded-full"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-sky-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center">
                            <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Configure Email</h3>
                            <p className="text-sm text-gray-500">Set recipients and email content</p>
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
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* To Recipients */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label>To</Label>
                            {!showCc && (
                                <button
                                    onClick={() => setShowCc(true)}
                                    className="text-sm text-sky-600 hover:text-sky-700"
                                >
                                    + Add CC
                                </button>
                            )}
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 mb-2 bg-gray-100 p-1 rounded-lg">
                            {(['USER', 'ROLE', 'GROUP'] as EntityType[]).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        setActiveTab(type);
                                        setAddingTo('to');
                                        setSearchQuery('');
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${activeTab === type && addingTo === 'to'
                                        ? 'bg-white text-sky-600 shadow-sm'
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
                                    value={addingTo === 'to' ? searchQuery : ''}
                                    onChange={(e) => {
                                        setAddingTo('to');
                                        setSearchQuery(e.target.value);
                                    }}
                                    onFocus={() => {
                                        setAddingTo('to');
                                        setShowDropdown(true);
                                    }}
                                    className="pl-10"
                                />
                                {loading && addingTo === 'to' && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                                )}
                            </div>

                            {/* Dropdown - Show when results exist or loading */}
                            {showDropdown && addingTo === 'to' && (searchResults.length > 0 || loading) && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
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

                                        return (
                                            <button
                                                key={entity.id}
                                                onClick={() => addRecipient(entity)}
                                                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                                            >
                                                {'username' in entity ? (
                                                    <UserAvatar user={entity as UserDto} size="sm" />
                                                ) : (
                                                    getEntityIcon(activeTab)
                                                )}
                                                <span className="truncate">{name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {renderRecipientList(recipients, 'to')}
                    </div>

                    {/* CC Recipients */}
                    {showCc && (
                        <div>
                            <Label className="mb-2 block">CC</Label>
                            <Input
                                placeholder="Search to add CC recipients..."
                                value={addingTo === 'cc' ? searchQuery : ''}
                                onChange={(e) => {
                                    setAddingTo('cc');
                                    setSearchQuery(e.target.value);
                                }}
                                onFocus={() => setAddingTo('cc')}
                            />
                            {renderRecipientList(ccRecipients, 'cc')}
                        </div>
                    )}

                    {/* Subject */}
                    <div>
                        <Label htmlFor="email-subject">Subject</Label>
                        <Input
                            id="email-subject"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            placeholder="Email subject..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Variables: {'{{document.name}}'}, {'{{workflow.name}}'}
                        </p>
                    </div>

                    {/* Body */}
                    <div>
                        <Label htmlFor="email-body">Message</Label>
                        <Textarea
                            id="email-body"
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            placeholder="Email body..."
                            rows={5}
                        />
                    </div>

                    {/* Attach Document */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <input
                            type="checkbox"
                            id="attach-document"
                            checked={attachDocument}
                            onChange={(e) => setAttachDocument(e.target.checked)}
                            className="rounded"
                        />
                        <Label htmlFor="attach-document" className="flex items-center gap-2 cursor-pointer">
                            <Paperclip className="w-4 h-4 text-gray-500" />
                            Attach document to email
                        </Label>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={recipients.length === 0 || !emailSubject}
                        className="bg-sky-500 hover:bg-sky-600"
                    >
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    );
}
