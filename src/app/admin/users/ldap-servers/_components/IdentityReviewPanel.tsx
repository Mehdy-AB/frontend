'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useNotifications } from '@/hooks/useNotifications';
import {
  UserX,
  Users,
  AlertTriangle,
  XCircle,
  Link2,
  UserCog,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { ldapServerService } from '@/api/services/ldapServerService';

interface IdentityReviewPanelProps {
  serverId: string;
}

type Category = 'orphans' | 'managers' | 'errors';

export default function IdentityReviewPanel({ serverId }: IdentityReviewPanelProps) {
  const { showSuccess, showError } = useNotifications();
  const [activeTab, setActiveTab] = useState<Category>('orphans');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [relinkId, setRelinkId] = useState('');

  // Search state bound to the active tab
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Totals for the badges
  const [totals, setTotals] = useState({ orphans: 0, managers: 0, errors: 0 });

  // Data for each category (only the active one is populated)
  const [orphanedUsers, setOrphanedUsers] = useState<any[]>([]);
  const [unresolvedManagers, setUnresolvedManagers] = useState<any[]>([]);
  const [syncErrorUsers, setSyncErrorUsers] = useState<any[]>([]);

  const PAGE_SIZE = 15;

  const fetchReview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ldapServerService.getIdentityReview(serverId, activeTab, {
        page,
        size: PAGE_SIZE,
        search: debouncedSearch || undefined,
      });
      // Always update totals
      setTotals({
        orphans: res.totalOrphans ?? 0,
        managers: res.totalUnresolvedManagers ?? 0,
        errors: res.totalSyncErrors ?? 0,
      });
      setTotalPages(res.totalPages ?? 0);

      // Update the active category data
      if (activeTab === 'orphans') setOrphanedUsers(res.data ?? []);
      if (activeTab === 'managers') setUnresolvedManagers(res.data ?? []);
      if (activeTab === 'errors') setSyncErrorUsers(res.data ?? []);
    } catch {
      showError('Failed to load identity review data');
    } finally {
      setLoading(false);
    }
  }, [serverId, activeTab, page, debouncedSearch]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  // Reset page and search when switching tabs
  const switchTab = (tab: Category) => {
    setPage(0);
    setSearch('');
    setDebouncedSearch('');
    setActiveTab(tab);
  };

  const handleRelink = async (userId: string) => {
    if (!relinkId.trim()) {
      showError('Please enter a new external ID');
      return;
    }
    try {
      await ldapServerService.relinkOrphan(serverId, userId, relinkId.trim());
      showSuccess('User re-linked successfully');
      setRelinkId('');
      fetchReview();
    } catch {
      showError('Failed to relink user');
    }
  };

  const handleConvertLocal = async (userId: string) => {
    try {
      await ldapServerService.convertToLocal(serverId, userId);
      showSuccess('User converted to local account');
      fetchReview();
    } catch {
      showError('Failed to convert user');
    }
  };

  const tabs = [
    {
      id: 'orphans' as const,
      label: 'Orphaned',
      icon: UserX,
      count: totals.orphans,
      color: 'text-amber-600',
      activeBg: 'bg-amber-50 border-amber-200',
      activeText: 'text-amber-700',
    },
    {
      id: 'managers' as const,
      label: 'Unresolved Mgrs',
      icon: Users,
      count: totals.managers,
      color: 'text-blue-600',
      activeBg: 'bg-blue-50 border-blue-200',
      activeText: 'text-blue-700',
    },
    {
      id: 'errors' as const,
      label: 'Sync Errors',
      icon: XCircle,
      count: totals.errors,
      color: 'text-red-600',
      activeBg: 'bg-red-50 border-red-200',
      activeText: 'text-red-700',
    },
  ];

  // Pagination controls
  const PaginationBar = () => {
    if (totalPages <= 1) return null;
    const currentTotal =
      activeTab === 'orphans' ? totals.orphans :
      activeTab === 'managers' ? totals.managers :
      totals.errors;

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Page {page + 1} of {totalPages} · {currentTotal.toLocaleString()} total
        </p>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 rounded-lg"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0 || loading}
          >
            <ChevronLeft className="h-3 w-3" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 rounded-lg"
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1 || loading}
          >
            Next <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 rounded-xl border-gray-200 text-sm"
          />
        </div>
        <Button variant="outline" size="sm" onClick={fetchReview} className="h-9 px-3 gap-1.5 text-xs text-gray-600 rounded-xl shadow-sm">
          <RefreshCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Pill-styled Tab Navigation */}
      <div className="flex flex-wrap bg-gray-100/70 p-1.5 rounded-[1.25rem] border border-gray-200/60 shadow-inner max-w-fit w-full sm:w-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50 ring-1 ring-black/5'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? tab.color : 'text-gray-400'}`} />
            {tab.label}
            <Badge variant="secondary" className={`${activeTab === tab.id ? tab.activeBg + ' ' + tab.activeText : 'bg-gray-200/50 text-gray-500'} ml-1.5 rounded-full px-2 py-0.5 text-[11px]`}>
              {tab.count.toLocaleString()}
            </Badge>
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Tab content */}
      {!loading && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {activeTab === 'orphans' && (
            <>
              {orphanedUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-14 w-14 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center mb-3">
                    <UserX className="h-7 w-7 text-amber-500" />
                  </div>
                  <p className="text-sm text-gray-500">No orphaned users</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80 border-b border-gray-200">
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Display Name</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">External ID</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Sync</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orphanedUsers.map((user) => (
                        <TableRow key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <TableCell className="font-mono text-xs text-gray-700">{user.username}</TableCell>
                          <TableCell className="text-sm text-gray-900">{user.displayName}</TableCell>
                          <TableCell className="font-mono text-xs text-gray-400 max-w-[140px] truncate">
                            {user.externalImmutableId || '—'}
                          </TableCell>
                          <TableCell className="text-xs text-gray-400">
                            {user.lastLdapSync ? new Date(user.lastLdapSync).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 rounded-lg">
                                    <Link2 className="h-3 w-3" /> Relink
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Relink User: {user.username}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Enter the new external immutable ID (e.g. objectGUID) to re-link this user.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <Input
                                    placeholder="New external ID"
                                    value={relinkId}
                                    onChange={(e) => setRelinkId(e.target.value)}
                                  />
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRelink(user.id)}>
                                      Relink
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-amber-600 rounded-lg">
                                    <UserCog className="h-3 w-3" /> Local
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Convert to Local Account</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently break the LDAP link for <strong>{user.username}</strong>.
                                      The user will become a local ECM account.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleConvertLocal(user.id)}
                                      className="bg-amber-600 hover:bg-amber-700"
                                    >
                                      Convert to Local
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <PaginationBar />
                </>
              )}
            </>
          )}

          {activeTab === 'managers' && (
            <>
              {unresolvedManagers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-14 w-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-3">
                    <Users className="h-7 w-7 text-blue-500" />
                  </div>
                  <p className="text-sm text-gray-500">All manager relationships resolved</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80 border-b border-gray-200">
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Display Name</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Manager DN (unresolved)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unresolvedManagers.map((user) => (
                        <TableRow key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <TableCell className="font-mono text-xs text-gray-700">{user.username}</TableCell>
                          <TableCell className="text-sm text-gray-900">{user.displayName}</TableCell>
                          <TableCell className="font-mono text-xs text-gray-400 break-all">
                            {user.ldapManagerDn}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <PaginationBar />
                </>
              )}
            </>
          )}

          {activeTab === 'errors' && (
            <>
              {syncErrorUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-14 w-14 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mb-3">
                    <AlertTriangle className="h-7 w-7 text-red-500" />
                  </div>
                  <p className="text-sm text-gray-500">No sync errors</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80 border-b border-gray-200">
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Display Name</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Error Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {syncErrorUsers.map((user) => (
                        <TableRow key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <TableCell className="font-mono text-xs text-gray-700">{user.username}</TableCell>
                          <TableCell className="text-sm text-gray-900">{user.displayName}</TableCell>
                          <TableCell>
                            <Badge variant="destructive" className="rounded-full">{user.status}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-gray-400">{user.errorMessage || 'No message'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <PaginationBar />
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
