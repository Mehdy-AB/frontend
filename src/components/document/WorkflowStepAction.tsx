'use client';

import { useState, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  Info,
  ChevronDown,
  ChevronUp,
  Upload,
  FileIcon,
  X,
  Loader2
} from 'lucide-react';
import { WorkflowNodeInstanceResponse, CompleteStepRequest, RejectStepRequest, TaskFormField } from '@/types/workflow';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { documentService } from '@/api/services/documentService';
import { linkRuleService } from '@/api/services/linkRuleService';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import UserAvatar from '@/components/main/UserAvatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface WorkflowStepActionProps {
  stepInstance: WorkflowNodeInstanceResponse;
  onComplete?: () => void;
}

// Get node type badge styling
const getNodeTypeBadge = (nodeType?: string) => {
  switch (nodeType) {
    case 'APPROVAL':
      return { label: 'Approval Required', className: 'bg-blue-100 text-blue-700 border-blue-200' };
    case 'REVIEW':
      return { label: 'Review Required', className: 'bg-purple-100 text-purple-700 border-purple-200' };
    case 'MANUAL_TASK':
      return { label: 'Task', className: 'bg-amber-100 text-amber-700 border-amber-200' };
    case 'MULTI_CHOICE':
      return { label: 'Choice Required', className: 'bg-teal-100 text-teal-700 border-teal-200' };
    default:
      return { label: 'Action Required', className: 'bg-gray-100 text-gray-700 border-gray-200' };
  }
};

