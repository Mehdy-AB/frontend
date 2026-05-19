import { z } from 'zod';

// ─── Re-exports from API layer ───────────────────────────────────────────────
export type {
    LdapServerDto,
    CreateLdapServerRequest,
    UpdateLdapServerRequest,
    TestConnectionResponse,
    LdapSyncResult,
    LdapStatistics,
    PageResponse,
    DepartmentOrgUnitMappingDto,
    GroupOrgUnitMappingDto,
    OrgUnitSearchResult,
} from '@/api/services/ldapServerService';

// ─── Constants ───────────────────────────────────────────────────────────────

export const SERVER_TYPES = [
    { value: 'All', label: 'All Types' },
    { value: 'Active Directory', label: 'Active Directory' },
    { value: 'OpenLDAP', label: 'OpenLDAP' },
    { value: 'Apache Directory', label: 'Apache Directory' },
    { value: 'FreeIPA', label: 'FreeIPA' },
    { value: 'Custom', label: 'Custom' },
] as const;

/** Server type options for forms (without 'All') */
export const SERVER_TYPE_OPTIONS = [
    { value: 'Active Directory', label: 'Active Directory' },
    { value: 'OpenLDAP', label: 'OpenLDAP' },
    { value: 'Apache Directory', label: 'Apache Directory' },
    { value: 'FreeIPA', label: 'FreeIPA' },
    { value: 'Custom', label: 'Custom' },
] as const;

export const STATUS_OPTIONS = [
    { value: 'All', label: 'All Status' },
    { value: 'Connected', label: 'Connected' },
    { value: 'Disconnected', label: 'Disconnected' },
    { value: 'Error', label: 'Error' },
    { value: 'Testing', label: 'Testing' },
    { value: 'Maintenance', label: 'Maintenance' },
] as const;

export const SECURITY_OPTIONS = [
    { value: 'All', label: 'All Security' },
    { value: 'SSL', label: 'SSL' },
    { value: 'TLS', label: 'TLS' },
    { value: 'None', label: 'None' },
] as const;

export const SYNC_SCHEDULE_OPTIONS = [
    { value: 'MANUAL', label: 'Manual Only' },
    { value: 'EVERY_15_MIN', label: 'Every 15 Minutes' },
    { value: 'EVERY_30_MIN', label: 'Every 30 Minutes' },
    { value: 'HOURLY', label: 'Every Hour' },
    { value: 'EVERY_6_HOURS', label: 'Every 6 Hours' },
    { value: 'DAILY', label: 'Every 24 Hours' },
] as const;

// ─── DMS User Fields (real User.java entity fields) ─────────────────────────

/** DMS user fields available for attribute mapping — matches User.java entity */
/** Fallback field list — overridden at runtime by backend GET /user-fields */
export const DMS_USER_FIELDS = [
    { value: 'username', label: 'Username' },
    { value: 'email', label: 'Email' },
    { value: 'firstName', label: 'First Name' },
    { value: 'lastName', label: 'Last Name' },
    { value: 'displayName', label: 'Display Name' },
    { value: 'jobTitle', label: 'Job Title' },
    { value: 'imageUrl', label: 'Profile Image URL' },
    { value: 'employeeNumber', label: 'Employee Number' },
] as const;

// ─── Per-type default attribute mappings ─────────────────────────────────────

/** Pre-configured LDAP attribute mappings per server type */
export const TYPE_ATTRIBUTE_MAPPINGS: Record<string, AttributeMapping[]> = {
    'Active Directory': [
        { dmsField: 'username', ldapAttribute: 'sAMAccountName' },
        { dmsField: 'email', ldapAttribute: 'mail' },
        { dmsField: 'firstName', ldapAttribute: 'givenName' },
        { dmsField: 'lastName', ldapAttribute: 'sn' },
        { dmsField: 'displayName', ldapAttribute: 'displayName' },
        { dmsField: 'jobTitle', ldapAttribute: 'title' },
    ],
    'OpenLDAP': [
        { dmsField: 'username', ldapAttribute: 'uid' },
        { dmsField: 'email', ldapAttribute: 'mail' },
        { dmsField: 'firstName', ldapAttribute: 'givenName' },
        { dmsField: 'lastName', ldapAttribute: 'sn' },
        { dmsField: 'displayName', ldapAttribute: 'cn' },
        { dmsField: 'jobTitle', ldapAttribute: 'title' },
    ],
    'Apache Directory': [
        { dmsField: 'username', ldapAttribute: 'uid' },
        { dmsField: 'email', ldapAttribute: 'mail' },
        { dmsField: 'firstName', ldapAttribute: 'givenName' },
        { dmsField: 'lastName', ldapAttribute: 'sn' },
        { dmsField: 'displayName', ldapAttribute: 'cn' },
        { dmsField: 'jobTitle', ldapAttribute: 'title' },
    ],
    'FreeIPA': [
        { dmsField: 'username', ldapAttribute: 'uid' },
        { dmsField: 'email', ldapAttribute: 'mail' },
        { dmsField: 'firstName', ldapAttribute: 'givenName' },
        { dmsField: 'lastName', ldapAttribute: 'sn' },
        { dmsField: 'displayName', ldapAttribute: 'cn' },
        { dmsField: 'jobTitle', ldapAttribute: 'title' },
    ],
    'Custom': [
        { dmsField: 'username', ldapAttribute: '' },
        { dmsField: 'email', ldapAttribute: '' },
        { dmsField: 'firstName', ldapAttribute: '' },
        { dmsField: 'lastName', ldapAttribute: '' },
    ],
};

