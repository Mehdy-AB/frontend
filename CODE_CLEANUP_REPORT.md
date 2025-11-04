# Code Cleanup Report - Frontend Refactoring

**Date**: 2025-11-04  
**Branch**: `cleanup/frontend/split-long-files-20251104182349`  
**Status**: In Progress

## Summary

This cleanup focuses on organizing, simplifying, and splitting long/complex files in the Next.js frontend. Initial work has addressed build errors, and file splitting is in progress.

## Build Status

### Before Changes
- ❌ Build failed with multiple TypeScript errors
- Multiple invalid icon imports from `lucide-react`
- Invalid Badge variant usage (`variant="success"` not supported)
- Missing type properties in API interfaces

### After Initial Fixes (Current Status)
- ✅ Fixed invalid icon imports (removed 100+ non-existent loader icons from transactions page)
- ✅ Fixed Badge variant usage (replaced `variant="success"` with `variant="default" className="bg-green-500"`)
- ✅ Fixed LinkRuleResponseDto type issues
- ⚠️ Some build errors may remain (needs full build verification)

### Commands Run
```bash
npm ci                    # Clean install - SUCCESS
npm run build             # Build - PARTIALLY FIXED (some errors remain)
```

## Files Modified (Build Fixes)

1. **src/app/admin/documents/linking/page.tsx**
   - Fixed `conditionsLogic` property access (LinkRuleResponseDto doesn't include it)
   - Fixed `sourceMetadataId`/`targetMetadataId` to use `sourceMetadata`/`targetMetadata` objects

2. **src/app/admin/system/emails/page.tsx**
   - Added missing `Database` icon import

3. **src/app/admin/system/license/page.tsx**
   - Removed invalid `Stop` icon import

4. **src/app/admin/system/transactions/page.tsx**
   - Removed 100+ invalid icon imports (LoaderBounce1-100, QuestionMarkCircle, CheckCircle2, etc.)
   - Cleaned up unused/non-existent icon imports

5. **src/app/admin/users/[userId]/page.tsx**
   - Fixed Badge variant usage (3 instances: Active status, Verified status)

6. **src/app/admin/users/page.tsx**
   - Fixed Badge variant usage (Active status)

## Files Identified for Splitting (>300 lines)

### Priority 1 - Very Large Files (>1000 lines)
1. **src/app/admin/system/dms-settings/page.tsx** (~1406 lines)
   - **Plan**: Split into:
     - `components/admin/dms-settings/OverviewTab.tsx`
     - `components/admin/dms-settings/StorageTab.tsx`
     - `components/admin/dms-settings/SecurityTab.tsx`
     - `components/admin/dms-settings/PerformanceTab.tsx`
     - `components/admin/dms-settings/BackupTab.tsx`
     - `components/admin/dms-settings/LogsTab.tsx`
     - `hooks/useDMSSettings.ts`
     - `lib/dmsSettingsUtils.ts`

2. **src/app/admin/system/email/page.tsx** (~936 lines)
   - **Plan**: Split into:
     - `components/admin/email/SMTPSettings.tsx`
     - `components/admin/email/EmailTemplates.tsx`
     - `components/admin/email/DeliverySettings.tsx`
     - `components/admin/email/EmailStats.tsx`
     - `hooks/useEmailSettings.ts`

3. **src/app/admin/system/emails/page.tsx** (~910 lines)
   - **Plan**: Split into:
     - `components/admin/emails/EmailCampaigns.tsx`
     - `components/admin/emails/EmailTemplatesList.tsx`
     - `components/admin/emails/EmailLogs.tsx`
     - `hooks/useEmailManagement.ts`

### Priority 2 - Large Files (500-800 lines)
4. **src/app/folders/[folderId]/page.tsx** (~736 lines)
   - **Status**: Already partially extracted (uses components from `@/components/folder`)
   - **Plan**: Further extraction:
     - Extract table row components
     - Extract folder action handlers to `hooks/useFolderActions.ts`
     - Move utility functions to `utils/folderUtils.ts`

5. **src/app/shared/page.tsx** (~627 lines)
   - **Plan**: Split into:
     - `components/shared/FolderCard.tsx` (grid view)
     - `components/shared/FolderRow.tsx` (list view) - already extracted inline
     - `components/shared/SharedPageHeader.tsx`
     - `hooks/useSharedFolders.ts`

6. **src/app/documents/[documentId]/page.tsx** (~562 lines)
   - **Status**: Already uses extracted components from `@/components/document`
   - **Plan**: Further extraction:
     - Extract document action handlers to `hooks/useDocumentActions.ts`
     - Move utility functions

### Priority 3 - Medium Files (300-500 lines)
7. **src/app/folders/page.tsx** (~578 lines)
8. **src/app/admin/system/customization/page.tsx** (~700+ lines)
9. **src/app/admin/system/license/page.tsx** (~600+ lines)
10. **src/components/modals/FileUploadModal.tsx** (~500+ lines)
11. **src/app/admin/documents/linking/page.tsx** (~1600+ lines)

## Extraction Strategy

### Components
- Extract internal subcomponents into feature-specific folders
- Each component file exports a single React component
- Small helpers exported via `index.ts` barrel files

### Hooks
- Move stateful logic to `hooks/` directory
- Examples: `usePagination`, `useFetchX`, `useFormState`, `useDebouncedValue`
- Document with TSDoc comments

### Utilities
- Extract pure functions to `lib/` or `utils/`
- Keep utils framework-agnostic to avoid circular imports

### Types
- Centralize shared types in `types/` or `src/types/`
- Use named exports, barrel files sparingly

## Next Steps

### Immediate Actions
1. ✅ Fix build errors (COMPLETED - initial fixes)
2. ⏳ Complete build verification
3. ⏳ Split `src/app/admin/system/dms-settings/page.tsx` (highest priority)
4. ⏳ Split `src/app/admin/system/email/page.tsx`
5. ⏳ Split `src/app/admin/system/emails/page.tsx`
6. ⏳ Extract hooks from large page components
7. ⏳ Move utility functions to `lib/` or `utils/`

### Testing
- Run `npm run build` after each major refactor
- Run `npm test` if test suite exists
- Manual smoke testing of affected routes

### Documentation
- Add TSDoc comments for extracted functions/components
- Update import paths
- Document any breaking changes

## Files Created/Modified

### New Files (To Be Created)
- `src/components/admin/dms-settings/` (multiple components)
- `src/components/admin/email/` (multiple components)
- `src/components/admin/emails/` (multiple components)
- `src/hooks/useDMSSettings.ts`
- `src/hooks/useEmailSettings.ts`
- `src/hooks/useEmailManagement.ts`
- `src/lib/dmsSettingsUtils.ts`

### Files to Move to `src/removed/` (if unsure about deletion)
- None identified yet (all code is being refactored, not deleted)

## Warnings & Manual Review Required

1. **API Routes**: Not modified (per requirements)
2. **Next.js Routing**: Page file paths preserved
3. **localStorage Keys**: Not changed
4. **Build Errors**: Some may remain - full build verification needed

## Rollback Instructions

To revert all changes:
```bash
git checkout master
git branch -D cleanup/frontend/split-long-files-20251104182349
```

To revert specific commits:
```bash
git log --oneline  # Find commit hash
git revert <commit-hash>
```

## Local Verification

After cleanup:
```bash
npm ci
npm run build
npm run dev  # Test main routes:
  - / (dashboard)
  - /folders
  - /folders/[folderId]
  - /documents/[documentId]
  - /admin/system/dms-settings
  - /admin/system/email
```

## Notes

- All changes are committed on branch `cleanup/frontend/split-long-files-20251104182349`
- Build errors fixed: invalid imports, Badge variants
- File splitting is in progress - focusing on largest files first
- Tests may need updating after component extractions
