# Workflow Management System

## Overview
A comprehensive workflow management system for document approval processes, built with Next.js, React Flow (@xyflow/react), and TypeScript.

## Features

### 1. **Main Workflow Management Page** (`/admin/workflow/page.tsx`)
- **List all workflows** with pagination and search functionality
- **Quick stats** showing total workflows, active workflows, pending, and total steps
- **Create new workflows** using modal dialog
- **Bulk actions** for workflow management
- **Filter and search** workflows by name
- **View, edit, and delete** workflow operations

**Key Components:**
- Uses `useServerSideSearch` hook for efficient data fetching
- Integrates with `workflowService` API
- Fetches roles from `notificationApiClient` for role assignment
- Responsive grid layout with cards for workflow display

### 2. **Visual Workflow Designer** (`/admin/workflow/designer/page.tsx`)
- **Drag-and-drop workflow design** using @xyflow/react
- **Custom node components** (WorkflowStepNode) displaying:
  - Step sequence number
  - Step name
  - Approver role
  - Step description
  - Status indicators (color-coded)
- **Interactive canvas** with:
  - MiniMap for navigation
  - Controls for zoom and pan
  - Background grid with dots pattern
  - Connection handles for linking steps
- **Side panel** for workflow properties:
  - Workflow name and description
  - Conditional workflow toggle
  - Step editor for selected nodes
  - Real-time statistics
- **Node editing** capabilities:
  - Edit step name
  - Assign approver roles
  - Add descriptions
  - Delete steps
- **Add/remove steps** dynamically
- **Save workflow** functionality

**Visual Features:**
- Color-coded node status: Blue (default), Green (completed), Yellow (active), Red (rejected)
- Animated edges showing workflow flow
- Real-time node count and connection statistics
- Legend panel showing status color meanings

### 3. **Workflow Detail View** (`/admin/workflow/[workflowId]/page.tsx`)
- **Comprehensive workflow information** display
- **Tabbed interface** with:
  - **Overview**: Basic workflow info, type, and status
  - **Steps**: Sequential list of all workflow steps with roles
  - **Instances**: Active workflow instances
  - **Analytics**: Performance metrics and statistics
- **Quick stats cards** showing:
  - Total steps
  - Active instances
  - Pending workflows
  - Completed workflows
- **Action buttons** for edit and delete operations
- **Status badges** indicating workflow state

### 4. **Workflow Instances Monitor** (`/admin/workflow/instances/page.tsx`)
- **Real-time monitoring** of all workflow instances
- **Advanced filtering**:
  - By status (Draft, Submitted, In Review, Approved, etc.)
  - By workflow name
  - By document name
- **Statistics dashboard** showing:
  - Total instances
  - Completed workflows
  - Pending approvals
  - Rejected workflows
- **Detailed table view** with:
  - Workflow name
  - Associated document
  - Current step
  - Status badge
  - Start date
  - Action buttons
- **Export functionality** for reporting
- **Refresh capability** for real-time updates

### 5. **CreateWorkflowModal Component** (`/components/modals/CreateWorkflowModal.tsx`)
- **Multi-step form** for workflow creation
- **Basic information** section:
  - Workflow name (required)
  - Description (optional)
  - Conditional workflow toggle
- **Dynamic step management**:
  - Add/remove workflow steps
  - Reorder steps automatically
  - Each step includes:
    - Step name
    - Approver role (dropdown from available roles)
    - Step description
- **Form validation** with error messages
- **Role integration** from API
- **Responsive design** with scrollable content

## Technical Implementation

### API Integration
- **Base URL**: `/api/v1/workflow`
- **Service Pattern**: Follows `folderService.ts` pattern
- **Endpoints used**:
  - `GET /api/v1/workflow` - List all workflows
  - `GET /api/v1/workflow/{id}` - Get workflow details
  - `POST /api/v1/workflow/instance` - Create workflow instance
  - `GET /api/v1/workflow/instance/{id}` - Get instance details
  - `GET /api/v1/workflow/instance/my` - Get user's workflows
  - `GET /api/v1/workflow/instance/pending` - Get pending approvals

### State Management
- **React hooks**: useState, useEffect, useCallback
- **Custom hooks**: useServerSideSearch for data fetching
- **@xyflow/react hooks**: useNodesState, useEdgesState for workflow canvas

### Data Flow
1. **Roles** fetched from `notificationApiClient.getAllRoles()`
2. **Workflows** fetched from `workflowService.getAllWorkflows()`
3. **Instances** fetched with pagination support
4. **Real-time updates** on user actions