/** Default filter templates per server type */
export const TYPE_FILTER_DEFAULTS: Record<string, { userFilter: string; groupFilter: string }> = {
    'Active Directory': {
        userFilter: '(&(objectClass=person)(objectClass=user)(!(objectClass=computer)))',
        groupFilter: '(&(objectClass=group))',
    },
    'OpenLDAP': {
        userFilter: '(&(objectClass=inetOrgPerson))',
        groupFilter: '(&(objectClass=groupOfNames))',
    },
    'Apache Directory': {
        userFilter: '(&(objectClass=inetOrgPerson))',
        groupFilter: '(&(objectClass=groupOfNames))',
    },
    'FreeIPA': {
        userFilter: '(&(objectClass=person)(objectClass=posixAccount))',
        groupFilter: '(&(objectClass=posixGroup))',
    },
    'Custom': {
        userFilter: '(&(objectClass=person))',
        groupFilter: '(&(objectClass=group))',
    },
};

// ─── Component-level types ───────────────────────────────────────────────────

export interface AttributeMapping {
    dmsField: string;
    ldapAttribute: string;
    /** Stable unique key for React rendering — not sent to backend */
    _uid?: string;
}

export interface GroupRoleMapping {
    ldapGroupDn: string;
    ldapGroupName: string;
    roleId: string;
    roleName: string;
}

export interface LdapGroup {
    dn: string;
    name: string;
}

export interface GroupGroupMapping {
    ldapGroupDn: string;
    ldapGroupName: string;
    groupId: string;
    groupName: string;
}

export interface DepartmentOrgUnitMapping {
    departmentValue: string;
    orgUnitId: string;
    orgUnitName: string;
    orgUnitCode: string;
    isPrimary: boolean;
}

export interface GroupOrgUnitMapping {
    ldapGroupDn: string;
    ldapGroupName: string;
    orgUnitId: string;
    orgUnitName: string;
    orgUnitCode: string;
    isPrimary: boolean;
}

// ─── Enterprise: Sync Run Audit ─────────────────────────────────────────────

export interface DirectorySyncRun {
    id: string;
    ldapServerId: string;
    triggeredBy: string;
    triggerType: 'MANUAL' | 'SCHEDULED' | 'JIT';
    mode: 'FULL' | 'INCREMENTAL' | 'DRY_RUN';
    status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BLOCKED_BY_THRESHOLD' | 'CANCELLED';
    startedAt: string;
    completedAt: string | null;
    usersCreated: number;
    usersUpdated: number;
    usersDisabled: number;
    usersRestored: number;
    usersSkipped: number;
    groupsProcessed: number;
    rolesAssigned: number;
    rolesRevoked: number;
    managersResolved: number;
    managersUnresolved: number;
    errorsCount: number;
    errorSummary: string | null;
    dryRun: boolean;
    thresholdTriggered: number | null;
}

export interface IdentityReviewData {
    orphanedUsers: Array<{
        id: string;
        username: string;
        email: string;
        displayName: string;
        externalImmutableId: string;
        ldapDn: string;
        lastLdapSync: string;
    }>;
    unresolvedManagers: Array<{
        id: string;
        username: string;
        displayName: string;
        ldapManagerDn: string;
    }>;
    syncErrorUsers: Array<{
        id: string;
        username: string;
        displayName: string;
        status: string;
    }>;
    totalOrphans: number;
    totalUnresolvedManagers: number;
    totalSyncErrors: number;
}

