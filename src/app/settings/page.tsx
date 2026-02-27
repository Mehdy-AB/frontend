'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/contexts/NotificationContext';
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
  Shield,
  Briefcase,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { profileService, type UpdateProfileRequest, type ChangePasswordRequest } from '@/api/services/profileService';
import { ImageCropDialog } from '@/components/ui/image-crop-dialog';

// --- Password strength calculator ---
function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  if (!password) return { level: 0, label: '', color: '' };

  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);
  const len = password.length;

  if (len >= 10 && hasLetters && hasNumbers && hasSymbols) {
    return { level: 4, label: 'Very Strong', color: 'bg-emerald-500' };
  }
  if (len >= 8 && hasLetters && hasNumbers) {
    return { level: 3, label: 'Strong', color: 'bg-blue-500' };
  }
  if (len >= 6 && hasLetters) {
    return { level: 2, label: 'Fair', color: 'bg-amber-500' };
  }
  return { level: 1, label: 'Weak', color: 'bg-red-500' };
}

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const { addNotification } = useNotification();
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
  const [profileSaved, setProfileSaved] = useState(false);
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
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  // Avatar hover
  const [avatarHovered, setAvatarHovered] = useState(false);

  // Password strength
  const passwordStrength = useMemo(() => getPasswordStrength(passwords.newPassword), [passwords.newPassword]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!session) {
      router.push('/auth/login');
    }
  }, [session, router]);

  // Load profile once on mount (not on every session update)
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (session && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadProfile();
    }
  }, [session]);

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
      addNotification({ type: 'error', title: 'Error', message: 'Failed to load profile information' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setProfileSaving(true);
      setProfileSaved(false);

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

      // Refresh session in background (no await — avoids re-render/loading flash)
      updateSession();

      setProfileSaving(false);
      setProfileSaved(true);
      addNotification({ type: 'success', title: 'Profile Updated', message: 'Your settings have been saved successfully.' });
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      addNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to update profile' });
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords
    if (passwords.newPassword !== passwords.confirmPassword) {
      addNotification({ type: 'error', title: 'Validation Error', message: 'New password and confirmation do not match' });
      return;
    }

    if (passwords.newPassword.length < 8) {
      addNotification({ type: 'error', title: 'Validation Error', message: 'Password must be at least 8 characters long' });
      return;
    }

    try {
      setPasswordSaving(true);
      setPasswordSaved(false);

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

      setPasswordSaving(false);
      setPasswordSaved(true);
      addNotification({ type: 'success', title: 'Password Changed', message: 'Your password has been updated successfully.' });
      setTimeout(() => setPasswordSaved(false), 2000);
    } catch (error: any) {
      console.error('Failed to change password:', error);
      addNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to change password' });
      setPasswordSaving(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      addNotification({ type: 'error', title: 'Invalid File', message: 'Please select an image file' });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      addNotification({ type: 'error', title: 'File Too Large', message: 'Image size must be less than 5MB' });
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


      const updatedProfile = await profileService.uploadProfilePhoto(croppedFile);
      setProfilePhotoUrl(updatedProfile.profilePhotoUrl || null);

      // Refresh session in background
      updateSession();

      addNotification({ type: 'success', title: 'Photo Updated', message: 'Your profile photo has been updated.' });
    } catch (error: any) {
      console.error('Failed to upload photo:', error);
      addNotification({ type: 'error', title: 'Upload Failed', message: error.response?.data?.message || 'Failed to upload photo' });
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

      await profileService.deleteProfilePhoto();
      setProfilePhotoUrl(null);

      // Refresh session in background
      updateSession();

      addNotification({ type: 'success', title: 'Photo Removed', message: 'Your profile photo has been deleted.' });
    } catch (error: any) {
      console.error('Failed to delete photo:', error);
      addNotification({ type: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to delete photo' });
    } finally {
      setPhotoUploading(false);
    }
  };



  const getInitials = () => {
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    return profile.displayName.substring(0, 2).toUpperCase();
  };

  // --- Premium input class helper (uses theme tokens, not raw grays) ---
  const inputClass =
    'rounded-xl border-border/70 bg-white dark:bg-muted/40 ' +
    'focus:bg-white dark:focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary/30 ' +
    'focus:shadow-sm transition-all duration-150 placeholder:text-muted-foreground/40 text-foreground';

  // Only show full-page spinner on first load (no profile data yet).
  // On remounts after save, profile data is already in state — skip the spinner.
  if (profileLoading && !profile.displayName) {
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
    <div className="container mx-auto py-10 px-4 max-w-4xl settings-page-enter">
      <div className="space-y-10">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Account Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your profile, preferences, and security settings.
          </p>
        </div>



        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/50 dark:bg-muted/30 p-1 border border-border/40">
            <TabsTrigger
              value="profile"
              className="gap-2 rounded-lg data-[state=active]:bg-card dark:data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all duration-150 text-sm font-medium"
            >
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="gap-2 rounded-lg data-[state=active]:bg-card dark:data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all duration-150 text-sm font-medium"
            >
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* ============ PROFILE TAB ============ */}
          <TabsContent value="profile" className="space-y-6 settings-section-enter">

            {/* --- Profile Photo Card --- */}
            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-150 border-border/50 overflow-hidden">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
                  <Camera className="h-5 w-5 text-primary/80" />
                  Profile Photo
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Your avatar is visible across the system. Upload a JPEG, PNG, GIF, or WebP (max 5MB).
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <div className="flex items-center gap-6">
                  {/* Avatar with hover overlay */}
                  <div
                    className="relative cursor-pointer group"
                    onMouseEnter={() => setAvatarHovered(true)}
                    onMouseLeave={() => setAvatarHovered(false)}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Avatar className="h-24 w-24 ring-4 ring-primary/10 dark:ring-primary/20 transition-all duration-150">
                      {profilePhotoUrl ? (
                        <AvatarImage src={profilePhotoUrl} alt={profile.displayName} />
                      ) : null}
                      <AvatarFallback className="text-2xl font-semibold bg-primary/5 text-primary dark:bg-primary/10">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Hover overlay */}
                    <div className={`absolute inset-0 rounded-full bg-black/40 flex items-center justify-center transition-opacity duration-150 ${avatarHovered ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="text-white text-xs font-medium flex flex-col items-center gap-0.5">
                        <Camera className="h-4 w-4" />
                        Change
                      </div>
                    </div>
                  </div>

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
                      className="gap-2 rounded-xl border-border/70 hover:bg-muted/50 transition-all duration-150 hover:-translate-y-0.5"
                    >
                      <Upload className="h-4 w-4" />
                      {photoUploading ? 'Uploading...' : 'Upload Photo'}
                    </Button>
                    {profilePhotoUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePhotoDelete}
                        disabled={photoUploading}
                        className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all duration-150"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* --- Profile Information Card --- */}
            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-150 border-border/50 overflow-hidden">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
                  <User className="h-5 w-5 text-primary/80" />
                  Profile Information
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Manage how your name and email appear across the system.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <form onSubmit={handleProfileSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2.5">
                      <Label htmlFor="firstName" className="text-sm font-medium text-foreground/70">
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={profile.firstName}
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        placeholder="John"
                        className={inputClass}
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label htmlFor="lastName" className="text-sm font-medium text-foreground/70">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        placeholder="Doe"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="displayName" className="text-sm font-medium text-foreground/70">
                      Display Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="displayName"
                      value={profile.displayName}
                      onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                      placeholder="John Doe"
                      required
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground/70">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        placeholder="john.doe@example.com"
                        required
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="jobTitle" className="text-sm font-medium text-foreground/70">
                      Job Title
                    </Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input
                        id="jobTitle"
                        value={profile.jobTitle}
                        onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
                        placeholder="Software Engineer"
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>

                  <Separator className="my-2" />

                  <div className="flex justify-end gap-3 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={loadProfile}
                      disabled={profileSaving}
                      className="rounded-xl text-muted-foreground hover:bg-muted/60 transition-all duration-150"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={profileSaving}
                      className="rounded-xl shadow-sm hover:shadow-md active:scale-[0.97] transition-all duration-150 gap-2 min-w-[140px]"
                    >
                      {profileSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : profileSaved ? (
                        <>
                          <Check className="h-4 w-4" />
                          Saved!
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ SECURITY TAB ============ */}
          <TabsContent value="security" className="space-y-6 settings-section-enter">
            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-150 border-border/50 overflow-hidden">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
                  <Lock className="h-5 w-5 text-primary/80" />
                  Change Password
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Update your password and secure your account access.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  {/* Current Password */}
                  <div className="space-y-2.5">
                    <Label htmlFor="currentPassword" className="text-sm font-medium text-foreground/70">
                      Current Password <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                        placeholder="Enter current password"
                        required
                        className={`${inputClass} pr-11`}
                      />
                      <button
                        type="button"
                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-150"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        tabIndex={-1}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Separator className="my-1" />

                  {/* New Password */}
                  <div className="space-y-2.5">
                    <Label htmlFor="newPassword" className="text-sm font-medium text-foreground/70">
                      New Password <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                        placeholder="Enter new password"
                        required
                        minLength={8}
                        className={`${inputClass} pr-11`}
                      />
                      <button
                        type="button"
                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-150"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {passwords.newPassword && (
                      <div className="space-y-1.5 pt-1 settings-section-enter">
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength.level
                                ? passwordStrength.color
                                : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs font-medium ${passwordStrength.level <= 1 ? 'text-red-500' :
                          passwordStrength.level === 2 ? 'text-amber-500' :
                            passwordStrength.level === 3 ? 'text-blue-500' :
                              'text-emerald-500'
                          }`}>
                          {passwordStrength.label}
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground/70">
                      Use 8+ characters with a mix of letters, numbers, and symbols for best security.
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2.5">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground/70">
                      Confirm New Password <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                        required
                        className={`${inputClass} pr-11 ${passwords.confirmPassword && passwords.confirmPassword !== passwords.newPassword
                          ? 'ring-2 ring-red-400/50 border-transparent'
                          : ''
                          }`}
                      />
                      <button
                        type="button"
                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-150"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwords.confirmPassword && passwords.confirmPassword !== passwords.newPassword && (
                      <p className="text-xs text-red-500 settings-section-enter">Passwords do not match.</p>
                    )}
                  </div>

                  <Separator className="my-2" />

                  <div className="flex justify-end gap-3 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                      disabled={passwordSaving}
                      className="rounded-xl text-muted-foreground hover:bg-muted/60 transition-all duration-150"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={passwordSaving}
                      className="rounded-xl shadow-sm hover:shadow-md active:scale-[0.97] transition-all duration-150 gap-2 min-w-[160px]"
                    >
                      {passwordSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Changing...
                        </>
                      ) : passwordSaved ? (
                        <>
                          <Check className="h-4 w-4" />
                          Changed!
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          Change Password
                        </>
                      )}
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
