'use client';

import { useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceRole, WorkspaceMemberDto, workspaceService } from '@/api/services/workspaceService';

interface EditRoleModalProps {
    workspaceId: string;
    member: WorkspaceMemberDto;
    open: boolean;
    onClose: () => void;
    onUpdated: (memberId: number, newRole: WorkspaceRole) => void;
}

const roleOptions: { value: WorkspaceRole; label: string; desc: string; color: string }[] = [
    { value: 'OWNER', label: 'Owner', desc: 'Full control over workspace', color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { value: 'MANAGER', label: 'Manager', desc: 'Manage members and content', color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { value: 'CONTRIBUTOR', label: 'Contributor', desc: 'Create and edit content', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { value: 'READER', label: 'Reader', desc: 'View-only access', color: 'text-gray-600 bg-gray-50 border-gray-200' },
    { value: 'AUDITOR', label: 'Auditor', desc: 'View + audit logs', color: 'text-amber-600 bg-amber-50 border-amber-200' },
];

export default function EditRoleModal({ workspaceId, member, open, onClose, onUpdated }: EditRoleModalProps) {
    const [selectedRole, setSelectedRole] = useState<WorkspaceRole>(member.workspaceRole);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const displayName = member.principalType === 'USER'
        ? (member.userFirstName ? `${member.userFirstName} ${member.userLastName || ''}`.trim() : (member.userDisplayName || member.principalId))
        : (member.userDisplayName || member.principalId);

    const handleSave = async () => {
        if (selectedRole === member.workspaceRole) {
            onClose();
            return;
        }
        setSaving(true);
        setError('');
        try {
            await workspaceService.changeMemberRole(workspaceId, member.id, selectedRole);
            onUpdated(member.id, selectedRole);
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to update role');
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Edit Member Role</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Update role for <span className="font-medium text-gray-700">{displayName}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-2">
                    {roleOptions.map(opt => (
                        <button key={opt.value} type="button" onClick={() => setSelectedRole(opt.value)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${selectedRole === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}`}>
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${opt.color}`}>
                                <span className="text-sm font-bold">{opt.label[0]}</span>
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm font-medium ${selectedRole === opt.value ? 'text-blue-700' : 'text-gray-700'}`}>{opt.label}</p>
                                <p className="text-xs text-gray-400">{opt.desc}</p>
                            </div>
                            {selectedRole === opt.value && <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />}
                        </button>
                    ))}

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">{error}</div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
                    <Button onClick={handleSave} disabled={saving || selectedRole === member.workspaceRole}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl px-6 border-0">
                        {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
