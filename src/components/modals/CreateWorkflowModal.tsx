'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { UserDto, RoleDto, GroupDto } from '@/types/api';
import { Plus, X, Users, Shield, User } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { notificationApiClient } from '@/api/notificationClient';
import { workflowAdminService } from '@/api/services/workflowAdminService';
import { useNotifications } from '@/hooks/useNotifications';
import { CreateWorkflowRequest, CreateWorkflowStepRequest, CreateStepAssignmentRequest } from '@/types/api';

interface CreateWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateWorkflowModal({
  isOpen,
  onClose,
  onSuccess
}: CreateWorkflowModalProps) {
  const { showSuccess, showError } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(true);

  const [formData, setFormData] = useState<CreateWorkflowRequest>({
    name: '',
    description: '',
    isActive: true,
    trigger: {
      triggerType: 'FOLDER',
      folderId: undefined,
      categoryId: undefined
    },
    steps: [
      {
        name: '',
        description: '',
        stepOrder: 1,
        isRequired: true,
        allowParallelApproval: false,
        assignments: [
          {
            assigneeType: 'USER',
            assigneeId: '',
            canEdit: true,
          }
        ]
      }
    ]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch users, roles, and groups
  useEffect(() => {
    if (!isOpen) return;

    const fetchEntities = async () => {
      try {
        setLoadingEntities(true);
        const [usersRes, rolesRes, groupsRes] = await Promise.all([
          notificationApiClient.getAllUsers({ page: 0, size: 1000, desc: false }),
          notificationApiClient.getAllRoles({ page: 0, size: 1000, desc: false }),
          notificationApiClient.getAllGroups({ page: 0, size: 1000, desc: false }),
        ]);
        setUsers(usersRes.content || []);
        setRoles(rolesRes.content || []);
        setGroups(groupsRes.content || []);
      } catch (error) {
        console.error('Error fetching entities:', error);
      } finally {
        setLoadingEntities(false);
      }
    };

    fetchEntities();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Workflow name is required';
    }

    if (formData.steps.length === 0) {
      newErrors.steps = 'At least one step is required';
    }

    formData.steps.forEach((step, stepIndex) => {
      if (!step.name.trim()) {
        newErrors[`step_${stepIndex}_name`] = 'Step name is required';
      }
      if (step.assignments.length === 0) {
        newErrors[`step_${stepIndex}_assignments`] = 'At least one assignment is required';
      }
      step.assignments.forEach((assignment, assignIndex) => {
        if (!assignment.assigneeId) {
          newErrors[`step_${stepIndex}_assign_${assignIndex}_id`] = 'Assignee is required';
        }
      });
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      await workflowAdminService.createWorkflow(formData);
      showSuccess('Workflow created successfully');
      handleReset();
      onClose();
      onSuccess?.();
    } catch (error: any) {
      showError('Failed to create workflow', error?.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true,
      trigger: {
        triggerType: 'FOLDER',
        folderId: undefined,
        categoryId: undefined
      },
      steps: [
        {
          name: '',
          description: '',
          stepOrder: 1,
          isRequired: true,
          allowParallelApproval: false,
          assignments: [
            {
              assigneeType: 'USER',
              assigneeId: '',
              canEdit: true,
            }
          ]
        }
      ]
    });
    setErrors({});
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [
        ...formData.steps,
        {
          name: '',
          description: '',
          stepOrder: formData.steps.length + 1,
          isRequired: true,
          allowParallelApproval: false,
          assignments: [
            {
              assigneeType: 'USER',
              assigneeId: '',
              canEdit: true,
            }
          ]
        }
      ]
    });
  };

  const removeStep = (index: number) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    const updatedSteps = newSteps.map((step, i) => ({
      ...step,
      stepOrder: i + 1
    }));
    setFormData({
      ...formData,
      steps: updatedSteps
    });
  };

  const updateStep = (index: number, field: keyof CreateWorkflowStepRequest, value: any) => {
    const newSteps = [...formData.steps];
    newSteps[index] = {
      ...newSteps[index],
      [field]: value
    };
    setFormData({
      ...formData,
      steps: newSteps
    });
  };

  const addAssignment = (stepIndex: number) => {
    const newSteps = [...formData.steps];
    newSteps[stepIndex].assignments.push({
      assigneeType: 'USER',
      assigneeId: '',
      canEdit: true,
    });
    setFormData({
      ...formData,
      steps: newSteps
    });
  };

  const removeAssignment = (stepIndex: number, assignIndex: number) => {
    const newSteps = [...formData.steps];
    newSteps[stepIndex].assignments = newSteps[stepIndex].assignments.filter(
      (_, i) => i !== assignIndex
    );
    setFormData({
      ...formData,
      steps: newSteps
    });
  };

  const updateAssignment = (
    stepIndex: number,
    assignIndex: number,
    field: keyof CreateStepAssignmentRequest,
    value: any
  ) => {
    const newSteps = [...formData.steps];
    newSteps[stepIndex].assignments[assignIndex] = {
      ...newSteps[stepIndex].assignments[assignIndex],
      [field]: value
    };
    setFormData({
      ...formData,
      steps: newSteps
    });
  };

  const getAssigneeOptions = (type: 'USER' | 'ROLE' | 'GROUP') => {
    switch (type) {
      case 'USER':
        return users;
      case 'ROLE':
        return roles;
      case 'GROUP':
        return groups;
      default:
        return [];
    }
  };

  const getAssigneeName = (type: 'USER' | 'ROLE' | 'GROUP', id: string) => {
    const options = getAssigneeOptions(type);
    const item = options.find(item =>
      (type === 'USER' ? (item as UserDto).id : (item as RoleDto | GroupDto).id) === id
    );
    if (type === 'USER') {
      return (item as UserDto)?.displayName || (item as UserDto)?.username || '';
    }
    return (item as RoleDto | GroupDto)?.name || '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Workflow</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Workflow Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Workflow Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Document Approval Workflow"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the workflow purpose..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active (workflow can be used)
              </Label>
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Workflow Steps *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStep}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </div>

            {errors.steps && (
              <p className="text-sm text-red-500">{errors.steps}</p>
            )}

            <div className="space-y-4">
              {formData.steps.map((step, stepIndex) => (
                <div
                  key={stepIndex}
                  className="border rounded-lg p-4 space-y-4 relative"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      Step {step.stepOrder}
                    </span>
                    {formData.steps.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(stepIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`step_${stepIndex}_name`}>Step Name *</Label>
                      <Input
                        id={`step_${stepIndex}_name`}
                        value={step.name}
                        onChange={(e) => updateStep(stepIndex, 'name', e.target.value)}
                        placeholder="e.g., Manager Approval"
                        className={errors[`step_${stepIndex}_name`] ? 'border-red-500' : ''}
                      />
                      {errors[`step_${stepIndex}_name`] && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors[`step_${stepIndex}_name`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`step_${stepIndex}_order`}>Step Order</Label>
                      <Input
                        id={`step_${stepIndex}_order`}
                        type="number"
                        value={step.stepOrder}
                        onChange={(e) => updateStep(stepIndex, 'stepOrder', parseInt(e.target.value) || 1)}
                        min={1}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`step_${stepIndex}_description`}>Step Description</Label>
                    <Textarea
                      id={`step_${stepIndex}_description`}
                      value={step.description || ''}
                      onChange={(e) => updateStep(stepIndex, 'description', e.target.value)}
                      placeholder="Describe what this step does..."
                      rows={2}
                    />
                  </div>

                  {/* Assignments */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Assignments *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addAssignment(stepIndex)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Assignee
                      </Button>
                    </div>

                    {errors[`step_${stepIndex}_assignments`] && (
                      <p className="text-sm text-red-500">
                        {errors[`step_${stepIndex}_assignments`]}
                      </p>
                    )}

                    <div className="space-y-2">
                      {step.assignments.map((assignment, assignIndex) => (
                        <div
                          key={assignIndex}
                          className="flex gap-2 items-start p-2 border rounded bg-muted/30"
                        >
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Assignee Type</Label>
                              <Select
                                value={assignment.assigneeType}
                                onValueChange={(value: 'USER' | 'ROLE' | 'GROUP') => {
                                  updateAssignment(stepIndex, assignIndex, 'assigneeType', value);
                                  updateAssignment(stepIndex, assignIndex, 'assigneeId', '');
                                }}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="USER">
                                    <div className="flex items-center gap-2">
                                      <User className="h-3 w-3" />
                                      User
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="ROLE">
                                    <div className="flex items-center gap-2">
                                      <Shield className="h-3 w-3" />
                                      Role
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="GROUP">
                                    <div className="flex items-center gap-2">
                                      <Users className="h-3 w-3" />
                                      Group
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-xs">Assignee</Label>
                              <Select
                                value={assignment.assigneeId}
                                onValueChange={(value) => updateAssignment(stepIndex, assignIndex, 'assigneeId', value)}
                                disabled={loadingEntities}
                              >
                                <SelectTrigger
                                  className={`h-8 ${errors[`step_${stepIndex}_assign_${assignIndex}_id`] ? 'border-red-500' : ''}`}
                                >
                                  <SelectValue placeholder="Select assignee" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getAssigneeOptions(assignment.assigneeType).map((item) => {
                                    const id = assignment.assigneeType === 'USER'
                                      ? (item as UserDto).id
                                      : (item as RoleDto | GroupDto).id;
                                    const name = assignment.assigneeType === 'USER'
                                      ? (item as UserDto).displayName || (item as UserDto).username
                                      : (item as RoleDto | GroupDto).name;
                                    return (
                                      <SelectItem key={id} value={id}>
                                        {name}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                              {errors[`step_${stepIndex}_assign_${assignIndex}_id`] && (
                                <p className="text-xs text-red-500 mt-1">
                                  {errors[`step_${stepIndex}_assign_${assignIndex}_id`]}
                                </p>
                              )}
                            </div>
                          </div>

                          {step.assignments.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAssignment(stepIndex, assignIndex)}
                              className="mt-6"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleReset();
                onClose();
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || loadingEntities}>
              {isLoading ? 'Creating...' : 'Create Workflow'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
