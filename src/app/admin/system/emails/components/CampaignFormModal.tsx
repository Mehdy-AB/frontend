'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    RefreshCw,
    X,
    Save,
    Clock,
    Users,
    Globe,
    Building2,
    AlertCircle,
    Check,
    Loader2,
    FileText,
    Info,
    AlertTriangle,
    Paperclip,
} from 'lucide-react';
import type {
    EmailCampaign,
    EmailCampaignType,
    TargetType,
    CampaignFormData,
} from '../lib/types';
import { userManagementService } from '@/api/services/userManagementService';
import { roleManagementService } from '@/api/services/roleManagementService';
import type { UserDto, RoleDto, PageResponse } from '@/types/api';
import type { EmailTemplate } from '@/api/services/emailManagementService';
import { emailManagementService, type VariableDefinition } from '@/api/services/emailManagementService';
import { documentService } from '@/api/services/documentService';
import type { DocumentResponseDto } from '@/types/api';
import { RichEmailEditor, EmailPreviewPanel } from '@/components/email';

// ============================================================================
// Variable Utilities (reused from Send Email modal)
// ============================================================================

const STANDARD_VARIABLES = ['name', 'firstName', 'lastName', 'email', 'companyName'] as const;

function extractVariables(text: string): string[] {
    const matches = text.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))].sort();
}

// ============================================================================
// Email Chip Input Component
// ============================================================================

function EmailChipInput({
    emails,
    onChange,
    error,
}: {
    emails: string[];
    onChange: (emails: string[]) => void;
    error?: string;
}) {
    const [inputValue, setInputValue] = useState('');
    const [inputError, setInputError] = useState('');

    const validateEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const addEmail = (email: string) => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) return;

        if (!validateEmail(trimmed)) {
            setInputError('Invalid email format');
            return;
        }

        if (emails.includes(trimmed)) {
            setInputError('Email already added');
            return;
        }

        onChange([...emails, trimmed]);
        setInputValue('');
        setInputError('');
    };

    const removeEmail = (email: string) => {
        onChange(emails.filter(e => e !== email));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addEmail(inputValue);
        }
        if (e.key === 'Backspace' && !inputValue && emails.length > 0) {
            removeEmail(emails[emails.length - 1]);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30 min-h-[80px]">
                {emails.map((email) => (
                    <Badge key={email} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                        {email}
                        <button
                            type="button"
                            onClick={() => removeEmail(email)}
                            className="ml-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded p-0.5"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
                <Input
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setInputError('');
                    }}
                    onKeyDown={handleKeyDown}
                    onBlur={() => inputValue && addEmail(inputValue)}
                    placeholder={emails.length === 0 ? "Enter email addresses..." : ""}
                    className="flex-1 min-w-[200px] border-0 shadow-none focus-visible:ring-0 p-0"
                />
            </div>
            {(inputError || error) && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {inputError || error}
                </p>
            )}
            <p className="text-xs text-muted-foreground">
                Press Enter or comma to add. Backspace to remove the last one.
            </p>
        </div>
    );
}

// ============================================================================
// Searchable User Selector Component
// ============================================================================

