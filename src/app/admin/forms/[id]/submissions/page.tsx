'use client';

import React, { useState, useEffect } from 'react';
import { use } from 'react';
import {
  Users,
  UserX,
  Search,
  Filter,
  Download,
  Eye,
  Star,
  CheckCircle,
  XCircle,
  Trash2,
  MoreVertical,
  Loader2,
  Mail,
  Clock,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formService } from '@/api/services/formService';
import { FormSubmissionResponse } from '@/types/api';
import { useNotifications } from '@/hooks/useNotifications';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import UserAvatar from '@/components/main/UserAvatar';

export default function SubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { showSuccess, showError } = useNotifications();
  const [submissions, setSubmissions] = useState<FormSubmissionResponse[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<FormSubmissionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmissionResponse | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  // Fetch submissions
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await formService.getFormSubmissions(
        parseInt(id),
        page,
        20,
        statusFilter !== 'all' ? statusFilter : undefined
      );
      setSubmissions(response.content);
      setFilteredSubmissions(response.content);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      showError('Load Failed', 'Unable to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [id, page, statusFilter]);

  // Filter submissions
  useEffect(() => {
    let filtered = submissions;

    if (searchQuery) {
      filtered = filtered.filter(sub =>
        sub.submitterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.submitterEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.id.toString().includes(searchQuery)
      );
    }

    setFilteredSubmissions(filtered);
  }, [searchQuery, submissions]);

  const handleViewDetails = (submission: FormSubmissionResponse) => {
    // Navigate to detail page
    router.push(`/admin/forms/${id}/submissions/${submission.id}`);
  };

  const handleToggleStar = async (submissionId: number) => {
    try {
      await formService.toggleSubmissionStar(submissionId);
      showSuccess('Updated', 'Submission marked');
      fetchSubmissions();
    } catch (error: any) {
      showError('Update Failed', error.message);
    }
  };

  const handleUpdateStatus = async (submissionId: number, status: string) => {
    try {
      await formService.updateSubmissionStatus(submissionId, status);
      showSuccess('Status Updated', `Submission marked as ${status.toLowerCase()}`);
      fetchSubmissions();
    } catch (error: any) {
      showError('Update Failed', error.message);
    }
  };

  const handleSaveReviewNotes = async () => {
    if (!selectedSubmission) return;

    try {
      await formService.addReviewNotes(selectedSubmission.id, reviewNotes);
      showSuccess('Notes Saved', 'Review notes updated successfully');
      setShowDetailDialog(false);
      fetchSubmissions();
    } catch (error: any) {
      showError('Save Failed', error.message);
    }
  };

  const handleDelete = async (submissionId: number) => {
    if (!confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return;
    }

    try {
      await formService.deleteSubmission(submissionId);
      showSuccess('Deleted', 'Submission deleted successfully');
      fetchSubmissions();
    } catch (error: any) {
      showError('Delete Failed', error.message);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await formService.exportSubmissions(parseInt(id), 'csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `submissions-${id}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      showError('Export Failed', error.message);
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
    return (
      <Badge className={variant.color}>
        {variant.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Button variant="ghost" onClick={() => router.push('/admin/forms')}>
            ← Back to Forms
          </Button>
          <h1 className="text-3xl font-bold mt-2">Form Submissions</h1>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold mt-1">{submissions.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Submitted</p>
              <p className="text-2xl font-bold mt-1 text-blue-600">
                {submissions.filter(s => s.status === 'SUBMITTED').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Under Review</p>
              <p className="text-2xl font-bold mt-1 text-yellow-600">
                {submissions.filter(s => s.status === 'UNDER_REVIEW').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold mt-1 text-green-600">
                {submissions.filter(s => s.status === 'APPROVED').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-2xl font-bold mt-1 text-red-600">
                {submissions.filter(s => s.status === 'REJECTED').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'all'
                ? 'No submissions match your filters'
                : 'Submissions will appear here once users submit the form'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${!submission.isRead ? 'bg-blue-50' : ''
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Star button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={() => handleToggleStar(submission.id)}
                      >
                        <Star
                          className={`w-4 h-4 ${submission.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`}
                        />
                      </Button>

                      {/* User Avatar */}
                      {submission.submitter ? (
                        <UserAvatar
                          user={submission.submitter}
                          size="md"
                          showTooltip
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <UserX className="w-5 h-5 text-orange-600" />
                        </div>
                      )}

                      {/* Main Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">
                            {submission.submitter ? (
                              submission.submitterName ||
                              `${submission.submitter.firstName || ''} ${submission.submitter.lastName || ''}`.trim() ||
                              'User'
                            ) : submission.submitterName || 'Anonymous'}
                          </h3>
                          {!submission.submitter && (
                            <Badge className="bg-orange-100 text-orange-700 text-xs">Anonymous</Badge>
                          )}
                          {submission.submitter && (
                            <Badge className="bg-green-100 text-green-700 text-xs">Auth</Badge>
                          )}
                          {getStatusBadge(submission.status)}
                          {!submission.isRead && (
                            <Badge className="bg-blue-500 text-white text-xs">New</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                          {(submission.submitterEmail || submission.submitter?.email) && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[180px]">
                                {submission.submitterEmail || submission.submitter?.email}
                              </span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(submission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {submission.submitterIp && (
                            <span className="flex items-center gap-1 text-xs font-mono text-gray-400">
                              IP: {submission.submitterIp}
                            </span>
                          )}
                          {submission.completionTimeSeconds && (
                            <span className="flex items-center gap-1 text-xs">
                              ⏱ {Math.floor(submission.completionTimeSeconds / 60)}m {submission.completionTimeSeconds % 60}s
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(submission)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUpdateStatus(submission.id, 'UNDER_REVIEW')}>
                            <Clock className="w-4 h-4 mr-2" />
                            Mark Under Review
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(submission.id, 'APPROVED')}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(submission.id, 'REJECTED')}>
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(submission.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-6">
              {/* Submitter Info Card */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar/Icon */}
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${selectedSubmission.submitter
                      ? 'bg-blue-500 text-white'
                      : 'bg-orange-100 text-orange-600'
                      }`}>
                      {selectedSubmission.submitter ? (
                        <span className="text-xl font-bold">
                          {(selectedSubmission.submitterName || selectedSubmission.submitter?.firstName || 'U').charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <UserX className="w-6 h-6" />
                      )}
                    </div>

                    {/* User Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-lg">
                          {selectedSubmission.submitter ? (
                            selectedSubmission.submitterName ||
                            `${selectedSubmission.submitter?.firstName || ''} ${selectedSubmission.submitter?.lastName || ''}`.trim() ||
                            'Authenticated User'
                          ) : selectedSubmission.submitterName ? (
                            selectedSubmission.submitterName
                          ) : (
                            'Anonymous Visitor'
                          )}
                        </h4>
                        {!selectedSubmission.submitter && (
                          <Badge className="bg-orange-100 text-orange-700">Anonymous</Badge>
                        )}
                        {selectedSubmission.submitter && (
                          <Badge className="bg-green-100 text-green-700">Authenticated</Badge>
                        )}
                      </div>

                      {/* Contact Info */}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {selectedSubmission.submitterEmail || selectedSubmission.submitter?.email || 'No email provided'}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(selectedSubmission.submittedAt).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        {selectedSubmission.submitterIp && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="w-4 h-4 text-xs text-gray-400 font-mono">IP</span>
                            {selectedSubmission.submitterIp}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {new Date(selectedSubmission.submittedAt).toLocaleTimeString()}
                          {selectedSubmission.completionTimeSeconds && (
                            <span className="text-gray-400">
                              • {Math.floor(selectedSubmission.completionTimeSeconds / 60)}m {selectedSubmission.completionTimeSeconds % 60}s to complete
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="text-right">
                      {getStatusBadge(selectedSubmission.status)}
                      {!selectedSubmission.isRead && (
                        <Badge className="bg-blue-500 text-white ml-2">Unread</Badge>
                      )}
                      {selectedSubmission.isStarred && (
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 mt-2 ml-auto" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Form Data */}
              <div>
                <h3 className="font-semibold mb-3">Form Responses</h3>
                <div className="space-y-4">
                  {selectedSubmission.values.map((value, idx) => {
                    const isFileUpload = value.fileUrl || (value.value && (value.value.startsWith('http') || value.value.includes('minio')));
                    const isImage = isFileUpload && value.value && /\.(jpg|jpeg|png|gif|webp)$/i.test(value.value);

                    return (
                      <div key={idx} className="border-l-2 border-blue-500 pl-4">
                        <p className="text-sm font-medium text-gray-700">{value.fieldLabel}</p>

                        {isFileUpload ? (
                          <div className="mt-2">
                            {isImage ? (
                              <div className="space-y-2">
                                <img
                                  src={value.fileUrl || value.value}
                                  alt={value.fieldLabel}
                                  className="max-w-md rounded border"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                                <div className="hidden">
                                  <p className="text-sm text-gray-500">Image preview unavailable</p>
                                </div>
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
                                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                              >
                                <Download className="w-4 h-4" />
                                Download File
                              </a>
                            )}
                          </div>
                        ) : (
                          <p className="mt-1 whitespace-pre-wrap">{value.value || 'N/A'}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review Notes */}
              <div>
                <Label htmlFor="review-notes">Review Notes</Label>
                <Textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  placeholder="Add notes about this submission..."
                  className="mt-2"
                />
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                    Close
                  </Button>
                  <Button onClick={handleSaveReviewNotes}>
                    Save Notes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

