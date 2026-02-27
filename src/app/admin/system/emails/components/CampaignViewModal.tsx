'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import {
    Copy,
    Edit,
    X,
    Send,
    Users,
    Clock,
    CheckCircle2,
    XCircle,
    Mail,
    MousePointer,
    AlertCircle,
    FileText,
    Play,
    Pause,
    AlertTriangle,
    History,
} from 'lucide-react';
import type { EmailCampaign, EmailCampaignStatus, EmailCampaignType, CampaignActivity } from '../lib/types';

// ============================================================================
// Status Badge (same as in CampaignsTab)
// ============================================================================

function StatusBadge({ status }: { status: EmailCampaignStatus }) {
    const config: Record<EmailCampaignStatus, { label: string; className: string; icon: React.ReactNode }> = {
        DRAFT: {
            label: 'Draft',
            className: 'bg-muted text-muted-foreground',
            icon: <FileText className="h-3 w-3" />,
        },
        SCHEDULED: {
            label: 'Scheduled',
            className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
            icon: <Clock className="h-3 w-3" />,
        },
        SENDING: {
            label: 'Sending',
            className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
            icon: <Send className="h-3 w-3" />,
        },
        RUNNING: {
            label: 'Sending',  // RUNNING is an alias for SENDING
            className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
            icon: <Send className="h-3 w-3" />,
        },
        PAUSED: {
            label: 'Paused',
            className: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
            icon: <Pause className="h-3 w-3" />,
        },
        COMPLETED: {
            label: 'Completed',
            className: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
            icon: <CheckCircle2 className="h-3 w-3" />,
        },
        FAILED: {
            label: 'Failed',
            className: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
            icon: <XCircle className="h-3 w-3" />,
        },
        CANCELLED: {
            label: 'Cancelled',
            className: 'bg-muted text-muted-foreground',
            icon: <AlertTriangle className="h-3 w-3" />,
        },
    };

    const { label, className, icon } = config[status];

    return (
        <Badge variant="outline" className={`gap-1 font-medium ${className}`}>
            {icon}
            {label}
        </Badge>
    );
}

// ============================================================================
// Type Badge
// ============================================================================

