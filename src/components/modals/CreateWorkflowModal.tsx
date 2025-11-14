'use client';

import React, { useState } from 'react';
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
import { RoleDto } from '@/types/api';
import { Plus, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface CreateWorkflowData {
  name: string;
  description?: string;
  conditional: boolean;
  steps: WorkflowStepData[];
}

export interface WorkflowStepData {
  name: string;
  sequence: number;
  approverRole: string;
  description?: string;
}

interface CreateWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWorkflowData) => void;
  isLoading: boolean;
  roles: RoleDto[];
}

export default function CreateWorkflowModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  roles
}: CreateWorkflowModalProps) {
  const [formData, setFormData] = useState<CreateWorkflowData>({
    name: '',
    description: '',
    conditional: false,
    steps: [
      {
        name: '',
        sequence: 1,
        approverRole: '',
        description: ''
      }
    ]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Workflow name is required';
    }
    
    if (formData.steps.length === 0) {
      newErrors.steps = 'At least one step is required';
    }
    
    formData.steps.forEach((step, index) => {
      if (!step.name.trim()) {
        newErrors[`step_${index}_name`] = 'Step name is required';
      }
      if (!step.approverRole) {
        newErrors[`step_${index}_role`] = 'Approver role is required';
      }
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSubmit(formData);
  };

  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      conditional: false,
      steps: [
        {
          name: '',
          sequence: 1,
          approverRole: '',
          description: ''
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
          sequence: formData.steps.length + 1,
          approverRole: '',
          description: ''
        }
      ]
    });
  };

  const removeStep = (index: number) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    // Update sequence numbers
    const updatedSteps = newSteps.map((step, i) => ({
      ...step,
      sequence: i + 1
    }));
    setFormData({
      ...formData,
      steps: updatedSteps
    });
  };

  const updateStep = (index: number, field: keyof WorkflowStepData, value: string | number) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                id="conditional"
                checked={formData.conditional}
                onCheckedChange={(checked) => setFormData({ ...formData, conditional: checked })}
              />
              <Label htmlFor="conditional" className="cursor-pointer">
                Conditional Workflow (allows branching based on conditions)
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
              {formData.steps.map((step, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-3 relative"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      Step {step.sequence}
                    </span>
                    {formData.steps.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`step_${index}_name`}>Step Name *</Label>
                      <Input
                        id={`step_${index}_name`}
                        value={step.name}
                        onChange={(e) => updateStep(index, 'name', e.target.value)}
                        placeholder="e.g., Manager Approval"
                        className={errors[`step_${index}_name`] ? 'border-red-500' : ''}
                      />
                      {errors[`step_${index}_name`] && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors[`step_${index}_name`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`step_${index}_role`}>Approver Role *</Label>
                      <Select
                        value={step.approverRole}
                        onValueChange={(value) => updateStep(index, 'approverRole', value)}
                      >
                        <SelectTrigger 
                          className={errors[`step_${index}_role`] ? 'border-red-500' : ''}
                        >
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.name} value={role.name || ''}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors[`step_${index}_role`] && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors[`step_${index}_role`]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`step_${index}_description`}>Step Description</Label>
                    <Textarea
                      id={`step_${index}_description`}
                      value={step.description}
                      onChange={(e) => updateStep(index, 'description', e.target.value)}
                      placeholder="Describe what this step does..."
                      rows={2}
                    />
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Workflow'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

