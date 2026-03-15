'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  User,
  Shield,
  Users as UsersIcon,
  Activity,
  FileText,
  Settings,
  Key,
  LogOut,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Edit,
  Monitor,
  Smartphone,
  Tablet,
  Plus,
  X,
  Camera,
  Save,
  Folder,
  ExternalLink,
  Building2,
  Briefcase,
  Hash,
  DollarSign,
  CalendarIcon,
  ChevronsUpDown,
  Check,
  Network,
  UserCheck,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { notificationApiClient } from '@/api/notificationClient';
import { roleManagementService } from '@/api/services/roleManagementService';
import { apiClient } from '@/api/client';
import { auditLogService, AuditLog } from '@/api/services/auditLogService';
import { adminUserService } from '@/api/services/adminUserService';
import { organizationService, ReferenceDataItem, ManagerAssignmentResponse, ReferenceDataCategory } from '@/api/services/organizationService';
import { userManagementService } from '@/api/services/userManagementService';
import { UserDto, RoleDto, GroupDto } from '@/types/api';
import { formatDate, formatDateOnly } from '@/lib/dateFormatter';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import AssignUserRolesModal from '@/components/modals/AssignUserRolesModal';
import AssignUserGroupsModal from '@/components/modals/AssignUserGroupsModal';
import { usePermissions } from '@/hooks/usePermissions';
import { Permissions } from '@/constants/permissions';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useNotification } from '@/contexts/NotificationContext';
import { ImageCropDialog } from '@/components/ui/image-crop-dialog';
import CreateReferenceDataModal from '@/components/modals/CreateReferenceDataModal';
import RepositoryBrowser from '@/components/main/RepositoryBrowser';

interface UserStatistics {
  userId: string;
  username: string;
  displayName: string;
  createdAt: string;
  lastLogin: string;
  rolesCount: number;
  groupsCount: number;
  activeSessionsCount: number;
  status: string;
  emailVerified: boolean;
}

interface Session {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo: string;
  location: string;
  createdAt: string;
  lastAccessedAt: string;
  expiresAt: string;
  isActive: boolean;
}

interface UserRepository {
  rootFolderId: number;
  folderName: string;
  folderCount: number;
  documentCount: number;
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const { hasPermission } = usePermissions();
  const canManageRefData = hasPermission(Permissions.ORG_MANAGE_REFERENCE_DATA);
  const canAssignManager = hasPermission(Permissions.ORG_ASSIGN_MANAGER);
  const { addNotification } = useNotification();

