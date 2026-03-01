'use client';

import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from '@/components/ui/alert-dialog';
import type { LdapServer } from './ldap-types';

interface DeleteServerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    server: LdapServer | null;
    onConfirm: () => Promise<void>;
    loading: boolean;
}

export default function DeleteServerDialog({
    open,
    onOpenChange,
    server,
    onConfirm,
    loading,
}: DeleteServerDialogProps) {
    if (!server) return null;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <AlertDialogTitle>Delete LDAP Server</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="space-y-2">
                        <span className="block">
                            Are you sure you want to delete <strong>&quot;{server.name}&quot;</strong>?
                        </span>
                        <span className="block text-xs">
                            This will permanently remove the server configuration, attribute mappings, and all
                            synchronization history. Users previously synced from this server will not be
                            deleted but will no longer receive updates.
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={async (e) => {
                            e.preventDefault();
                            await onConfirm();
                        }}
                        disabled={loading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Delete Server
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
