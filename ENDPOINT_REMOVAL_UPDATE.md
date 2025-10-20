# Endpoint Removal Update

## Overview
Removed the manual and automatic link endpoints from the frontend as they were removed from the backend.

## Removed Endpoints

### Backend Endpoints Removed:
- ❌ `GET /api/document-links/document/{documentId}/manual`
- ❌ `GET /api/document-links/document/{documentId}/automatic`

## Frontend Changes

### Files Updated:

#### 1. `frontend/src/api/client.ts`
**Removed methods:**
- ❌ `getManualLinks(documentId: number)`
- ❌ `getAutomaticLinks(documentId: number)`

#### 2. `frontend/src/api/notificationClient.ts`
**Removed methods:**
- ❌ `getManualLinks(documentId: number, options?: ApiNotificationOptions)`
- ❌ `getAutomaticLinks(documentId: number, options?: ApiNotificationOptions)`

#### 3. `frontend/src/api/services/documentService.ts`
**Removed methods:**
- ❌ `static async getManualLinks(documentId: number, options?: any)`
- ❌ `static async getAutomaticLinks(documentId: number, options?: any)`

## Alternative Approach

To get manual or automatic links separately, use the existing `getRelatedDocuments()` method with the `isManual` filter:

### Get Manual Links Only:
```typescript
const manualLinks = await DocumentService.getRelatedDocuments(documentId, {
  isManual: true,
  page: 0,
  size: 20
});
```

### Get Automatic Links Only:
```typescript
const automaticLinks = await DocumentService.getRelatedDocuments(documentId, {
  isManual: false,
  page: 0,
  size: 20
});
```

### Get All Links (Manual + Automatic):
```typescript
const allLinks = await DocumentService.getRelatedDocuments(documentId, {
  page: 0,
  size: 20
});
```

## Status

✅ **All changes completed successfully**
- Endpoints removed from API client
- Endpoints removed from notification client  
- Endpoints removed from document service
- No linting errors

## Migration Guide

If you have any UI components using the old methods:

**Old Code:**
```typescript
// ❌ This will no longer work
const manualLinks = await DocumentService.getManualLinks(documentId);
const autoLinks = await DocumentService.getAutomaticLinks(documentId);
```

**New Code:**
```typescript
// ✅ Use this instead
const manualLinks = await DocumentService.getRelatedDocuments(documentId, {
  isManual: true
});

const autoLinks = await DocumentService.getRelatedDocuments(documentId, {
  isManual: false
});
```

---

**Last Updated:** $(date)
**Status:** ✅ Complete


