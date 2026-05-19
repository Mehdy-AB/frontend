'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
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
    Building2,
    Activity,
    Search,
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
import { Badge } from '@/components/ui/badge';
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
    type DepartmentOrgUnitMapping,
    type GroupOrgUnitMapping,
    DMS_USER_FIELDS,
    SERVER_TYPE_OPTIONS,
    TYPE_ATTRIBUTE_MAPPINGS,
    TYPE_FILTER_DEFAULTS,
    SYNC_SCHEDULE_OPTIONS,
} from './ldap-types';
import { ldapServerService, type OrgUnitSearchResult } from '@/api/services/ldapServerService';
import LdapGroupCombobox from './LdapGroupCombobox';
import LdapDepartmentCombobox from './LdapDepartmentCombobox';
import OrgUnitCombobox from './OrgUnitCombobox';
import RoleCombobox from './RoleCombobox';
import DmsGroupCombobox from './DmsGroupCombobox';

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
    const { showSuccess, showError } = useNotifications();
    const [activeTab, setActiveTab] = useState('connection');
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [attributeMappings, setAttributeMappings] = useState<AttributeMapping[]>([]);

    // Stable UID generator for mapping rows — prevents Radix Select from losing state on row deletion
    const uidRef = React.useRef(0);
    const nextUid = () => `m-${++uidRef.current}`;
    const withUid = (m: AttributeMapping): AttributeMapping => ({ ...m, _uid: m._uid || nextUid() });

    // ── Role mapping state ──
    const [groupRoleMappings, setGroupRoleMappings] = useState<GroupRoleMapping[]>([]);
    const [isSavingMappings, setIsSavingMappings] = useState(false);
    const [defaultRoleName, setDefaultRoleName] = useState('USER');
    const [mappingsLoaded, setMappingsLoaded] = useState(false);

    // ── Group-group mapping state ──
    const [groupGroupMappings, setGroupGroupMappings] = useState<GroupGroupMapping[]>([]);
    const [isSavingGroupMappings, setIsSavingGroupMappings] = useState(false);
    const [groupMappingsLoaded, setGroupMappingsLoaded] = useState(false);

    // ── OrgUnit mapping state ──
    const [deptOrgUnitMappings, setDeptOrgUnitMappings] = useState<DepartmentOrgUnitMapping[]>([]);
    const [groupOrgUnitMappings, setGroupOrgUnitMappings] = useState<GroupOrgUnitMapping[]>([]);
    const [isSavingOrgUnitMappings, setIsSavingOrgUnitMappings] = useState(false);
    const [orgUnitMappingsLoaded, setOrgUnitMappingsLoaded] = useState(false);

    // ── Dynamic user fields (fetched from backend) ──
    const [dmsUserFields, setDmsUserFields] = useState<{ value: string; label: string }[]>(DMS_USER_FIELDS as unknown as { value: string; label: string }[]);

    useEffect(() => {
        if (open) {
            ldapServerService.getUserFields()
                .then(fields => { if (fields?.length) setDmsUserFields(fields.map((f: any) => ({ value: f.value ?? f.name, label: f.label }))); })
                .catch(() => { /* fallback to hardcoded DMS_USER_FIELDS */ });
        }
    }, [open]);

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
            syncManagers: true,
            managerAttribute: 'manager',
            syncDepartment: true,
            departmentAttribute: 'department',
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
                    syncManagers: server.syncManagers ?? true,
                    managerAttribute: server.managerAttribute || 'manager',
                    syncDepartment: server.syncDepartment ?? false,
                    departmentAttribute: server.departmentAttribute || 'department',
                    immutableIdAttribute: server.immutableIdAttribute || 'objectGUID',
                    jitProvisioning: server.jitProvisioning ?? false,
                    deletionThresholdPercent: server.deletionThresholdPercent ?? 20,
                });
                // Populate attribute mappings from server
                const mappings = Object.entries(server.attributes).map(([dmsField, ldapAttribute]) => ({
                    dmsField,
                    ldapAttribute,
                }));
                setAttributeMappings((mappings.length > 0 ? mappings : TYPE_ATTRIBUTE_MAPPINGS['Active Directory']).map(withUid));
            } else {
                reset();
                setAttributeMappings([...TYPE_ATTRIBUTE_MAPPINGS['Active Directory']].map(withUid));
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
            setAttributeMappings(typeMappings.map((m) => withUid({ ...m })));
        }
        const typeFilters = TYPE_FILTER_DEFAULTS[serverType];
        if (typeFilters) {
            setValue('userFilter', typeFilters.userFilter);
            setValue('groupFilter', typeFilters.groupFilter);
        }

        // Auto-set the correct Immutable ID attribute based on server type
        if (serverType === 'Active Directory') {
            setValue('immutableIdAttribute', 'objectGUID');
        } else if (serverType === 'OpenLDAP' || serverType === 'FreeIPA') {
            setValue('immutableIdAttribute', 'entryUUID');
        } else {
            setValue('immutableIdAttribute', 'uid'); // Fallback for custom
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
        setAttributeMappings((prev) => [...prev, withUid({ dmsField: '', ldapAttribute: '' })]);
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
            showError('Hostname is required', 'Enter a hostname or IP address before testing the connection.');
            setActiveTab('connection');
            return;
        }
        if (!values.baseDn?.trim()) {
            showError('Base DN is required', 'Enter the Base DN before testing the connection.');
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

    // Get available DMS fields — exclude already-mapped ones but always include the currently selected value
    const getAvailableDmsFields = (currentIndex: number) => {
        const currentField = attributeMappings[currentIndex]?.dmsField;
        const usedFields = attributeMappings
            .filter((_, i) => i !== currentIndex)
            .map((m) => m.dmsField);
        return dmsUserFields.filter((f) => f.value === currentField || !usedFields.includes(f.value));
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
            showSuccess('Group mappings saved successfully');
        } catch {
            showError('Failed to save group mappings');
        } finally {
            setIsSavingGroupMappings(false);
        }
    };

    // Load mappings and roles when switching to the roles tab
    useEffect(() => {
        if (activeTab === 'roles' && server?.id) {
            loadGroupMappings();
        }
    }, [activeTab, server?.id, loadGroupMappings]);

    // Load group-group mappings when switching to the groups tab
    useEffect(() => {
        if (activeTab === 'groups' && server?.id) {
            loadGroupGroupMappings();
        }
    }, [activeTab, server?.id, loadGroupGroupMappings]);

    // ── OrgUnit mapping loading ──
    const loadOrgUnitMappings = useCallback(async () => {
        if (!server?.id || orgUnitMappingsLoaded) return;
        try {
            const [deptRes, groupRes] = await Promise.all([
                ldapServerService.getDepartmentOrgUnitMappings(server.id),
                ldapServerService.getGroupOrgUnitMappings(server.id),
            ]);
            setDeptOrgUnitMappings((deptRes.mappings ?? []) as DepartmentOrgUnitMapping[]);
            setGroupOrgUnitMappings((groupRes.mappings ?? []) as GroupOrgUnitMapping[]);
            setOrgUnitMappingsLoaded(true);
        } catch {
            showError('Failed to load OrgUnit mappings');
        }
    }, [server?.id, orgUnitMappingsLoaded]);



    const handleSaveOrgUnitMappings = async () => {
        if (!server?.id) return;
        setIsSavingOrgUnitMappings(true);
        try {
            await Promise.all([
                ldapServerService.saveDepartmentOrgUnitMappings(server.id, { mappings: deptOrgUnitMappings }),
                ldapServerService.saveGroupOrgUnitMappings(server.id, { mappings: groupOrgUnitMappings }),
            ]);
            showSuccess('OrgUnit mappings saved');
        } catch {
            showError('Failed to save OrgUnit mappings');
        } finally {
            setIsSavingOrgUnitMappings(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'orgunits' && server?.id) {
            loadOrgUnitMappings();
        }
    }, [activeTab, server?.id, loadOrgUnitMappings]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-2xl">
                <DialogHeader className="px-6 pt-6 pb-0">
                    <DialogTitle className="text-xl font-semibold text-gray-900">
                        {isEditing ? 'Edit LDAP Server' : 'Add LDAP Server'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-500">
                        {isEditing
                            ? `Modify configuration for "${server?.name}".`
                            : 'Configure a new LDAP server connection.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="flex flex-col flex-1 overflow-hidden"
                    >
                        <div className="px-6 pt-4 w-full">
                            <TabsList className="flex overflow-x-auto hide-scrollbar bg-gray-100/70 p-1 rounded-2xl border border-gray-200/60 shadow-inner w-full justify-start h-auto gap-0.5">
                                <TabsTrigger
                                    value="connection"
                                    className="gap-1.5 px-3 py-1.5 text-xs font-semibold relative rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200/50 data-[state=active]:ring-1 data-[state=active]:ring-black/5 text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 shrink-0"
                                >
                                    <Server className="h-3.5 w-3.5" />
                                    Connection
                                    {hasTabErrors('connection') && (
                                        <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full shadow-sm" />
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="authentication"
                                    className="gap-1.5 px-3 py-1.5 text-xs font-semibold relative rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200/50 data-[state=active]:ring-1 data-[state=active]:ring-black/5 text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 shrink-0"
                                >
                                    <Key className="h-3.5 w-3.5" />
                                    Auth
                                    {hasTabErrors('authentication') && (
                                        <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full shadow-sm" />
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="directory"
                                    className="gap-1.5 px-3 py-1.5 text-xs font-semibold relative rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200/50 data-[state=active]:ring-1 data-[state=active]:ring-black/5 text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 shrink-0"
                                >
                                    <FolderTree className="h-3.5 w-3.5" />
                                    Directory
                                    {hasTabErrors('directory') && (
                                        <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full shadow-sm" />
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="mapping"
                                    className="gap-1.5 px-3 py-1.5 text-xs font-semibold relative rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200/50 data-[state=active]:ring-1 data-[state=active]:ring-black/5 text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 shrink-0"
                                >
                                    <ArrowLeftRight className="h-3.5 w-3.5" />
                                    Mapping
                                </TabsTrigger>
                                <TabsTrigger
                                    value="sync"
                                    className="gap-1.5 px-3 py-1.5 text-xs font-semibold relative rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200/50 data-[state=active]:ring-1 data-[state=active]:ring-black/5 text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 shrink-0"
                                >
                                    <Clock className="h-3.5 w-3.5" />
                                    Sync
                                </TabsTrigger>
                                {isEditing && (
                                    <TabsTrigger
                                        value="roles"
                                        className="gap-1.5 px-3 py-1.5 text-xs font-semibold relative rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200/50 data-[state=active]:ring-1 data-[state=active]:ring-black/5 text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 shrink-0"
                                    >
                                        <Shield className="h-3.5 w-3.5" />
                                        Roles
                                    </TabsTrigger>
                                )}
                                {isEditing && (
                                    <TabsTrigger
                                        value="groups"
                                        className="gap-1.5 px-3 py-1.5 text-xs font-semibold relative rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200/50 data-[state=active]:ring-1 data-[state=active]:ring-black/5 text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 shrink-0"
                                    >
                                        <Users className="h-3.5 w-3.5" />
                                        Groups
                                    </TabsTrigger>
                                )}
                                {isEditing && (
                                    <TabsTrigger
                                        value="orgunits"
                                        className="gap-1.5 px-3 py-1.5 text-xs font-semibold relative rounded-xl transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200/50 data-[state=active]:ring-1 data-[state=active]:ring-black/5 text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 shrink-0"
                                    >
                                        <Building2 className="h-3.5 w-3.5" />
                                        OrgUnits
                                    </TabsTrigger>
                                )}
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            {/* ── Tab 1: Connection ── */}
                            <TabsContent value="connection" className="mt-0">
                                <div className="space-y-6">
                                    <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100/60 shadow-sm space-y-5">
                                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50">
                                            <Server className="h-4 w-4 text-violet-600" />
                                            <h3 className="text-sm font-semibold text-gray-900">Server Details</h3>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Server Name <span className="text-red-500">*</span></Label>
                                                <Input
                                                    id="name"
                                                    placeholder="e.g., Corporate Active Directory"
                                                    {...register('name')}
                                                    aria-invalid={!!errors.name}
                                                    className="rounded-xl border-gray-200 shadow-sm h-10"
                                                />
                                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="serverType" className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Server Type <span className="text-red-500">*</span></Label>
                                                <Select
                                                    value={serverType}
                                                    onValueChange={(val) => setValue('serverType', val)}
                                                >
                                                    <SelectTrigger id="serverType" className={`rounded-xl border-gray-200 shadow-sm h-10 ${errors.serverType ? 'border-red-500' : ''}`}>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-gray-200 shadow-lg">
                                                        {SERVER_TYPE_OPTIONS.map((type) => (
                                                            <SelectItem key={type.value} value={type.value} className="rounded-lg">
                                                                {type.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors.serverType && <p className="text-xs text-red-500 mt-1">{errors.serverType.message}</p>}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description" className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Description</Label>
                                            <Input
                                                id="description"
                                                placeholder="Optional description for this server"
                                                {...register('description')}
                                                className="rounded-xl border-gray-200 shadow-sm h-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100/60 shadow-sm space-y-5">
                                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50">
                                            <Activity className="h-4 w-4 text-emerald-600" />
                                            <h3 className="text-sm font-semibold text-gray-900">Network & Security</h3>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <Label htmlFor="hostname" className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Hostname / IP <span className="text-red-500">*</span></Label>
                                                <Input
                                                    id="hostname"
                                                    placeholder="ad.company.com"
                                                    {...register('hostname')}
                                                    aria-invalid={!!errors.hostname}
                                                    className="rounded-xl border-gray-200 shadow-sm h-10"
                                                />
                                                {errors.hostname && <p className="text-xs text-red-500 mt-1">{errors.hostname.message}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="port" className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Port <span className="text-red-500">*</span></Label>
                                                <Input
                                                    id="port"
                                                    type="number"
                                                    {...register('port')}
                                                    aria-invalid={!!errors.port}
                                                    className="rounded-xl border-gray-200 shadow-sm h-10"
                                                />
                                                {errors.port && <p className="text-xs text-red-500 mt-1">{errors.port.message}</p>}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-violet-200 transition-colors">
                                                <div>
                                                    <Label htmlFor="useSSL" className="font-semibold text-gray-900">Use SSL (LDAPS)</Label>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">Secure connection via SSL</p>
                                                </div>
                                                <Switch
                                                    id="useSSL"
                                                    checked={useSSL}
                                                    onCheckedChange={(checked) => setValue('useSSL', checked)}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-violet-200 transition-colors">
                                                <div>
                                                    <Label htmlFor="useTLS" className="font-semibold text-gray-900">Use STARTTLS</Label>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">Upgrade insecure connection</p>
                                                </div>
                                                <Switch
                                                    id="useTLS"
                                                    checked={useTLS}
                                                    onCheckedChange={(checked) => setValue('useTLS', checked)}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="connectionTimeout" className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Connection Timeout (s)</Label>
                                                <Input id="connectionTimeout" type="number" {...register('connectionTimeout')} className="rounded-xl border-gray-200 shadow-sm h-10" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="searchTimeout" className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Search Timeout (s)</Label>
                                                <Input id="searchTimeout" type="number" {...register('searchTimeout')} className="rounded-xl border-gray-200 shadow-sm h-10" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ── Tab 2: Authentication ── */}
                            <TabsContent value="authentication" className="mt-0">
                                <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100/60 shadow-sm space-y-5">
                                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50">
                                        <Key className="h-4 w-4 text-amber-600" />
                                        <h3 className="text-sm font-semibold text-gray-900">Service Account Credentials</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bindDn" className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Bind DN <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="bindDn"
                                            placeholder="cn=admin,dc=example,dc=com"
                                            className="font-mono text-sm rounded-xl border-gray-200 shadow-sm h-10"
                                            {...register('bindDn')}
                                            aria-invalid={!!errors.bindDn}
                                        />
                                        {errors.bindDn && <p className="text-xs text-red-500 mt-1">{errors.bindDn.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bindPassword" className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                            Bind Password
                                            {isEditing && <span className="text-[10px] text-gray-400 normal-case tracking-normal ml-2">(leave blank to keep unchanged)</span>}
                                        </Label>
                                        <Input
                                            id="bindPassword"
                                            type="password"
                                            placeholder={isEditing ? '••••••••' : 'Enter password'}
                                            {...register('bindPassword')}
                                            className="rounded-xl border-gray-200 shadow-sm h-10"
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ── Tab 3: Directory Settings ── */}
                            <TabsContent value="directory" className="mt-0">
                                <div className="space-y-6">
                                    <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100/60 shadow-sm space-y-5">
                                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50">
                                            <FolderTree className="h-4 w-4 text-blue-600" />
                                            <h3 className="text-sm font-semibold text-gray-900">Search Base</h3>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="baseDn" className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Base Search DN <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="baseDn"
                                                placeholder="dc=example,dc=com"
                                                className="font-mono text-sm rounded-xl border-gray-200 shadow-sm h-10"
                                                {...register('baseDn')}
                                                aria-invalid={!!errors.baseDn}
                                            />
                                            {errors.baseDn && <p className="text-xs text-red-500 mt-1">{errors.baseDn.message}</p>}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100/60 shadow-sm space-y-5">
                                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50">
                                            <Search className="h-4 w-4 text-cyan-600" />
                                            <h3 className="text-sm font-semibold text-gray-900">Custom Filters</h3>
                                        </div>
                                        <div className="space-y-5">
                                            <div className="space-y-2">
                                                <Label htmlFor="userFilter" className="text-xs font-semibold text-gray-700 uppercase tracking-wide">User Search Filter</Label>
                                                <Input
                                                    id="userFilter"
                                                    placeholder="(&(objectClass=person))"
                                                    className="font-mono text-sm rounded-xl border-gray-200 shadow-sm h-10"
                                                    {...register('userFilter')}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="groupFilter" className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Group Search Filter</Label>
                                                <Input
                                                    id="groupFilter"
                                                    placeholder="(&(objectClass=group))"
                                                    className="font-mono text-sm rounded-xl border-gray-200 shadow-sm h-10"
                                                    {...register('groupFilter')}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ── Tab 4: Attribute Mapping ── */}
                            <TabsContent value="mapping" className="mt-0 space-y-5">
                                {/* Subtitle */}
                                <p className="text-sm text-gray-500">
                                    {isCustom ? 'Custom mode — enter fields manually.' : `${serverType} preset — modify LDAP attributes as needed.`}
                                </p>

                                {/* Header */}
                                <div className="grid grid-cols-[1fr_8px_1fr_40px] items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                                    <span>User Field</span>
                                    <span />
                                    <span>LDAP Attribute</span>
                                    <span />
                                </div>

                                {/* Mapping rows */}
                                <div className="space-y-2.5">
                                    {attributeMappings.map((mapping, index) => (
                                        <div
                                            key={mapping._uid || index}
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
                                    disabled={!isCustom && attributeMappings.length >= dmsUserFields.length}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Mapping
                                </Button>
                            </TabsContent>

                            {/* ── Tab 5: Roles (LDAP Group → DMS Role) ── */}
                            <TabsContent value="roles" className="mt-0">
                                {!isEditing ? (
                                    <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-muted-foreground mt-4 bg-gray-50/30">
                                        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Shield className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <p className="font-semibold text-gray-900">Save the server first</p>
                                        <p className="text-sm mt-1 text-gray-500 max-w-sm mx-auto">Role mappings can be configured after the initial server connection is established and saved.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100/60 shadow-sm space-y-5">
                                            <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50">
                                                <Shield className="h-4 w-4 text-violet-600" />
                                                <h3 className="text-sm font-semibold text-gray-900">System Role Mapping</h3>
                                            </div>

                                            {/* Mapping rows */}
                                            <div className="space-y-3">
                                                {/* Header */}
                                                <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                                    <span>LDAP Group</span>
                                                    <span></span>
                                                    <span>System Role</span>
                                                    <span></span>
                                                </div>

                                                {groupRoleMappings.map((mapping, index) => {
                                                    const isDuplicate = mapping.ldapGroupDn && groupRoleMappings.filter(m => m.ldapGroupDn === mapping.ldapGroupDn).length > 1;
                                                    return (
                                                        <div key={index} className="grid grid-cols-[1fr_auto_1fr_auto] gap-3 items-center group bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-violet-200 transition-colors">
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
                                                                    triggerClassName="h-10 text-sm w-full rounded-lg border-gray-200 shadow-sm"
                                                                />
                                                                {isDuplicate && (
                                                                    <div className="flex items-center gap-1 mt-1.5 text-[11px] text-red-500 font-medium">
                                                                        <AlertTriangle className="h-3 w-3" />
                                                                        <span>Duplicate mapping</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0 shadow-inner">
                                                                <ArrowLeftRight className="h-3.5 w-3.5 text-gray-400" />
                                                            </div>

                                                            {/* DMS Role — searchable combobox */}
                                                            <RoleCombobox
                                                                value={mapping.roleId}
                                                                displayName={mapping.roleName}
                                                                onSelect={(id, name) => {
                                                                    setGroupRoleMappings(prev => {
                                                                        const updated = [...prev];
                                                                        updated[index] = { ...updated[index], roleId: id, roleName: name };
                                                                        return updated;
                                                                    });
                                                                }}
                                                                placeholder="Search system roles..."
                                                                triggerClassName="h-10 text-sm w-full rounded-lg border-gray-200 shadow-sm"
                                                            />

                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-10 w-10 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                                onClick={() => removeGroupMapping(index)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
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
                                                className="gap-2 w-full border-dashed border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl py-5 hover:border-gray-400 transition-colors"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Add Role Mapping
                                            </Button>
                                        </div>

                                        <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100/60 shadow-sm space-y-5">
                                            <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50">
                                                <Shield className="h-4 w-4 text-emerald-600" />
                                                <h3 className="text-sm font-semibold text-gray-900">Default Role Assignment</h3>
                                            </div>

                                            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3 hover:border-emerald-200 transition-colors">
                                                <div>
                                                    <Label className="font-semibold text-gray-900">Default Role for Unmapped Users</Label>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                                        Users who don't match any group mapping will receive this role during sync.
                                                    </p>
                                                </div>
                                                <RoleCombobox
                                                    value=""
                                                    displayName={defaultRoleName}
                                                    onSelect={(_id, name) => setDefaultRoleName(name)}
                                                    placeholder="Search default role..."
                                                    triggerClassName="w-full max-w-md rounded-xl border-gray-200 h-10 shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Save mappings button */}
                                        <div className="flex justify-end pt-2">
                                            <Button
                                                type="button"
                                                onClick={saveGroupMappings}
                                                disabled={isSavingMappings}
                                                className="gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-6 shadow-md transition-all hover:shadow-lg"
                                            >
                                                {isSavingMappings && <Loader2 className="h-4 w-4 animate-spin" />}
                                                {isSavingMappings ? 'Saving...' : 'Save Role Mappings'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            {/* ── Tab 7: Groups (LDAP Group → DMS Group) ── */}
                            <TabsContent value="groups" className="mt-0">
                                {!isEditing ? (
                                    <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-muted-foreground mt-4 bg-gray-50/30">
                                        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Users className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <p className="font-semibold text-gray-900">Save the server first</p>
                                        <p className="text-sm mt-1 text-gray-500 max-w-sm mx-auto">Group mappings can be configured after the initial server connection is established and saved.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100/60 shadow-sm space-y-5">
                                            <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50">
                                                <Users className="h-4 w-4 text-emerald-600" />
                                                <h3 className="text-sm font-semibold text-gray-900">LDAP to DMS Group Mapping</h3>
                                            </div>

                                            {/* Group-group mappings */}
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                                    <span>LDAP Group</span>
                                                    <span></span>
                                                    <span>DMS Group</span>
                                                    <span></span>
                                                </div>

                                                {groupGroupMappings.length === 0 ? (
                                                    <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center bg-white/50">
                                                        <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                                        <p className="text-sm font-medium text-gray-900">No group mappings yet</p>
                                                        <p className="text-xs mt-1 text-gray-500">Click &quot;Add Group Mapping&quot; to map LDAP groups to DMS groups</p>
                                                    </div>
                                                ) : (
                                                    groupGroupMappings.map((mapping, index) => {
                                                        const isDuplicate = mapping.ldapGroupDn && groupGroupMappings.filter(m => m.ldapGroupDn === mapping.ldapGroupDn).length > 1;
                                                        return (
                                                            <div key={index} className="grid grid-cols-[1fr_auto_1fr_auto] gap-3 items-center group bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-emerald-200 transition-colors">
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
                                                                        triggerClassName="h-10 text-sm w-full rounded-lg border-gray-200 shadow-sm"
                                                                    />
                                                                    {isDuplicate && (
                                                                        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-red-500 font-medium">
                                                                            <AlertTriangle className="h-3 w-3" />
                                                                            <span>Duplicate mapping</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0 shadow-inner">
                                                                    <ArrowLeftRight className="h-3.5 w-3.5 text-gray-400" />
                                                                </div>

                                                                <div className="flex-1 min-w-0">
                                                                    <DmsGroupCombobox
                                                                        value={mapping.groupId}
                                                                        displayName={mapping.groupName}
                                                                        onSelect={(id, name) => {
                                                                            setGroupGroupMappings(prev => {
                                                                                const updated = [...prev];
                                                                                updated[index] = { ...updated[index], groupId: id, groupName: name };
                                                                                return updated;
                                                                            });
                                                                        }}
                                                                        placeholder="Search DMS groups..."
                                                                        triggerClassName="h-10 text-sm w-full rounded-lg border-gray-200 shadow-sm"
                                                                    />
                                                                </div>

                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => removeGroupGroupMapping(index)}
                                                                    className="h-10 w-10 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addGroupGroupMapping}
                                                className="gap-2 w-full border-dashed border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl py-5 hover:border-gray-400 transition-colors"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Add Group Mapping
                                            </Button>
                                        </div>

                                        {/* Save group mappings button */}
                                        <div className="flex justify-end pt-2">
                                            <Button
                                                type="button"
                                                onClick={saveGroupGroupMappings}
                                                disabled={isSavingGroupMappings}
                                                className="gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-6 shadow-md transition-all hover:shadow-lg"
                                            >
                                                {isSavingGroupMappings && <Loader2 className="h-4 w-4 animate-spin" />}
                                                {isSavingGroupMappings ? 'Saving...' : 'Save Group Mappings'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            {/* ── Tab: OrgUnit Mapping ── */}
                            {isEditing && (
                                <TabsContent value="orgunits" className="mt-0">
                                    <div className="space-y-6">
                                        <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100/60 shadow-sm space-y-5">
                                            <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50">
                                                <Building2 className="h-4 w-4 text-blue-600" />
                                                <h3 className="text-sm font-semibold text-gray-900">Department to OrgUnit Mapping</h3>
                                            </div>

                                            {/* Department → OrgUnit Section */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-medium">
                                                            Map LDAP department attributes to internal OrgUnits
                                                        </p>
                                                    </div>
                                                    {watch('syncDepartment') && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setDeptOrgUnitMappings(prev => [...prev, {
                                                                    departmentValue: '',
                                                                    orgUnitId: '',
                                                                    orgUnitName: '',
                                                                    orgUnitCode: '',
                                                                    isPrimary: true,
                                                                }]);
                                                            }}
                                                            className="gap-1.5 rounded-lg border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
                                                        >
                                                            <Plus className="h-3.5 w-3.5" />
                                                            Add Mapping
                                                        </Button>
                                                    )}
                                                </div>

                                                {!watch('syncDepartment') ? (
                                                    <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center bg-white/50">
                                                        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                            <Building2 className="h-6 w-6 text-gray-400" />
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            Attribute-based mapping disabled
                                                        </p>
                                                        <p className="text-[11px] text-gray-500 mt-1 max-w-sm mx-auto">
                                                            Go to the <strong>Sync Settings</strong> tab and enable <em>Map Departments to OrgUnits</em> to configure this.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {deptOrgUnitMappings.length > 0 && (
                                                            <div className="space-y-3">
                                                                <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                                                    <span>LDAP Department</span>
                                                                    <span></span>
                                                                    <span>DMS OrgUnit</span>
                                                                    <span></span>
                                                                </div>

                                                                {deptOrgUnitMappings.map((mapping, index) => {
                                                                    const conflict = deptOrgUnitMappings.filter(m => m.departmentValue && m.departmentValue === mapping.departmentValue).length > 1;
                                                                    return (
                                                                        <div key={index} className="grid grid-cols-[1fr_auto_1fr_auto] gap-3 items-center group bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                                                                            <div className="flex-1 min-w-0">
                                                                                <LdapDepartmentCombobox
                                                                                    serverId={server?.id || ''}
                                                                                    value={mapping.departmentValue}
                                                                                    hasConflict={conflict}
                                                                                    onSelect={(val) => {
                                                                                        setDeptOrgUnitMappings(prev => prev.map((m, i) =>
                                                                                            i === index ? { ...m, departmentValue: val } : m
                                                                                        ));
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            
                                                                            <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0 shadow-inner">
                                                                                <ArrowLeftRight className="h-3.5 w-3.5 text-gray-400" />
                                                                            </div>

                                                                            <div className="flex-1 min-w-0">
                                                                                <OrgUnitCombobox
                                                                                    value={mapping.orgUnitId}
                                                                                    displayValue={mapping.orgUnitName}
                                                                                    onChange={(ou) => {
                                                                                        setDeptOrgUnitMappings(prev => prev.map((m, i) =>
                                                                                            i === index ? {
                                                                                                ...m,
                                                                                                orgUnitId: ou?.id || '',
                                                                                                orgUnitName: ou?.name || '',
                                                                                                orgUnitCode: ou?.code || '',
                                                                                            } : m
                                                                                        ));
                                                                                    }}
                                                                                />
                                                                            </div>

                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-10 w-10 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                                                onClick={() => setDeptOrgUnitMappings(prev => prev.filter((_, i) => i !== index))}
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {deptOrgUnitMappings.length === 0 && (
                                                            <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center bg-white/50">
                                                                <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                                                <p className="text-sm font-medium text-gray-900 mb-1">
                                                                    No department mappings
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    Click &quot;Add Mapping&quot; above to configure department to OrgUnit mapping.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100/60 shadow-sm space-y-5">
                                            <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50">
                                                <Users className="h-4 w-4 text-emerald-600" />
                                                <h3 className="text-sm font-semibold text-gray-900">LDAP Group to OrgUnit Mapping</h3>
                                            </div>

                                            {/* LDAP Group → OrgUnit Section */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-medium">
                                                            Place LDAP group members into specific OrgUnits
                                                        </p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setGroupOrgUnitMappings(prev => [...prev, {
                                                            ldapGroupDn: '',
                                                            ldapGroupName: '',
                                                            orgUnitId: '',
                                                            orgUnitName: '',
                                                            orgUnitCode: '',
                                                            isPrimary: false,
                                                        }])}
                                                        className="gap-1.5 rounded-lg border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                        Add Mapping
                                                    </Button>
                                                </div>

                                                {groupOrgUnitMappings.length > 0 ? (
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                                            <span>LDAP Group</span>
                                                            <span></span>
                                                            <span>DMS OrgUnit</span>
                                                            <span></span>
                                                        </div>

                                                        {groupOrgUnitMappings.map((mapping, index) => (
                                                            <div key={index} className="grid grid-cols-[1fr_auto_1fr_auto] gap-3 items-center group bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-emerald-200 transition-colors">
                                                                <div className="flex-1 min-w-0">
                                                                    <LdapGroupCombobox
                                                                        serverId={server?.id || ''}
                                                                        value={mapping.ldapGroupDn}
                                                                        displayName={mapping.ldapGroupName || ''}
                                                                        onSelect={(dn, name) => {
                                                                            setGroupOrgUnitMappings(prev => prev.map((m, i) =>
                                                                                i === index ? {
                                                                                    ...m,
                                                                                    ldapGroupDn: dn || '',
                                                                                    ldapGroupName: name || '',
                                                                                } : m
                                                                            ));
                                                                        }}
                                                                        triggerClassName="h-10 text-sm w-full rounded-lg border-gray-200 shadow-sm"
                                                                    />
                                                                </div>

                                                                <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0 shadow-inner">
                                                                    <ArrowLeftRight className="h-3.5 w-3.5 text-gray-400" />
                                                                </div>

                                                                <div className="flex-1 min-w-0">
                                                                    <OrgUnitCombobox
                                                                        value={mapping.orgUnitId}
                                                                        displayValue={mapping.orgUnitName}
                                                                        onChange={(ou) => {
                                                                            setGroupOrgUnitMappings(prev => prev.map((m, i) =>
                                                                                i === index ? {
                                                                                    ...m,
                                                                                    orgUnitId: ou?.id || '',
                                                                                    orgUnitName: ou?.name || '',
                                                                                    orgUnitCode: ou?.code || '',
                                                                                } : m
                                                                            ));
                                                                        }}
                                                                    />
                                                                </div>

                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-10 w-10 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                                    onClick={() => setGroupOrgUnitMappings(prev => prev.filter((_, i) => i !== index))}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center bg-white/50">
                                                        <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                                        <p className="text-sm font-medium text-gray-900">
                                                            No group mappings
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Click &quot;Add Mapping&quot; to map LDAP group members to specific OrgUnits
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Save button */}
                                        <div className="flex justify-end pt-2">
                                            <Button
                                                type="button"
                                                onClick={handleSaveOrgUnitMappings}
                                                disabled={isSavingOrgUnitMappings}
                                                className="gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-6 shadow-md transition-all hover:shadow-lg"
                                            >
                                                {isSavingOrgUnitMappings && <Loader2 className="h-4 w-4 animate-spin" />}
                                                {isSavingOrgUnitMappings ? 'Saving...' : 'Save OrgUnit Mappings'}
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>
                            )}

                            {/* ── Tab 5: Sync Settings ── */}
                            <TabsContent value="sync" className="mt-0">
                                <div className="space-y-6">
                                    <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100/60 shadow-sm space-y-5">
                                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50">
                                            <Clock className="h-4 w-4 text-violet-600" />
                                            <h3 className="text-sm font-semibold text-gray-900">Sync Frequency</h3>
                                        </div>
                                        <div className="space-y-2 max-w-sm">
                                            <Label htmlFor="syncSchedule" className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Automated Schedule</Label>
                                            <Select
                                                value={watch('syncSchedule')}
                                                onValueChange={(val) => setValue('syncSchedule', val)}
                                            >
                                                <SelectTrigger id="syncSchedule" className="rounded-xl border-gray-200 shadow-sm h-10">
                                                    <SelectValue placeholder="Select schedule" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-gray-200 shadow-lg">
                                                    {SYNC_SCHEDULE_OPTIONS.map((opt) => (
                                                        <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100/60 shadow-sm space-y-5">
                                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50">
                                            <Shield className="h-4 w-4 text-emerald-600" />
                                            <h3 className="text-sm font-semibold text-gray-900">Identity Governance</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-violet-200 transition-colors">
                                                <div>
                                                    <Label htmlFor="autoDisableUsers" className="font-semibold text-gray-900">Auto-Disable Removed Users</Label>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">Disable accounts missing from LDAP</p>
                                                </div>
                                                <Switch
                                                    id="autoDisableUsers"
                                                    checked={watch('autoDisableUsers')}
                                                    onCheckedChange={(checked) => setValue('autoDisableUsers', checked)}
                                                />
                                            </div>

                                            {watch('autoDisableUsers') && (
                                                <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 shadow-sm pl-8 relative before:absolute before:left-4 before:top-1/2 before:w-3 before:h-px before:bg-gray-300">
                                                    <div>
                                                        <Label htmlFor="deletionThresholdPercent" className="font-semibold text-gray-900 text-sm">Deletion Threshold (%)</Label>
                                                        <p className="text-[11px] text-gray-500 mt-0.5">Safety limit to prevent mass disablement</p>
                                                    </div>
                                                    <Input
                                                        id="deletionThresholdPercent"
                                                        type="number"
                                                        min="1"
                                                        max="100"
                                                        className="w-24 h-9 rounded-xl border-gray-200"
                                                        {...register('deletionThresholdPercent', { valueAsNumber: true })}
                                                    />
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-violet-200 transition-colors">
                                                <div>
                                                    <Label htmlFor="jitProvisioning" className="font-semibold text-gray-900 flex items-center gap-2">
                                                        JIT Provisioning
                                                        <Badge variant="outline" className="text-[10px] bg-violet-50 text-violet-700 border-violet-200">Enterprise</Badge>
                                                    </Label>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">Create users upon first login</p>
                                                </div>
                                                <Switch
                                                    id="jitProvisioning"
                                                    checked={watch('jitProvisioning')}
                                                    onCheckedChange={(checked) => setValue('jitProvisioning', checked)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100/60 shadow-sm space-y-5">
                                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50">
                                            <ArrowLeftRight className="h-4 w-4 text-cyan-600" />
                                            <h3 className="text-sm font-semibold text-gray-900">Advanced Mapping Features</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-violet-200 transition-colors">
                                                <div>
                                                    <Label htmlFor="syncManagers" className="font-semibold text-gray-900">Sync Manager Hierarchy</Label>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">Map reporting lines from LDAP</p>
                                                </div>
                                                <Switch
                                                    id="syncManagers"
                                                    checked={watch('syncManagers')}
                                                    onCheckedChange={(checked) => setValue('syncManagers', checked)}
                                                />
                                            </div>

                                            {watch('syncManagers') && (
                                                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm pl-8 relative before:absolute before:left-4 before:top-1/2 before:w-3 before:h-px before:bg-gray-300">
                                                    <Label htmlFor="managerAttribute" className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Manager Attribute</Label>
                                                    <Input
                                                        id="managerAttribute"
                                                        {...register('managerAttribute')}
                                                        placeholder="manager"
                                                        className="max-w-xs mt-2 rounded-xl border-gray-200 shadow-sm h-10"
                                                    />
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-violet-200 transition-colors">
                                                <div>
                                                    <Label htmlFor="syncDepartment" className="font-semibold text-gray-900">Map Departments to OrgUnits</Label>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">Enable OrgUnit assignment rules</p>
                                                </div>
                                                <Switch
                                                    id="syncDepartment"
                                                    checked={watch('syncDepartment')}
                                                    onCheckedChange={(checked) => setValue('syncDepartment', checked)}
                                                />
                                            </div>

                                            {watch('syncDepartment') && (
                                                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm pl-8 relative before:absolute before:left-4 before:top-1/2 before:w-3 before:h-px before:bg-gray-300">
                                                    <Label htmlFor="departmentAttribute" className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Department Attribute</Label>
                                                    <Input
                                                        id="departmentAttribute"
                                                        {...register('departmentAttribute')}
                                                        placeholder="department"
                                                        className="max-w-xs mt-2 rounded-xl border-gray-200 shadow-sm h-10"
                                                    />
                                                </div>
                                            )}

                                            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                                <Label htmlFor="immutableIdAttribute" className="font-semibold text-gray-900 flex items-center gap-2">
                                                    Immutable ID Attribute
                                                    <Badge variant="outline" className="text-[10px] bg-violet-50 text-violet-700 border-violet-200">Enterprise</Badge>
                                                </Label>
                                                <p className="text-[11px] text-gray-500 mt-0.5 mb-3">AD: objectGUID · OpenLDAP: entryUUID</p>
                                                <Input
                                                    id="immutableIdAttribute"
                                                    {...register('immutableIdAttribute')}
                                                    placeholder="objectGUID"
                                                    className="max-w-xs rounded-xl border-gray-200 shadow-sm h-10"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>



                        {/* ── Footer ── */}
                        <DialogFooter className="px-6 py-4 flex-row gap-2 sm:gap-2 border-t border-gray-200">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSaving || isTesting}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                            <div className="flex-1" />
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleTestConnection}
                                disabled={isSaving || isTesting}
                                className="gap-2 rounded-xl"
                            >
                                {isTesting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <TestTube className="h-4 w-4" />
                                )}
                                {isTesting ? 'Testing...' : 'Test Connection'}
                            </Button>
                            <Button type="submit" disabled={isSaving || isTesting} className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl shadow-md">
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