### UI Components Used
- **shadcn/ui components**:
  - Button, Card, Badge, Input, Label, Textarea
  - Select, Dialog, Tabs
  - DropdownMenu
- **Custom components**:
  - ServerSearchInput
  - Pagination
  - ConfirmationModal
  - WorkflowStatusBadge

### Workflow Visualization (@xyflow/react)
```typescript
// Custom Node Type
const WorkflowStepNode = ({ data }) => {
  // Displays step info with color-coded status
  // Includes edit button
  // Shows role and description
};

// Node Types Registration
const nodeTypes = {
  workflowStep: WorkflowStepNode,
};

// ReactFlow Component
<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  nodeTypes={nodeTypes}
  fitView
>
  <Controls />
  <MiniMap />
  <Background variant={BackgroundVariant.Dots} />
  <Panel position="top-center">
    {/* Status legend */}
  </Panel>
</ReactFlow>
```

## Key Features by Page

### Main Workflow Page
✅ Search and filter workflows
✅ Create new workflows with role assignment
✅ Edit and delete operations
✅ Visual statistics cards
✅ Responsive table with actions
✅ Pagination support
✅ Loading states and error handling

### Designer Page
✅ Visual drag-and-drop interface
✅ Add/edit/delete workflow steps
✅ Connect steps with edges
✅ Real-time canvas updates
✅ Side panel for properties
✅ Role assignment dropdown
✅ Color-coded status indicators
✅ Save workflow functionality

### Detail Page
✅ Comprehensive workflow information
✅ Tabbed navigation
✅ Steps overview with roles
✅ Instance monitoring
✅ Analytics placeholder
✅ Edit and delete actions
✅ Status badges

### Instances Page
✅ Real-time instance monitoring
✅ Status filtering
✅ Search by name
✅ Statistics dashboard
✅ Export functionality
✅ Refresh capability
✅ Detailed table view

## Integration Points

### Backend API
- Fetches workflows from `/api/v1/workflow`
- Integrates with existing backend controller
- Uses TypeScript types from `@/types/workflow`

### Permission System
- Integrates with role management
- Fetches roles via `notificationApiClient`
- Uses `@RequirePermission` annotations on backend

### Document System
- Links workflows to documents
- Displays document names in instances
- Navigates to document detail pages

## Optimization Techniques

1. **Lazy Loading**: Components load only when needed
2. **Debounced Search**: 500ms debounce on search input
3. **Pagination**: Server-side pagination for large datasets
4. **Memoization**: useMemo and useCallback for performance
5. **Error Boundaries**: Graceful error handling
6. **Loading States**: Skeleton loaders and spinners
7. **Type Safety**: Full TypeScript coverage

## Future Enhancements

- [ ] Add workflow templates library
- [ ] Implement workflow duplication
- [ ] Add workflow versioning
- [ ] Include audit trail for workflows
- [ ] Add webhook integrations
- [ ] Implement workflow scheduling
- [ ] Add notification system
- [ ] Create workflow analytics dashboard
- [ ] Add workflow testing/simulation mode
- [ ] Implement approval delegation
- [ ] Add SLA management
- [ ] Create mobile-responsive views

## Usage Example

```typescript
// Creating a new workflow
const workflow = {
  name: "Invoice Approval",
  description: "3-step invoice approval process",
  conditional: false,
  steps: [
    {
      name: "Manager Review",
      sequence: 1,
      approverRole: "MANAGER",
      description: "Initial manager approval"
    },
    {
      name: "Finance Review",
      sequence: 2,
      approverRole: "FINANCE",
      description: "Financial validation"
    },
    {
      name: "Director Approval",
      sequence: 3,
      approverRole: "DIRECTOR",
      description: "Final director approval"
    }
  ]
};

// The designer allows visual editing of this workflow
// with drag-and-drop nodes and connections
```

## Dependencies

- `@xyflow/react`: ^12.x - Visual workflow designer
- `next`: ^14.x - React framework
- `react`: ^18.x - UI library
- `tailwindcss`: ^3.x - Styling
- `lucide-react`: ^0.x - Icons
- `shadcn/ui`: Latest - UI components

## Notes

- All pages follow the admin permission management pattern
- Consistent with existing codebase architecture
- Fully responsive design
- Dark mode support
- Accessibility compliant
- SEO friendly with proper metadata

## Related Files

- `/api/services/workflowService.ts` - API client
- `/types/workflow.ts` - TypeScript types
- `/components/workflow/` - Workflow-specific components
- `/components/modals/CreateWorkflowModal.tsx` - Creation modal

