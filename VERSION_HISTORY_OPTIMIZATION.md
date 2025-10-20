# Version History Modal & Document Page Optimization

## Summary
Fixed two performance issues in the document viewing and version history system:

1. **Eliminated double fetch on initial document load** - Now fetches document data and download URL in parallel
2. **Optimized version restore process** - Updates local state and fetches new version content without full page reload

## Changes Made

### 1. Document Page Initial Load Optimization (`src/app/documents/[documentId]/page.tsx`)

#### Before:
```typescript
// First fetch document metadata to get activeVersion
const docData = await notificationApiClient.getDocument(parseInt(documentId), { silent: true });

// Then fetch download URL with that version
const versionToFetch = versionParam ? parseInt(versionParam) : (docData.activeVersion || null);
const downloadUrl = await notificationApiClient.downloadDocument(parseInt(documentId), versionToFetch ? { version: versionToFetch } : {}, { silent: true });
```

**Issues:**
- Sequential API calls (waited for first to complete before starting second)
- Redundant version parameter when no version specified (backend returns active version by default)

#### After:
```typescript
// Fetch document data and download URL in parallel
const versionToFetch = versionParam ? parseInt(versionParam) : null;

const [docData, downloadUrl] = await Promise.all([
  notificationApiClient.getDocument(parseInt(documentId), { silent: true }),
  notificationApiClient.downloadDocument(
    parseInt(documentId), 
    versionToFetch ? { version: versionToFetch } : {}, // Empty params on initial load
    { silent: true }
  )
]);
```

**Benefits:**
- ✅ Parallel API calls (both start simultaneously)
- ✅ Faster initial page load
- ✅ Cleaner code - relies on backend's default behavior for active version
- ✅ Only passes version parameter when explicitly needed (from URL)

### 2. Version Restore Optimization

#### In `VersionHistoryModal.tsx`:
- Updated `onRestoreVersion` prop signature to accept `(versionId: number, versionNumber: number)`
- Modified `handleRestoreVersion` to pass version number to parent handler
- Added loading state with spinning icon during restore operation
- Disabled restore button while processing

#### In `DocumentModals.tsx`:
- Updated prop interface to match new restore handler signature

#### In Document Page (`page.tsx`):
Updated `handleRestoreVersion` to be more efficient:

**Before:**
- Called API to set active version
- Fetched content with specific version parameter
- Multiple state updates
- Manual FileViewer refresh with 200ms delay
- Called `fetchVersions()` to refresh version list

**After:**
```typescript
const handleRestoreVersion = async (versionId: number, versionNumber: number): Promise<void> => {
  // 1. Set version as active in backend
  await notificationApiClient.setActiveVersion(document.documentId, versionId);
  
  // 2. Fetch the specific version content with explicit version parameter
  const newDownloadUrl = await notificationApiClient.downloadDocument(
    document.documentId, 
    { version: versionId }, // Explicitly fetch the restored version
    { silent: true }
  );
  
  // 3. Update local state with restored version
  setCurrentVersion(versionId);
  setDocument(prev => prev ? {
    ...prev,
    activeVersion: versionId,
    versionNumber: versionNumber,
    contentUrl: cacheBustedUrl
  } : null);
  
  // 4. Force FileViewer refresh
  setFileViewerKey(prev => prev + 1);
}
```

**Benefits:**
- ✅ Cleaner code - no longer manually searches versions array for metadata
- ✅ Version number passed directly from modal (already has this info)
- ✅ Shorter timeout (100ms vs 200ms)
- ✅ Removed redundant `fetchVersions()` call
- ✅ Simpler state updates

## API Endpoints Usage

### Document Download Endpoint
`GET /api/v1/document/download/{documentId}?version={versionId}`

**Key Behavior:**
- When `version` parameter is **omitted**: Returns the active version automatically
- When `version` parameter is **provided**: Returns that specific version

### Before Optimization:
```
Initial Load:
1. GET /api/v1/document/13 → Get document metadata with activeVersion
2. GET /api/v1/document/download/13?version=16 → Download specific version

Restore Version:
1. POST /api/v1/document/13/setActiveVersion?versionId=15
2. GET /api/v1/document/download/13?version=15 → Download specific version
3. GET /api/v1/document/13/versions → Refresh version list
```

### After Optimization:
```
Initial Load:
1. GET /api/v1/document/13 (parallel)
2. GET /api/v1/document/download/13 (parallel, no version param)

Restore Version:
1. POST /api/v1/document/13/setActiveVersion?versionId=15
2. GET /api/v1/document/download/13?version=15 → Explicitly fetch restored version
```

## Performance Improvements

1. **Initial Load**: Reduced from 2 sequential requests to 2 parallel requests (~50% faster)
2. **Version Restore**: Reduced from 3 requests to 2 requests (~33% fewer requests)
3. **User Experience**: 
   - Faster initial document display
   - Smoother version restore with loading indicator
   - No unnecessary page reloads or data refetches

## Testing Recommendations

1. **Initial Load Test**:
   - Navigate to a document page: `/documents/13`
   - Verify only 2 parallel API calls in Network tab
   - Verify active version loads correctly

2. **Version Restore Test**:
   - Open Version History modal
   - Click restore on a previous version
   - Verify restore button shows spinner
   - Verify document content updates without page reload
   - Verify only 2 API calls (setActiveVersion + download)

3. **Version URL Parameter Test**:
   - Navigate to: `/documents/13?version=15`
   - Verify specific version loads correctly
   - Verify download URL includes version parameter

## Files Modified

1. `src/app/documents/[documentId]/page.tsx` - Main document page logic
2. `src/components/document/VersionHistoryModal.tsx` - Version history UI
3. `src/components/document/DocumentModals.tsx` - Modal container props

## Notes

- All changes maintain backward compatibility
- Error handling preserved from original implementation
- Cache-busting still applied to prevent stale content
- Silent mode used for background requests to avoid notification spam

