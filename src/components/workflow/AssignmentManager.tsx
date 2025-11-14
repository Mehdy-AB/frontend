/**
 * AssignmentManager - Manage multiple assignments for a workflow step
 * Add/remove users, roles, groups with granular permissions
 */

import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, User, Shield, Users } from 'lucide-react';
import { EntitySearch } from './EntitySearch';
import {
  WorkflowTaskAssignment,
  EntitySearchResult,
  AssigneeType,
  ActionType,
  ACTION_TYPE_OPTIONS,
  ASSIGNEE_TYPE_OPTIONS,
} from '../../types/workflow-admin';

interface AssignmentManagerProps {
  assignments: WorkflowTaskAssignment[];
  onChange: (assignments: WorkflowTaskAssignment[]) => void;
  disabled?: boolean;
}

export const AssignmentManager: React.FC<AssignmentManagerProps> = ({
  assignments,
  onChange,
  disabled = false,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newAssignment, setNewAssignment] = useState<Partial<WorkflowTaskAssignment>>({
    actionType: 'APPROVER',
    canApprove: true,
    canReject: true,
    canComment: true,
    canRequestRevision: false,
  });

  const handleAddAssignment = () => {
    if (!newAssignment.assigneeType || (!newAssignment.userId && !newAssignment.roleId && !newAssignment.groupId)) {
      return;
    }

    onChange([...assignments, newAssignment as WorkflowTaskAssignment]);
    setNewAssignment({
      actionType: 'APPROVER',
      canApprove: true,
      canReject: true,
      canComment: true,
      canRequestRevision: false,
    });
    setIsAddingNew(false);
  };

  const handleRemoveAssignment = (index: number) => {
    onChange(assignments.filter((_, i) => i !== index));
  };

  const handleUpdateAssignment = (index: number, updated: Partial<WorkflowTaskAssignment>) => {
    const newAssignments = [...assignments];
    newAssignments[index] = { ...newAssignments[index], ...updated };
    onChange(newAssignments);
  };

  const handleEntitySelect = (entity: EntitySearchResult | null, isNew: boolean, index?: number) => {
    if (!entity) return;

    const assignmentUpdate: Partial<WorkflowTaskAssignment> = {
      assigneeType: entity.type as AssigneeType,
    };

    if (entity.type === 'USER') {
      assignmentUpdate.userId = entity.id;
      assignmentUpdate.userName = entity.displayName;
      assignmentUpdate.roleId = undefined;
      assignmentUpdate.roleName = undefined;
      assignmentUpdate.groupId = undefined;
      assignmentUpdate.groupName = undefined;
    } else if (entity.type === 'ROLE') {
      assignmentUpdate.roleId = entity.id;
      assignmentUpdate.roleName = entity.displayName;
      assignmentUpdate.userId = undefined;
      assignmentUpdate.userName = undefined;
      assignmentUpdate.groupId = undefined;
      assignmentUpdate.groupName = undefined;
    } else if (entity.type === 'GROUP') {
      assignmentUpdate.groupId = entity.id;
      assignmentUpdate.groupName = entity.displayName;
      assignmentUpdate.userId = undefined;
      assignmentUpdate.userName = undefined;
      assignmentUpdate.roleId = undefined;
      assignmentUpdate.roleName = undefined;
    }

    if (isNew) {
      setNewAssignment((prev) => ({ ...prev, ...assignmentUpdate }));
    } else if (index !== undefined) {
      handleUpdateAssignment(index, assignmentUpdate);
    }
  };

  const getAssignmentIcon = (assignment: WorkflowTaskAssignment) => {
    switch (assignment.assigneeType) {
      case 'USER':
        return <User className="h-4 w-4" />;
      case 'ROLE':
        return <Shield className="h-4 w-4" />;
      case 'GROUP':
        return <Users className="h-4 w-4" />;
    }
  };

  const getAssignmentName = (assignment: WorkflowTaskAssignment) => {
    return assignment.userName || assignment.roleName || assignment.groupName || 'Unknown';
  };

  const getActionTypeColor = (actionType: ActionType) => {
    switch (actionType) {
      case 'APPROVER':
        return 'bg-blue-100 text-blue-700';
      case 'REVIEWER':
        return 'bg-green-100 text-green-700';
      case 'NOTIFIED':
        return 'bg-gray-100 text-gray-700';
      case 'OPTIONAL':
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getEntityForEdit = (assignment: WorkflowTaskAssignment): EntitySearchResult | null => {
    if (assignment.userId) {
      return {
        id: assignment.userId,
        name: assignment.userName || '',
        displayName: assignment.userName || '',
        type: 'USER',
      };
    }
    if (assignment.roleId) {
      return {
        id: assignment.roleId,
        name: assignment.roleName || '',
        displayName: assignment.roleName || '',
        type: 'ROLE',
      };
    }
    if (assignment.groupId) {
      return {
        id: assignment.groupId,
        name: assignment.groupName || '',
        displayName: assignment.groupName || '',
        type: 'GROUP',
      };
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Step Assignments</h3>
          <p className="text-xs text-gray-500 mt-1">
            Assign users, roles, or groups to this workflow step
          </p>
        </div>
        {!disabled && !isAddingNew && (
          <button
            onClick={() => setIsAddingNew(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Assignment
          </button>
        )}
      </div>

      {/* Existing Assignments */}
      <div className="space-y-2">
        {assignments.map((assignment, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            {/* Entity Icon */}
            <div className="mt-1">{getAssignmentIcon(assignment)}</div>

            {/* Assignment Details */}
            <div className="flex-1 space-y-2">
              {editingIndex === index ? (
                // Edit Mode
                <div className="space-y-3">
                  <EntitySearch
                    value={getEntityForEdit(assignment)}
                    onChange={(entity) => handleEntitySelect(entity, false, index)}
                    placeholder="Search users, roles, or groups..."
                  />

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Action Type
                    </label>
                    <select
                      value={assignment.actionType}
                      onChange={(e) =>
                        handleUpdateAssignment(index, { actionType: e.target.value as ActionType })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {ACTION_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} - {option.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={assignment.canApprove}
                        onChange={(e) =>
                          handleUpdateAssignment(index, { canApprove: e.target.checked })
                        }
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Can Approve</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={assignment.canReject}
                        onChange={(e) =>
                          handleUpdateAssignment(index, { canReject: e.target.checked })
                        }
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Can Reject</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={assignment.canComment}
                        onChange={(e) =>
                          handleUpdateAssignment(index, { canComment: e.target.checked })
                        }
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Can Comment</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={assignment.canRequestRevision}
                        onChange={(e) =>
                          handleUpdateAssignment(index, { canRequestRevision: e.target.checked })
                        }
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Can Request Revision</span>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingIndex(null)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </button>
                    <button
                      onClick={() => setEditingIndex(null)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{getAssignmentName(assignment)}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${getActionTypeColor(assignment.actionType)}`}
                        >
                          {assignment.actionType}
                        </span>
                        <span className="text-xs text-gray-500">{assignment.assigneeType}</span>
                      </div>
                    </div>
                    {!disabled && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingIndex(index)}
                          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleRemoveAssignment(index)}
                          className="p-1.5 hover:bg-red-100 rounded transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    {assignment.canApprove && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                        Approve
                      </span>
                    )}
                    {assignment.canReject && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">Reject</span>
                    )}
                    {assignment.canComment && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        Comment
                      </span>
                    )}
                    {assignment.canRequestRevision && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                        Request Revision
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add New Assignment Form */}
      {isAddingNew && (
        <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200 space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">New Assignment</h4>

          <EntitySearch
            value={null}
            onChange={(entity) => handleEntitySelect(entity, true)}
            placeholder="Search users, roles, or groups..."
          />

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Action Type</label>
            <select
              value={newAssignment.actionType}
              onChange={(e) =>
                setNewAssignment({ ...newAssignment, actionType: e.target.value as ActionType })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ACTION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newAssignment.canApprove}
                onChange={(e) =>
                  setNewAssignment({ ...newAssignment, canApprove: e.target.checked })
                }
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Can Approve</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newAssignment.canReject}
                onChange={(e) =>
                  setNewAssignment({ ...newAssignment, canReject: e.target.checked })
                }
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Can Reject</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newAssignment.canComment}
                onChange={(e) =>
                  setNewAssignment({ ...newAssignment, canComment: e.target.checked })
                }
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Can Comment</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newAssignment.canRequestRevision}
                onChange={(e) =>
                  setNewAssignment({ ...newAssignment, canRequestRevision: e.target.checked })
                }
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Can Request Revision</span>
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddAssignment}
              disabled={
                !newAssignment.assigneeType ||
                (!newAssignment.userId && !newAssignment.roleId && !newAssignment.groupId)
              }
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              Add Assignment
            </button>
            <button
              onClick={() => setIsAddingNew(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {assignments.length === 0 && !isAddingNew && (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <div className="text-sm">No assignments yet</div>
          <div className="text-xs text-gray-400 mt-1">
            Click "Add Assignment" to assign users, roles, or groups
          </div>
        </div>
      )}
    </div>
  );
};