export interface LdapServer {
    id: string;
    name: string;
    description: string;
    serverType: string;
    hostname: string;
    port: number;
    sslPort: number;
    baseDN: string;
    bindDN: string;
    isActive: boolean;
    isSecure: boolean;
    useSSL: boolean;
    useTLS: boolean;
    connectionTimeout: number;
    searchTimeout: number;
    lastSync: string;
    lastTest: string;
    status: 'Connected' | 'Disconnected' | 'Error' | 'Testing' | 'Maintenance' | 'Unknown';
    createdBy: string;
    createdAt: string;
    lastModified: string;
    syncCount: number;
    errorCount: number;
    userCount: number;
    groupCount: number;
    attributes: Record<string, string>;
    filters: {
        userFilter: string;
        groupFilter: string;
        enabledFilter: string;
    };
    // Sync scheduling
    syncSchedule: string;
    autoDisableUsers: boolean;
    nextSyncAt: string;
    syncManagers: boolean;
    syncDepartment: boolean;
    managerAttribute: string;
    departmentAttribute: string;
    // Enterprise: Safety & Governance
    deletionThresholdPercent: number;
    resolveNestedGroups: boolean;
    jitProvisioning: boolean;
    immutableIdAttribute: string;
    fieldOwnership: Record<string, 'directory' | 'ecm' | 'hybrid'>;
    // Role mapping
    defaultRoleName: string;
}

// ─── Form schema (zod) ──────────────────────────────────────────────────────

export const ldapServerFormSchema = z.object({
    // Tab 1: Connection
    name: z.string().min(1, 'Server name is required').max(100, 'Server name too long'),
    serverType: z.string().min(1, 'Server type is required'),
    hostname: z
        .string()
        .min(1, 'Hostname is required')
        .regex(
            /^[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)*$|^(\d{1,3}\.){3}\d{1,3}$/,
            'Enter a valid hostname or IP address'
        ),
    port: z.coerce
        .number({ message: 'Port must be a number' })
        .int({ message: 'Port must be an integer' })
        .min(1, 'Port must be between 1 and 65535')
        .max(65535, 'Port must be between 1 and 65535'),
    sslPort: z.coerce
        .number({ message: 'SSL Port must be a number' })
        .int({ message: 'SSL Port must be an integer' })
        .min(1, 'Port must be between 1 and 65535')
        .max(65535, 'Port must be between 1 and 65535')
        .default(636),
    useSSL: z.boolean().default(false),
    useTLS: z.boolean().default(false),
    description: z.string().optional(),

    // Tab 2: Authentication
    bindDn: z.string().min(1, 'Bind DN is required'),
    bindPassword: z.string().optional(),

    // Tab 3: Directory Settings
    baseDn: z.string().min(1, 'Base DN is required'),
    userFilter: z.string().optional(),
    groupFilter: z.string().optional(),

    // Tab 4: Attribute Mapping (handled separately as dynamic fields)
    connectionTimeout: z.coerce.number().int().min(1).max(300).default(30),
    searchTimeout: z.coerce.number().int().min(1).max(120).default(10),

    // Tab 5: Sync Settings
    syncSchedule: z.string().default('DAILY'),
    autoDisableUsers: z.boolean().default(true),
    syncManagers: z.boolean().default(true),
    managerAttribute: z.string().default('manager'),
    syncDepartment: z.boolean().default(true),
    departmentAttribute: z.string().default('department'),
    immutableIdAttribute: z.string().default('objectGUID'),
    jitProvisioning: z.boolean().default(false),
    deletionThresholdPercent: z.coerce.number().int().min(1).max(100).default(20),
});

export type LdapServerFormValues = z.infer<typeof ldapServerFormSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getStatusVariant(status: string): 'default' | 'destructive' | 'secondary' | 'outline' {
    switch (status) {
        case 'Connected':
            return 'default';
        case 'Error':
            return 'destructive';
        case 'Disconnected':
            return 'secondary';
        default:
            return 'outline';
    }
}

export function getStatusColor(status: string): string {
    switch (status) {
        case 'Connected':
            return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
        case 'Error':
            return 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20';
        case 'Disconnected':
            return 'bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/20';
        case 'Testing':
            return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20';
        case 'Maintenance':
            return 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/20';
        default:
            return 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/20';
    }
}

export function getSecurityLabel(server: { useSSL: boolean; useTLS: boolean }): string {
    if (server.useSSL) return 'SSL';
    if (server.useTLS) return 'TLS';
    return 'None';
}
