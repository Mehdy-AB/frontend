'use client';

import { useState } from 'react';
import { X, UserPlus, Search, Users, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    workspaceService, WorkspaceRole, PrincipalType, WorkspaceMemberDto,
} from '@/api/services/workspaceService';

interface AddMemberModalProps {
    workspaceId: string;
    open: boolean;
    onClose: () => void;
    onAdded: (member: WorkspaceMemberDto) => void;
}

const principalTypeOptions: { value: PrincipalType; label: string; icon: React.ElementType }[] = [
    { value: 'USER', label: 'User', icon: User },
    { value: 'GROUP', label: 'Group', icon: Users },
    { value: 'ROLE', label: 'Role', icon: Shield },
];

const roleOptions: { value: WorkspaceRole; label: string; desc: string }[] = [
    { value: 'OWNER', label: 'Owner', desc: 'Full control, can change policy and manage members' },
    { value: 'MANAGER', label: 'Manager', desc: 'Can manage members and content' },
    { value: 'CONTRIBUTOR', label: 'Contributor', desc: 'Can create and edit content' },
    { value: 'READER', label: 'Reader', desc: 'View-only access to workspace content' },
    { value: 'AUDITOR', label: 'Auditor', desc: 'Can view content and audit logs' },
];

export default function AddMemberModal({ workspaceId, open, onClose, onAdded }: AddMemberModalProps) {
    const [principalType, setPrincipalType] = useState<PrincipalType>('USER');
    const [principalId, setPrincipalId] = useState('');
    const [role, setRole] = useState<WorkspaceRole>('READER');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!open) return null;

    const handleSubmit = async () => {
        if (!principalId.trim()) {
            setError('Please enter a user/group/role ID');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const member = await workspaceService.addMember(workspaceId, {
                principalType, principalId: principalId.trim(), role,
            });
            onAdded(member);
            setPrincipalId('');
            setRole('READER');
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to add member');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-500 rounded-xl flex items-center justify-center">
                            <UserPlus className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Add Member</h2>
                            <p className="text-sm text-gray-500">Assign a user, group, or role to this workspace</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">
                    {/* Principal Type */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Member Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {principalTypeOptions.map(opt => (
                                <button key={opt.value} type="button" onClick={() => setPrincipalType(opt.value)}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${principalType === opt.value
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 text-gray-500 hover:border-blue-200 hover:bg-gray-50'}`}>
                                    <opt.icon className="h-4 w-4" />{opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Principal ID */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                            {principalType === 'USER' ? 'User ID' : principalType === 'GROUP' ? 'Group ID' : 'Role ID'}
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input value={principalId} onChange={e => setPrincipalId(e.target.value)}
                                placeholder={`Enter ${principalType.toLowerCase()} ID or search...`}
                                className="pl-10 h-11 rounded-xl" />
                        </div>
                    </div>

                    {/* Role */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Workspace Role</label>
                        <div className="space-y-2">
                            {roleOptions.map(opt => (
                                <button key={opt.value} type="button" onClick={() => setRole(opt.value)}
                                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${role === opt.value
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}`}>
                                    <p className={`text-sm font-medium ${role === opt.value ? 'text-blue-700' : 'text-gray-700'}`}>{opt.label}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">{error}</div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading || !principalId.trim()}
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-6">
                        {loading ? 'Adding...' : 'Add Member'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
