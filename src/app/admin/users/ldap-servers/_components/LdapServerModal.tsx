'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Plus,
    Trash2,
    Loader2,
    TestTube,
    Server,
    Key,
    FolderTree,
    ArrowLeftRight,
    Info,
    Clock,
    Shield,
    Users,
    AlertTriangle,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ldapServerFormSchema,
    type LdapServerFormValues,
    type LdapServer,
    type AttributeMapping,
    type GroupRoleMapping,
    type GroupGroupMapping,
    DMS_USER_FIELDS,
    SERVER_TYPE_OPTIONS,
    TYPE_ATTRIBUTE_MAPPINGS,
    TYPE_FILTER_DEFAULTS,
    SYNC_SCHEDULE_OPTIONS,
} from './ldap-types';
import LdapGroupCombobox from './LdapGroupCombobox';

// ─── Props ───────────────────────────────────────────────────────────────────

interface LdapServerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    server: LdapServer | null; // null = add mode
    onSave: (values: LdapServerFormValues, mappings: AttributeMapping[]) => Promise<void>;
    onTestConnection: (values: LdapServerFormValues) => Promise<boolean>;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LdapServerModal({
    open,
    onOpenChange,
    server,
    onSave,
    onTestConnection,
}: LdapServerModalProps) {
    const isEditing = !!server;
    const [activeTab, setActiveTab] = useState('connection');
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [attributeMappings, setAttributeMappings] = useState<AttributeMapping[]>([]);

    // ── Role mapping state ──
    const [groupRoleMappings, setGroupRoleMappings] = useState<GroupRoleMapping[]>([]);
    const [availableRoles, setAvailableRoles] = useState<{ id: string; name: string }[]>([]);
    const [isSavingMappings, setIsSavingMappings] = useState(false);
    const [defaultRoleName, setDefaultRoleName] = useState('USER');
    const [mappingsLoaded, setMappingsLoaded] = useState(false);

    // ── Group-group mapping state ──
    const [groupGroupMappings, setGroupGroupMappings] = useState<GroupGroupMapping[]>([]);
    const [availableDmsGroups, setAvailableDmsGroups] = useState<{ id: string; name: string }[]>([]);
    const [isSavingGroupMappings, setIsSavingGroupMappings] = useState(false);
    const [groupMappingsLoaded, setGroupMappingsLoaded] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<LdapServerFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(ldapServerFormSchema) as any,
        defaultValues: {
            name: '',
            serverType: 'Active Directory',
            hostname: '',
            port: 389,
            useSSL: false,
            useTLS: false,
            description: '',
            bindDn: '',
            bindPassword: '',
            baseDn: '',
            userFilter: '(&(objectClass=person)(objectClass=user)(!(objectClass=computer)))',
            groupFilter: '(&(objectClass=group))',
            connectionTimeout: 30,
            searchTimeout: 10,
            syncSchedule: 'DAILY',
            autoDisableUsers: true,
        },
    });

    const useSSL = watch('useSSL');
    const useTLS = watch('useTLS');
    const serverType = watch('serverType');
    const isCustom = serverType === 'Custom';

    // Populate form when editing
    useEffect(() => {
        if (open) {
            if (server) {
                reset({
                    name: server.name,
                    serverType: server.serverType || 'Active Directory',
                    hostname: server.hostname,
                    port: server.port,
                    useSSL: server.useSSL,
                    useTLS: server.useTLS,
                    description: server.description,
                    bindDn: server.bindDN,
                    bindPassword: '',
                    baseDn: server.baseDN,
                    userFilter: server.filters.userFilter,
                    groupFilter: server.filters.groupFilter,
                    connectionTimeout: server.connectionTimeout,
                    searchTimeout: server.searchTimeout,
                    syncSchedule: server.syncSchedule || 'DAILY',
                    autoDisableUsers: server.autoDisableUsers ?? true,
                });
                // Populate attribute mappings from server
                const mappings = Object.entries(server.attributes).map(([dmsField, ldapAttribute]) => ({
                    dmsField,
                    ldapAttribute,
                }));
                setAttributeMappings(mappings.length > 0 ? mappings : TYPE_ATTRIBUTE_MAPPINGS['Active Directory']);
            } else {
                reset();
                setAttributeMappings([...TYPE_ATTRIBUTE_MAPPINGS['Active Directory']]);
            }
            setActiveTab('connection');
            setGroupRoleMappings([]);

            setMappingsLoaded(false);
            setDefaultRoleName(server?.defaultRoleName || 'USER');
        }
    }, [open, server, reset]);

    // When server type changes (not editing), swap mappings & filters
    useEffect(() => {
        if (!open || isEditing) return;
        const typeMappings = TYPE_ATTRIBUTE_MAPPINGS[serverType];
        if (typeMappings) {
            setAttributeMappings(typeMappings.map((m) => ({ ...m })));
        }
        const typeFilters = TYPE_FILTER_DEFAULTS[serverType];
        if (typeFilters) {
            setValue('userFilter', typeFilters.userFilter);
            setValue('groupFilter', typeFilters.groupFilter);
        }
    }, [serverType, open, isEditing, setValue]);

    // Auto-switch port when SSL toggled
    useEffect(() => {
        if (useSSL) {
            setValue('port', 636);
            setValue('useTLS', false);
        } else if (!useTLS) {
            setValue('port', 389);
        }
    }, [useSSL, setValue, useTLS]);

    useEffect(() => {
        if (useTLS) {
            setValue('useSSL', false);
        }
    }, [useTLS, setValue]);

    // ── Attribute mapping handlers ──
    const addMapping = () => {
        setAttributeMappings((prev) => [...prev, { dmsField: '', ldapAttribute: '' }]);
    };

    const removeMapping = (index: number) => {
        setAttributeMappings((prev) => prev.filter((_, i) => i !== index));
    };

    const updateMapping = (
        index: number,
        field: 'dmsField' | 'ldapAttribute',
        value: string
    ) => {
        setAttributeMappings((prev) =>
            prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
        );
    };

    // ── Form actions ──
    const onSubmit = async (values: LdapServerFormValues) => {
        setIsSaving(true);
        try {
            await onSave(values, attributeMappings.filter((m) => m.dmsField && m.ldapAttribute));
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestConnection = async () => {
        const values = watch();
        // Validate required connection fields before calling API
        if (!values.hostname?.trim()) {
            toast.error('Hostname is required', {
                description: 'Enter a hostname or IP address before testing the connection.',
            });
            setActiveTab('connection');
            return;
        }
        if (!values.baseDn?.trim()) {
            toast.error('Base DN is required', {
                description: 'Enter the Base DN before testing the connection.',
            });
            setActiveTab('directory');
            return;
        }
        setIsTesting(true);
        try {
            await onTestConnection(values);
        } finally {
            setIsTesting(false);
        }
    };

    // ── Helpers ──
    const hasTabErrors = (tab: string): boolean => {
        switch (tab) {
            case 'connection':
                return !!(errors.name || errors.hostname || errors.port || errors.description || errors.serverType);
            case 'authentication':
                return !!(errors.bindDn || errors.bindPassword);
            case 'directory':
                return !!(errors.baseDn || errors.userFilter || errors.groupFilter);
            default:
                return false;
        }
    };

    // Get available DMS fields (exclude already-mapped ones)
    const getAvailableDmsFields = (currentIndex: number) => {
        const usedFields = attributeMappings
            .filter((_, i) => i !== currentIndex)
            .map((m) => m.dmsField);
        return DMS_USER_FIELDS.filter((f) => !usedFields.includes(f.value));
    };

    // ── Role mapping handlers ──
    const loadGroupMappings = useCallback(async () => {
        if (!server?.id || mappingsLoaded) return;
        try {
            const { ldapServerService } = await import('@/api/services/ldapServerService');
            const data = await ldapServerService.getGroupMappings(server.id);
            setGroupRoleMappings(data.mappings || []);
            setDefaultRoleName(data.defaultRoleName || 'USER');
            setMappingsLoaded(true);
        } catch {
            console.error('Failed to load group mappings');
        }
    }, [server?.id, mappingsLoaded]);

    const loadAvailableRoles = useCallback(async () => {
        if (availableRoles.length > 0) return;
        try {
            const { roleManagementService } = await import('@/api/services/roleManagementService');
            const result = await roleManagementService.getRoles(0, 100);
            const roles = (result as any).content || result;
            setAvailableRoles(Array.isArray(roles) ? roles.map((r: any) => ({ id: r.id, name: r.name })) : []);
        } catch {
            console.error('Failed to load roles');
        }
    }, [availableRoles.length]);



    const addGroupMapping = () => {
        setGroupRoleMappings(prev => [...prev, {
            ldapGroupDn: '',
            ldapGroupName: '',
            roleId: '',
            roleName: '',
        }]);
    };

    const removeGroupMapping = (index: number) => {
        setGroupRoleMappings(prev => prev.filter((_, i) => i !== index));
    };

    const updateGroupMapping = (index: number, field: keyof GroupRoleMapping, value: string) => {
        setGroupRoleMappings(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            if (field === 'roleId') {
                const role = availableRoles.find(r => r.id === value);
                if (role) updated[index].roleName = role.name;
            }
            return updated;
        });
    };

    const saveGroupMappings = async () => {
        if (!server?.id) return;
        setIsSavingMappings(true);
        try {
            const { ldapServerService } = await import('@/api/services/ldapServerService');
            const validMappings = groupRoleMappings.filter(m => m.ldapGroupDn && m.roleId);
            await ldapServerService.saveGroupMappings(server.id, {
                defaultRoleName,
                mappings: validMappings,
            });
        } catch {
            console.error('Failed to save group mappings');
        } finally {
            setIsSavingMappings(false);
        }
    };

    // ── Group-group mapping handlers ──
    const loadGroupGroupMappings = useCallback(async () => {
        if (!server?.id || groupMappingsLoaded) return;
        try {
            const { ldapServerService } = await import('@/api/services/ldapServerService');
            const data = await ldapServerService.getGroupGroupMappings(server.id);
            setGroupGroupMappings(data.mappings || []);
            setGroupMappingsLoaded(true);
        } catch {
            console.error('Failed to load group-group mappings');
        }
    }, [server?.id, groupMappingsLoaded]);

    const loadAvailableDmsGroups = useCallback(async () => {
        if (availableDmsGroups.length > 0) return;
        try {
            const { ldapServerService } = await import('@/api/services/ldapServerService');
            const groups = await ldapServerService.fetchDmsGroups();
            setAvailableDmsGroups(Array.isArray(groups) ? groups : []);
        } catch {
            console.error('Failed to load DMS groups');
        }
    }, [availableDmsGroups.length]);

    const addGroupGroupMapping = () => {
        setGroupGroupMappings(prev => [...prev, {
            ldapGroupDn: '',
            ldapGroupName: '',
            groupId: '',
            groupName: '',
        }]);
    };

    const removeGroupGroupMapping = (index: number) => {
        setGroupGroupMappings(prev => prev.filter((_, i) => i !== index));
    };

    const updateGroupGroupMapping = (index: number, field: keyof GroupGroupMapping, value: string) => {
        setGroupGroupMappings(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            if (field === 'groupId') {
                const dmsGroup = availableDmsGroups.find(g => g.id === value);
                if (dmsGroup) updated[index].groupName = dmsGroup.name;
            }
            return updated;
        });
    };

    const saveGroupGroupMappings = async () => {
        if (!server?.id) return;
        setIsSavingGroupMappings(true);
        try {
            const { ldapServerService } = await import('@/api/services/ldapServerService');
            const validMappings = groupGroupMappings.filter(m => m.ldapGroupDn && m.groupId);
            await ldapServerService.saveGroupGroupMappings(server.id, {
                mappings: validMappings,
            });
            toast.success('Group mappings saved successfully');
        } catch {
            toast.error('Failed to save group mappings');
        } finally {
            setIsSavingGroupMappings(false);
        }
    };

    // Load mappings and roles when switching to the roles tab
    useEffect(() => {
        if (activeTab === 'roles' && server?.id) {
            loadGroupMappings();
            loadAvailableRoles();
        }
    }, [activeTab, server?.id, loadGroupMappings, loadAvailableRoles]);

    // Load group-group mappings and DMS groups when switching to the groups tab
    useEffect(() => {
        if (activeTab === 'groups' && server?.id) {
            loadGroupGroupMappings();
            loadAvailableDmsGroups();
        }
    }, [activeTab, server?.id, loadGroupGroupMappings, loadAvailableDmsGroups]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-0">
                    <DialogTitle className="text-xl">
                        {isEditing ? 'Edit LDAP Server' : 'Add LDAP Server'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? `Modify the configuration for "${server?.name}".`
                            : 'Configure a new LDAP server connection for user synchronization.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="flex flex-col flex-1 overflow-hidden"
                    >
                        <div className="px-6 pt-4">
                            <TabsList className="w-full grid grid-cols-7">
                                <TabsTrigger
                                    value="connection"
                                    className="gap-1.5 text-xs sm:text-sm relative"
                                >
                                    <Server className="h-3.5 w-3.5 hidden sm:block" />
                                    Connection
                                    {hasTabErrors('connection') && (
                                        <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="authentication"
                                    className="gap-1.5 text-xs sm:text-sm relative"
                                >
                                    <Key className="h-3.5 w-3.5 hidden sm:block" />
                                    Auth
                                    {hasTabErrors('authentication') && (
                                        <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="directory"
                                    className="gap-1.5 text-xs sm:text-sm relative"
                                >
                                    <FolderTree className="h-3.5 w-3.5 hidden sm:block" />
                                    Directory
                                    {hasTabErrors('directory') && (
                                        <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="mapping"
                                    className="gap-1.5 text-xs sm:text-sm"
                                >
                                    <ArrowLeftRight className="h-3.5 w-3.5 hidden sm:block" />
                                    Mapping
                                </TabsTrigger>
                                <TabsTrigger
                                    value="sync"
                                    className="gap-1.5 text-xs sm:text-sm"
                                >
                                    <Clock className="h-3.5 w-3.5 hidden sm:block" />
                                    Sync
                                </TabsTrigger>
                                <TabsTrigger
                                    value="roles"
                                    className="gap-1.5 text-xs sm:text-sm"
                                >
                                    <Shield className="h-3.5 w-3.5 hidden sm:block" />
                                    Roles
                                </TabsTrigger>
                                <TabsTrigger
                                    value="groups"
                                    className="gap-1.5 text-xs sm:text-sm"
                                >
                                    <Users className="h-3.5 w-3.5 hidden sm:block" />
                                    Groups
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            {/* ── Tab 1: Connection ── */}
                            <TabsContent value="connection" className="mt-0 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Server Name <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g., Corporate Active Directory"
                                            {...register('name')}
                                            aria-invalid={!!errors.name}
                                        />
                                        {errors.name && (
                                            <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="serverType">Server Type <span className="text-red-500">*</span></Label>
                                        <Select
                                            value={serverType}
                                            onValueChange={(val) => setValue('serverType', val)}
                                        >
                                            <SelectTrigger id="serverType" className={errors.serverType ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SERVER_TYPE_OPTIONS.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.serverType && (
                                            <p className="text-xs text-red-500 mt-1">{errors.serverType.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Input
                                        id="description"
                                        placeholder="Optional description for this server"
                                        {...register('description')}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="hostname">Hostname / IP <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="hostname"
                                            placeholder="ad.company.com"
                                            {...register('hostname')}
                                            aria-invalid={!!errors.hostname}
                                        />
                                        {errors.hostname && (
                                            <p className="text-xs text-red-500 mt-1">{errors.hostname.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="port">Port <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="port"
                                            type="number"
                                            {...register('port')}
                                            aria-invalid={!!errors.port}
                                        />
                                        {errors.port && (
                                            <p className="text-xs text-red-500 mt-1">{errors.port.message}</p>
                                        )}
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium">Security</h4>
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div>
                                            <Label htmlFor="useSSL" className="font-medium">Use SSL (LDAPS)</Label>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Connect over port 636 with SSL encryption
                                            </p>
                                        </div>
                                        <Switch
                                            id="useSSL"
                                            checked={useSSL}
                                            onCheckedChange={(checked) => setValue('useSSL', checked)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div>
                                            <Label htmlFor="useTLS" className="font-medium">Use STARTTLS</Label>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Upgrade connection to TLS after connecting on port 389
                                            </p>
                                        </div>
                                        <Switch
                                            id="useTLS"
                                            checked={useTLS}
                                            onCheckedChange={(checked) => setValue('useTLS', checked)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="connectionTimeout">Connection Timeout (s)</Label>
                                        <Input
                                            id="connectionTimeout"
                                            type="number"
                                            {...register('connectionTimeout')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="searchTimeout">Search Timeout (s)</Label>
                                        <Input
                                            id="searchTimeout"
                                            type="number"
                                            {...register('searchTimeout')}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ── Tab 2: Authentication ── */}
                            <TabsContent value="authentication" className="mt-0 space-y-5">
                                <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/30 p-4 text-sm">
                                    <p className="text-amber-800 dark:text-amber-300">
                                        The Bind DN is the account used to connect to the LDAP server. Make sure it has
                                        read access to search for users and groups.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bindDn">Bind DN <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="bindDn"
                                        placeholder="cn=admin,dc=example,dc=com"
                                        className="font-mono text-sm"
                                        {...register('bindDn')}
                                        aria-invalid={!!errors.bindDn}
                                    />
                                    {errors.bindDn && (
                                        <p className="text-xs text-red-500 mt-1">{errors.bindDn.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bindPassword">
                                        Bind Password
                                        {isEditing && (
                                            <span className="text-xs text-muted-foreground ml-2">(leave blank to keep unchanged)</span>
                                        )}
                                    </Label>
                                    <Input
                                        id="bindPassword"
                                        type="password"
                                        placeholder={isEditing ? '••••••••' : 'Enter password'}
                                        {...register('bindPassword')}
                                    />
                                </div>
                            </TabsContent>

                            {/* ── Tab 3: Directory Settings ── */}
                            <TabsContent value="directory" className="mt-0 space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="baseDn">Base Search DN <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="baseDn"
                                        placeholder="dc=example,dc=com"
                                        className="font-mono text-sm"
                                        {...register('baseDn')}
                                        aria-invalid={!!errors.baseDn}
                                    />
                                    {errors.baseDn && (
                                        <p className="text-xs text-red-500 mt-1">{errors.baseDn.message}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        The base DN is the root of the LDAP tree from which to search for users.
                                    </p>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <Label htmlFor="userFilter">User Search Filter</Label>
                                    <Input
                                        id="userFilter"
                                        placeholder="(&(objectClass=person))"
                                        className="font-mono text-sm"
                                        {...register('userFilter')}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        LDAP filter for finding user entries.
                                        {!isCustom && (
                                            <span className="text-primary ml-1">(Pre-filled for {serverType})</span>
                                        )}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="groupFilter">Group Search Filter</Label>
                                    <Input
                                        id="groupFilter"
                                        placeholder="(&(objectClass=group))"
                                        className="font-mono text-sm"
                                        {...register('groupFilter')}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        LDAP filter for finding group entries.
                                    </p>
                                </div>
                            </TabsContent>

                            {/* ── Tab 4: Attribute Mapping ── */}
                            <TabsContent value="mapping" className="mt-0 space-y-5">
                                {/* Info banner — changes based on type */}
                                {isCustom ? (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/30 p-4 text-sm">
                                        <div className="flex gap-2">
                                            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-medium text-amber-800 dark:text-amber-300">Custom Mapping Mode</p>
                                                <p className="text-amber-700 dark:text-amber-400 mt-1">
                                                    Enter both the DMS field name and the LDAP attribute manually. The DMS field must
                                                    match a User entity property (e.g., <code className="bg-amber-200/50 dark:bg-amber-900/50 px-1 rounded text-xs">username</code>,{' '}
                                                    <code className="bg-amber-200/50 dark:bg-amber-900/50 px-1 rounded text-xs">email</code>,{' '}
                                                    <code className="bg-amber-200/50 dark:bg-amber-900/50 px-1 rounded text-xs">firstName</code>).
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/30 p-4 text-sm">
                                        <div className="flex gap-2">
                                            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-medium text-blue-800 dark:text-blue-300">{serverType} Preset Mappings</p>
                                                <p className="text-blue-700 dark:text-blue-400 mt-1">
                                                    Default LDAP attributes are pre-configured for {serverType}. You can modify the LDAP
                                                    attribute values if your directory uses different names.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Header */}
                                <div className="grid grid-cols-[1fr_8px_1fr_40px] items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                                    <span>DMS Field</span>
                                    <span />
                                    <span>LDAP Attribute</span>
                                    <span />
                                </div>

                                {/* Mapping rows */}
                                <div className="space-y-2.5">
                                    {attributeMappings.map((mapping, index) => (
                                        <div
                                            key={index}
                                            className="grid grid-cols-[1fr_8px_1fr_40px] items-center gap-2 group"
                                        >
                                            {/* DMS Field — dropdown for known types, text input for Custom */}
                                            {isCustom ? (
                                                <Input
                                                    value={mapping.dmsField}
                                                    onChange={(e) => updateMapping(index, 'dmsField', e.target.value)}
                                                    placeholder="e.g., username, email, firstName"
                                                    className="h-9 text-sm"
                                                />
                                            ) : (
                                                <Select
                                                    value={mapping.dmsField}
                                                    onValueChange={(val) => updateMapping(index, 'dmsField', val)}
                                                >
                                                    <SelectTrigger className="h-9 text-sm">
                                                        <SelectValue placeholder="Select field" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {getAvailableDmsFields(index).map((field) => (
                                                            <SelectItem key={field.value} value={field.value}>
                                                                {field.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}

                                            <span className="text-center text-muted-foreground text-xs">→</span>

                                            {/* LDAP Attribute — always a text input */}
                                            <Input
                                                value={mapping.ldapAttribute}
                                                onChange={(e) =>
                                                    updateMapping(index, 'ldapAttribute', e.target.value)
                                                }
                                                placeholder={isCustom ? 'e.g., sAMAccountName, uid, mail' : 'LDAP attribute'}
                                                className="h-9 font-mono text-sm"
                                            />

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-9 w-9 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                                onClick={() => removeMapping(index)}
                                                disabled={attributeMappings.length <= 1}
                                                aria-label={`Remove mapping for ${mapping.dmsField || 'field'}`}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addMapping}
                                    className="gap-1.5 w-full border-dashed"
                                    disabled={!isCustom && attributeMappings.length >= DMS_USER_FIELDS.length}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Mapping
                                </Button>
                            </TabsContent>

                            {/* ── Tab 5: Roles (LDAP Group → DMS Role) ── */}
                            <TabsContent value="roles" className="mt-0 space-y-5">
                                {!isEditing ? (
                                    <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                                        <Shield className="h-10 w-10 mx-auto mb-3 opacity-40" />
                                        <p className="font-medium">Save the server first</p>
                                        <p className="text-sm mt-1">Role mappings can be configured after the server is saved.</p>
                                    </div>
                                ) : (<>
                                    <div className="rounded-lg border bg-violet-50/50 dark:bg-violet-950/20 border-violet-200/50 dark:border-violet-800/50 p-4">
                                        <div className="flex items-start gap-3">
                                            <Shield className="h-5 w-5 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-medium text-violet-800 dark:text-violet-300">Group → Role Mapping</p>
                                                <p className="text-sm text-violet-700/70 dark:text-violet-400/70 mt-1">
                                                    Map LDAP groups to DMS roles. During sync, users will automatically receive DMS roles
                                                    based on their LDAP group memberships. Manually assigned roles are never affected.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mapping rows */}
                                    <div className="space-y-2">
                                        {/* Header */}
                                        <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center text-xs font-medium text-muted-foreground px-1">
                                            <span>LDAP Group</span>
                                            <span></span>
                                            <span>DMS Role</span>
                                            <span></span>
                                        </div>

                                        {groupRoleMappings.map((mapping, index) => {
                                            const isDuplicate = mapping.ldapGroupDn && groupRoleMappings.filter(m => m.ldapGroupDn === mapping.ldapGroupDn).length > 1;
                                            return (
                                                <div key={index} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center group">
                                                    {/* LDAP Group — autocomplete combobox */}
                                                    <div>
                                                        <LdapGroupCombobox
                                                            serverId={server?.id || ''}
                                                            value={mapping.ldapGroupDn}
                                                            displayName={mapping.ldapGroupName}
                                                            hasConflict={!!isDuplicate}
                                                            onSelect={(dn, name) => {
                                                                setGroupRoleMappings(prev => {
                                                                    const updated = [...prev];
                                                                    updated[index] = { ...updated[index], ldapGroupDn: dn, ldapGroupName: name };
                                                                    return updated;
                                                                });
                                                            }}
                                                            triggerClassName="h-9 text-sm w-full"
                                                        />
                                                        {isDuplicate && (
                                                            <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                                                                <AlertTriangle className="h-3 w-3" />
                                                                <span>Duplicate mapping</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <ArrowLeftRight className="h-4 w-4 text-muted-foreground shrink-0" />

                                                    {/* DMS Role dropdown */}
                                                    <Select
                                                        value={mapping.roleId}
                                                        onValueChange={(val) => updateGroupMapping(index, 'roleId', val)}
                                                    >
                                                        <SelectTrigger className="h-9 text-sm">
                                                            <SelectValue placeholder="Select DMS role" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {availableRoles.map((role) => (
                                                                <SelectItem key={role.id} value={role.id}>
                                                                    {role.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>

                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 w-9 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                                        onClick={() => removeGroupMapping(index)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addGroupMapping}
                                        className="gap-1.5 w-full border-dashed"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Add Mapping
                                    </Button>

                                    <Separator />

                                    {/* Default role */}
                                    <div className="space-y-2">
                                        <Label>Default Role for Unmapped Users</Label>
                                        <Select
                                            value={defaultRoleName}
                                            onValueChange={(val) => setDefaultRoleName(val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select default role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableRoles.map((role) => (
                                                    <SelectItem key={role.id} value={role.name}>
                                                        {role.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Users who don&apos;t match any group mapping will receive this role during sync.
                                        </p>
                                    </div>

                                    {/* Save mappings button */}
                                    <Button
                                        type="button"
                                        onClick={saveGroupMappings}
                                        disabled={isSavingMappings}
                                        className="gap-2 w-full"
                                    >
                                        {isSavingMappings && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {isSavingMappings ? 'Saving...' : 'Save Role Mappings'}
                                    </Button>
                                </>)}
                            </TabsContent>

                            {/* ── Tab 7: Groups (LDAP Group → DMS Group) ── */}
                            <TabsContent value="groups" className="mt-0 space-y-5">
                                {!isEditing ? (
                                    <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                                        <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                                        <p className="font-medium">Save the server first</p>
                                        <p className="text-sm mt-1">Group mappings can be configured after the server is saved.</p>
                                    </div>
                                ) : (<>
                                    <div className="rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/50 p-4">
                                        <div className="flex items-start gap-3">
                                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-medium text-blue-800 dark:text-blue-300">LDAP Group → DMS Group Mapping</p>
                                                <p className="text-sm text-blue-700/70 dark:text-blue-400/70 mt-1">
                                                    Map LDAP groups to DMS groups for automatic group assignment during sync.
                                                    Users will be added to the corresponding DMS groups based on their LDAP group membership.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Group-group mappings */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium">Group Mappings</Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addGroupGroupMapping}
                                                className="gap-1.5"
                                            >
                                                <Plus className="h-3.5 w-3.5" /> Add Mapping
                                            </Button>
                                        </div>

                                        {groupGroupMappings.length === 0 ? (
                                            <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                                                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">No group mappings yet</p>
                                                <p className="text-xs mt-1">Click &quot;Add Mapping&quot; to map LDAP groups to DMS groups</p>
                                            </div>
                                        ) : (
                                            groupGroupMappings.map((mapping, index) => {
                                                const isDuplicate = mapping.ldapGroupDn && groupGroupMappings.filter(m => m.ldapGroupDn === mapping.ldapGroupDn).length > 1;
                                                return (
                                                    <div key={index} className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                                                        <div className="flex-1 min-w-0">
                                                            <LdapGroupCombobox
                                                                serverId={server?.id || ''}
                                                                value={mapping.ldapGroupDn}
                                                                displayName={mapping.ldapGroupName}
                                                                hasConflict={!!isDuplicate}
                                                                onSelect={(dn, name) => {
                                                                    setGroupGroupMappings(prev => {
                                                                        const updated = [...prev];
                                                                        updated[index] = { ...updated[index], ldapGroupDn: dn, ldapGroupName: name };
                                                                        return updated;
                                                                    });
                                                                }}
                                                                triggerClassName="text-xs w-full"
                                                            />
                                                            {isDuplicate && (
                                                                <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                                                                    <AlertTriangle className="h-3 w-3" />
                                                                    <span>Duplicate mapping</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-muted-foreground text-xs shrink-0">→</span>
                                                        <div className="flex-1 min-w-0">
                                                            <Select
                                                                value={mapping.groupId}
                                                                onValueChange={(val) => updateGroupGroupMapping(index, 'groupId', val)}
                                                            >
                                                                <SelectTrigger className="text-xs">
                                                                    <SelectValue placeholder="Select DMS Group" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {availableDmsGroups.map((g) => (
                                                                        <SelectItem key={g.id} value={g.id}>
                                                                            {g.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeGroupGroupMapping(index)}
                                                            className="shrink-0 h-8 w-8 text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Save group mappings button */}
                                    <Button
                                        type="button"
                                        onClick={saveGroupGroupMappings}
                                        disabled={isSavingGroupMappings}
                                        className="gap-2 w-full"
                                    >
                                        {isSavingGroupMappings && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {isSavingGroupMappings ? 'Saving...' : 'Save Group Mappings'}
                                    </Button>
                                </>)}
                            </TabsContent>

                            {/* ── Tab 5: Sync Settings ── */}
                            <TabsContent value="sync" className="mt-0 space-y-5">
                                <div className="rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/50 p-4">
                                    <div className="flex items-start gap-3">
                                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-medium text-blue-800 dark:text-blue-300">Automatic Sync Schedule</p>
                                            <p className="text-sm text-blue-700/70 dark:text-blue-400/70 mt-1">
                                                Configure how often users are automatically synced from this LDAP server.
                                                &quot;Manual Only&quot; means sync only runs when you click the Sync button.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="syncSchedule">Sync Frequency</Label>
                                    <Select
                                        value={watch('syncSchedule')}
                                        onValueChange={(val) => setValue('syncSchedule', val)}
                                    >
                                        <SelectTrigger id="syncSchedule">
                                            <SelectValue placeholder="Select schedule" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SYNC_SCHEDULE_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Users will be automatically imported, updated, or disabled on this schedule.
                                    </p>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <Label htmlFor="autoDisableUsers">Auto-Disable Removed Users</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Automatically disable DMS accounts for users no longer found in LDAP.
                                                This prevents ex-employees from logging in after being removed from Active Directory.
                                            </p>
                                        </div>
                                        <Switch
                                            id="autoDisableUsers"
                                            checked={watch('autoDisableUsers')}
                                            onCheckedChange={(checked) => setValue('autoDisableUsers', checked)}
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </div>

                        <Separator />

                        {/* ── Footer ── */}
                        <DialogFooter className="px-6 py-4 flex-row gap-2 sm:gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSaving || isTesting}
                            >
                                Cancel
                            </Button>
                            <div className="flex-1" />
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleTestConnection}
                                disabled={isSaving || isTesting}
                                className="gap-2"
                            >
                                {isTesting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <TestTube className="h-4 w-4" />
                                )}
                                {isTesting ? 'Testing...' : 'Test Connection'}
                            </Button>
                            <Button type="submit" disabled={isSaving || isTesting} className="gap-2">
                                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                {isEditing ? 'Save Changes' : 'Save Configuration'}
                            </Button>
                        </DialogFooter>
                    </Tabs>
                </form>
            </DialogContent>
        </Dialog>
    );
}
