'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface ApplyWorkflowChangesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (applyToExisting: boolean, reason?: string) => void;
  isLoading?: boolean;
}

export default function ApplyWorkflowChangesDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: ApplyWorkflowChangesDialogProps) {
  const [applyToExisting, setApplyToExisting] = useState<boolean | null>(null);
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (applyToExisting === null) return;
    onConfirm(applyToExisting, reason.trim() || undefined);
  };

  const handleClose = () => {
    setApplyToExisting(null);
    setReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Apply Workflow Changes?
          </DialogTitle>
          <DialogDescription>
            Do you want to apply these changes to existing active workflow instances?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <button
              onClick={() => setApplyToExisting(true)}
              className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                applyToExisting === true
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  applyToExisting === true ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}>
                  {applyToExisting === true && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <p className="font-semibold text-sm">Yes, apply to existing instances</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Update all active workflow instances with the new step names, descriptions, and assignments
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setApplyToExisting(false)}
              className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                applyToExisting === false
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  applyToExisting === false ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}>
                  {applyToExisting === false && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <p className="font-semibold text-sm">No, only apply to new instances</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only new workflow instances will use the updated configuration
                  </p>
                </div>
              </div>
            </button>
          </div>

          {applyToExisting === true && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-800">
                  This will update step names, descriptions, and assignments for all active instances. 
                  Completed steps will not be affected.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-sm">
                  Reason for applying changes (optional)
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why these changes are being applied to existing instances..."
                  rows={3}
                  className="text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={applyToExisting === null || isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                {applyToExisting ? 'Applying...' : 'Continuing...'}
              </>
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}