function TypeBadge({ type }: { type: EmailCampaignType }) {
    const config: Record<EmailCampaignType, { label: string; className: string }> = {
        NEWSLETTER: { label: 'Newsletter', className: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' },
        ANNOUNCEMENT: { label: 'Announcement', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' },
        TRANSACTIONAL: { label: 'Transactional', className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400' },
        AUTOMATED: { label: 'Automated', className: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400' },
        SYSTEM: { label: 'System', className: 'bg-muted text-muted-foreground' },
    };

    const { label, className } = config[type];
    return <Badge variant="secondary" className={className}>{label}</Badge>;
}

// ============================================================================
// Stats Grid Component
// ============================================================================

function StatItem({ label, value, icon: Icon, color }: {
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}) {
    return (
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${color}`}>
            <Icon className="h-5 w-5" />
            <div>
                <p className="text-xl font-bold">{value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
            </div>
        </div>
    );
}

// ============================================================================
// Activity Timeline
// ============================================================================

function ActivityTimeline({ activities }: { activities: CampaignActivity[] }) {
    const getActivityIcon = (type: CampaignActivity['type']) => {
        switch (type) {
            case 'CREATED': return <FileText className="h-4 w-4 text-blue-500" />;
            case 'UPDATED': return <Edit className="h-4 w-4 text-amber-500" />;
            case 'SCHEDULED': return <Clock className="h-4 w-4 text-indigo-500" />;
            case 'STARTED': return <Play className="h-4 w-4 text-green-500" />;
            case 'PAUSED': return <Pause className="h-4 w-4 text-orange-500" />;
            case 'RESUMED': return <Play className="h-4 w-4 text-green-500" />;
            case 'COMPLETED': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'FAILED': return <XCircle className="h-4 w-4 text-red-500" />;
            case 'CANCELLED': return <AlertTriangle className="h-4 w-4 text-gray-500" />;
            default: return <History className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <div className="space-y-3">
            {activities.map((activity, index) => (
                <div key={activity.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                        <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                            {getActivityIcon(activity.type)}
                        </div>
                        {index < activities.length - 1 && (
                            <div className="w-px h-full bg-slate-200 dark:bg-slate-700 my-1" />
                        )}
                    </div>
                    <div className="flex-1 pb-3">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{activity.userName || 'System'}</span>
                            <span>•</span>
                            <span>{new Date(activity.timestamp).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// Format Date Utility
// ============================================================================

function formatDate(dateString?: string): string {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// ============================================================================
// Main CampaignViewModal Component
// ============================================================================

interface CampaignViewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    campaign?: EmailCampaign;
    activities: CampaignActivity[];
    onEdit: () => void;
    onDuplicate: () => void;
}

export default function CampaignViewModal({
    open,
    onOpenChange,
    campaign,
    activities,
    onEdit,
    onDuplicate,
}: CampaignViewModalProps) {
    if (!campaign) return null;

    const clickRate = campaign.sentCount > 0
        ? ((campaign.clickedCount / campaign.sentCount) * 100).toFixed(1)
        : '0.0';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <DialogTitle className="text-xl pr-8">{campaign.name}</DialogTitle>
                            <div className="flex items-center gap-2">
                                <StatusBadge status={campaign.status} />
                                <TypeBadge type={campaign.type} />
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-180px)]">
                    <div className="p-6 space-y-6">
                        {/* Subject */}
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Subject</h4>
                            <p className="text-lg">{campaign.subject}</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <StatItem
                                label="Recipients"
                                value={campaign.totalRecipients}
                                icon={Users}
                                color="bg-card border text-blue-600 dark:text-blue-400"
                            />
                            <StatItem
                                label="Sent"
                                value={campaign.sentCount}
                                icon={Send}
                                color="bg-card border text-green-600 dark:text-green-400"
                            />
                            <StatItem
                                label="Clicked"
                                value={campaign.clickedCount}
                                icon={MousePointer}
                                color="bg-card border text-amber-600 dark:text-amber-400"
                            />
                            <StatItem
                                label="Failed"
                                value={campaign.failedCount}
                                icon={XCircle}
                                color="bg-card border text-red-600 dark:text-red-400"
                            />
                        </div>

                        {/* Rates */}
                        {campaign.sentCount > 0 && (
                            <div className="flex gap-4 p-4 rounded-lg bg-muted/30 border">
                                <div className="flex-1 text-center">
                                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{clickRate}%</p>
                                    <p className="text-sm text-muted-foreground">Click Rate</p>
                                </div>
                            </div>
                        )}

                        {/* Target & Scheduling Info */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Card>
                                <CardContent className="p-4 space-y-3">
                                    <h4 className="font-medium flex items-center gap-2">
                                        <Users className="h-4 w-4 text-primary" />
                                        Target Audience
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Type:</span>
                                            <span className="capitalize">{campaign.targetType.replace('_', ' ').toLowerCase()}</span>
                                        </div>
                                        {campaign.targetRoleIds && campaign.targetRoleIds.length > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Roles:</span>
                                                <span>{campaign.targetRoleIds.length} selected</span>
                                            </div>
                                        )}
                                        {campaign.targetUserIds && campaign.targetUserIds.length > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Users:</span>
                                                <span>{campaign.targetUserIds.length} selected</span>
                                            </div>
                                        )}
                                        {campaign.externalEmails && campaign.externalEmails.length > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">External:</span>
                                                <span>{campaign.externalEmails.length} emails</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4 space-y-3">
                                    <h4 className="font-medium flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Schedule
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Scheduled:</span>
                                            <span>{formatDate(campaign.scheduledAt)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Sent:</span>
                                            <span>{formatDate(campaign.sentAt)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Created:</span>
                                            <span>{formatDate(campaign.createdAt)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">By:</span>
                                            <span>{campaign.createdBy}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Email Body Preview */}
                        <div>
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Email Preview
                            </h4>
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs text-muted-foreground border-b">
                                    HTML Preview
                                </div>
                                <div
                                    className="p-4 bg-card prose prose-sm dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: campaign.bodyHtml }}
                                />
                            </div>
                        </div>

                        {/* Activity Timeline */}
                        <div>
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                                <History className="h-4 w-4" />
                                Recent Activity
                            </h4>
                            <Card>
                                <CardContent className="p-4">
                                    {activities.length > 0 ? (
                                        <ActivityTimeline activities={activities} />
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            No activity recorded yet
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </ScrollArea>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t bg-muted/30 flex justify-between">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Close
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onDuplicate}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                        </Button>
                        <Button onClick={onEdit} className="gap-2">
                            <Edit className="h-4 w-4" />
                            Edit
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
