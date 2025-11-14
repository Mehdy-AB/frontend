/**
 * WorkflowStepEditor - Modal for editing a single workflow step
 */

import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { AssignmentManager } from './AssignmentManager';
import { WorkflowTaskDetail } from '../../types/workflow-admin';

interface WorkflowStepEditorProps {
  step: WorkflowTaskDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (step: WorkflowTaskDetail) => void;
}

export const WorkflowStepEditor: React.FC<WorkflowStepEditorProps> = ({
  step,
  isOpen,
  onClose,
  onSave,
}) => {
  const [editedStep, setEditedStep] = useState<WorkflowTaskDetail | null>(null);

  useEffect(() => {
    if (step) {
      setEditedStep({ ...step });
    }
  }, [step]);

  const handleSave = () => {
    if (editedStep) {
      onSave(editedStep);
      onClose();
    }
  };

  if (!isOpen || !editedStep) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        {/* Modal */}
        <div className="inline-block w-full max-w-3xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {editedStep.id ? 'Edit Workflow Step' : 'New Workflow Step'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Step Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Step Name *
              </label>
              <input
                type="text"
                value={editedStep.name}
                onChange={(e) => setEditedStep({ ...editedStep, name: e.target.value })}
                placeholder="e.g., Manager Approval"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sequence */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sequence Order *
              </label>
              <input
                type="number"
                value={editedStep.sequence}
                onChange={(e) => setEditedStep({ ...editedStep, sequence: parseInt(e.target.value) || 0 })}
                min={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                The order in which this step appears in the workflow
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={editedStep.description || ''}
                onChange={(e) => setEditedStep({ ...editedStep, description: e.target.value })}
                placeholder="Describe what happens in this step..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Assignments */}
            <div>
              <AssignmentManager
                assignments={editedStep.assignments}
                onChange={(assignments) => setEditedStep({ ...editedStep, assignments })}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!editedStep.name.trim() || editedStep.sequence < 1}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              Save Step
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

