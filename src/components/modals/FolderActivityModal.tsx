import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ActivitySection } from '@/components/folder/ActivitySection';
import { AuditLog } from '@/types/api';

interface FolderActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    auditLogs: AuditLog[];
    isLoadingAuditLogs: boolean;
    formatDate: (dateString: string) => string;
}

export function FolderActivityModal({
    isOpen,
    onClose,
    auditLogs,
    isLoadingAuditLogs,
    formatDate
}: FolderActivityModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Recent Activity</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                    <ActivitySection
                        showActivitySection={true}
                        onToggleActivitySection={() => { }}
                        auditLogs={auditLogs}
                        isLoadingAuditLogs={isLoadingAuditLogs}
                        formatDate={formatDate}
                        isLoading={false}
                        isModal={true}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
