'use client';

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import {
    Search,
    X,
    Zap,
    CheckCircle,
    Share2,
    Clock,
    Folder,
    Edit,
    Bell,
    Mail,
    Variable,
    Timer,
    Globe,
    Workflow,
    FileCode,
    ScanText,
    Archive,
    Trash,
    XCircle,
    Eye,
    ClipboardCheck,
    GitFork,
    Merge,
    FileEdit,
    RefreshCw,
    FilePlus2,
    Lock,
    Unlock,
    AlertTriangle,
    Database,
    Square,
    Stamp,
    List,
} from 'lucide-react';

interface NodesPaletteProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

/**
 * Draggable node card component
 */
interface DraggableNodeCardProps {
    nodeType: string;
    label: string;
    displayName: string;
    icon: React.ReactNode;
    colorClass: string;
}

const DraggableNodeCard = ({ nodeType, label, displayName, icon, colorClass }: DraggableNodeCardProps) => (
    <div
        className={`flex flex-col items-center justify-center gap-2 p-3 aspect-square ${colorClass} rounded-xl cursor-grab hover:shadow-lg hover:scale-105 transition-all duration-200`}
        draggable
        onDragStart={(e) => {
            e.dataTransfer.setData('application/reactflow/type', nodeType);
            e.dataTransfer.setData('application/reactflow/label', label);
            e.dataTransfer.effectAllowed = 'move';
        }}
    >
        {icon}
        <span className="text-xs font-medium text-center">{displayName}</span>
    </div>
);

/**
 * NodesPalette - Sidebar panel with draggable workflow nodes
 * Includes all backend-supported node types from WorkflowNodeType.java
 */
