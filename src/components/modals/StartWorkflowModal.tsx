'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { workflowService } from '@/api/services/workflowService';
import { WorkflowResponse } from '@/types/api';
import { useNotifications } from '@/hooks/useNotifications';

interface StartWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: number;
  documentName: string;
  onSuccess?: () => void;
  onWorkflowStarted?: () => void;
}

export default function StartWorkflowModal({
  isOpen,
  onClose,
  documentId,
  documentName,
  onSuccess,
  onWorkflowStarted,
}: StartWorkflowModalProps) {
  const { showError, showSuccess } = useNotifications();
  const [workflows, setWorkflows] = useState<WorkflowResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const hasLoadedRef = useRef(false);

  // Load available active workflows
  useEffect(() => {
    if (isOpen && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      const loadWorkflows = async () => {
        try {
          setLoading(true);
          const response = await workflowService.getAllWorkflows(0, 100, undefined, true);
          setWorkflows(response.content || []);
        } catch (error) {
          console.error('Failed to load workflows:', error);
          showError('Error', 'Failed to load available workflows');
        } finally {
          setLoading(false);
        }
      };
      loadWorkflows();
    } else if (!isOpen) {
      // Reset state when modal closes
      hasLoadedRef.current = false;
      setSelectedWorkflowId(null);
      setNotes('');
      setWorkflows([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Only depend on isOpen

  const handleStart = async () => {
    if (!selectedWorkflowId) {
      showError('Validation Error', 'Please select a workflow');
      return;
    }

    setStarting(true);
    try {
      await workflowService.startWorkflowInstance({
        workflowId: selectedWorkflowId,
        documentId: documentId,
        notes: notes.trim() || undefined,
      });
      showSuccess('Workflow Started', 'Workflow has been started successfully');
      onSuccess?.();
      onWorkflowStarted?.();
      onClose();
    } catch (error: any) {
      console.error('Error starting workflow:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to start workflow';
      showError('Start Failed', errorMessage);
    } finally {
      setStarting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Play className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Start Workflow</h2>
              <p className="text-sm text-gray-600">Start a workflow for this document</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
            disabled={starting}
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Document Info */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <Label className="text-xs text-gray-500 mb-1">Document</Label>
            <p className="font-medium text-gray-900">{documentName}</p>
          </div>

          {/* Workflow Selection */}
          <div>
            <Label>Select Workflow *</Label>
            {loading ? (
              <div className="mt-2 flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : workflows.length === 0 ? (
              <div className="mt-2 p-4 text-center text-sm text-gray-500 border rounded-lg">
                No active workflows available
              </div>
            ) : (
              <div className="mt-2 border rounded-lg max-h-[300px] overflow-y-auto">
                <div className="divide-y">
                  {workflows.map((workflow) => (
                    <button
                      key={workflow.id}
                      type="button"
                      onClick={() => setSelectedWorkflowId(workflow.id)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedWorkflowId === workflow.id
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{workflow.name}</p>
                          {workflow.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {workflow.description}
                            </p>
                          )}
                        </div>
                        {selectedWorkflowId === workflow.id && (
                          <div className="ml-4 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this workflow..."
              className="mt-2"
              rows={4}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={starting}>
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={starting || !selectedWorkflowId || loading}
          >
            {starting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Workflow
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