function UserSearchSelector({
    selectedUsers,
    onSelect,
    onRemove,
}: {
    selectedUsers: UserDto[];
    onSelect: (user: UserDto) => void;
    onRemove: (userId: string) => void;
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserDto[]>([]);
    const [searching, setSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Search users with debounce
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const results = await userManagementService.quickSearchUsers(searchQuery);
                const selectedIds = new Set(selectedUsers.map(u => u.id));
                setSearchResults(results.filter(u => !selectedIds.has(u.id)));
                setShowDropdown(true);
            } catch (error) {
                console.error('Failed to search users:', error);
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedUsers]);

    const handleSelectUser = (user: UserDto) => {
        onSelect(user);
        setSearchQuery('');
        setSearchResults([]);
        setShowDropdown(false);
    };

    return (
        <div className="space-y-2">
            <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                System Users
            </Label>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-muted/30">
                    {selectedUsers.map((user) => (
                        <Badge key={user.id} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                            {user.displayName || user.username}
                            <span className="text-xs text-muted-foreground ml-1">
                                ({user.email})
                            </span>
                            <button
                                type="button"
                                onClick={() => onRemove(user.id)}
                                className="ml-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded p-0.5"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            {/* Search Input */}
            <div className="relative">
                <Input
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                />
                {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                )}

                {/* Search Results Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-[200px] overflow-y-auto">
                        {searchResults.map((user) => (
                            <button
                                key={user.id}
                                type="button"
                                onClick={() => handleSelectUser(user)}
                                className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2"
                            >
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                    {(user.displayName || user.username || '?').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{user.displayName || user.username}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <p className="text-xs text-muted-foreground">
                {selectedUsers.length} user(s) selected
            </p>
        </div>
    );
}

// ============================================================================
// Searchable Role Selector Component
// ============================================================================

function RoleSearchSelector({
    selectedRoles,
    onSelect,
    onRemove,
}: {
    selectedRoles: RoleDto[];
    onSelect: (role: RoleDto) => void;
    onRemove: (roleId: string) => void;
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<RoleDto[]>([]);
    const [searching, setSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Search roles with debounce
    useEffect(() => {
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const response: PageResponse<RoleDto> = await roleManagementService.getRoles(
                    0, 20, 'name', 'asc', searchQuery || undefined
                );
                const selectedIds = new Set(selectedRoles.map(r => r.id));
                setSearchResults(response.content.filter(r => !selectedIds.has(r.id)));
                if (searchQuery.length >= 1) {
                    setShowDropdown(true);
                }
            } catch (error) {
                console.error('Failed to search roles:', error);
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedRoles]);

    const handleSelectRole = (role: RoleDto) => {
        onSelect(role);
        setSearchQuery('');
        setShowDropdown(false);
    };

    return (
        <div className="space-y-2">
            <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Roles
            </Label>

            {/* Selected Roles */}
            {selectedRoles.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-muted/30">
                    {selectedRoles.map((role) => (
                        <Badge key={role.id} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                            {role.name}
                            {role.userCount !== undefined && (
                                <span className="text-xs text-muted-foreground ml-1">
                                    ({role.userCount} users)
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => onRemove(role.id)}
                                className="ml-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded p-0.5"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            {/* Search Input */}
            <div className="relative">
                <Input
                    placeholder="Search roles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                />
                {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                )}

                {/* Search Results Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-[200px] overflow-y-auto">
                        {searchResults.map((role) => (
                            <button
                                key={role.id}
                                type="button"
                                onClick={() => handleSelectRole(role)}
                                className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between"
                            >
                                <span className="font-medium">{role.name}</span>
                                {role.userCount !== undefined && (
                                    <span className="text-xs text-muted-foreground">
                                        {role.userCount} users
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <p className="text-xs text-muted-foreground">
                {selectedRoles.length} role(s) selected
            </p>
        </div>
    );
}

// ============================================================================
// Document Search Selector Component
// ============================================================================

function DocumentSearchSelector({
    selectedDocIds,
    onSelect,
    onRemove,
}: {
    selectedDocIds: number[];
    onSelect: (docId: number) => void;
    onRemove: (docId: number) => void;
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<DocumentResponseDto[]>([]);
    const [searching, setSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Search documents with debounce
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const results = await documentService.searchDocuments(searchQuery, 0, 10);
                const selectedIdSet = new Set(selectedDocIds);
                setSearchResults(results.content.filter((doc: DocumentResponseDto) => !selectedIdSet.has(doc.documentId)));
                setShowDropdown(true);
            } catch (error) {
                console.error('Failed to search documents:', error);
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedDocIds]);

    const handleSelectDocument = (doc: DocumentResponseDto) => {
        onSelect(doc.documentId);
        setSearchQuery('');
        setSearchResults([]);
        setShowDropdown(false);
    };

    const formatSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    };

    return (
        <div className="space-y-2">
            {/* Search Input */}
            <div className="relative">
                <Input
                    placeholder="Search documents by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                />
                {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                )}

                {/* Search Results Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-[200px] overflow-y-auto">
                        {searchResults.map((doc) => (
                            <button
                                key={doc.documentId}
                                type="button"
                                onClick={() => handleSelectDocument(doc)}
                                className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2"
                            >
                                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{doc.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatSize(doc.sizeBytes)}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <p className="text-xs text-muted-foreground">
                {selectedDocIds.length} document(s) selected
            </p>
        </div>
    );
}

// ============================================================================
// Variable Info Panel Component
// ============================================================================

function VariableInfoPanel({
    subject,
    bodyHtml,
    templateVariables,
}: {
    subject: string;
    bodyHtml: string;
    templateVariables?: string[];
}) {
    const usedVars = [...new Set([
        ...extractVariables(subject),
        ...extractVariables(bodyHtml)
    ])];

    const standardVars = usedVars.filter(v => STANDARD_VARIABLES.includes(v as any));
    const customVars = usedVars.filter(v =>
        !STANDARD_VARIABLES.includes(v as any) && templateVariables?.includes(v)
    );
    const unknownVars = usedVars.filter(v =>
        !STANDARD_VARIABLES.includes(v as any) && !templateVariables?.includes(v)
    );

    if (usedVars.length === 0) return null;

    return (
        <div className="p-3 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-500/30">
            <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Template Variables Detected
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {standardVars.map(v => (
                            <Badge key={v} variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300">
                                {`{{${v}}}`}
                            </Badge>
                        ))}
                        {customVars.map(v => (
                            <Badge key={v} variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300">
                                {`{{${v}}}`}
                            </Badge>
                        ))}
                        {unknownVars.map(v => (
                            <Badge key={v} variant="outline" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300">
                                {`{{${v}}}`}
                                <AlertTriangle className="h-3 w-3 ml-1" />
                            </Badge>
                        ))}
                    </div>
                    {unknownVars.length > 0 && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                            ⚠️ Unknown variables won't be replaced
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        Standard variables (name, email, etc.) are auto-filled per recipient
                    </p>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Form Validation
// ============================================================================

interface FormErrors {
    name?: string;
    subject?: string;
    bodyHtml?: string;
    recipients?: string;
}

function validateForm(
    data: CampaignFormData,
    selectedUsers: UserDto[],
    selectedRoles: RoleDto[]
): FormErrors {
    const errors: FormErrors = {};

    if (!data.name.trim()) {
        errors.name = 'Campaign name is required';
    }

    if (!data.subject.trim()) {
        errors.subject = 'Subject is required';
    }

    if (!data.bodyHtml.trim()) {
        errors.bodyHtml = 'Email body is required';
    }

    // Validate recipients - check both live selections AND existing IDs in formData
    const hasSystemUsers = selectedUsers.length > 0 || selectedRoles.length > 0
        || (data.targetUserIds && data.targetUserIds.length > 0)
        || (data.targetRoleIds && data.targetRoleIds.length > 0);
    const hasExternalEmails = data.externalEmails.length > 0;

    if (data.targetType === 'SYSTEM_USERS' && !hasSystemUsers) {
        errors.recipients = 'Select at least one user or role';
    }
    if (data.targetType === 'EXTERNAL' && !hasExternalEmails) {
        errors.recipients = 'Add at least one email address';
    }
    if (data.targetType === 'MIXED' && !hasSystemUsers && !hasExternalEmails) {
        errors.recipients = 'Add at least one recipient';
    }

    return errors;
}

// ============================================================================
// Main CampaignFormModal Component
// ============================================================================

interface CampaignFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    campaign?: EmailCampaign;
    isEditing: boolean;
    onSubmit: (data: CampaignFormData) => Promise<void>;
    templates: EmailTemplate[];
}

export default function CampaignFormModal({
    open,
    onOpenChange,
    campaign,
    isEditing,
    onSubmit,
    templates,
}: CampaignFormModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    // Selected users and roles (real data)
    const [selectedUsers, setSelectedUsers] = useState<UserDto[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<RoleDto[]>([]);

    // Currently selected template (for variable info)
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

    // WYSIWYG editor state
    const [availableVariables, setAvailableVariables] = useState<VariableDefinition[]>([]);
    const [showPreview, setShowPreview] = useState(false);

    // Fetch available variables on mount
    useEffect(() => {
        emailManagementService.getVariables()
            .then(setAvailableVariables)
            .catch(err => console.error('Failed to fetch variables:', err));
    }, []);

    // Form state
    const [formData, setFormData] = useState<CampaignFormData>({
        name: '',
        subject: '',
        bodyHtml: '<p>Your email content here...</p>',
        templateId: undefined,
        type: 'NEWSLETTER',
        targetType: 'SYSTEM_USERS',
        targetUserIds: [],
        targetRoleIds: [],
        externalEmails: [],
        documentIds: [],
        scheduleEnabled: false,
        scheduledAt: undefined,
    });

    // Track whether user has interacted with pickers (to avoid overwriting existing IDs on edit)
    const recipientPickerTouched = React.useRef(false);

    // Reset form when dialog opens/closes or campaign changes
    useEffect(() => {
        recipientPickerTouched.current = false;
        if (open) {
            if (campaign && isEditing) {
                setFormData({
                    name: campaign.name,
                    subject: campaign.subject,
                    bodyHtml: campaign.bodyHtml,
                    templateId: campaign.templateId,
                    type: campaign.type,
                    targetType: campaign.targetType,
                    targetUserIds: campaign.targetUserIds || [],
                    targetRoleIds: campaign.targetRoleIds || [],
                    externalEmails: campaign.externalEmails || [],
                    documentIds: campaign.documentIds || [],
                    scheduleEnabled: !!campaign.scheduledAt,
                    scheduledAt: campaign.scheduledAt,
                });
                // Start fresh - existing IDs are preserved in formData above
                setSelectedUsers([]);
                setSelectedRoles([]);
            } else {
                setFormData({
                    name: '',
                    subject: '',
                    bodyHtml: '<p>Your email content here...</p>',
                    templateId: undefined,
                    type: 'NEWSLETTER',
                    targetType: 'SYSTEM_USERS',
                    targetUserIds: [],
                    targetRoleIds: [],
                    externalEmails: [],
                    documentIds: [],
                    scheduleEnabled: false,
                    scheduledAt: undefined,
                });
                setSelectedUsers([]);
                setSelectedRoles([]);
                setSelectedTemplate(null);
            }
            setErrors({});
        }
    }, [open, campaign, isEditing]);

    // Sync selected users/roles to form data ONLY when user actively interacts with pickers
    useEffect(() => {
        if (!recipientPickerTouched.current) return;
        setFormData(prev => ({
            ...prev,
            targetUserIds: selectedUsers.map(u => u.id),
            targetRoleIds: selectedRoles.map(r => r.id),
        }));
    }, [selectedUsers, selectedRoles]);

    // Handle template selection
    const handleTemplateSelect = (templateId: string) => {
        if (templateId === 'none') {
            setFormData(prev => ({ ...prev, templateId: undefined }));
            setSelectedTemplate(null);
        } else {
            const template = templates.find(t => String(t.id) === templateId);
            if (template) {
                setFormData(prev => ({
                    ...prev,
                    templateId,
                    subject: template.subject,
                    bodyHtml: template.bodyHtml,
                }));
                setSelectedTemplate(template);
            }
        }
    };

    // Handle form submission
    const handleSubmit = async (asDraft: boolean = true) => {
        const validationErrors = validateForm(formData, selectedUsers, selectedRoles);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({
                ...formData,
                scheduleEnabled: !asDraft && formData.scheduleEnabled,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateField = <K extends keyof CampaignFormData>(
        field: K,
        value: CampaignFormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    // Filter to only active templates
    const activeTemplates = templates.filter(t => t.isActive);

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="max-w-3xl max-h-[90vh] p-0 overflow-hidden"
                    onInteractOutside={(e) => {
                        if (showPreview) e.preventDefault();
                    }}
                    onEscapeKeyDown={(e) => {
                        if (showPreview) e.preventDefault();
                    }}
                >
                    <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            {isEditing ? 'Edit Campaign' : 'Create Campaign'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? 'Update your email campaign details'
                                : 'Set up a new email campaign to reach your audience'}
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[calc(90vh-200px)]">
                        <div className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div className="grid gap-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Campaign Name *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => updateField('name', e.target.value)}
                                            placeholder="e.g., February Newsletter"
                                            className={errors.name ? 'border-red-500' : ''}
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-500 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="template" className="flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Use Template
                                        </Label>
                                        <Select
                                            value={formData.templateId || 'none'}
                                            onValueChange={handleTemplateSelect}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a template" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No template - compose manually</SelectItem>
                                                {activeTemplates.map((t) => (
                                                    <SelectItem key={t.id} value={String(t.id)}>
                                                        {t.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {activeTemplates.length === 0 && (
                                            <p className="text-xs text-muted-foreground">
                                                No active templates available
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject Line *</Label>
                                    <Input
                                        id="subject"
                                        value={formData.subject}
                                        onChange={(e) => updateField('subject', e.target.value)}
                                        placeholder="Enter email subject..."
                                        className={errors.subject ? 'border-red-500' : ''}
                                    />
                                    {errors.subject && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {errors.subject}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="body">Email Body *</Label>
                                    <RichEmailEditor
                                        value={formData.bodyHtml}
                                        onChange={(html) => updateField('bodyHtml', html)}
                                        availableVariables={availableVariables}
                                        placeholder="Start writing your email..."
                                        error={!!errors.bodyHtml}
                                        onPreview={() => setShowPreview(true)}
                                    />
                                    {errors.bodyHtml && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {errors.bodyHtml}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <hr className="border-dashed" />

                            {/* Campaign Type & Target */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Campaign Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(v) => updateField('type', v as EmailCampaignType)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NEWSLETTER">Newsletter</SelectItem>
                                            <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                                            <SelectItem value="TRANSACTIONAL">Transactional</SelectItem>
                                            <SelectItem value="AUTOMATED">Automated</SelectItem>
                                            <SelectItem value="SYSTEM">System</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Target Type</Label>
                                    <Select
                                        value={formData.targetType}
                                        onValueChange={(v) => {
                                            updateField('targetType', v as TargetType);
                                            setErrors(prev => ({ ...prev, recipients: undefined }));
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SYSTEM_USERS">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4" />
                                                    System Users
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="EXTERNAL">
                                                <div className="flex items-center gap-2">
                                                    <Globe className="h-4 w-4" />
                                                    External
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="MIXED">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4" />
                                                    Mixed
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Recipients Section */}
                            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                                <h4 className="font-medium flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" />
                                    Recipients
                                </h4>

                                {errors.recipients && (
                                    <p className="text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.recipients}
                                    </p>
                                )}

                                {/* System Users Selection */}
                                {(formData.targetType === 'SYSTEM_USERS' || formData.targetType === 'MIXED') && (
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <RoleSearchSelector
                                            selectedRoles={selectedRoles}
                                            onSelect={(role) => { recipientPickerTouched.current = true; setSelectedRoles(prev => [...prev, role]); }}
                                            onRemove={(roleId) => { recipientPickerTouched.current = true; setSelectedRoles(prev => prev.filter(r => r.id !== roleId)); }}
                                        />
                                        <UserSearchSelector
                                            selectedUsers={selectedUsers}
                                            onSelect={(user) => { recipientPickerTouched.current = true; setSelectedUsers(prev => [...prev, user]); }}
                                            onRemove={(userId) => { recipientPickerTouched.current = true; setSelectedUsers(prev => prev.filter(u => u.id !== userId)); }}
                                        />
                                    </div>
                                )}

                                {/* External Emails */}
                                {(formData.targetType === 'EXTERNAL' || formData.targetType === 'MIXED') && (
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Globe className="h-4 w-4" />
                                            External Email Addresses
                                        </Label>
                                        <EmailChipInput
                                            emails={formData.externalEmails}
                                            onChange={(emails) => {
                                                updateField('externalEmails', emails);
                                                setErrors(prev => ({ ...prev, recipients: undefined }));
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            <hr className="border-dashed" />

                            {/* Document Attachments Section */}
                            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                                <h4 className="font-medium flex items-center gap-2">
                                    <Paperclip className="h-4 w-4 text-primary" />
                                    Document Attachments
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    Attach documents from your DMS. If total size exceeds 20MB, download links will be sent instead.
                                </p>

                                {/* Selected Documents */}
                                {formData.documentIds.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.documentIds.map((docId) => (
                                            <Badge key={docId} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                                                Document #{docId}
                                                <button
                                                    type="button"
                                                    onClick={() => updateField('documentIds', formData.documentIds.filter(id => id !== docId))}
                                                    className="ml-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded p-0.5"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Document Search */}
                                <DocumentSearchSelector
                                    selectedDocIds={formData.documentIds}
                                    onSelect={(docId) => {
                                        if (!formData.documentIds.includes(docId)) {
                                            updateField('documentIds', [...formData.documentIds, docId]);
                                        }
                                    }}
                                    onRemove={(docId) => updateField('documentIds', formData.documentIds.filter(id => id !== docId))}
                                />
                            </div>

                            <hr className="border-dashed" />

                            {/* Scheduling */}
                            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-primary" />
                                            Schedule for Later
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Set a specific date and time to send this campaign
                                        </p>
                                    </div>
                                    <Switch
                                        checked={formData.scheduleEnabled}
                                        onCheckedChange={(checked) => updateField('scheduleEnabled', checked)}
                                    />
                                </div>

                                {formData.scheduleEnabled && (
                                    <div className="pt-2">
                                        <Label htmlFor="scheduledAt">Send Date & Time</Label>
                                        <Input
                                            id="scheduledAt"
                                            type="datetime-local"
                                            value={formData.scheduledAt ? formData.scheduledAt.slice(0, 16) : ''}
                                            onChange={(e) => updateField('scheduledAt', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                                            min={new Date().toISOString().slice(0, 16)}
                                            className="mt-2"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="px-6 py-4 border-t bg-muted/30">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleSubmit(true)}
                            disabled={isSubmitting}
                            className="gap-2"
                        >
                            <Save className="h-4 w-4" />
                            Save Draft
                        </Button>
                        {formData.scheduleEnabled && formData.scheduledAt && (
                            <Button
                                onClick={() => handleSubmit(false)}
                                disabled={isSubmitting}
                                className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                            >
                                {isSubmitting ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Clock className="h-4 w-4" />
                                )}
                                Schedule
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent >
            </Dialog >

            {/* Email Preview Modal */}
            {
                showPreview && (
                    <EmailPreviewPanel
                        subject={formData.subject}
                        bodyHtml={formData.bodyHtml}
                        onClose={() => setShowPreview(false)}
                        onFetchPreview={async (recipientId) => {
                            const result = await emailManagementService.previewEmail({
                                subject: formData.subject,
                                bodyHtml: formData.bodyHtml,
                                recipientId,
                            });
                            return result;
                        }}
                    />
                )
            }
        </>
    );
}
