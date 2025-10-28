# Server-Side Search with Local Filtering

This folder contains reusable components for implementing server-side search with instant local filtering feedback.

## Components

### 1. `useServerSideSearch` Hook

A custom React hook that implements a two-phase search strategy:
1. **Immediate local filtering** on cached data (instant feedback)
2. **Debounced API fetch** for comprehensive results

#### Features
- ✅ StartsWith filtering logic (not contains)
- ✅ Separate loading states (full page vs table-only)
- ✅ No reload when clearing search (fetches default data)
- ✅ Pagination support
- ✅ Error handling

#### Usage Example

```tsx
import { useServerSideSearch } from '@/components/main/useServerSideSearch';
import { RoleDto } from '@/types/api';

function RolesPage() {
  const {
    displayData,        // Data to display (local results or API results)
    searchQuery,        // Current search query
    setSearchQuery,     // Update search query
    page,              // Current page
    setPage,           // Update page
    totalPages,        // Total pages from API
    totalElements,     // Total elements from API
    loading,           // Full page loading (initial load)
    tableLoading,      // Table-only loading (search/pagination)
    isLocalFiltering,  // Currently showing local filtered results
    error,             // Error state
    fetchData,         // Manually trigger data fetch
    clearError         // Clear error
  } = useServerSideSearch<RoleDto>({
    fetchFunction: async (page, searchTerm) => {
      // Your API call here
      return await api.getRoles({
        page,
        size: 20,
        name: searchTerm
      });
    },
    searchFields: (role) => [
      role.name,
      role.description || '',
      role.id
    ],
    debounceMs: 800  // Optional, default 800ms
  });

  return (
    <div>
      {/* Use displayData in your table/grid */}
      {displayData.map(role => (
        <div key={role.id}>{role.name}</div>
      ))}
    </div>
  );
}
```

### 2. `ServerSearchInput` Component

A simple search input component that works seamlessly with `useServerSideSearch`.

#### Features
- ✅ Search icon on the left
- ✅ Clear button (X) on the right when there's text
- ✅ Clean integration with the hook

#### Usage Example

```tsx
import ServerSearchInput from '@/components/main/ServerSearchInput';
import { useServerSideSearch } from '@/components/main/useServerSideSearch';

function MyPage() {
  const { searchQuery, setSearchQuery } = useServerSideSearch({
    // ... hook config
  });

  return (
    <ServerSearchInput
      value={searchQuery}
      onChange={setSearchQuery}
      placeholder="Search by name, description, or ID..."
    />
  );
}
```

## Complete Example

See `frontend/src/app/admin/roles/page.tsx` for a complete working example.

### Step-by-Step Implementation

1. **Define your fetch function**
```tsx
const fetchFunction = async (page: number, searchTerm?: string) => {
  return await api.getData({
    page,
    size: 20,
    search: searchTerm
  });
};
```

2. **Define searchable fields**
```tsx
const searchFields = (item: MyDataType) => [
  item.name,
  item.description || '',
  item.id
];
```

3. **Use the hook**
```tsx
const {
  displayData,
  searchQuery,
  setSearchQuery,
  page,
  setPage,
  totalPages,
  totalElements,
  loading,
  tableLoading,
  isLocalFiltering,
  error,
  fetchData
} = useServerSideSearch<MyDataType>({
  fetchFunction,
  searchFields,
  debounceMs: 800
});
```

4. **Render the UI**
```tsx
return (
  <div>
    {/* Search Input */}
    <ServerSearchInput
      value={searchQuery}
      onChange={setSearchQuery}
      placeholder="Search..."
    />

    {/* Loading State */}
    {loading && <LoadingSpinner />}
    
    {/* Error State */}
    {error && <ErrorMessage message={error} />}
    
    {/* Data Table */}
    <table>
      <tbody>
        {displayData.map(item => (
          <tr key={item.id}>
            <td>{item.name}</td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* Table Loading Indicator */}
    {tableLoading && (
      <div className="loading">
        {isLocalFiltering 
          ? 'Fetching comprehensive results...' 
          : 'Loading...'
        }
      </div>
    )}

    {/* Pagination */}
    <Pagination
      currentPage={page}
      totalPages={totalPages}
      totalElements={totalElements}
      pageSize={20}
      onPageChange={setPage}
    />
  </div>
);
```

## API Response Format

The hook supports two response formats:

### 1. Array Response
```typescript
[{ id: 1, name: "Item 1" }, { id: 2, name: "Item 2" }]
```

### 2. Paginated Response
```typescript
{
  content: [{ id: 1, name: "Item 1" }],
  totalPages: 5,
  totalElements: 100
}
```

The hook automatically detects which format is returned.

## Hook Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fetchFunction` | `(page, searchTerm?) => Promise<T[] \| PageResponse<T>>` | **Required** | Function to fetch data from API |
| `searchFields` | `(item: T) => string[]` | **Required** | Function to extract searchable fields |
| `debounceMs` | `number` | `800` | Debounce delay for API calls (ms) |
| `initialPage` | `number` | `0` | Initial page number |
| `fetchOnMount` | `boolean` | `true` | Whether to fetch data on mount |

## Hook Return Values

| Property | Type | Description |
|----------|------|-------------|
| `displayData` | `T[]` | Data to display (local results or API results) |
| `allData` | `T[]` | All cached data from API |
| `searchQuery` | `string` | Current search query |
| `setSearchQuery` | `(query: string) => void` | Update search query |
| `page` | `number` | Current page |
| `setPage` | `(page: number) => void` | Update page |
| `totalPages` | `number` | Total pages from API |
| `totalElements` | `number` | Total elements from API |
| `loading` | `boolean` | Full page loading state |
| `tableLoading` | `boolean` | Table-only loading state |
| `isLocalFiltering` | `boolean` | Currently showing local filtered results |
| `error` | `string \| null` | Error message |
| `fetchData` | `(isSearchRequest?: boolean) => Promise<void>` | Manually trigger data fetch |
| `clearError` | `() => void` | Clear error state |

## Search Behavior

### When User Types:
1. ⚡ **Immediate**: Local filtering shows instant results
2. ⏱️ **After 800ms**: API fetch happens in background
3. 🔄 **Table reloads**: Only table content updates, not full page

### When User Clears Search:
1. 🔄 Fetches default data from API (no filter)
2. 📄 Only table reloads, not full page

### StartsWith vs Contains:
- ✅ Uses `startsWith` logic (type "ad" → finds "admin", not "loadmin")
- ❌ Not `contains` logic (prevents false positives)

## Benefits

1. **Better UX**: Instant feedback with local filtering
2. **Reduced API Calls**: Debounced remote search
3. **Reusable**: Works with any data type
4. **Type-Safe**: Full TypeScript support
5. **Flexible**: Supports both array and paginated responses
6. **Performance**: Only table reloads, not the whole page

## Migration Guide

If you have an existing page with custom search logic, you can migrate it to use this hook:

**Before:**
```tsx
const [data, setData] = useState([]);
const [searchQuery, setSearchQuery] = useState('');
const [loading, setLoading] = useState(true);
// ... lots of useEffect hooks for search, pagination, etc.
```

**After:**
```tsx
const {
  displayData,
  searchQuery,
  setSearchQuery,
  loading,
  // ... everything else
} = useServerSideSearch({ ... });
```

Much cleaner! 🎉

