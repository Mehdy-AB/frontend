'use client';

import React, { useState, useEffect } from 'react';
import { use } from 'react';
import {
    ArrowLeft,
    ArrowRight,
    ChevronLeft,
    Mail,
    Calendar,
    Clock,
    Star,
    CheckCircle,
    XCircle,
    Loader2,
    Download,
    FileText,
    User,
    UserX,
    Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formService } from '@/api/services/formService';
import { FormSubmissionResponse } from '@/types/api';
import { useNotifications } from '@/hooks/useNotifications';
import { useRouter } from 'next/navigation';
import UserAvatar from '@/components/main/UserAvatar';

export default function SubmissionDetailPage({
    params
}: {
    params: Promise<{ id: string; subId: string }>
}) {
    const { id, subId } = use(params);
    const router = useRouter();
    const { showSuccess, showError } = useNotifications();

    const [submission, setSubmission] = useState<FormSubmissionResponse | null>(null);
    const [allSubmissions, setAllSubmissions] = useState<FormSubmissionResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewNotes, setReviewNotes] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    // Fetch all submissions and find current one
    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await formService.getFormSubmissions(parseInt(id), 0, 100);
            setAllSubmissions(response.content);

            const idx = response.content.findIndex(s => s.id === parseInt(subId));
            if (idx !== -1) {
                setCurrentIndex(idx);
                setSubmission(response.content[idx]);
                setReviewNotes(response.content[idx].reviewNotes || '');

                // Mark as read
                if (!response.content[idx].isRead) {
                    await formService.markSubmissionAsRead(parseInt(subId));
                }
            }
        } catch (error) {
            console.error('Failed to fetch submission:', error);
            showError('Load Failed', 'Unable to load submission details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id, subId]);

    const navigateToSubmission = (newIndex: number) => {
        if (newIndex >= 0 && newIndex < allSubmissions.length) {
            const newSubmission = allSubmissions[newIndex];
            router.push(`/admin/forms/${id}/submissions/${newSubmission.id}`);
        }
    };

    const handleUpdateStatus = async (status: string) => {
        if (!submission) return;
        try {
            await formService.updateSubmissionStatus(submission.id, status);
            showSuccess('Status Updated', `Submission marked as ${status.toLowerCase()}`);
            fetchData();
        } catch (error: any) {
            showError('Update Failed', error.message);
        }
    };

    const handleSaveNotes = async () => {
        if (!submission) return;
        try {
            await formService.addReviewNotes(submission.id, reviewNotes);
            showSuccess('Saved', 'Review notes updated');
        } catch (error: any) {
            showError('Save Failed', error.message);
        }
    };

    const handleToggleStar = async () => {
        if (!submission) return;
        try {
            await formService.toggleSubmissionStar(submission.id);
            fetchData();
        } catch (error: any) {
            showError('Update Failed', error.message);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { color: string; label: string }> = {
            SUBMITTED: { color: 'bg-blue-100 text-blue-700', label: 'Submitted' },
            UNDER_REVIEW: { color: 'bg-yellow-100 text-yellow-700', label: 'Under Review' },
            APPROVED: { color: 'bg-green-100 text-green-700', label: 'Approved' },
            REJECTED: { color: 'bg-red-100 text-red-700', label: 'Rejected' },
            ARCHIVED: { color: 'bg-gray-100 text-gray-700', label: 'Archived' }
        };
        const variant = variants[status] || variants.SUBMITTED;
        return <Badge className={variant.color}>{variant.label}</Badge>;
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6 flex justify-center items-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!submission) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="py-12 text-center">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium">Submission not found</h3>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => router.push(`/admin/forms/${id}/submissions`)}
                        >
                            Back to Submissions
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header with Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push(`/admin/forms/${id}/submissions`)}
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back to Submissions
                    </Button>
                    <div className="text-sm text-gray-500">
                        {currentIndex + 1} of {allSubmissions.length}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigateToSubmission(currentIndex - 1)}
                        disabled={currentIndex === 0}
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigateToSubmission(currentIndex + 1)}
                        disabled={currentIndex >= allSubmissions.length - 1}
                    >
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleToggleStar}
                    >
                        <Star className={`w-5 h-5 ${submission.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Submitter Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        {submission.submitter ? (
                            <UserAvatar user={submission.submitter} size="xl" showTooltip />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                                <UserX className="w-8 h-8 text-orange-600" />
                            </div>
                        )}

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-xl font-bold">
                                    {submission.submitter ? (
                                        submission.submitterName ||
                                        `${submission.submitter.firstName || ''} ${submission.submitter.lastName || ''}`.trim() ||
                                        'Authenticated User'
                                    ) : submission.submitterName || 'Anonymous Visitor'}
                                </h2>
                                {submission.submitter ? (
                                    <Badge className="bg-green-100 text-green-700">Authenticated</Badge>
                                ) : (
                                    <Badge className="bg-orange-100 text-orange-700">Anonymous</Badge>
                                )}
                                {getStatusBadge(submission.status)}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    {submission.submitterEmail || submission.submitter?.email || 'No email'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    {new Date(submission.submittedAt).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    {new Date(submission.submittedAt).toLocaleTimeString()}
                                    {submission.completionTimeSeconds && (
                                        <span className="text-gray-400 ml-1">
                                            ({Math.floor(submission.completionTimeSeconds / 60)}m {submission.completionTimeSeconds % 60}s)
                                        </span>
                                    )}
                                </div>
                                {submission.submitterIp && (
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-gray-400" />
                                        <span className="font-mono text-xs">{submission.submitterIp}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                            <Select value={submission.status} onValueChange={handleUpdateStatus}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SUBMITTED">Submitted</SelectItem>
                                    <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                                    <SelectItem value="APPROVED">Approved</SelectItem>
                                    <SelectItem value="REJECTED">Rejected</SelectItem>
                                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Form Responses */}
            <Card>
                <CardHeader>
                    <CardTitle>Form Responses</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        {submission.values.map((value, idx) => {
                            const isFileUpload = value.fileUrl || (value.value && (value.value.startsWith('http') || value.value.includes('minio')));
                            const isImage = isFileUpload && value.value && /\.(jpg|jpeg|png|gif|webp)$/i.test(value.value);

                            return (
                                <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                                    <Label className="text-sm font-semibold text-gray-700">{value.fieldLabel}</Label>
                                    <p className="text-xs text-gray-400 mb-2">Key: {value.fieldKey}</p>

                                    {isFileUpload ? (
                                        <div className="mt-2">
                                            {isImage ? (
                                                <div className="space-y-2">
                                                    <img
                                                        src={value.fileUrl || value.value}
                                                        alt={value.fieldLabel}
                                                        className="max-w-md rounded border"
                                                    />
                                                    <a
                                                        href={value.fileUrl || value.value}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 text-blue-600 text-sm hover:underline"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        Download Image
                                                    </a>
                                                </div>
                                            ) : (
                                                <a
                                                    href={value.fileUrl || value.value}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Download File
                                                </a>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="mt-1 text-gray-900 whitespace-pre-wrap bg-white p-3 rounded border">
                                            {value.value || <span className="text-gray-400 italic">No answer</span>}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Review Notes */}
            <Card>
                <CardHeader>
                    <CardTitle>Review Notes</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={4}
                        placeholder="Add internal notes about this submission..."
                        className="mb-4"
                    />
                    <Button onClick={handleSaveNotes}>
                        Save Notes
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
