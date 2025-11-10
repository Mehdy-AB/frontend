'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Lock, 
  Camera, 
  Save, 
  X, 
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Check,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { profileService, type UpdateProfileRequest, type ChangePasswordRequest } from '@/api/services/profileService';
import { ImageCropDialog } from '@/components/ui/image-crop-dialog';

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile state
  const [profile, setProfile] = useState({
    displayName: '',
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  
  // Crop dialog state
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  
  // Password state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Alert state
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Load profile on mount
  useEffect(() => {
    if (!session) {
      router.push('/auth/login');
      return;
    }
    loadProfile();
  }, [session, router]);
  
  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      const data = await profileService.getCurrentProfile();
      setProfile({
        displayName: data.displayName || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        jobTitle: data.jobTitle || '',
      });
      setProfilePhotoUrl(data.profilePhotoUrl || null);
    } catch (error) {
      console.error('Failed to load profile:', error);
      showAlert('error', 'Failed to load profile information');
    } finally {
      setProfileLoading(false);
    }
  };
  
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setProfileSaving(true);
      setAlert(null);
      
      const request: UpdateProfileRequest = {
        displayName: profile.displayName,
        firstName: profile.firstName || undefined,
        lastName: profile.lastName || undefined,
        email: profile.email,
        jobTitle: profile.jobTitle || undefined,
      };
      
      const updatedProfile = await profileService.updateProfile(request);
      setProfile({
        displayName: updatedProfile.displayName || '',
        firstName: updatedProfile.firstName || '',
        lastName: updatedProfile.lastName || '',
        email: updatedProfile.email || '',
        jobTitle: updatedProfile.jobTitle || '',
      });
      
      // Update session
      await updateSession();
      
      showAlert('success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      showAlert('error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwords.newPassword !== passwords.confirmPassword) {
      showAlert('error', 'New password and confirmation do not match');
      return;
    }
    
    if (passwords.newPassword.length < 8) {
      showAlert('error', 'Password must be at least 8 characters long');
      return;
    }
    
    try {
      setPasswordSaving(true);
      setAlert(null);
      
      const request: ChangePasswordRequest = {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
        confirmPassword: passwords.confirmPassword,
      };
      
      await profileService.changePassword(request);
      
      // Clear password fields
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      showAlert('success', 'Password changed successfully');
    } catch (error: any) {
      console.error('Failed to change password:', error);
      showAlert('error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };
  
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showAlert('error', 'Please select an image file');
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showAlert('error', 'Image size must be less than 5MB');
      return;
    }
    
    // Create object URL for cropping
    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setCropDialogOpen(true);
  };

  const handleCropComplete = async (croppedFile: File) => {
    try {
      setPhotoUploading(true);
      setAlert(null);
      
      const updatedProfile = await profileService.uploadProfilePhoto(croppedFile);
      setProfilePhotoUrl(updatedProfile.profilePhotoUrl || null);
      
      // Update session without reload
      await updateSession();
      
      showAlert('success', 'Profile photo updated successfully');
    } catch (error: any) {
      console.error('Failed to upload photo:', error);
      showAlert('error', error.response?.data?.message || 'Failed to upload photo');
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Clean up object URL
      if (imageToCrop) {
        URL.revokeObjectURL(imageToCrop);
        setImageToCrop(null);
      }
    }
  };

  const handleCropCancel = () => {
    setCropDialogOpen(false);
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
      setImageToCrop(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handlePhotoDelete = async () => {
    if (!confirm('Are you sure you want to delete your profile photo?')) {
      return;
    }
    
    try {
      setPhotoUploading(true);
      setAlert(null);
      
      await profileService.deleteProfilePhoto();
      setProfilePhotoUrl(null);
      
      // Update session
      await updateSession();
      
      showAlert('success', 'Profile photo deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete photo:', error);
      showAlert('error', error.response?.data?.message || 'Failed to delete photo');
    } finally {
      setPhotoUploading(false);
    }
  };
  
  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };
  
  const getInitials = () => {
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    return profile.displayName.substring(0, 2).toUpperCase();
  };
  
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and profile</p>
        </div>
        
        {/* Alert */}
        {alert && (
          <Alert variant={alert.type === 'error' ? 'destructive' : 'default'}>
            {alert.type === 'success' ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Profile Photo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Profile Photo
                </CardTitle>
                <CardDescription>
                  Update your profile photo (JPEG, PNG, GIF, or WebP, max 5MB)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    {profilePhotoUrl ? (
                      <AvatarImage src={profilePhotoUrl} alt={profile.displayName} />
                    ) : null}
                    <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoSelect}
                      disabled={photoUploading}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photoUploading}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {photoUploading ? 'Uploading...' : 'Upload Photo'}
                    </Button>
                    {profilePhotoUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePhotoDelete}
                        disabled={photoUploading}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Photo
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profile.firstName}
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        placeholder="John"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name *</Label>
                    <Input
                      id="displayName"
                      value={profile.displayName}
                      onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      placeholder="john.doe@example.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      value={profile.jobTitle}
                      onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
                      placeholder="Software Engineer"
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={loadProfile}
                      disabled={profileSaving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button type="submit" disabled={profileSaving}>
                      <Save className="h-4 w-4 mr-2" />
                      {profileSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password *</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                        placeholder="Enter current password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password *</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                        placeholder="Enter new password (min 8 characters)"
                        required
                        minLength={8}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                      disabled={passwordSaving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button type="submit" disabled={passwordSaving}>
                      <Lock className="h-4 w-4 mr-2" />
                      {passwordSaving ? 'Changing...' : 'Change Password'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

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

