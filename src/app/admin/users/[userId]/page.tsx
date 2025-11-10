'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
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
  Trash2,
  Monitor,
  Smartphone,
  Tablet,
  Plus,
  X,
  Camera,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { notificationApiClient } from '@/api/notificationClient';
import { roleManagementService } from '@/api/services/roleManagementService';
import { apiClient } from '@/api/client';
import { auditLogService, AuditLog } from '@/api/services/auditLogService';
import { adminUserService } from '@/api/services/adminUserService';
import { UserDto, RoleDto, GroupDto } from '@/types/api';
import { formatDate } from '@/lib/dateFormatter';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import AssignUserRolesModal from '@/components/modals/AssignUserRolesModal';
import AssignUserGroupsModal from '@/components/modals/AssignUserGroupsModal';
import { usePermissions } from '@/hooks/usePermissions';
import { Permissions } from '@/constants/permissions';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useNotification } from '@/contexts/NotificationContext';
import { ImageCropDialog } from '@/components/ui/image-crop-dialog';

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
  const { addNotification } = useNotification();

  const [user, setUser] = useState<UserDto | null>(null);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [repository, setRepository] = useState<UserRepository | null>(null);
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);
  const [activityTotal, setActivityTotal] = useState(0);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Permission checks
  const canViewUser = hasPermission(Permissions.USER_READ);
  const canUpdateUser = hasPermission(Permissions.USER_UPDATE);
  const canDeleteUser = hasPermission(Permissions.USER_DELETE);
  const canAssignRole = hasPermission(Permissions.USER_ASSIGN_ROLE);
  const canViewRepository = hasPermission(Permissions.FOLDER_READ);
  
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
  
  // Crop dialog state
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

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
        <TabsList className="grid w-full grid-cols-7">
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
          <TabsTrigger value="roles" disabled={!canAssignRole}>
            <Shield className="h-4 w-4 mr-2" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="groups" disabled={!canAssignRole}>
            <UsersIcon className="h-4 w-4 mr-2" />
            Groups
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <LogOut className="h-4 w-4 mr-2" />
            Sessions
          </TabsTrigger>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <TabsTrigger 
                  value="documents" 
                  disabled={!canViewRepository}
                  className={!canViewRepository ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Documents
                </TabsTrigger>
              </div>
            </TooltipTrigger>
            {!canViewRepository && (
              <TooltipContent>
                <p>You don't have permission to view user repositories (folder:read required)</p>
              </TooltipContent>
            )}
          </Tooltip>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
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
                      <div key={group} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <UsersIcon className="h-4 w-4 text-primary" />
                          <span className="font-medium">{group}</span>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => canAssignRole && handleRemoveGroup(group)}
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

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Repository</CardTitle>
                  <CardDescription>
                    Access user's document repository and folders
                  </CardDescription>
                </div>
                {repository && canViewRepository && (
                  <Button
                    onClick={() => window.open(`/folders/${repository.rootFolderId}`, '_blank')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Open Repository
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!canViewRepository ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">Permission Required</p>
                  <p className="text-sm text-muted-foreground">
                    You don't have permission to view user repositories. The folder:read permission is required.
                  </p>
                </div>
              ) : repository ? (
                <div className="space-y-6">
                  {/* Repository Card */}
                  <div 
                    className={`p-6 border-2 border-primary/20 rounded-lg transition-colors bg-gradient-to-br from-primary/5 to-transparent ${
                      canViewRepository ? 'hover:border-primary/40 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                    }`}
                    onClick={() => canViewRepository && window.open(`/folders/${repository.rootFolderId}`, '_blank')}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-primary/10 rounded-xl">
                        <FileText className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-1">{repository.folderName}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          User's root repository folder
                        </p>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-muted rounded">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-lg font-semibold">{repository.documentCount}</p>
                              <p className="text-xs text-muted-foreground">Documents</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-muted rounded">
                              <UsersIcon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-lg font-semibold">{repository.folderCount}</p>
                              <p className="text-xs text-muted-foreground">Subfolders</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/folders/${repository.rootFolderId}`, '_blank');
                          }}
                        >
                          Open in New Tab
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/folders/${repository.rootFolderId}`);
                          }}
                        >
                          Open Here
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> Click the repository card or use the buttons to browse this user's files and folders. 
                      Opening in a new tab allows you to explore the repository without leaving this page.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">No Repository Found</p>
                  <p className="text-sm text-muted-foreground">
                    This user doesn't have a repository set up yet
                  </p>
                </div>
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
        className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${
          isResetPasswordModalOpen ? '' : 'hidden'
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
        currentGroups={userGroups}
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
    </div>
  );
}