export default function NodesPalette({ searchQuery, onSearchChange }: NodesPaletteProps) {
    // Check if a node name matches the search query
    const matchesNodeSearch = useCallback((nodeName: string) => {
        if (!searchQuery) return true;
        return nodeName.toLowerCase().includes(searchQuery.toLowerCase());
    }, [searchQuery]);

    return (
        <div className="p-4 space-y-3">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    type="text"
                    placeholder="Search nodes..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 h-9 text-sm bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
                {searchQuery && (
                    <button
                        onClick={() => onSearchChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            <p className="text-xs text-gray-400 text-center">Drag nodes to canvas</p>

            {/* Entry Points */}
            {matchesNodeSearch('trigger') && (
                <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Entry Points</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {matchesNodeSearch('trigger') && (
                            <DraggableNodeCard
                                nodeType="triggerNode"
                                label="Trigger"
                                displayName="Trigger"
                                icon={<Zap className="w-6 h-6 text-green-600" />}
                                colorClass="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 text-green-900"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Human Tasks */}
            {(matchesNodeSearch('approval') || matchesNodeSearch('review') || matchesNodeSearch('manual') || matchesNodeSearch('task') || matchesNodeSearch('choice') || matchesNodeSearch('decision')) && (
                <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Human Tasks</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {matchesNodeSearch('approval') && (
                            <DraggableNodeCard
                                nodeType="approvalNode"
                                label="Approval"
                                displayName="Approval"
                                icon={<CheckCircle className="w-6 h-6 text-blue-600" />}
                                colorClass="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 text-blue-900"
                            />
                        )}
                        {matchesNodeSearch('review') && (
                            <DraggableNodeCard
                                nodeType="reviewNode"
                                label="Review"
                                displayName="Review"
                                icon={<Eye className="w-6 h-6 text-indigo-600" />}
                                colorClass="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 text-indigo-900"
                            />
                        )}
                        {(matchesNodeSearch('manual') || matchesNodeSearch('task')) && (
                            <DraggableNodeCard
                                nodeType="manualTaskNode"
                                label="Manual Task"
                                displayName="Manual Task"
                                icon={<ClipboardCheck className="w-6 h-6 text-violet-600" />}
                                colorClass="bg-gradient-to-br from-violet-50 to-violet-100 border-2 border-violet-200 text-violet-900"
                            />
                        )}
                        {(matchesNodeSearch('choice') || matchesNodeSearch('decision') || matchesNodeSearch('multi')) && (
                            <DraggableNodeCard
                                nodeType="multiChoiceNode"
                                label="Multi-Choice"
                                displayName="Multi-Choice"
                                icon={<List className="w-6 h-6 text-teal-600" />}
                                colorClass="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-200 text-teal-900"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Logic / Flow Control */}
            {(matchesNodeSearch('condition') || matchesNodeSearch('split') || matchesNodeSearch('join') || matchesNodeSearch('parallel') || matchesNodeSearch('fork')) && (
                <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Logic / Flow</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {matchesNodeSearch('condition') && (
                            <DraggableNodeCard
                                nodeType="conditionalNode"
                                label="Condition"
                                displayName="Condition"
                                icon={<Share2 className="w-6 h-6 text-purple-600" />}
                                colorClass="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 text-purple-900"
                            />
                        )}
                        {(matchesNodeSearch('split') || matchesNodeSearch('parallel') || matchesNodeSearch('fork')) && (
                            <DraggableNodeCard
                                nodeType="splitNode"
                                label="Split (Fork)"
                                displayName="Split"
                                icon={<GitFork className="w-6 h-6 text-fuchsia-600" />}
                                colorClass="bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 border-2 border-fuchsia-200 text-fuchsia-900"
                            />
                        )}
                        {(matchesNodeSearch('join') || matchesNodeSearch('merge')) && (
                            <DraggableNodeCard
                                nodeType="joinNode"
                                label="Join (Merge)"
                                displayName="Join"
                                icon={<Merge className="w-6 h-6 text-pink-600" />}
                                colorClass="bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-pink-200 text-pink-900"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Time / Scheduling */}
            {(matchesNodeSearch('delay') || matchesNodeSearch('wait')) && (
                <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Time / Scheduling</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {(matchesNodeSearch('delay') || matchesNodeSearch('wait')) && (
                            <DraggableNodeCard
                                nodeType="delayNode"
                                label="Delay"
                                displayName="Delay"
                                icon={<Clock className="w-6 h-6 text-slate-600" />}
                                colorClass="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 text-slate-900"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Document Actions */}
            {(matchesNodeSearch('move') || matchesNodeSearch('metadata') || matchesNodeSearch('status') || matchesNodeSearch('version') ||
                matchesNodeSearch('lock') || matchesNodeSearch('unlock') || matchesNodeSearch('archive') || matchesNodeSearch('delete') ||
                matchesNodeSearch('stamp') || matchesNodeSearch('lifecycle')) && (
                    <div className="mb-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Document Actions</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {matchesNodeSearch('move') && (
                                <DraggableNodeCard
                                    nodeType="moveDocumentNode"
                                    label="Move Document"
                                    displayName="Move"
                                    icon={<Folder className="w-6 h-6 text-emerald-600" />}
                                    colorClass="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 text-emerald-900"
                                />
                            )}
                            {matchesNodeSearch('metadata') && (
                                <DraggableNodeCard
                                    nodeType="updateMetadataNode"
                                    label="Update Metadata"
                                    displayName="Metadata"
                                    icon={<FileEdit className="w-6 h-6 text-teal-600" />}
                                    colorClass="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-200 text-teal-900"
                                />
                            )}
                            {(matchesNodeSearch('status') || matchesNodeSearch('lifecycle')) && (
                                <DraggableNodeCard
                                    nodeType="changeStatusNode"
                                    label="Change Status"
                                    displayName="Status"
                                    icon={<RefreshCw className="w-6 h-6 text-cyan-600" />}
                                    colorClass="bg-gradient-to-br from-cyan-50 to-cyan-100 border-2 border-cyan-200 text-cyan-900"
                                />
                            )}
                            {matchesNodeSearch('version') && (
                                <DraggableNodeCard
                                    nodeType="newVersionNode"
                                    label="New Version"
                                    displayName="Version"
                                    icon={<FilePlus2 className="w-6 h-6 text-sky-600" />}
                                    colorClass="bg-gradient-to-br from-sky-50 to-sky-100 border-2 border-sky-200 text-sky-900"
                                />
                            )}
                            {matchesNodeSearch('lock') && (
                                <DraggableNodeCard
                                    nodeType="lockDocumentNode"
                                    label="Lock Document"
                                    displayName="Lock"
                                    icon={<Lock className="w-6 h-6 text-amber-600" />}
                                    colorClass="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 text-amber-900"
                                />
                            )}
                            {matchesNodeSearch('unlock') && (
                                <DraggableNodeCard
                                    nodeType="unlockDocumentNode"
                                    label="Unlock Document"
                                    displayName="Unlock"
                                    icon={<Unlock className="w-6 h-6 text-lime-600" />}
                                    colorClass="bg-gradient-to-br from-lime-50 to-lime-100 border-2 border-lime-200 text-lime-900"
                                />
                            )}
                            {matchesNodeSearch('stamp') && (
                                <DraggableNodeCard
                                    nodeType="stampNode"
                                    label="Apply Stamp"
                                    displayName="Stamp"
                                    icon={<Stamp className="w-6 h-6 text-indigo-600" />}
                                    colorClass="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 text-indigo-900"
                                />
                            )}
                            {matchesNodeSearch('archive') && (
                                <DraggableNodeCard
                                    nodeType="archiveNode"
                                    label="Archive"
                                    displayName="Archive"
                                    icon={<Archive className="w-6 h-6 text-stone-600" />}
                                    colorClass="bg-gradient-to-br from-stone-50 to-stone-100 border-2 border-stone-200 text-stone-900"
                                />
                            )}
                            {matchesNodeSearch('delete') && (
                                <DraggableNodeCard
                                    nodeType="deleteNode"
                                    label="Delete"
                                    displayName="Delete"
                                    icon={<Trash className="w-6 h-6 text-red-600" />}
                                    colorClass="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 text-red-900"
                                />
                            )}
                        </div>
                    </div>
                )}

            {/* Communication */}
            {(matchesNodeSearch('notify') || matchesNodeSearch('email') || matchesNodeSearch('notification')) && (
                <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Communication</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {(matchesNodeSearch('notify') || matchesNodeSearch('notification')) && (
                            <DraggableNodeCard
                                nodeType="notificationNode"
                                label="Notification"
                                displayName="Notify"
                                icon={<Bell className="w-6 h-6 text-amber-600" />}
                                colorClass="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 text-amber-900"
                            />
                        )}
                        {matchesNodeSearch('email') && (
                            <DraggableNodeCard
                                nodeType="emailNode"
                                label="Send Email"
                                displayName="Email"
                                icon={<Mail className="w-6 h-6 text-sky-600" />}
                                colorClass="bg-gradient-to-br from-sky-50 to-sky-100 border-2 border-sky-200 text-sky-900"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Integration / Automation */}
            {(matchesNodeSearch('api') || matchesNodeSearch('workflow') || matchesNodeSearch('sub')) && (
                <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Integration</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {matchesNodeSearch('api') && (
                            <DraggableNodeCard
                                nodeType="apiCallNode"
                                label="API Call"
                                displayName="API"
                                icon={<Globe className="w-6 h-6 text-cyan-600" />}
                                colorClass="bg-gradient-to-br from-cyan-50 to-cyan-100 border-2 border-cyan-200 text-cyan-900"
                            />
                        )}
                        {(matchesNodeSearch('workflow') || matchesNodeSearch('sub')) && (
                            <DraggableNodeCard
                                nodeType="subWorkflowNode"
                                label="Sub-Workflow"
                                displayName="Workflow"
                                icon={<Workflow className="w-6 h-6 text-violet-600" />}
                                colorClass="bg-gradient-to-br from-violet-50 to-violet-100 border-2 border-violet-200 text-violet-900"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Variables / Context */}
            {(matchesNodeSearch('variable') || matchesNodeSearch('set')) && (
                <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Variables</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {(matchesNodeSearch('variable') || matchesNodeSearch('set')) && (
                            <DraggableNodeCard
                                nodeType="setVariableNode"
                                label="Set Variable"
                                displayName="Set Var"
                                icon={<Variable className="w-6 h-6 text-teal-600" />}
                                colorClass="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-200 text-teal-900"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Flow Control / Termination */}
            {(matchesNodeSearch('cancel') || matchesNodeSearch('terminate') || matchesNodeSearch('stop') || matchesNodeSearch('fail')) && (
                <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Termination</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {(matchesNodeSearch('cancel') || matchesNodeSearch('terminate') || matchesNodeSearch('stop') || matchesNodeSearch('fail')) && (
                            <DraggableNodeCard
                                nodeType="cancelNode"
                                label="Cancel"
                                displayName="Cancel"
                                icon={<XCircle className="w-6 h-6 text-red-600" />}
                                colorClass="bg-gradient-to-br from-red-50 to-rose-100 border-2 border-red-200 text-red-900"
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
