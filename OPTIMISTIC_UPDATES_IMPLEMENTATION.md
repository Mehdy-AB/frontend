# Optimistic Updates Implementation

## Overview
Implemented local state updates instead of refetching data from the backend after mutations on the roles page, significantly improving performance and user experience.

## Changes Made

### 1. Enhanced `useServerSideSearch` Hook
**File**: `frontend/src/components/main/useServerSideSearch.ts`

Added four new methods for local data manipulation:

```typescript
{
  updateItem: (itemId, updater, idGetter?) => void;
  addItem: (item) => void;
  removeItem: (itemId, idGetter?) => void;
  setDataDirectly: (newData) => void;
}
```

**Features**:
- ✅ Update items in local state without refetching
- ✅ Add new items to the beginning of the list
- ✅ Remove items from local state
- ✅ Automatically handles local search results when filtering is active
- ✅ Custom ID getter for flexible item identification

### 2. Updated Roles Page
**File**: `frontend/src/app/admin/roles/page.tsx`

Refactored all mutation handlers to use optimistic updates:

#### Create Role
```typescript
// Before: await fetchData(false);
// After:
const rolePermissions = permissions.filter(p => data.permissionKeys.includes(p.key));
addItem({
  ...newRole,
  permissions: rolePermissions
});
```

#### Update Role (Edit)
```typescript
// Before: await fetchData(false);
// After:
updateItem(roleToEdit.id, (item) => ({
  ...item,
  name: data.name,
  description: data.description
}));
```

#### Delete Role
```typescript
// Before: await fetchData(false);
// After:
removeItem(roleToDelete.id);
```

#### Toggle Status
```typescript
// Before: await fetchData(false);
// After:
updateItem(role.id, (item) => ({
  ...item,
  deletedAt: isActive ? new Date().toISOString() : undefined
}));
```

#### Update Permissions
```typescript
// Before: await fetchData(false);
// After:
const rolePermissions = permissions.filter(p => permissionKeys.includes(p.key));
updateItem(roleToManagePermissions.id, (item) => ({
  ...item,
  permissions: rolePermissions
}));
```

### 3. Enhanced ViewRoleUsersModal
**File**: `frontend/src/components/modals/ViewRoleUsersModal.tsx`

Added `onUserRemoved` callback prop:

```typescript
interface ViewRoleUsersModalProps {
  // ... existing props
  onUserRemoved?: (userId: string) => void;
}
```

**Behavior**:
- Uses local `removeItem` from its own `useServerSideSearch` instance
- Notifies parent component via callback
- No page refresh needed

## Benefits

### Performance
- ✅ **No unnecessary network requests** - Only make API calls for mutations, not for reads
- ✅ **Instant UI updates** - Users see changes immediately
- ✅ **Reduced server load** - Fewer GET requests after mutations

### User Experience
- ✅ **Smoother interactions** - No loading spinners after every action
- ✅ **No page jumps** - UI stays in place, scroll position maintained
- ✅ **Faster perceived performance** - Immediate feedback

### Code Quality
- ✅ **Reusable pattern** - Same approach can be applied to other pages
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Consistent behavior** - All mutations follow the same pattern

## Usage Pattern

### Basic Update
```typescript
const { updateItem } = useServerSideSearch<T>({ ... });

// Update an item
updateItem(itemId, (item) => ({
  ...item,
  fieldToUpdate: newValue
}));
```

### Add Item
```typescript
const { addItem } = useServerSideSearch<T>({ ... });

// Add new item
addItem(newItem);
```

### Remove Item
```typescript
const { removeItem } = useServerSideSearch<T>({ ... });

// Remove item
removeItem(itemId);
```

### Custom ID Getter
```typescript
const { updateItem } = useServerSideSearch<T>({ ... });

// For items with non-standard ID field
updateItem(customId, (item) => ({ ...item }), (item) => item.customIdField);
```

## Migration Guide for Other Pages

To implement optimistic updates on other pages:

1. **Import the enhanced hook**:
   ```typescript
   const { updateItem, addItem, removeItem } = useServerSideSearch<T>({ ... });
   ```

2. **Replace `fetchData()` calls after mutations**:
   ```typescript
   // Before
   await apiClient.updateItem(id, data);
   await fetchData(false);
   
   // After
   await apiClient.updateItem(id, data);
   updateItem(id, (item) => ({ ...item, ...data }));
   ```

3. **For create operations**:
   ```typescript
   // Before
   const newItem = await apiClient.createItem(data);
   await fetchData(false);
   
   // After
   const newItem = await apiClient.createItem(data);
   addItem(newItem);
   ```

4. **For delete operations**:
   ```typescript
   // Before
   await apiClient.deleteItem(id);
   await fetchData(false);
   
   // After
   await apiClient.deleteItem(id);
   removeItem(id);
   ```

## Error Handling

If an API call fails, you can still revert to fetching:

```typescript
try {
  await apiClient.updateItem(id, data);
  updateItem(id, (item) => ({ ...item, ...data }));
} catch (error) {
  console.error('Error updating item:', error);
  // Revert to fetching if needed
  await fetchData(false);
}
```

## Testing Checklist

- ✅ Create role → Should appear in list immediately
- ✅ Edit role → Should update in list without refetch
- ✅ Delete role → Should disappear from list immediately
- ✅ Toggle status → Should update status without refetch
- ✅ Update permissions → Should update in list immediately
- ✅ Assign users to role → Should complete without refetch
- ✅ Remove user from role (in modal) → Should update modal list immediately
- ✅ Search functionality → Should still work with local updates
- ✅ Pagination → Should maintain state across updates

## Notes

- The `RoleDto` type doesn't include a `users` field, so we don't track user assignments in the roles list
- Permission keys are mapped to `PermissionDto` objects for type safety
- The `deletedAt` field uses `undefined` instead of `null` for proper TypeScript typing
- All updates are optimistic - UI updates before API confirms success

## Future Improvements

1. **Optimistic rollback** - Automatically revert changes if API call fails
2. **Loading states** - Show inline loading indicators for items being updated
3. **Conflict resolution** - Handle concurrent updates from multiple users
4. **WebSocket integration** - Real-time updates from server