// Calculate duration from startedAt to now
const getDuration = (startedAt?: string) => {
  if (!startedAt) return null;

  const start = new Date(startedAt);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h`;
  } else if (diffHours > 0) {
    return `${diffHours}h ${diffMins % 60}m`;
  } else if (diffMins > 0) {
    return `${diffMins}m`;
  }
  return 'Just started';
};

export default function WorkflowStepAction({ stepInstance, onComplete }: WorkflowStepActionProps) {
  const { showSuccess, showError } = useNotifications();
  const [comment, setComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formExpanded, setFormExpanded] = useState(true);
  const [activeAction, setActiveAction] = useState<'idle' | 'approve' | 'reject' | 'choice'>('idle');

  // File upload state: fieldKey -> File object
  const [fileUploads, setFileUploads] = useState<Record<string, File>>({});
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Get form fields from step instance (from node config)
  const formFields: TaskFormField[] = stepInstance.formFields || stepInstance.config?.formFields || [];
  const rejectFormFields: TaskFormField[] = (stepInstance as any).rejectFormFields || stepInstance.config?.rejectFormFields || [];

  // Determine which form fields to show based on active action
  const getActiveFormFields = (): TaskFormField[] => {
    if (activeAction === 'reject') {
      return rejectFormFields;
    }
    if (activeAction === 'choice' && selectedChoiceId !== null) {
      // Find per-choice form fields
      const choices: any[] = (stepInstance as any).choices || (stepInstance as any).config?.choices || [];
      const selectedChoice = choices.find((c: any) => c.id === selectedChoiceId);
      return selectedChoice?.formFields || [];
    }
    // Default: approve or general form fields
    return formFields;
  };

  const activeFormFields = getActiveFormFields();
  const hasActiveForm = activeFormFields.length > 0;

  const validateFormFields = (fields: TaskFormField[]): boolean => {
    const errors: Record<string, string> = {};
    for (const field of fields) {
      const value = formValues[field.fieldKey];
      if (field.type === 'FILE') {
        // FILE fields validate against fileUploads state
        if (field.isRequired && !fileUploads[field.fieldKey]) {
          errors[field.fieldKey] = `${field.label} is required`;
        }
      } else {
        if (field.isRequired && (value === undefined || value === null || value === '')) {
          errors[field.fieldKey] = `${field.label} is required`;
        }
        if (field.type === 'EMAIL' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
          errors[field.fieldKey] = 'Invalid email address';
        }
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Upload file fields and link them as attachments to the origin document
  const processFileUploads = async (fields: TaskFormField[]): Promise<Record<string, any>> => {
    const fileFields = fields.filter(f => f.type === 'FILE');
    if (fileFields.length === 0) return {};

    const documentId = stepInstance.documentId;
    // Get the origin document's folder
    let folderId = 1; // fallback
    if (stepInstance.document?.folderId) {
      folderId = stepInstance.document.folderId;
    }

    const uploadedIds: Record<string, any> = {};

    for (const field of fileFields) {
      const file = fileUploads[field.fieldKey];
      if (!file) continue;

      try {
        // Upload the file to the same folder as the origin document
        const uploadResult = await documentService.uploadDocument(
          file,
          folderId,
          file.name.replace(/\.[^/.]+$/, ''), // title = filename without extension
          'ENG'
        );

        // Link the uploaded document as an attachment to the origin document
        if (documentId && uploadResult?.documentId) {
          await linkRuleService.createDocumentLink({
            sourceDocumentId: documentId,
            targetDocumentId: uploadResult.documentId,
            relationType: 'ATTACHMENT' as any,
            description: `Attached via workflow task: ${stepInstance.nodeName} - ${field.label}`,
          });
        }

        uploadedIds[field.fieldKey] = uploadResult?.documentId;
      } catch (err: any) {
        throw new Error(`Failed to upload ${file.name}: ${err?.message || 'Unknown error'}`);
      }
    }

    return uploadedIds;
  };

  const handleComplete = async (choiceId?: number) => {
    const fieldsToValidate = getActiveFormFields();
    if (fieldsToValidate.length > 0 && !validateFormFields(fieldsToValidate)) {
      return;
    }

    try {
      setLoading(true);
      setUploadingFiles(true);

      // Process file uploads first
      const uploadedFileIds = await processFileUploads(fieldsToValidate);
      const mergedFormValues = { ...formValues, ...uploadedFileIds };

      setUploadingFiles(false);

      const request: CompleteStepRequest = {
        comment: comment || undefined,
        chosenOptionId: choiceId ?? selectedChoiceId ?? undefined,
        formData: fieldsToValidate.length > 0 ? mergedFormValues : undefined,
      };
      await workflowAdminService.completeNode(stepInstance.id, request);
      showSuccess('Step completed successfully');
      resetState();
      onComplete?.();
    } catch (error: any) {
      setUploadingFiles(false);
      showError('Failed to complete step', error?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showError('Rejection reason is required');
      return;
    }

    // Validate reject form fields
    if (rejectFormFields.length > 0 && !validateFormFields(rejectFormFields)) {
      return;
    }

    try {
      setLoading(true);
      const request: RejectStepRequest = {
        rejectionReason: rejectionReason.trim(),
        formData: rejectFormFields.length > 0 ? formValues : undefined,
      };
      await workflowAdminService.rejectNode(stepInstance.id, request);
      showSuccess('Step rejected');
      resetState();
      onComplete?.();
    } catch (error: any) {
      showError('Failed to reject step', error?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setComment('');
    setRejectionReason('');
    setSelectedChoiceId(null);
    setFormValues({});
    setFormErrors({});
    setFileUploads({});
    setActiveAction('idle');
  };

  const updateFormValue = (fieldKey: string, value: any) => {
    setFormValues(prev => ({ ...prev, [fieldKey]: value }));
    if (formErrors[fieldKey]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
    }
  };

  // Render a form field based on its type
  const renderFormField = (field: TaskFormField) => {
    const value = formValues[field.fieldKey];
    const error = formErrors[field.fieldKey];

    const fieldContent = (() => {
      switch (field.type) {
        case 'TEXT':
          return (
            <Textarea
              value={value || ''}
              onChange={(e) => updateFormValue(field.fieldKey, e.target.value)}
              placeholder={field.placeholder || ''}
              rows={3}
              className={error ? 'border-red-300' : ''}
            />
          );
        case 'NUMBER':
          return (
            <Input
              type="number"
              value={value ?? ''}
              onChange={(e) => updateFormValue(field.fieldKey, e.target.value ? parseInt(e.target.value) : '')}
              placeholder={field.placeholder || ''}
              className={error ? 'border-red-300' : ''}
            />
          );
        case 'DECIMAL':
          return (
            <Input
              type="number"
              step="0.01"
              value={value ?? ''}
              onChange={(e) => updateFormValue(field.fieldKey, e.target.value ? parseFloat(e.target.value) : '')}
              placeholder={field.placeholder || ''}
              className={error ? 'border-red-300' : ''}
            />
          );
        case 'EMAIL':
          return (
            <Input
              type="email"
              value={value || ''}
              onChange={(e) => updateFormValue(field.fieldKey, e.target.value)}
              placeholder={field.placeholder || 'email@example.com'}
              className={error ? 'border-red-300' : ''}
            />
          );
        case 'DATE':
          return (
            <Input
              type="date"
              value={value || ''}
              onChange={(e) => updateFormValue(field.fieldKey, e.target.value)}
              className={error ? 'border-red-300' : ''}
            />
          );
        case 'TIME':
          return (
            <Input
              type="time"
              value={value || ''}
              onChange={(e) => updateFormValue(field.fieldKey, e.target.value)}
              className={error ? 'border-red-300' : ''}
            />
          );
        case 'DATETIME':
          return (
            <Input
              type="datetime-local"
              value={value || ''}
              onChange={(e) => updateFormValue(field.fieldKey, e.target.value)}
              className={error ? 'border-red-300' : ''}
            />
          );
        case 'BOOLEAN':
          return (
            <div className="flex items-center gap-2 py-1">
              <Switch
                checked={!!value}
                onCheckedChange={(checked) => updateFormValue(field.fieldKey, checked)}
              />
              <span className="text-sm text-gray-500">{value ? 'Yes' : 'No'}</span>
            </div>
          );
        case 'FILE':
          return (
            <div className="space-y-2">
              {fileUploads[field.fieldKey] ? (
                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <FileIcon className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-green-800 truncate flex-1">
                    {fileUploads[field.fieldKey].name}
                  </span>
                  <span className="text-xs text-green-600 flex-shrink-0">
                    {(fileUploads[field.fieldKey].size / 1024).toFixed(1)} KB
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    onClick={() => {
                      setFileUploads(prev => {
                        const next = { ...prev };
                        delete next[field.fieldKey];
                        return next;
                      });
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors hover:border-blue-400 hover:bg-blue-50/50 ${error ? 'border-red-300 bg-red-50/30' : 'border-gray-300'
                    }`}
                  onClick={() => fileInputRefs.current[field.fieldKey]?.click()}
                >
                  <Upload className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                  <p className="text-xs text-gray-500">Click to browse or drag a file</p>
                  <p className="text-xs text-gray-400 mt-0.5">{field.placeholder || 'Any file type'}</p>
                </div>
              )}
              <input
                ref={(el) => { fileInputRefs.current[field.fieldKey] = el; }}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) {
                    setFileUploads(prev => ({ ...prev, [field.fieldKey]: selectedFile }));
                    // Clear error if exists
                    if (formErrors[field.fieldKey]) {
                      setFormErrors(prev => {
                        const next = { ...prev };
                        delete next[field.fieldKey];
                        return next;
                      });
                    }
                  }
                  // Reset input so same file can be selected again
                  e.target.value = '';
                }}
              />
            </div>
          );
        default: // STRING
          return (
            <Input
              type="text"
              value={value || ''}
              onChange={(e) => updateFormValue(field.fieldKey, e.target.value)}
              placeholder={field.placeholder || ''}
              className={error ? 'border-red-300' : ''}
            />
          );
      }
    })();

    return (
      <div key={field.fieldKey}>
        <Label htmlFor={field.fieldKey} className="flex items-center gap-1 text-sm">
          {field.label}
          {field.isRequired && <span className="text-red-500">*</span>}
        </Label>
        <div className="mt-1">{fieldContent}</div>
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      </div>
    );
  };

  // Only render for actionable statuses (ACTIVE or SCHEDULED)
  if (stepInstance.status !== 'ACTIVE' && stepInstance.status !== 'SCHEDULED') {
    return null;
  }

  const isOverdue = stepInstance.isOverdue;
  const nodeType = stepInstance.nodeType;
  const typeBadge = getNodeTypeBadge(nodeType);
  const duration = getDuration(stepInstance.startedAt);

  const isApprovalNode = nodeType === 'APPROVAL';
  const isMultiChoiceNode = nodeType === 'MULTI_CHOICE';

  // Get choices for multi-choice nodes
  const multiChoiceOptions: { id: number; label: string; formFields?: TaskFormField[] }[] =
    (stepInstance as any).choices ||
    (stepInstance as any).config?.choices ||
    [{ id: 1, label: 'Continue' }];

  // Check if any action has form fields
  const hasApproveFormFields = formFields.length > 0;
  const hasRejectFormFields = rejectFormFields.length > 0;
  const hasChoiceFormFields = multiChoiceOptions.some((c: any) => c.formFields && c.formFields.length > 0);

  // Determine if we need to show an inline form for a given action
  const needsFormForAction = (action: 'approve' | 'reject' | 'choice', choiceId?: number): boolean => {
    if (action === 'approve') return hasApproveFormFields;
    if (action === 'reject') return hasRejectFormFields;
    if (action === 'choice' && choiceId) {
      const choice = multiChoiceOptions.find(c => c.id === choiceId);
      return !!(choice?.formFields && choice.formFields.length > 0);
    }
    return false;
  };

  const handleActionClick = (action: 'approve' | 'reject' | 'choice', choiceId?: number) => {
    // Reset form state for new action
    setFormValues({});
    setFormErrors({});
    setComment('');
    setRejectionReason('');

    if (action === 'choice' && choiceId !== undefined) {
      setSelectedChoiceId(choiceId);
      if (needsFormForAction('choice', choiceId)) {
        setActiveAction('choice');
        setFormExpanded(true);
      } else {
        // No form fields for this choice, complete directly
        handleComplete(choiceId);
      }
    } else if (action === 'approve') {
      if (hasApproveFormFields) {
        setActiveAction('approve');
        setFormExpanded(true);
      } else {
        handleComplete();
      }
    } else if (action === 'reject') {
      setActiveAction('reject');
      setFormExpanded(true);
    }
  };

  // Build the inline form section title
  const getFormTitle = () => {
    if (activeAction === 'reject') return 'Reject — Fill Required Information';
    if (activeAction === 'choice' && selectedChoiceId !== null) {
      const choice = multiChoiceOptions.find(c => c.id === selectedChoiceId);
      return `${choice?.label || 'Choice'} — Fill Required Information`;
    }
    if (activeAction === 'approve') {
      return isApprovalNode ? 'Approve — Fill Required Information' : 'Complete — Fill Required Information';
    }
    return 'Fill Required Information';
  };

  const showInlineForm = activeAction !== 'idle' && (hasActiveForm || activeAction === 'reject');

  return (
    <>
      {/* Notification Banner with inline form */}
      <div className={`w-full rounded-lg border-2 mb-4 ${isOverdue
        ? 'border-red-300 bg-gradient-to-r from-red-50 to-white'
        : 'border-blue-300 bg-gradient-to-r from-blue-50 to-white'
        }`}>
        {/* Header row */}
        <div className="px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            {/* Left side: Icon, Type, Name, Description */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {isOverdue ? (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={typeBadge.className}>
                    {typeBadge.label}
                  </Badge>
                  <span className="font-semibold text-gray-900 truncate">
                    {stepInstance.nodeName}
                  </span>
                  {stepInstance.workflowName && (
                    <span className="text-xs text-gray-500">
                      ({stepInstance.workflowName})
                    </span>
                  )}
                </div>

                {stepInstance.description && (
                  <div className="mt-1.5 text-sm text-gray-700 bg-white/60 rounded px-2 py-1 border border-gray-100">
                    <Info className="h-3.5 w-3.5 inline-block mr-1 text-blue-500" />
                    {stepInstance.description}
                  </div>
                )}

                <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-gray-600">
                  {duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Active: {duration}</span>
                    </div>
                  )}
                  {stepInstance.dueDate && (
                    <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                      <Calendar className="h-3 w-3" />
                      <span>Due: {new Date(stepInstance.dueDate).toLocaleDateString()}</span>
                      {isOverdue && <span className="ml-1">(Overdue)</span>}
                    </div>
                  )}
                  {stepInstance.assignments && stepInstance.assignments.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Assigned to:</span>
                      <div className="flex items-center gap-1.5">
                        <TooltipProvider>
                          {stepInstance.assignments.slice(0, 3).map((assignment) => (
                            <Tooltip key={assignment.id}>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 cursor-pointer">
                                  <UserAvatar
                                    user={assignment.user ? {
                                      id: assignment.user.id,
                                      username: assignment.user.username,
                                      email: assignment.user.email,
                                      firstName: assignment.user.firstName,
                                      lastName: assignment.user.lastName,
                                      displayName: assignment.user.displayName,
                                      imgUrl: assignment.user.imgUrl,
                                      imageUrl: assignment.user.imageUrl,
                                    } : null}
                                    size="xs"
                                  />
                                  <span className="text-gray-700 font-medium">
                                    {assignment.assigneeName || assignment.user?.displayName || 'Unknown'}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="text-xs">
                                <div className="space-y-0.5">
                                  <div className="font-semibold">
                                    {assignment.assigneeName || assignment.user?.displayName || 'Unknown'}
                                  </div>
                                  {assignment.user?.username && (
                                    <div className="text-gray-400">@{assignment.user.username}</div>
                                  )}
                                  {assignment.user?.email && (
                                    <div className="text-gray-400">{assignment.user.email}</div>
                                  )}
                                  {assignment.role && (
                                    <div className="text-purple-400">Role: {assignment.role.name}</div>
                                  )}
                                  {assignment.group && (
                                    <div className="text-green-400">Group: {assignment.group.name}</div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </TooltipProvider>
                        {stepInstance.assignments.length > 3 && (
                          <span className="text-gray-500 text-xs">
                            +{stepInstance.assignments.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side: Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {activeAction !== 'idle' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetState}
                  className="text-gray-500 text-xs"
                >
                  Cancel
                </Button>
              )}

              {activeAction === 'idle' && (
                <>
                  {isMultiChoiceNode ? (
                    <>
                      {multiChoiceOptions.map((choice) => (
                        <Button
                          key={choice.id}
                          onClick={() => handleActionClick('choice', choice.id)}
                          size="sm"
                          disabled={loading}
                          variant={choice.id === 1 ? 'default' : 'outline'}
                          className={choice.id === 1
                            ? 'bg-teal-600 hover:bg-teal-700 text-white'
                            : 'border-teal-300 text-teal-700 hover:bg-teal-50'
                          }
                        >
                          {choice.label}
                        </Button>
                      ))}
                    </>
                  ) : isApprovalNode ? (
                    <>
                      <Button
                        onClick={() => handleActionClick('reject')}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleActionClick('approve')}
                        size="sm"
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => {
                        if (hasApproveFormFields) {
                          handleActionClick('approve');
                        } else {
                          handleComplete();
                        }
                      }}
                      size="sm"
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      {loading ? 'Processing...' : 'Done'}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Inline Form Section */}
        {showInlineForm && formExpanded && (
          <div className={`border-t rounded-b-lg ${activeAction === 'reject'
            ? 'border-red-200 bg-red-50/50'
            : 'border-blue-200 bg-white/80'
            }`}>
            <div className="px-4 py-4 space-y-4">
              {/* Form Header */}
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${activeAction === 'reject' ? 'text-red-700' : 'text-gray-700'}`}>
                  {getFormTitle()}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormExpanded(!formExpanded)}
                  className="text-gray-400"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>

              {/* Dynamic Form Fields */}
              {activeFormFields.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeFormFields.map(renderFormField)}
                </div>
              )}

              {/* Rejection Reason (only for reject action) */}
              {activeAction === 'reject' && (
                <div>
                  <Label htmlFor="inline-reject-reason" className="text-sm">
                    Rejection Reason <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="inline-reject-reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    rows={2}
                    className="mt-1 border-red-200"
                  />
                </div>
              )}

              {/* Comment (for approve/choice/done) */}
              {activeAction !== 'reject' && (
                <div>
                  <Label htmlFor="inline-comment" className="text-sm">Comment (Optional)</Label>
                  <Textarea
                    id="inline-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={2}
                    className="mt-1"
                  />
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetState}
                >
                  Cancel
                </Button>

                {activeAction === 'reject' ? (
                  <Button
                    onClick={handleReject}
                    size="sm"
                    disabled={loading || !rejectionReason.trim()}
                    variant="destructive"
                  >
                    {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
                    {loading ? 'Processing...' : 'Reject'}
                  </Button>
                ) : activeAction === 'choice' ? (
                  <Button
                    onClick={() => handleComplete(selectedChoiceId ?? undefined)}
                    size="sm"
                    disabled={loading}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                    {uploadingFiles ? 'Uploading files...' : loading ? 'Processing...' : `Submit ${multiChoiceOptions.find(c => c.id === selectedChoiceId)?.label || ''}`}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleComplete()}
                    size="sm"
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                    {uploadingFiles ? 'Uploading files...' : loading ? 'Processing...' : (isApprovalNode ? 'Approve' : 'Complete')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
