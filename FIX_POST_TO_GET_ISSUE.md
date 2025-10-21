# Fix: POST to GET Method Issue for Related Documents

## Issue
The browser is making a POST request to `/api/document-links/document/{id}/related` but the backend expects GET.

## Root Cause
The frontend code is **already correct** and uses GET method. The issue is caused by:
- Browser caching old JavaScript bundles
- Next.js build cache being stale
- Hot Module Replacement (HMR) not picking up changes

## Verified Code
The `getRelatedDocuments` function in `frontend/src/api/client.ts` correctly uses GET:

```typescript
async getRelatedDocuments(documentId: number, params: {...}): Promise<PageResponse<RelatedDocumentResponseDto>> {
  const queryParams = new URLSearchParams();
  // ... build query params ...
  
  const response: AxiosResponse<PageResponse<RelatedDocumentResponseDto>> = 
    await this.client.get(`/api/document-links/document/${documentId}/related?${queryParams.toString()}`);
  return response.data;
}
```

## Solution Steps

### 1. Clear Browser Cache
**Option A: Hard Refresh**
- Windows/Linux: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**Option B: Clear Cache Manually**
- Open DevTools (F12)
- Right-click the refresh button
- Select "Empty Cache and Hard Reload"

### 2. Clear Next.js Build Cache
Stop the dev server and run:

```bash
cd frontend
rm -rf .next
npm run dev
```

Or on Windows:
```powershell
cd frontend
Remove-Item -Recurse -Force .next
npm run dev
```

### 3. Clear node_modules and Reinstall (If Still Not Working)
```bash
cd frontend
rm -rf node_modules .next
npm install
npm run dev
```

### 4. Verify the Fix
1. Open DevTools Network tab
2. Refresh the page
3. Check the request to `/api/document-links/document/1/related`
4. Verify it shows `GET` as the Request Method

## Prevention
To avoid this in the future:
1. Always hard refresh after code changes
2. Restart the dev server after major changes
3. Consider disabling cache in DevTools during development:
   - DevTools → Network tab → Check "Disable cache"

