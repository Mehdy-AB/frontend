'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { apiClient } from '@/api/client';
import type { EmailCapturePolicyDto, WorkspaceSummary } from './types';

const API_BASE = '/api/v1/email-governance/policies';

/**
 * Hook: fetch all policies (system default + workspace overrides)
 */
export function useEmailGovernancePolicies() {
  const [policies, setPolicies] = useState<EmailCapturePolicyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<EmailCapturePolicyDto[]>(API_BASE);
      setPolicies(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { policies, loading, error, refresh };
}

/**
 * Hook: fetch + manage the system default policy state.
 *
 * Uses a ref for notification functions to avoid infinite re-render loops
 * (showError/showSuccess change identity on every render).
 */
export function useDefaultPolicy() {
  const [policy, setPolicy] = useState<EmailCapturePolicyDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useNotifications();

  // Stable refs to avoid dependency-cycle infinite loops
  const showErrorRef = useRef(showError);
  const showSuccessRef = useRef(showSuccess);
  showErrorRef.current = showError;
  showSuccessRef.current = showSuccess;

  const fetchDefault = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<EmailCapturePolicyDto>(`${API_BASE}/default`);
      setPolicy(data);
    } catch (e: any) {
      showErrorRef.current('Error', e.message || 'Failed to load default policy');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDefault(); }, [fetchDefault]);

  const savePolicy = useCallback(async (updates: Partial<EmailCapturePolicyDto>) => {
    if (!policy) return;
    try {
      setSaving(true);
      const saved = await apiClient.put<EmailCapturePolicyDto>(`${API_BASE}/${policy.id}`, { ...policy, ...updates });
      setPolicy(saved);
      showSuccessRef.current('Saved', 'System default policy updated successfully.');
    } catch (e: any) {
      showErrorRef.current('Save Failed', e.message || 'Could not update policy');
    } finally {
      setSaving(false);
    }
  }, [policy]);

  return { policy, setPolicy, loading, saving, savePolicy, refresh: fetchDefault };
}

/**
 * Hook: CRUD mutations for workspace policies
 */
export function usePolicyMutations(onSuccess?: () => void) {
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useNotifications();

  // Stable refs
  const showErrorRef = useRef(showError);
  const showSuccessRef = useRef(showSuccess);
  const onSuccessRef = useRef(onSuccess);
  showErrorRef.current = showError;
  showSuccessRef.current = showSuccess;
  onSuccessRef.current = onSuccess;

  const createPolicy = useCallback(async (workspaceId: string, data: Partial<EmailCapturePolicyDto>) => {
    try {
      setSaving(true);
      await apiClient.post<EmailCapturePolicyDto>(`${API_BASE}/workspace/${workspaceId}`, data);
      showSuccessRef.current('Created', 'Workspace policy created successfully.');
      onSuccessRef.current?.();
    } catch (e: any) {
      showErrorRef.current('Create Failed', e.message || 'Could not create policy');
    } finally {
      setSaving(false);
    }
  }, []);

  const updatePolicy = useCallback(async (id: number, data: Partial<EmailCapturePolicyDto>) => {
    try {
      setSaving(true);
      await apiClient.put<EmailCapturePolicyDto>(`${API_BASE}/${id}`, data);
      showSuccessRef.current('Updated', 'Workspace policy updated successfully.');
      onSuccessRef.current?.();
    } catch (e: any) {
      showErrorRef.current('Update Failed', e.message || 'Could not update policy');
    } finally {
      setSaving(false);
    }
  }, []);

  const deletePolicy = useCallback(async (id: number) => {
    try {
      setSaving(true);
      await apiClient.delete<any>(`${API_BASE}/${id}`);
      showSuccessRef.current('Deleted', 'Workspace policy deleted. Users will fall back to the system default.');
      onSuccessRef.current?.();
    } catch (e: any) {
      showErrorRef.current('Delete Failed', e.message || 'Could not delete policy');
    } finally {
      setSaving(false);
    }
  }, []);

  return { saving, createPolicy, updatePolicy, deletePolicy };
}

/**
 * Hook: search workspaces with debounced server-side search.
 *
 * Uses apiClient (which targets localhost:8080) to call
 * GET /api/workspaces?search=<query>&size=15 as the admin types.
 * Results are debounced by 300ms to avoid hammering the backend.
 */
export function useWorkspaceSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WorkspaceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced server-side search
  const search = useCallback((searchTerm: string) => {
    setQuery(searchTerm);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ size: '15' });
        if (searchTerm.trim()) params.set('search', searchTerm.trim());
        const data = await apiClient.get<any>(`/api/workspaces?${params}`);
        // The endpoint returns a Page<> object with .content array
        setResults(data.content || data);
      } catch { /* ignore – workspace search is best-effort */ }
      finally { setLoading(false); }
    }, 300);
  }, []);

  // Load initial results on mount
  useEffect(() => {
    search('');
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  return { query, results, loading, search };
}
