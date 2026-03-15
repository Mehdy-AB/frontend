'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, User, Mail, Briefcase, Lock, Eye, EyeOff, Shield, AlertCircle,
  CheckCircle, Hash, DollarSign, CalendarIcon, Check, ChevronsUpDown,
  Pencil, Trash2, UserCheck, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { organizationService, ReferenceDataItem, ReferenceDataCategory } from '@/api/services/organizationService';
import { userManagementService } from '@/api/services/userManagementService';
import CreateReferenceDataModal from '@/components/modals/CreateReferenceDataModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import { useNotification } from '@/contexts/NotificationContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Permissions } from '@/constants/permissions';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserData) => Promise<void>;
  loading?: boolean;
}

export interface CreateUserData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  password: string;
  jobTitle?: string;
  imageUrl?: string;
  employeeNumber?: string;
  costCenterId?: string;
  hireDate?: string;
  jobFamilyId?: string;
  employmentTypeId?: string;
  clearanceLevelId?: string;
  managerId?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function CreateUserModal({ isOpen, onClose, onSubmit, loading = false }: CreateUserModalProps) {
  const { addNotification } = useNotification();
  const { hasPermission } = usePermissions();
  const canManageRefData = hasPermission(Permissions.ORG_MANAGE_REFERENCE_DATA);
  const canAssignManager = hasPermission(Permissions.ORG_ASSIGN_MANAGER);
  const [formData, setFormData] = useState<CreateUserData>({
    username: '', email: '', firstName: '', lastName: '', displayName: '', password: '', jobTitle: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Server-side search state for each ref data category
  const [jfSearch, setJfSearch] = useState('');
  const [etSearch, setEtSearch] = useState('');
  const [clSearch, setClSearch] = useState('');
  const [ccSearch, setCcSearch] = useState('');
  const debouncedJf = useDebounce(jfSearch, 300);
  const debouncedEt = useDebounce(etSearch, 300);
  const debouncedCl = useDebounce(clSearch, 300);
  const debouncedCc = useDebounce(ccSearch, 300);

  // Results from server
  const [jobFamilies, setJobFamilies] = useState<ReferenceDataItem[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<ReferenceDataItem[]>([]);
  const [clearanceLevels, setClearanceLevels] = useState<ReferenceDataItem[]>([]);
  const [costCenters, setCostCenters] = useState<ReferenceDataItem[]>([]);
  const [jfLoading, setJfLoading] = useState(false);
  const [etLoading, setEtLoading] = useState(false);
  const [clLoading, setClLoading] = useState(false);
  const [ccLoading, setCcLoading] = useState(false);

  // Selected display names (to show in trigger button)
  const [selectedJfName, setSelectedJfName] = useState('');
  const [selectedEtName, setSelectedEtName] = useState('');
  const [selectedClName, setSelectedClName] = useState('');
  const [selectedCcName, setSelectedCcName] = useState('');

  // Popover open state
  const [jfOpen, setJfOpen] = useState(false);
  const [etOpen, setEtOpen] = useState(false);
  const [clOpen, setClOpen] = useState(false);
  const [ccOpen, setCcOpen] = useState(false);

  // Create/Edit modal
  const [createCategory, setCreateCategory] = useState<ReferenceDataCategory | null>(null);
  const [editItem, setEditItem] = useState<ReferenceDataItem | null>(null);

  // Delete confirmation
  const [deleteItem, setDeleteItem] = useState<{ item: ReferenceDataItem; category: ReferenceDataCategory } | null>(null);

  // Manager picker
  const [managerSearch, setManagerSearch] = useState('');
  const [managerResults, setManagerResults] = useState<any[]>([]);
  const [managerOpen, setManagerOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<any>(null);
  const [managerLoading, setManagerLoading] = useState(false);
  const debouncedMgrSearch = useDebounce(managerSearch, 300);

  // Server-side search effects
  useEffect(() => {
    if (debouncedJf.length >= 1) {
      setJfLoading(true);
      organizationService.searchReferenceData('job-families', debouncedJf)
        .then(setJobFamilies).catch(() => { }).finally(() => setJfLoading(false));
    } else {
      setJobFamilies([]);
    }
  }, [debouncedJf]);

  useEffect(() => {
    if (debouncedEt.length >= 1) {
      setEtLoading(true);
      organizationService.searchReferenceData('employment-types', debouncedEt)
        .then(setEmploymentTypes).catch(() => { }).finally(() => setEtLoading(false));
    } else {
      setEmploymentTypes([]);
    }
  }, [debouncedEt]);

  useEffect(() => {
    if (debouncedCl.length >= 1) {
      setClLoading(true);
      organizationService.searchReferenceData('clearance-levels', debouncedCl)
        .then(setClearanceLevels).catch(() => { }).finally(() => setClLoading(false));
    } else {
      setClearanceLevels([]);
    }
  }, [debouncedCl]);

  useEffect(() => {
    if (debouncedCc.length >= 1) {
      setCcLoading(true);
      organizationService.searchReferenceData('cost-centers', debouncedCc)
        .then(setCostCenters).catch(() => { }).finally(() => setCcLoading(false));
    } else {
      setCostCenters([]);
    }
  }, [debouncedCc]);

  // Manager search
  useEffect(() => {
    if (debouncedMgrSearch.length >= 2) {
      setManagerLoading(true);
      userManagementService.quickSearchUsers(debouncedMgrSearch)
        .then(res => setManagerResults(res || []))
        .catch(() => { })
        .finally(() => setManagerLoading(false));
    } else {
      setManagerResults([]);
    }
  }, [debouncedMgrSearch]);

  // Auto-generate display name
  useEffect(() => {
    if (formData.firstName || formData.lastName) {
      const auto = `${formData.firstName} ${formData.lastName}`.trim();
      if (auto && formData.displayName === '') {
        setFormData(prev => ({ ...prev, displayName: auto }));
      }
    }
  }, [formData.firstName, formData.lastName]);

  // Password strength
  useEffect(() => {
    const p = formData.password;
    if (!p) { setPasswordStrength(0); return; }
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^a-zA-Z0-9]/.test(p)) s++;
    setPasswordStrength(s);
  }, [formData.password]);

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return { label: 'No password', color: 'bg-gray-200' };
    if (passwordStrength <= 2) return { label: 'Weak', color: 'bg-red-500' };
    if (passwordStrength === 3) return { label: 'Medium', color: 'bg-yellow-500' };
    if (passwordStrength === 4) return { label: 'Good', color: 'bg-blue-500' };
    return { label: 'Strong', color: 'bg-green-500' };
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.displayName.trim()) newErrors.displayName = 'Display name is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await onSubmit({
        ...formData,
        managerId: selectedManager?.id || undefined,
      });
      handleClose();
    } catch { /* handled by parent */ }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ username: '', email: '', firstName: '', lastName: '', displayName: '', password: '', jobTitle: '' });
      setConfirmPassword(''); setShowPassword(false); setShowConfirmPassword(false); setErrors({});
      setSelectedJfName(''); setSelectedEtName(''); setSelectedClName(''); setSelectedCcName('');
      setJfSearch(''); setEtSearch(''); setClSearch(''); setCcSearch(''); setManagerSearch('');
      setSelectedManager(null);
      onClose();
    }
  };

  const handleDeleteRefItem = async () => {
    if (!deleteItem) return;
    try {
      await organizationService.deleteReferenceData(deleteItem.category, deleteItem.item.id);
      // Clear selection if deleted item was selected
      if (deleteItem.category === 'job-families' && formData.jobFamilyId === deleteItem.item.id) {
        setFormData(prev => ({ ...prev, jobFamilyId: undefined })); setSelectedJfName('');
      } else if (deleteItem.category === 'employment-types' && formData.employmentTypeId === deleteItem.item.id) {
        setFormData(prev => ({ ...prev, employmentTypeId: undefined })); setSelectedEtName('');
      } else if (deleteItem.category === 'clearance-levels' && formData.clearanceLevelId === deleteItem.item.id) {
        setFormData(prev => ({ ...prev, clearanceLevelId: undefined })); setSelectedClName('');
      } else if (deleteItem.category === 'cost-centers' && formData.costCenterId === deleteItem.item.id) {
        setFormData(prev => ({ ...prev, costCenterId: undefined })); setSelectedCcName('');
      }
      // Re-trigger search to refresh
      if (deleteItem.category === 'job-families') setJfSearch(prev => prev + ' ');
      else if (deleteItem.category === 'employment-types') setEtSearch(prev => prev + ' ');
      else if (deleteItem.category === 'clearance-levels') setClSearch(prev => prev + ' ');
      else if (deleteItem.category === 'cost-centers') setCcSearch(prev => prev + ' ');
      addNotification({ type: 'success', title: 'Deleted', message: `${deleteItem.item.name} deleted successfully` });
    } catch (err: any) {
      addNotification({ type: 'error', title: 'Error', message: err?.message || 'Failed to delete item' });
    }
    setDeleteItem(null);
  };

  // Shared combobox renderer
  const renderRefCombobox = (
    category: ReferenceDataCategory,
    label: string,
    icon: React.ReactNode,
    open: boolean,
    setOpen: (v: boolean) => void,
    search: string,
    setSearch: (v: string) => void,
    items: ReferenceDataItem[],
    isLoading: boolean,
    selectedId: string | undefined,
    selectedName: string,
    onSelect: (item: ReferenceDataItem) => void,
    onClear: () => void,
    required = false,
  ) => (
    <div className="space-y-1">
      <Label className="flex items-center gap-1 text-sm">
        {icon} {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between font-normal h-9 text-sm" type="button" disabled={loading}>
            {selectedName || <span className="text-muted-foreground">Search {label.toLowerCase()}...</span>}
            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder={`Search by name or code...`} value={search} onValueChange={setSearch} />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                </div>
              ) : search.length < 1 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Type to search...</div>
              ) : items.length === 0 ? (
                <CommandEmpty>No results found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {selectedId && (
                    <CommandItem value="__clear__" onSelect={() => { onClear(); setOpen(false); }}>
                      <X className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> Clear selection
                    </CommandItem>
                  )}
                  {items.map(item => (
                    <CommandItem key={item.id} value={item.id} onSelect={() => { onSelect(item); setOpen(false); }}
                      className="flex items-center justify-between group">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Check className={cn('h-3.5 w-3.5 shrink-0', selectedId === item.id ? 'opacity-100' : 'opacity-0')} />
                        {category === 'clearance-levels' && item.color && (
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        )}
                        <div className="min-w-0">
                          <span className="text-sm">{item.name}</span>
                          <span className="text-xs text-muted-foreground ml-1">({item.code})</span>
                          {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                        </div>
                      </div>
                      {canManageRefData && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button type="button" onClick={(e) => { e.stopPropagation(); setEditItem(item); setCreateCategory(category); setOpen(false); }}
                            className="p-1 hover:bg-muted rounded" title="Edit">
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteItem({ item, category }); setOpen(false); }}
                            className="p-1 hover:bg-destructive/10 rounded" title="Delete">
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </button>
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
      {canManageRefData && (
        <p className="text-xs text-muted-foreground">
          Can&apos;t find what you need?{' '}
          <button type="button" onClick={() => { setEditItem(null); setCreateCategory(category); }}
            className="text-primary hover:underline font-medium">Create new</button>
        </p>
      )}
    </div>
  );

  if (!isOpen) return null;

  const strengthInfo = getPasswordStrengthLabel();

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="bg-background rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10"><User className="h-5 w-5 text-primary" /></div>
              <div>
                <h2 className="text-lg font-semibold">Create New User</h2>
                <p className="text-sm text-muted-foreground">Fill in user details below</p>
              </div>
            </div>
            <button onClick={handleClose} disabled={loading} className="p-1.5 hover:bg-muted rounded-full transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-5">
            {/* === Account Information === */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-primary" /> Account Information
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="cuUsername" className="text-sm">Username <span className="text-red-500">*</span></Label>
                  <Input id="cuUsername" value={formData.username} onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="jdoe" disabled={loading} className="h-9" />
                  {errors.username && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.username}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cuEmail" className="text-sm">Email <span className="text-red-500">*</span></Label>
                  <Input id="cuEmail" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john.doe@company.com" disabled={loading} className="h-9" />
                  {errors.email && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.email}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="cuFirstName" className="text-sm">First Name</Label>
                  <Input id="cuFirstName" value={formData.firstName} onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John" disabled={loading} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cuLastName" className="text-sm">Last Name</Label>
                  <Input id="cuLastName" value={formData.lastName} onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Doe" disabled={loading} className="h-9" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="cuDisplayName" className="text-sm">Display Name <span className="text-red-500">*</span></Label>
                <Input id="cuDisplayName" value={formData.displayName} onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="John Doe" disabled={loading} className="h-9" />
                {errors.displayName && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.displayName}</p>}
              </div>
            </fieldset>

            <hr className="border-border" />

            {/* === Security === */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                <Lock className="h-4 w-4 text-primary" /> Security
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="cuPassword" className="text-sm">Password <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input id="cuPassword" type={showPassword ? 'text' : 'password'} value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} placeholder="••••••••" disabled={loading} className="h-9 pr-9" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.password}</p>}
                  {formData.password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">{[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= passwordStrength ? strengthInfo.color : 'bg-muted'}`} />
                      ))}</div>
                      <p className={`text-xs ${passwordStrength <= 2 ? 'text-red-500' : passwordStrength === 3 ? 'text-yellow-600' : 'text-green-600'}`}>{strengthInfo.label}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cuConfirmPassword" className="text-sm">Confirm Password <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input id="cuConfirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" disabled={loading} className="h-9 pr-9" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.confirmPassword}</p>}
                  {confirmPassword && formData.password === confirmPassword && (
                    <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Passwords match</p>
                  )}
                </div>
              </div>
            </fieldset>

            <hr className="border-border" />

            {/* === HR & Position Details === */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                <Briefcase className="h-4 w-4 text-primary" /> HR &amp; Position Details
              </legend>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="cuJobTitle" className="text-sm">Job Title</Label>
                  <Input id="cuJobTitle" value={formData.jobTitle || ''} onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                    placeholder="Software Engineer" disabled={loading} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cuEmployeeNumber" className="text-sm flex items-center gap-1">
                    <Hash className="h-3 w-3" /> Employee Number
                  </Label>
                  <Input id="cuEmployeeNumber" value={formData.employeeNumber || ''} onChange={(e) => setFormData(prev => ({ ...prev, employeeNumber: e.target.value }))}
                    placeholder="Auto-generated if empty" disabled={loading} className="h-9" />
                  <p className="text-xs text-muted-foreground">Leave blank for auto-generation</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="cuHireDate" className="text-sm flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" /> Hire Date
                  </Label>
                  <Input id="cuHireDate" type="date" value={formData.hireDate || ''} onChange={(e) => setFormData(prev => ({ ...prev, hireDate: e.target.value }))}
                    disabled={loading} className="h-9" />
                </div>
                {renderRefCombobox('cost-centers', 'Cost Center', <DollarSign className="h-3 w-3" />,
                  ccOpen, setCcOpen, ccSearch, setCcSearch, costCenters, ccLoading,
                  formData.costCenterId, selectedCcName,
                  (item) => { setFormData(prev => ({ ...prev, costCenterId: item.id })); setSelectedCcName(item.name); },
                  () => { setFormData(prev => ({ ...prev, costCenterId: undefined })); setSelectedCcName(''); }
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {renderRefCombobox('job-families', 'Job Family', <Briefcase className="h-3 w-3" />,
                  jfOpen, setJfOpen, jfSearch, setJfSearch, jobFamilies, jfLoading,
                  formData.jobFamilyId, selectedJfName,
                  (item) => { setFormData(prev => ({ ...prev, jobFamilyId: item.id })); setSelectedJfName(item.name); },
                  () => { setFormData(prev => ({ ...prev, jobFamilyId: undefined })); setSelectedJfName(''); }
                )}
                {renderRefCombobox('employment-types', 'Employment Type', <Briefcase className="h-3 w-3" />,
                  etOpen, setEtOpen, etSearch, setEtSearch, employmentTypes, etLoading,
                  formData.employmentTypeId, selectedEtName,
                  (item) => { setFormData(prev => ({ ...prev, employmentTypeId: item.id })); setSelectedEtName(item.name); },
                  () => { setFormData(prev => ({ ...prev, employmentTypeId: undefined })); setSelectedEtName(''); }
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {renderRefCombobox('clearance-levels', 'Clearance Level', <Shield className="h-3 w-3" />,
                  clOpen, setClOpen, clSearch, setClSearch, clearanceLevels, clLoading,
                  formData.clearanceLevelId, selectedClName,
                  (item) => { setFormData(prev => ({ ...prev, clearanceLevelId: item.id })); setSelectedClName(item.name); },
                  () => { setFormData(prev => ({ ...prev, clearanceLevelId: undefined })); setSelectedClName(''); }
                )}
              </div>
            </fieldset>

            <hr className="border-border" />

            {/* === Manager === */}
            {canAssignManager && (
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
                  <UserCheck className="h-4 w-4 text-primary" /> Manager
                </legend>
                <div className="space-y-1">
                  <Label className="text-sm">Direct Manager</Label>
                  {selectedManager ? (
                    <div className="flex items-center gap-3 p-2.5 border rounded-md bg-muted/30">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={selectedManager.imgUrl || selectedManager.imageUrl} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">{selectedManager.displayName?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{selectedManager.displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{selectedManager.email}</p>
                      </div>
                      <button type="button" onClick={() => setSelectedManager(null)}
                        className="p-1 hover:bg-muted rounded-full"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ) : (
                    <Popover open={managerOpen} onOpenChange={setManagerOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between font-normal h-9 text-sm" type="button" disabled={loading}>
                          <span className="text-muted-foreground">Search for a manager...</span>
                          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput placeholder="Search by name..." value={managerSearch} onValueChange={setManagerSearch} />
                          <CommandList>
                            {managerLoading ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                              </div>
                            ) : managerSearch.length < 2 ? (
                              <div className="py-6 text-center text-sm text-muted-foreground">Type at least 2 characters...</div>
                            ) : managerResults.length === 0 ? (
                              <CommandEmpty>No users found.</CommandEmpty>
                            ) : (
                              <CommandGroup>
                                {managerResults.map(u => (
                                  <CommandItem key={u.id} value={u.id} onSelect={() => { setSelectedManager(u); setManagerOpen(false); setManagerSearch(''); }}>
                                    <Avatar className="h-6 w-6 mr-2">
                                      <AvatarImage src={u.imgUrl || u.imageUrl} />
                                      <AvatarFallback className="text-xs">{u.displayName?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="text-sm">{u.displayName}</p>
                                      <p className="text-xs text-muted-foreground">{u.email}</p>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </fieldset>
            )}

            {/* Submit */}
            <div className="pt-3 border-t">
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={handleClose} disabled={loading} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creating...</div>
                  ) : (
                    <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Create User</div>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>

      {/* Create/Edit Reference Data Modal */}
      <CreateReferenceDataModal
        isOpen={!!createCategory}
        category={createCategory || 'job-families'}
        editItem={editItem}
        onClose={() => { setCreateCategory(null); setEditItem(null); }}
        onCreated={(item) => {
          const isEditing = !!editItem;
          if (createCategory === 'job-families') {
            setFormData(prev => ({ ...prev, jobFamilyId: item.id })); setSelectedJfName(item.name);
          } else if (createCategory === 'employment-types') {
            setFormData(prev => ({ ...prev, employmentTypeId: item.id })); setSelectedEtName(item.name);
          } else if (createCategory === 'clearance-levels') {
            setFormData(prev => ({ ...prev, clearanceLevelId: item.id })); setSelectedClName(item.name);
          } else if (createCategory === 'cost-centers') {
            setFormData(prev => ({ ...prev, costCenterId: item.id })); setSelectedCcName(item.name);
          }
          addNotification({
            type: 'success',
            title: isEditing ? 'Updated' : 'Created',
            message: `${item.name} ${isEditing ? 'updated' : 'created'} successfully`,
          });
        }}
      />

      {/* Delete Confirmation */}
      {deleteItem && (
        <ConfirmationModal
          isOpen={!!deleteItem}
          onClose={() => setDeleteItem(null)}
          onConfirm={handleDeleteRefItem}
          title={`Delete ${deleteItem.item.name}?`}
          message={`Are you sure you want to delete "${deleteItem.item.name}" (${deleteItem.item.code})? This action cannot be undone.`}
        />
      )}
    </>
  );
}