  const [user, setUser] = useState<UserDto | null>(null);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [repository, setRepository] = useState<UserRepository | null>(null);
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);
  const [activityTotal, setActivityTotal] = useState(0);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userGroups, setUserGroups] = useState<GroupDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Permission checks
  const canViewUser = hasPermission(Permissions.USER_READ);
  const canUpdateUser = hasPermission(Permissions.USER_UPDATE);
  const canDeleteUser = hasPermission(Permissions.USER_DELETE);
  const canAssignRole = hasPermission(Permissions.USER_ASSIGN_ROLE);
  const canViewRepository = hasPermission(Permissions.FOLDER_READ);
  const canViewRoles = hasPermission(Permissions.ROLE_READ);
  const canViewGroups = hasPermission(Permissions.GROUP_READ);
  const canViewAudit = hasPermission(Permissions.AUDIT_READ);
  const canViewSessions = hasPermission(Permissions.USER_READ); // Sessions are part of user read

  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [revokeSessionId, setRevokeSessionId] = useState<string | null>(null);

  // Edit profile states
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // HR edit states
  const [editEmployeeNumber, setEditEmployeeNumber] = useState('');
  const [editCostCenterId, setEditCostCenterId] = useState<string | undefined>(undefined);
  const [editCostCenterName, setEditCostCenterName] = useState('');
  const [editHireDate, setEditHireDate] = useState('');
  const [editJobFamilyId, setEditJobFamilyId] = useState<string | undefined>(undefined);
  const [editEmploymentTypeId, setEditEmploymentTypeId] = useState<string | undefined>(undefined);
  const [editClearanceLevelId, setEditClearanceLevelId] = useState<string | undefined>(undefined);

  // Selected ref data display names
  const [selectedJfName, setSelectedJfName] = useState('');
  const [selectedEtName, setSelectedEtName] = useState('');
  const [selectedClName, setSelectedClName] = useState('');

  // Reference data — server-side search results
  const [jobFamilies, setJobFamilies] = useState<ReferenceDataItem[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<ReferenceDataItem[]>([]);
  const [clearanceLevels, setClearanceLevels] = useState<ReferenceDataItem[]>([]);
  const [costCenters, setCostCenters] = useState<ReferenceDataItem[]>([]);
  const [jfOpen, setJfOpen] = useState(false);
  const [etOpen, setEtOpen] = useState(false);
  const [clOpen, setClOpen] = useState(false);
  const [ccOpen, setCcOpen] = useState(false);
  const [jfLoading, setJfLoading] = useState(false);
  const [etLoading, setEtLoading] = useState(false);
  const [clLoading, setClLoading] = useState(false);
  const [ccLoading, setCcLoading] = useState(false);

  // Server-side search queries
  const [jfSearchQ, setJfSearchQ] = useState('');
  const [etSearchQ, setEtSearchQ] = useState('');
  const [clSearchQ, setClSearchQ] = useState('');
  const [ccSearchQ, setCcSearchQ] = useState('');

  // Manager state
  const [currentManager, setCurrentManager] = useState<ManagerAssignmentResponse | null>(null);
  const [managerSearchQuery, setManagerSearchQuery] = useState('');
  const [managerSearchResults, setManagerSearchResults] = useState<UserDto[]>([]);
  const [managerPickerOpen, setManagerPickerOpen] = useState(false);
  const [assigningManager, setAssigningManager] = useState(false);

  // Create/Edit ref data modal
  const [createRefCategory, setCreateRefCategory] = useState<ReferenceDataCategory | null>(null);
  const [editRefItem, setEditRefItem] = useState<ReferenceDataItem | null>(null);
  const [deleteRefItem, setDeleteRefItem] = useState<{ item: ReferenceDataItem; category: ReferenceDataCategory } | null>(null);

  // Crop dialog state
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  // Load manager on mount
  useEffect(() => {
    loadCurrentManager();
  }, [userId]);

  // Server-side search effects for ref data
  useEffect(() => {
    if (jfSearchQ.length >= 1) {
      setJfLoading(true);
      organizationService.searchReferenceData('job-families', jfSearchQ)
        .then(setJobFamilies).catch(() => { }).finally(() => setJfLoading(false));
    } else { setJobFamilies([]); }
  }, [jfSearchQ]);

  useEffect(() => {
    if (etSearchQ.length >= 1) {
      setEtLoading(true);
      organizationService.searchReferenceData('employment-types', etSearchQ)
        .then(setEmploymentTypes).catch(() => { }).finally(() => setEtLoading(false));
    } else { setEmploymentTypes([]); }
  }, [etSearchQ]);

  useEffect(() => {
    if (clSearchQ.length >= 1) {
      setClLoading(true);
      organizationService.searchReferenceData('clearance-levels', clSearchQ)
        .then(setClearanceLevels).catch(() => { }).finally(() => setClLoading(false));
    } else { setClearanceLevels([]); }
  }, [clSearchQ]);

  useEffect(() => {
    if (ccSearchQ.length >= 1) {
      setCcLoading(true);
      organizationService.searchReferenceData('cost-centers', ccSearchQ)
        .then(setCostCenters).catch(() => { }).finally(() => setCcLoading(false));
    } else { setCostCenters([]); }
  }, [ccSearchQ]);

  // Delete ref data handler
  const handleDeleteRefData = async () => {
    if (!deleteRefItem) return;
    try {
      await organizationService.deleteReferenceData(deleteRefItem.category, deleteRefItem.item.id);
      // Clear selection if the deleted item was selected
      if (deleteRefItem.category === 'job-families' && editJobFamilyId === deleteRefItem.item.id) { setEditJobFamilyId(undefined); setSelectedJfName(''); }
      else if (deleteRefItem.category === 'employment-types' && editEmploymentTypeId === deleteRefItem.item.id) { setEditEmploymentTypeId(undefined); setSelectedEtName(''); }
      else if (deleteRefItem.category === 'clearance-levels' && editClearanceLevelId === deleteRefItem.item.id) { setEditClearanceLevelId(undefined); setSelectedClName(''); }
      else if (deleteRefItem.category === 'cost-centers' && editCostCenterId === deleteRefItem.item.id) { setEditCostCenterId(undefined); setEditCostCenterName(''); }
      // Remove deleted item from the dropdown list
      const deletedId = deleteRefItem.item.id;
      if (deleteRefItem.category === 'job-families') setJobFamilies(prev => prev.filter(i => i.id !== deletedId));
      else if (deleteRefItem.category === 'employment-types') setEmploymentTypes(prev => prev.filter(i => i.id !== deletedId));
      else if (deleteRefItem.category === 'clearance-levels') setClearanceLevels(prev => prev.filter(i => i.id !== deletedId));
      else if (deleteRefItem.category === 'cost-centers') setCostCenters(prev => prev.filter(i => i.id !== deletedId));
      addNotification({ type: 'success', title: 'Deleted', message: `${deleteRefItem.item.name} deleted successfully` });
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Error', message: err.message || 'Failed to delete' });
    }
    setDeleteRefItem(null);
  };

  const loadCurrentManager = async () => {
    try {
      const mgr = await organizationService.getCurrentManager(userId);
      setCurrentManager(mgr);
    } catch {
      setCurrentManager(null);
    }
  };

  const handleSearchManagers = async (query: string) => {
    setManagerSearchQuery(query);
    if (query.length < 2) { setManagerSearchResults([]); return; }
    try {
      const results = await userManagementService.quickSearchUsers(query);
      setManagerSearchResults((results || []).filter((u: UserDto) => u.id !== userId));
    } catch { setManagerSearchResults([]); }
  };

  const handleAssignManager = async (managerUserId: string) => {
    setAssigningManager(true);
    try {
      await organizationService.assignManager(userId, { managerUserId });
      // Reload fresh manager data from backend to ensure correct IDs
      const fresh = await organizationService.getCurrentManager(userId);
      setCurrentManager(fresh);
      setManagerPickerOpen(false);
      setManagerSearchQuery('');
      setManagerSearchResults([]);
      addNotification({ type: 'success', title: 'Manager Updated', message: 'Manager assigned successfully' });
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Error', message: err.message || 'Failed to assign manager' });
    } finally { setAssigningManager(false); }
  };

  const handleRemoveManager = async () => {
    setAssigningManager(true);
    try {
      await organizationService.removeManager(userId);
      setCurrentManager(null);
      addNotification({ type: 'success', title: 'Manager Removed', message: 'Manager removed successfully' });
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Error', message: err.message || 'Failed to remove manager' });
    } finally { setAssigningManager(false); }
  };

  // Populate edit form fields when user data is loaded
  useEffect(() => {
    if (user) {
      setEditDisplayName(user.displayName || '');
      setEditEmail(user.email || '');
      setEditFirstName(user.firstName || '');
      setEditLastName(user.lastName || '');
      setEditJobTitle(user.jobTitle || '');
      setEditUsername(user.username || '');
      setProfilePhotoPreview(user.imgUrl || null);
      // HR fields
      setEditEmployeeNumber(user.employeeNumber || '');
      setEditCostCenterId(user.costCenterId || undefined);
      setEditCostCenterName(user.costCenterName || '');
      setEditHireDate(user.hireDate || '');
      setEditJobFamilyId(user.jobFamilyId || undefined);
      setEditEmploymentTypeId(user.employmentTypeId || undefined);
      setEditClearanceLevelId(user.clearanceLevelId || undefined);
      setSelectedJfName(user.jobFamilyName || '');
      setSelectedEtName(user.employmentTypeName || '');
      setSelectedClName(user.clearanceLevelName || '');
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [userData, stats] = await Promise.all([
        notificationApiClient.getUserById(userId),
        notificationApiClient.getUserStatisticsById(userId).catch(() => null)
      ]);
      setUser(userData);
      setStatistics(stats);
      setUserRoles(userData.roles || []);
      setUserGroups(userData.groups || []);

      // Fetch sessions
      if (activeTab === 'sessions') {
        fetchSessions();
      }
    } catch (err: any) {
      console.error('Error fetching user:', err);
      setError(err.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const sessionsData = await notificationApiClient.getUserSessions(userId);
      setSessions(sessionsData || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
    }
  };

  const fetchRepository = async () => {
    try {
      // Fetch user's repository (root folder) using admin endpoint
      const repoResponse = await apiClient.get<any>(`/api/v1/folder/user/${userId}?page=0&size=1`);
      if (repoResponse.content && repoResponse.content.length > 0) {
        const rootFolder = repoResponse.content[0];
        setRepository({
          rootFolderId: rootFolder.id,
          folderName: rootFolder.name || 'My Repository',
          folderCount: rootFolder.subFolderCount || 0,
          documentCount: rootFolder.documentCount || 0,
        });
      } else {
        setRepository(null);
      }
    } catch (error) {
      console.error('Error fetching repository:', error);
      setRepository(null);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const logsResponse = await auditLogService.getAuditLogsByUser(userId, 0, 20);
      setActivityLogs(logsResponse.content || []);
      setActivityTotal(logsResponse.totalElements || 0);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      setActivityLogs([]);
      setActivityTotal(0);
    }
  };

  const handleBack = () => {
    router.push('/admin/users');
  };

  const handleUpdateUserStatus = async (enabled: boolean) => {
    try {
      await notificationApiClient.updateUserStatus(userId, enabled);
      setUser(prev => prev ? { ...prev, enabled, status: enabled ? 'ACTIVE' : 'INACTIVE' } : null);
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await notificationApiClient.deleteUser(userId);
      router.push('/admin/users');
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleResetPassword = async () => {
    try {
      const result = await notificationApiClient.resetUserPassword(userId);
      setTempPassword(result.temporaryPassword);
      // Keep modal open to show temp password
    } catch (error) {
      console.error('Error resetting password:', error);
      setIsResetPasswordModalOpen(false);
    }
  };

  const handleAssignRoles = async (roleIds: string[]) => {
    try {
      // Assign each role to the user
      for (const roleId of roleIds) {
        await roleManagementService.assignRoleToUsers(roleId, [userId]);
      }
      // Refetch user data to update roles
      await fetchUserData();
    } catch (error) {
      console.error('Error assigning roles:', error);
    }
  };

  const handleRemoveRole = async (roleName: string) => {
    try {
      await notificationApiClient.removeRoleFromUser(roleName, userId);
      setUserRoles(prev => prev.filter(r => r !== roleName));
      await fetchUserData();
    } catch (error) {
      console.error('Error removing role:', error);
    }
  };

  const handleAssignGroups = async (groupIds: string[]) => {
    try {
      // Assign user to each group
      for (const groupId of groupIds) {
        await notificationApiClient.addUserToGroup(groupId, userId);
      }
      // Refetch user data to update groups
      await fetchUserData();
    } catch (error) {
      console.error('Error assigning groups:', error);
    }
  };

  const handleRemoveGroup = async (groupId: string) => {
    try {
      await notificationApiClient.removeUserFromGroup(groupId, userId);
      await fetchUserData();
    } catch (error) {
      console.error('Error removing group:', error);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await notificationApiClient.revokeUserSession(userId, sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setRevokeSessionId(null);
    } catch (error) {
      console.error('Error revoking session:', error);
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await notificationApiClient.revokeAllUserSessions(userId);
      setSessions([]);
    } catch (error) {
      console.error('Error revoking all sessions:', error);
    }
  };

  // Edit profile handlers
  const handlePhotoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        addNotification({
          type: 'error',
          title: 'File too large',
          message: 'Profile photo must be less than 5MB',
        });
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        addNotification({
          type: 'error',
          title: 'Invalid file type',
          message: 'Only JPEG, PNG, GIF, WebP images are allowed',
        });
        return;
      }
      // Create object URL for cropping
      const imageUrl = URL.createObjectURL(file);
      setImageToCrop(imageUrl);
      setCropDialogOpen(true);
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    setProfilePhotoFile(croppedFile);
    setProfilePhotoPreview(URL.createObjectURL(croppedFile));
    // Clean up object URL
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
      setImageToCrop(null);
    }
  };

  const handleCropCancel = () => {
    setCropDialogOpen(false);
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
      setImageToCrop(null);
    }
  };

  const handleUploadPhoto = async () => {
    if (!profilePhotoFile) return;

    setSavingProfile(true);
    try {
      const updatedUser = await adminUserService.uploadUserProfilePhoto(userId, profilePhotoFile);
      setUser(updatedUser);
      setProfilePhotoPreview(updatedUser.imgUrl || null);
      setProfilePhotoFile(null);
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Profile photo updated successfully',
      });
    } catch (error: any) {
      console.error('Failed to upload profile photo:', error);
      addNotification({
        type: 'error',
        title: 'Upload failed',
        message: error.message || 'Failed to upload profile photo',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!user?.imgUrl) return;

    setSavingProfile(true);
    try {
      await adminUserService.deleteUserProfilePhoto(userId);
      setUser(prev => prev ? { ...prev, imgUrl: '' } : null);
      setProfilePhotoPreview(null);
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Profile photo deleted successfully',
      });
    } catch (error: any) {
      console.error('Failed to delete profile photo:', error);
      addNotification({
        type: 'error',
        title: 'Delete failed',
        message: error.message || 'Failed to delete profile photo',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingProfile(true);
    try {
      // Build update request with only changed fields (partial update)
      const updateRequest: any = {};
      if (editUsername !== user.username) updateRequest.username = editUsername;
      if (editEmail !== user.email) updateRequest.email = editEmail;
      if (editDisplayName !== user.displayName) updateRequest.displayName = editDisplayName;
      if (editFirstName !== user.firstName) updateRequest.firstName = editFirstName;
      if (editLastName !== user.lastName) updateRequest.lastName = editLastName;
      if (editJobTitle !== user.jobTitle) updateRequest.jobTitle = editJobTitle;
      // HR fields
      if (editEmployeeNumber !== (user.employeeNumber || '')) updateRequest.employeeNumber = editEmployeeNumber;
      if (editCostCenterId !== (user.costCenterId || undefined)) updateRequest.costCenterId = editCostCenterId || null;
      if (editHireDate !== (user.hireDate || '')) updateRequest.hireDate = editHireDate;
      if (editJobFamilyId !== (user.jobFamilyId || undefined)) updateRequest.jobFamilyId = editJobFamilyId || null;
      if (editEmploymentTypeId !== (user.employmentTypeId || undefined)) updateRequest.employmentTypeId = editEmploymentTypeId || null;
      if (editClearanceLevelId !== (user.clearanceLevelId || undefined)) updateRequest.clearanceLevelId = editClearanceLevelId || null;

      // Only make API call if there are changes
      if (Object.keys(updateRequest).length === 0) {
        addNotification({
          type: 'info',
          title: 'No changes',
          message: 'No fields were modified',
        });
        setSavingProfile(false);
        return;
      }

      const updatedUser = await adminUserService.updateUser(userId, updateRequest);
      setUser(updatedUser);
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'User profile updated successfully',
      });
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      addNotification({
        type: 'error',
        title: 'Update failed',
        message: error.message || 'Failed to update user profile',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    if (!canViewUser) {
      router.push('/admin/users');
      return;
    }

    if (activeTab === 'sessions') {
      fetchSessions();
    } else if (activeTab === 'documents') {
      if (canViewRepository) {
        fetchRepository();
      }
    } else if (activeTab === 'activity') {
      fetchActivityLogs();
    }
  }, [activeTab, canViewUser, canViewRepository, router]);

  const parseUserAgent = (userAgent: string) => {
    if (!userAgent) return { browser: 'Unknown', os: 'Unknown', device: 'desktop' };

    // Parse browser
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';

    // Parse OS
    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    // Parse device type
    let device = 'desktop';
    if (userAgent.includes('Mobile')) device = 'mobile';
    else if (userAgent.includes('Tablet')) device = 'tablet';

    return { browser, os, device };
  };

  const getDeviceIcon = (device: string) => {
    switch (device?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-destructive text-lg mb-4">{error || 'User not found'}</div>
              <Button onClick={handleBack}>Back to Users</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Complete dashboard for {user.displayName}</p>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.imageUrl || user.imgUrl} alt={user.displayName} />
                <AvatarFallback className="text-2xl">
                  {user.firstName?.[0] || user.username[0].toUpperCase()}
                  {user.lastName?.[0] || user.username[1]?.toUpperCase() || ''}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div>
                  <h2 className="text-2xl font-bold">{user.displayName}</h2>
                  <p className="text-muted-foreground">@{user.username}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.email}</span>
                    {user.emailVerified && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  {user.jobTitle && (
                    <Badge variant="outline">{user.jobTitle}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {user.status === 'ACTIVE' || user.enabled ? (
                    <Badge variant="default" className="bg-green-500">Active</Badge>
                  ) : (
                    <Badge variant="destructive">Disabled</Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Joined {formatDate(user.createdAt || user.createdTimestamp)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => canUpdateUser && handleUpdateUserStatus(!user.enabled)}
                    disabled={!canUpdateUser}
                  >
                    {user.enabled ? <XCircle className="h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    {user.enabled ? 'Disable' : 'Enable'}
                  </Button>
                </TooltipTrigger>
                {!canUpdateUser && (
                  <TooltipContent>
                    <p>You don't have permission to update users</p>
                  </TooltipContent>
                )}
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => canUpdateUser && setIsResetPasswordModalOpen(true)}
                    disabled={!canUpdateUser}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Reset Password
                  </Button>
                </TooltipTrigger>
                {!canUpdateUser && (
                  <TooltipContent>
                    <p>You don't have permission to reset user passwords</p>
                  </TooltipContent>
                )}
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => canDeleteUser && setIsDeleteModalOpen(true)}
                    disabled={!canDeleteUser}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </TooltipTrigger>
                {!canDeleteUser && (
                  <TooltipContent>
                    <p>You don't have permission to delete users</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Roles</p>
                <p className="text-2xl font-bold">{statistics?.rolesCount || user.roles?.length || 0}</p>
              </div>
              <Shield className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Groups</p>
                <p className="text-2xl font-bold">{statistics?.groupsCount || user.groups?.length || 0}</p>
              </div>
              <UsersIcon className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Documents</p>
                <p className="text-2xl font-bold">{repository?.documentCount || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sessions</p>
                <p className="text-2xl font-bold">{statistics?.activeSessionsCount || sessions.length}</p>
              </div>
              <LogOut className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">
            <User className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <TabsTrigger
                  value="edit"
                  disabled={!canUpdateUser}
                  className={!canUpdateUser ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </TabsTrigger>
              </div>
            </TooltipTrigger>
            {!canUpdateUser && (
              <TooltipContent>
                <p>You don't have permission to update users</p>
              </TooltipContent>
            )}
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <TabsTrigger
                  value="roles"
                  disabled={!canViewRoles}
                  className={!canViewRoles ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Roles
                </TabsTrigger>
              </div>
            </TooltipTrigger>
            {!canViewRoles && (
              <TooltipContent>
                <p>You don't have permission to view roles (role:read required)</p>
              </TooltipContent>
            )}
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <TabsTrigger
                  value="groups"
                  disabled={!canViewGroups}
                  className={!canViewGroups ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <UsersIcon className="h-4 w-4 mr-2" />
                  Groups
                </TabsTrigger>
              </div>
            </TooltipTrigger>
            {!canViewGroups && (
              <TooltipContent>
                <p>You don't have permission to view groups (group:read required)</p>
              </TooltipContent>
            )}
          </Tooltip>
          <TabsTrigger value="organization">
            <Building2 className="h-4 w-4 mr-2" />
            Organization
          </TabsTrigger>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <TabsTrigger
                  value="sessions"
                  disabled={!canViewSessions}
                  className={!canViewSessions ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sessions
                </TabsTrigger>
              </div>
            </TooltipTrigger>
            {!canViewSessions && (
              <TooltipContent>
                <p>You don't have permission to view user sessions (user:read required)</p>
              </TooltipContent>
            )}
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <TabsTrigger
                  value="folders"
                  disabled={!canViewRepository}
                  className={!canViewRepository ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  Folders
                </TabsTrigger>
              </div>
            </TooltipTrigger>
            {!canViewRepository && (
              <TooltipContent>
                <p>You don't have permission to view user repositories (folder:read required)</p>
              </TooltipContent>
            )}
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <TabsTrigger
                  value="activity"
                  disabled={!canViewAudit}
                  className={!canViewAudit ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Activity
                </TabsTrigger>
              </div>
            </TooltipTrigger>
            {!canViewAudit && (
              <TooltipContent>
                <p>You don't have permission to view activity logs (audit:read required)</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
                <CardDescription>Detailed information about this user</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-4">Personal Information</h3>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm text-muted-foreground">First Name</dt>
                        <dd className="font-medium">{user.firstName || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Last Name</dt>
                        <dd className="font-medium">{user.lastName || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Email</dt>
                        <dd className="font-medium">{user.email}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Job Title</dt>
                        <dd className="font-medium">{user.jobTitle || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Reports To</dt>
                        <dd className="font-medium">
                          {currentManager ? (
                            <button
                              onClick={() => router.push(`/admin/users/${currentManager.managerUserId}`)}
                              className="flex items-center gap-2 text-primary hover:underline"
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={currentManager.managerImageUrl} />
                                <AvatarFallback className="text-xs">{currentManager.managerDisplayName?.[0] || '?'}</AvatarFallback>
                              </Avatar>
                              {currentManager.managerDisplayName}
                            </button>
                          ) : (
                            <span className="text-muted-foreground">No manager assigned</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-4">Account Information</h3>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm text-muted-foreground">Username</dt>
                        <dd className="font-medium">@{user.username}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">User ID</dt>
                        <dd className="font-mono text-sm">{user.id}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Status</dt>
                        <dd>
                          {user.status === 'ACTIVE' || user.enabled ? (
                            <Badge variant="default" className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge variant="destructive">Disabled</Badge>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Email Verified</dt>
                        <dd>
                          {user.emailVerified ? (
                            <Badge variant="default" className="bg-green-500">Verified</Badge>
                          ) : (
                            <Badge variant="outline">Not Verified</Badge>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Created At</dt>
                        <dd className="text-sm">{formatDate(user.createdAt || user.createdTimestamp)}</dd>
                      </div>
                      {user.updatedAt && (
                        <div>
                          <dt className="text-sm text-muted-foreground">Last Updated</dt>
                          <dd className="text-sm">{formatDate(user.updatedAt)}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* HR Attributes Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  HR Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <dt className="text-sm text-muted-foreground">Employee Number</dt>
                    <dd className="font-medium">{user.employeeNumber || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Cost Center</dt>
                    <dd className="font-medium">{user.costCenterName || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Hire Date</dt>
                    <dd className="font-medium">{user.hireDate ? formatDateOnly(user.hireDate) : 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Job Family</dt>
                    <dd className="font-medium">{user.jobFamilyName || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Employment Type</dt>
                    <dd className="font-medium">{user.employmentTypeName || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Clearance Level</dt>
                    <dd className="font-medium">{user.clearanceLevelName || 'N/A'}</dd>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Edit Profile Tab */}
        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>Edit User Profile</CardTitle>
              <CardDescription>Update user information and profile photo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Photo Section */}
              <div className="flex flex-col items-center gap-4 pb-6 border-b">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profilePhotoPreview || undefined} alt={user.displayName || 'User'} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-5xl">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="h-16 w-16" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                  <Input
                    id="profilePhotoInput"
                    type="file"
                    accept="image/jpeg, image/png, image/gif, image/webp"
                    className="hidden"
                    onChange={handlePhotoFileChange}
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('profilePhotoInput')?.click()}
                    disabled={savingProfile}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Choose Photo
                  </Button>
                  {profilePhotoFile && (
                    <Button onClick={handleUploadPhoto} disabled={savingProfile}>
                      <Save className="h-4 w-4 mr-2" />
                      {savingProfile ? 'Uploading...' : 'Upload Photo'}
                    </Button>
                  )}
                  {user.imgUrl && !profilePhotoFile && (
                    <Button variant="destructive" onClick={handleDeletePhoto} disabled={savingProfile}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Photo
                    </Button>
                  )}
                </div>
                {profilePhotoFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {profilePhotoFile.name}
                  </p>
                )}
              </div>

              {/* Profile Information Form */}
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editUsername">Username</Label>
                    <Input
                      id="editUsername"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      required
                      disabled={savingProfile}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editDisplayName">Display Name</Label>
                    <Input
                      id="editDisplayName"
                      value={editDisplayName}
                      onChange={(e) => setEditDisplayName(e.target.value)}
                      required
                      disabled={savingProfile}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEmail">Email</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    disabled={savingProfile}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editFirstName">First Name</Label>
                    <Input
                      id="editFirstName"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      disabled={savingProfile}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editLastName">Last Name</Label>
                    <Input
                      id="editLastName"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      disabled={savingProfile}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editJobTitle">Job Title</Label>
                  <Input
                    id="editJobTitle"
                    value={editJobTitle}
                    onChange={(e) => setEditJobTitle(e.target.value)}
                    disabled={savingProfile}
                  />
                </div>

                {/* Manager Picker */}
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" />
                    Manager
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      {currentManager ? (
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={currentManager.managerImageUrl} />
                            <AvatarFallback>{currentManager.managerDisplayName?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{currentManager.managerDisplayName}</p>
                            <p className="text-xs text-muted-foreground">Since {formatDateOnly(currentManager.effectiveFrom)}</p>
                          </div>
                          {canAssignManager && (
                            <Button size="sm" variant="ghost" onClick={handleRemoveManager} disabled={assigningManager}>
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground p-3 border rounded-lg">No manager assigned</p>
                      )}
                    </div>
                    {canAssignManager && (
                      <Popover open={managerPickerOpen} onOpenChange={setManagerPickerOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" type="button">
                            {currentManager ? 'Change' : 'Assign'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="end">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Search users..."
                              value={managerSearchQuery}
                              onValueChange={handleSearchManagers}
                            />
                            <CommandList>
                              <CommandEmpty>No users found.</CommandEmpty>
                              <CommandGroup>
                                {managerSearchResults.map((u) => (
                                  <CommandItem
                                    key={u.id}
                                    value={u.id}
                                    onSelect={() => handleAssignManager(u.id)}
                                  >
                                    <Avatar className="h-6 w-6 mr-2">
                                      <AvatarImage src={u.imgUrl || u.imageUrl} />
                                      <AvatarFallback className="text-xs">{u.displayName?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm">{u.displayName}</p>
                                      <p className="text-xs text-muted-foreground">{u.email}</p>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>

                {/* HR Details Section */}
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    HR Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editEmployeeNumber" className="flex items-center gap-1">
                        <Hash className="h-3 w-3" /> Employee Number
                      </Label>
                      <Input
                        id="editEmployeeNumber"
                        value={editEmployeeNumber}
                        onChange={(e) => setEditEmployeeNumber(e.target.value)}
                        placeholder="EMP-001"
                        disabled={savingProfile}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1 text-sm">
                        <DollarSign className="h-3 w-3" /> Cost Center
                      </Label>
                      <Popover open={ccOpen} onOpenChange={setCcOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between font-normal h-9 text-sm" type="button" disabled={savingProfile}>
                            {editCostCenterName || <span className="text-muted-foreground">Search cost center...</span>}
                            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput placeholder="Search by name or code..." value={ccSearchQ} onValueChange={setCcSearchQ} />
                            <CommandList>
                              {ccLoading ? (
                                <div className="flex items-center justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /><span className="ml-2 text-sm text-muted-foreground">Searching...</span></div>
                              ) : ccSearchQ.length < 1 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">Type to search...</div>
                              ) : costCenters.length === 0 ? (
                                <CommandEmpty>No results found.</CommandEmpty>
                              ) : (
                                <CommandGroup>
                                  {editCostCenterId && (
                                    <CommandItem value="__clear__" onSelect={() => { setEditCostCenterId(undefined); setEditCostCenterName(''); setCcOpen(false); }}>
                                      <X className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> Clear selection
                                    </CommandItem>
                                  )}
                                  {costCenters.map(item => (
                                    <CommandItem key={item.id} value={item.id} onSelect={() => { setEditCostCenterId(item.id); setEditCostCenterName(item.name); setCcOpen(false); }}
                                      className="flex items-center justify-between group">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <Check className={cn('h-3.5 w-3.5 shrink-0', editCostCenterId === item.id ? 'opacity-100' : 'opacity-0')} />
                                        <div className="min-w-0">
                                          <span className="text-sm">{item.name}</span>
                                          <span className="text-xs text-muted-foreground ml-1">({item.code})</span>
                                          {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                                        </div>
                                      </div>
                                      {canManageRefData && (
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                          <button type="button" onClick={(e) => { e.stopPropagation(); setEditRefItem(item); setCreateRefCategory('cost-centers'); setCcOpen(false); }}
                                            className="p-1 hover:bg-muted rounded" title="Edit"><Pencil className="h-3 w-3 text-muted-foreground" /></button>
                                          <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteRefItem({ item, category: 'cost-centers' }); setCcOpen(false); }}
                                            className="p-1 hover:bg-destructive/10 rounded" title="Delete"><Trash2 className="h-3 w-3 text-destructive" /></button>
                                        </div>
                                      )}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {canManageRefData && (<p className="text-xs text-muted-foreground">Can&apos;t find what you need?{' '}<button type="button" onClick={() => { setEditRefItem(null); setCreateRefCategory('cost-centers'); }} className="text-primary hover:underline font-medium">Create new</button></p>)}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editHireDate" className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" /> Hire Date
                      </Label>
                      <Input
                        id="editHireDate"
                        type="date"
                        value={editHireDate}
                        onChange={(e) => setEditHireDate(e.target.value)}
                        disabled={savingProfile}
                      />
                    </div>
                    {/* Job Family */}
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1 text-sm">
                        <Briefcase className="h-3 w-3" /> Job Family
                      </Label>
                      <Popover open={jfOpen} onOpenChange={setJfOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between font-normal h-9 text-sm" type="button" disabled={savingProfile}>
                            {selectedJfName || <span className="text-muted-foreground">Search job family...</span>}
                            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput placeholder="Search by name or code..." value={jfSearchQ} onValueChange={setJfSearchQ} />
                            <CommandList>
                              {jfLoading ? (
                                <div className="flex items-center justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /><span className="ml-2 text-sm text-muted-foreground">Searching...</span></div>
                              ) : jfSearchQ.length < 1 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">Type to search...</div>
                              ) : jobFamilies.length === 0 ? (
                                <CommandEmpty>No results found.</CommandEmpty>
                              ) : (
                                <CommandGroup>
                                  {editJobFamilyId && (
                                    <CommandItem value="__clear__" onSelect={() => { setEditJobFamilyId(undefined); setSelectedJfName(''); setJfOpen(false); }}>
                                      <X className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> Clear selection
                                    </CommandItem>
                                  )}
                                  {jobFamilies.map(item => (
                                    <CommandItem key={item.id} value={item.id} onSelect={() => { setEditJobFamilyId(item.id); setSelectedJfName(item.name); setJfOpen(false); }}
                                      className="flex items-center justify-between group">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <Check className={cn('h-3.5 w-3.5 shrink-0', editJobFamilyId === item.id ? 'opacity-100' : 'opacity-0')} />
                                        <div className="min-w-0">
                                          <span className="text-sm">{item.name}</span>
                                          <span className="text-xs text-muted-foreground ml-1">({item.code})</span>
                                          {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        {canManageRefData && (<>
                                          <button type="button" onClick={(e) => { e.stopPropagation(); setEditRefItem(item); setCreateRefCategory('job-families'); setJfOpen(false); }}
                                            className="p-1 hover:bg-muted rounded" title="Edit"><Pencil className="h-3 w-3 text-muted-foreground" /></button>
                                          <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteRefItem({ item, category: 'job-families' }); setJfOpen(false); }}
                                            className="p-1 hover:bg-destructive/10 rounded" title="Delete"><Trash2 className="h-3 w-3 text-destructive" /></button>
                                        </>)}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {canManageRefData && (<p className="text-xs text-muted-foreground">Can&apos;t find what you need?{' '}<button type="button" onClick={() => { setEditRefItem(null); setCreateRefCategory('job-families'); }} className="text-primary hover:underline font-medium">Create new</button></p>)}
                    </div>
                    {/* Employment Type */}
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1 text-sm">
                        <Briefcase className="h-3 w-3" /> Employment Type
                      </Label>
                      <Popover open={etOpen} onOpenChange={setEtOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between font-normal h-9 text-sm" type="button" disabled={savingProfile}>
                            {selectedEtName || <span className="text-muted-foreground">Search employment type...</span>}
                            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput placeholder="Search by name or code..." value={etSearchQ} onValueChange={setEtSearchQ} />
                            <CommandList>
                              {etLoading ? (
                                <div className="flex items-center justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /><span className="ml-2 text-sm text-muted-foreground">Searching...</span></div>
                              ) : etSearchQ.length < 1 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">Type to search...</div>
                              ) : employmentTypes.length === 0 ? (
                                <CommandEmpty>No results found.</CommandEmpty>
                              ) : (
                                <CommandGroup>
                                  {editEmploymentTypeId && (
                                    <CommandItem value="__clear__" onSelect={() => { setEditEmploymentTypeId(undefined); setSelectedEtName(''); setEtOpen(false); }}>
                                      <X className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> Clear selection
                                    </CommandItem>
                                  )}
                                  {employmentTypes.map(item => (
                                    <CommandItem key={item.id} value={item.id} onSelect={() => { setEditEmploymentTypeId(item.id); setSelectedEtName(item.name); setEtOpen(false); }}
                                      className="flex items-center justify-between group">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <Check className={cn('h-3.5 w-3.5 shrink-0', editEmploymentTypeId === item.id ? 'opacity-100' : 'opacity-0')} />
                                        <div className="min-w-0">
                                          <span className="text-sm">{item.name}</span>
                                          <span className="text-xs text-muted-foreground ml-1">({item.code})</span>
                                          {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        {canManageRefData && (<>
                                          <button type="button" onClick={(e) => { e.stopPropagation(); setEditRefItem(item); setCreateRefCategory('employment-types'); setEtOpen(false); }}
                                            className="p-1 hover:bg-muted rounded" title="Edit"><Pencil className="h-3 w-3 text-muted-foreground" /></button>
                                          <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteRefItem({ item, category: 'employment-types' }); setEtOpen(false); }}
                                            className="p-1 hover:bg-destructive/10 rounded" title="Delete"><Trash2 className="h-3 w-3 text-destructive" /></button>
                                        </>)}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {canManageRefData && (<p className="text-xs text-muted-foreground">Can&apos;t find what you need?{' '}<button type="button" onClick={() => { setEditRefItem(null); setCreateRefCategory('employment-types'); }} className="text-primary hover:underline font-medium">Create new</button></p>)}
                    </div>
                    {/* Clearance Level */}
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1 text-sm">
                        <Shield className="h-3 w-3" /> Clearance Level
                      </Label>
                      <Popover open={clOpen} onOpenChange={setClOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between font-normal h-9 text-sm" type="button" disabled={savingProfile}>
                            {selectedClName || <span className="text-muted-foreground">Search clearance level...</span>}
                            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput placeholder="Search by name or code..." value={clSearchQ} onValueChange={setClSearchQ} />
                            <CommandList>
                              {clLoading ? (
                                <div className="flex items-center justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /><span className="ml-2 text-sm text-muted-foreground">Searching...</span></div>
                              ) : clSearchQ.length < 1 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">Type to search...</div>
                              ) : clearanceLevels.length === 0 ? (
                                <CommandEmpty>No results found.</CommandEmpty>
                              ) : (
                                <CommandGroup>
                                  {editClearanceLevelId && (
                                    <CommandItem value="__clear__" onSelect={() => { setEditClearanceLevelId(undefined); setSelectedClName(''); setClOpen(false); }}>
                                      <X className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> Clear selection
                                    </CommandItem>
                                  )}
                                  {clearanceLevels.map(item => (
                                    <CommandItem key={item.id} value={item.id} onSelect={() => { setEditClearanceLevelId(item.id); setSelectedClName(item.name); setClOpen(false); }}
                                      className="flex items-center justify-between group">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <Check className={cn('h-3.5 w-3.5 shrink-0', editClearanceLevelId === item.id ? 'opacity-100' : 'opacity-0')} />
                                        {item.color && <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />}
                                        <div className="min-w-0">
                                          <span className="text-sm">{item.name}</span>
                                          <span className="text-xs text-muted-foreground ml-1">({item.code})</span>
                                          {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        {canManageRefData && (<>
                                          <button type="button" onClick={(e) => { e.stopPropagation(); setEditRefItem(item); setCreateRefCategory('clearance-levels'); setClOpen(false); }}
                                            className="p-1 hover:bg-muted rounded" title="Edit"><Pencil className="h-3 w-3 text-muted-foreground" /></button>
                                          <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteRefItem({ item, category: 'clearance-levels' }); setClOpen(false); }}
                                            className="p-1 hover:bg-destructive/10 rounded" title="Delete"><Trash2 className="h-3 w-3 text-destructive" /></button>
                                        </>)}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {canManageRefData && (<p className="text-xs text-muted-foreground">Can&apos;t find what you need?{' '}<button type="button" onClick={() => { setEditRefItem(null); setCreateRefCategory('clearance-levels'); }} className="text-primary hover:underline font-medium">Create new</button></p>)}
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={savingProfile} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Roles</CardTitle>
                  <CardDescription>Manage roles assigned to this user</CardDescription>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => setIsRolesModalOpen(true)}
                      disabled={!canAssignRole}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Assign Roles
                    </Button>
                  </TooltipTrigger>
                  {!canAssignRole && (
                    <TooltipContent>
                      <p>You don't have permission to assign roles</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userRoles && userRoles.length > 0 ? (
                  <div className="space-y-2">
                    {userRoles.map(role => (
                      <div key={role} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <span className="font-medium">{role}</span>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => canAssignRole && handleRemoveRole(role)}
                              disabled={!canAssignRole}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          {!canAssignRole && (
                            <TooltipContent>
                              <p>You don't have permission to remove roles</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No roles assigned to this user</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Groups</CardTitle>
                  <CardDescription>Manage groups this user belongs to</CardDescription>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => setIsGroupsModalOpen(true)}
                      disabled={!canAssignRole}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Assign Groups
                    </Button>
                  </TooltipTrigger>
                  {!canAssignRole && (
                    <TooltipContent>
                      <p>You don't have permission to assign groups</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userGroups && userGroups.length > 0 ? (
                  <div className="space-y-2">
                    {userGroups.map(group => (
                      <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <UsersIcon className="h-4 w-4 text-primary" />
                          <span className="font-medium">{group.name}</span>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => canAssignRole && handleRemoveGroup(group.id)}
                              disabled={!canAssignRole}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          {!canAssignRole && (
                            <TooltipContent>
                              <p>You don't have permission to remove groups</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No groups assigned to this user</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab - UI Shell */}
        <TabsContent value="organization">
          <div className="space-y-4">
            {/* Org Unit Memberships */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Org Unit Memberships
                    </CardTitle>
                    <CardDescription>Organizational units this user belongs to</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Org unit memberships will be displayed here</p>
                  <p className="text-xs text-muted-foreground mt-1">Shows departments, teams, and units this user is assigned to</p>
                </div>
              </CardContent>
            </Card>

            {/* Position Assignments */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Position Assignments
                    </CardTitle>
                    <CardDescription>Positions this user holds across the organization</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Position assignments will be displayed here</p>
                  <p className="text-xs text-muted-foreground mt-1">Shows seat codes, titles, FTE%, and assignment types</p>
                </div>
              </CardContent>
            </Card>

            {/* Operational Groups */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Network className="h-5 w-5" />
                      Operational Groups
                    </CardTitle>
                    <CardDescription>Project teams, committees, and task forces</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Operational group memberships will be displayed here</p>
                  <p className="text-xs text-muted-foreground mt-1">Shows group name, role, and leader information</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>View and manage user's active sessions</CardDescription>
                </div>
                {sessions.length > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleRevokeAllSessions}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Revoke All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {sessions.length > 0 ? (
                <div className="space-y-4">
                  {sessions.map((session) => {
                    const { browser, os, device } = parseUserAgent(session.userAgent || session.deviceInfo || '');
                    const isCurrentSession = session.isActive;

                    return (
                      <div key={session.id} className={`p-5 border rounded-lg ${isCurrentSession ? 'border-primary bg-primary/5' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`p-3 rounded-lg ${isCurrentSession ? 'bg-primary/10' : 'bg-muted'}`}>
                              {getDeviceIcon(device)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-base">{browser} on {os}</h4>
                                {isCurrentSession && (
                                  <Badge variant="default" className="text-xs">Current</Badge>
                                )}
                                <Badge variant="outline" className="text-xs capitalize">
                                  {device}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-muted-foreground">IP Address:</span>
                                  <p className="font-medium">{session.ipAddress || 'Unknown'}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Location:</span>
                                  <p className="font-medium">{session.location || 'Unknown'}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Created:</span>
                                  <p className="font-medium">{formatDate(session.createdAt)}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Last Active:</span>
                                  <p className="font-medium">{formatDate(session.lastAccessedAt || session.createdAt)}</p>
                                </div>
                              </div>

                              {session.userAgent && (
                                <details className="mt-3">
                                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                    View User Agent
                                  </summary>
                                  <p className="text-xs font-mono mt-2 p-2 bg-muted rounded">
                                    {session.userAgent}
                                  </p>
                                </details>
                              )}
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="ml-4"
                            onClick={() => setRevokeSessionId(session.id)}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Revoke
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <LogOut className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No active sessions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Folders Tab */}
        <TabsContent value="folders">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Folder className="h-5 w-5" />
                    User Repository
                  </CardTitle>
                  <CardDescription>
                    Browse and manage user's folders and documents
                  </CardDescription>
                </div>
                {canViewRepository && (
                  <Button
                    onClick={() => router.push(`/folders?userId=${userId}`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Repository
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!canViewRepository ? (
                <div className="text-center py-12">
                  <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">Permission Required</p>
                  <p className="text-sm text-muted-foreground">
                    You don't have permission to view user repositories. The folder:read permission is required.
                  </p>
                </div>
              ) : (
                <RepositoryBrowser userId={userId} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                Recent user activity and audit trail ({activityTotal} total events)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityLogs.length > 0 ? (
                <div className="space-y-4">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="p-2 bg-muted rounded-lg mt-1">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{log.action}</span>
                          <Badge variant="outline" className="text-xs">
                            {log.entityType}
                          </Badge>
                        </div>
                        {log.details && (
                          <p className="text-sm text-muted-foreground mt-1">{log.details}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{formatDate(log.timestamp)}</span>
                          {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                          {log.entityId && <span>Entity: {log.entityId}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {activityTotal > 20 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        Showing 20 of {activityTotal} activity logs
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No recent activity</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    No audit logs found for this user
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete user "${user.displayName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        loading={false}
        itemName={user.displayName}
        itemType="user"
      />

      {/* Password Reset Modal */}
      <div
        className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${isResetPasswordModalOpen ? '' : 'hidden'
          }`}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              {tempPassword ? 'Password reset successful!' : `Reset password for ${user.displayName}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tempPassword ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Temporary Password:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-background rounded font-mono text-sm">
                      {tempPassword}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(tempPassword)}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Please provide this temporary password to the user. They will be required to change
                  it on their next login.
                </p>
              </div>
            ) : (
              <p>Are you sure you want to reset the password for "{user.displayName}"?</p>
            )}
          </CardContent>
          <div className="flex justify-end gap-2 p-6 pt-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsResetPasswordModalOpen(false);
                setTempPassword(null);
              }}
            >
              {tempPassword ? 'Close' : 'Cancel'}
            </Button>
            {!tempPassword && (
              <Button onClick={handleResetPassword}>
                Reset Password
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Revoke Session Modal */}
      {revokeSessionId && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setRevokeSessionId(null)}
          onConfirm={() => handleRevokeSession(revokeSessionId)}
          title="Revoke Session"
          message="Are you sure you want to revoke this session? The user will be logged out from this device."
          confirmText="Revoke"
          cancelText="Cancel"
          variant="destructive"
          loading={false}
        />
      )}

      {/* Role Assignment Modal */}
      <AssignUserRolesModal
        isOpen={isRolesModalOpen}
        onClose={() => setIsRolesModalOpen(false)}
        onSubmit={handleAssignRoles}
        userId={userId}
        userName={user.displayName}
        currentRoles={userRoles}
      />

      {/* Group Assignment Modal */}
      <AssignUserGroupsModal
        isOpen={isGroupsModalOpen}
        onClose={() => setIsGroupsModalOpen(false)}
        onSubmit={handleAssignGroups}
        userId={userId}
        userName={user.displayName}
        currentGroups={userGroups.map(g => g.id)}
      />

      {/* Image Crop Dialog */}
      {imageToCrop && (
        <ImageCropDialog
          isOpen={cropDialogOpen}
          onClose={handleCropCancel}
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Create/Edit Reference Data Modal */}
      <CreateReferenceDataModal
        isOpen={!!createRefCategory}
        category={createRefCategory || 'job-families'}
        editItem={editRefItem}
        onClose={() => { setCreateRefCategory(null); setEditRefItem(null); }}
        onCreated={(item) => {
          const isEditing = !!editRefItem;
          if (createRefCategory === 'job-families') {
            setEditJobFamilyId(item.id); setSelectedJfName(item.name);
            setJobFamilies(prev => isEditing ? prev.map(i => i.id === item.id ? item : i) : [...prev, item]);
          } else if (createRefCategory === 'employment-types') {
            setEditEmploymentTypeId(item.id); setSelectedEtName(item.name);
            setEmploymentTypes(prev => isEditing ? prev.map(i => i.id === item.id ? item : i) : [...prev, item]);
          } else if (createRefCategory === 'clearance-levels') {
            setEditClearanceLevelId(item.id); setSelectedClName(item.name);
            setClearanceLevels(prev => isEditing ? prev.map(i => i.id === item.id ? item : i) : [...prev, item]);
          } else if (createRefCategory === 'cost-centers') {
            setEditCostCenterId(item.id); setEditCostCenterName(item.name);
            setCostCenters(prev => isEditing ? prev.map(i => i.id === item.id ? item : i) : [...prev, item]);
          }
          addNotification({
            type: 'success',
            title: isEditing ? 'Updated' : 'Created',
            message: `${item.name} ${isEditing ? 'updated' : 'created'} successfully`,
          });
        }}
      />

      {/* Delete Reference Data Confirmation */}
      {deleteRefItem && (
        <ConfirmationModal
          isOpen={!!deleteRefItem}
          onClose={() => setDeleteRefItem(null)}
          onConfirm={handleDeleteRefData}
          title={`Delete ${deleteRefItem.item.name}?`}
          message={`Are you sure you want to delete "${deleteRefItem.item.name}" (${deleteRefItem.item.code})? This action cannot be undone.`}
          variant="destructive"
        />
      )}
    </div>
  );
}
