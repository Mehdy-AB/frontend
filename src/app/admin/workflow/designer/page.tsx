'use client';

import { useState } from 'react';
import { 
  Workflow, 
  Plus, 
  Save,
  ArrowLeft,
  Play,
  Settings,
  Users,
  GitBranch,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Trash2,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '../../../../contexts/LanguageContext';

export default function WorkflowDesignerPage() {
  const { t } = useLanguage();

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/workflow')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              {workflowId ? 'Edit Workflow' : 'Create New Workflow'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Design your workflow visually
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-blue-500">
            {nodes.length} Steps
          </Badge>
          <Badge variant="outline">
            {edges.length} Connections
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddStep}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Step
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !workflowName || nodes.length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Workflow'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar - Workflow Properties */}
        <Card className="w-80 border-r rounded-none">
          <div className="p-4 space-y-4 h-full overflow-y-auto">
            <div>
              <h3 className="font-semibold mb-4">Workflow Properties</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="workflow-name">Name *</Label>
                  <Input
                    id="workflow-name"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    placeholder="Workflow name..."
                  />
                </div>

                <div>
                  <Label htmlFor="workflow-description">Description</Label>
                  <Textarea
                    id="workflow-description"
                    value={workflowDescription}
                    onChange={(e) => setWorkflowDescription(e.target.value)}
                    placeholder="Workflow description..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="conditional"
                    checked={isConditional}
                    onChange={(e) => setIsConditional(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="conditional" className="cursor-pointer">
                    Conditional workflow
                  </Label>
                </div>
              </div>
            </div>

            {/* Selected Node Editor */}
            {selectedNode && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Edit Step</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label>Step Name</Label>
                    <Input
                      value={selectedNode.data.label}
                      onChange={(e) =>
                        setSelectedNode({
                          ...selectedNode,
                          data: {
                            ...selectedNode.data,
                            label: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Approver Role</Label>
                    <Select
                      value={selectedNode.data.role}
                      onValueChange={(value) =>
                        setSelectedNode({
                          ...selectedNode,
                          data: {
                            ...selectedNode.data,
                            role: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
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
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={selectedNode.data.description || ''}
                      onChange={(e) =>
                        setSelectedNode({
                          ...selectedNode,
                          data: {
                            ...selectedNode.data,
                            description: e.target.value,
                          },
                        })
                      }
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleUpdateNode}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Update
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleDeleteNode}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Workflow Stats */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Statistics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Steps:</span>
                  <span className="font-medium">{nodes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Connections:</span>
                  <span className="font-medium">{edges.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant={isConditional ? "default" : "secondary"}>
                    {isConditional ? 'Conditional' : 'Linear'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Canvas */}
        <div className="flex-1 bg-gray-50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            proOptions={proOptions}
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            <Panel position="top-center" className="bg-white rounded-lg shadow-md p-3">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span>Default</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <span>Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <span>Rejected</span>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

