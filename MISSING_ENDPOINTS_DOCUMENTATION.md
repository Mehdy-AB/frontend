# Missing Endpoints Documentation

This document lists the endpoints that are needed for the admin interface but are not currently implemented in the backend API.

## Overview

The frontend admin interface has been created with the following admin categories:
- Users Management (✅ Implemented)
- Groups Management (✅ Implemented) 
- Roles Management (✅ Implemented)
- Link Rules Management (⚠️ Partially Implemented)
- Tags Management (⚠️ Partially Implemented)
- Document Models Management (❌ Not Implemented)
- System Settings (❌ Not Implemented)

## Missing Endpoints

### 1. Document Models Management

**Status**: ❌ Not Implemented

**Required Endpoints**:
```
GET    /api/v1/models                    - Get all document models
POST   /api/v1/models                    - Create new document model
GET    /api/v1/models/{id}               - Get model by ID
PUT    /api/v1/models/{id}               - Update model
DELETE /api/v1/models/{id}               - Delete model
GET    /api/v1/models/{id}/metadata      - Get model metadata fields
POST   /api/v1/models/{id}/metadata      - Add metadata field to model
PUT    /api/v1/models/{id}/metadata/{fieldId} - Update metadata field
DELETE /api/v1/models/{id}/metadata/{fieldId} - Remove metadata field
GET    /api/v1/models/{id}/documents     - Get documents using this model
```

**Data Types Needed**:
```typescript
interface DocumentModel {
  id: number;
  name: string;
  description: string;
  category: string;
  metadataFields: MetadataField[];
  documentCount: number;
  createdAt: string;
  createdBy: string;
  isActive: boolean;
}

interface MetadataField {
  id: number;
  name: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'LIST';
  required: boolean;
  options?: string[];
}
```

### 2. System Settings Management

**Status**: ❌ Not Implemented

**Required Endpoints**:
```
GET    /api/v1/settings                  - Get all system settings
PUT    /api/v1/settings                  - Update system settings
GET    /api/v1/settings/email            - Get email settings
PUT    /api/v1/settings/email            - Update email settings
GET    /api/v1/settings/storage          - Get storage settings
PUT    /api/v1/settings/storage          - Update storage settings
GET    /api/v1/settings/security         - Get security settings
PUT    /api/v1/settings/security         - Update security settings
GET    /api/v1/settings/notifications    - Get notification settings
PUT    /api/v1/settings/notifications    - Update notification settings
```

**Data Types Needed**:
```typescript
interface SystemSettings {
  email: EmailSettings;
  storage: StorageSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
}

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
}

interface StorageSettings {
  maxFileSize: number;
  allowedFileTypes: string[];
  storageQuota: number;
  compressionEnabled: boolean;
}

interface SecuritySettings {
  passwordPolicy: PasswordPolicy;
  sessionTimeout: number;
  twoFactorEnabled: boolean;
  ipWhitelist: string[];
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationTypes: string[];
}
```

### 3. Enhanced Link Rules Management

**Status**: ⚠️ Partially Implemented

**Missing Endpoints**:
```
GET    /api/v1/link-rules/statistics     - Get link rule statistics
POST   /api/v1/link-rules/{id}/execute   - Execute link rule manually
GET    /api/v1/link-rules/{id}/execution-history - Get execution history
POST   /api/v1/link-rules/bulk-execute   - Execute multiple rules
GET    /api/v1/link-rules/metadata-options - Get available metadata for rules
```

### 4. Enhanced Tags Management

**Status**: ⚠️ Partially Implemented

**Missing Endpoints**:
```
GET    /api/v1/tags/statistics           - Get tag usage statistics
POST   /api/v1/tags/bulk-create          - Create multiple tags
PUT    /api/v1/tags/bulk-update          - Update multiple tags
DELETE /api/v1/tags/bulk-delete          - Delete multiple tags
GET    /api/v1/tags/{id}/usage           - Get tag usage details
POST   /api/v1/tags/{id}/merge           - Merge tag with another
```

### 5. Shared Items Management

**Status**: ❌ Not Implemented

**Required Endpoints**:
```
GET    /api/v1/shared                    - Get items shared with current user
GET    /api/v1/shared/documents          - Get shared documents
GET    /api/v1/shared/folders            - Get shared folders
POST   /api/v1/shared/{id}/favorite      - Add shared item to favorites
DELETE /api/v1/shared/{id}/favorite      - Remove from favorites
GET    /api/v1/shared/favorites          - Get favorite shared items
```

### 6. User Dashboard Statistics

**Status**: ❌ Not Implemented

**Required Endpoints**:
```
GET    /api/v1/dashboard/stats           - Get user dashboard statistics
GET    /api/v1/dashboard/recent          - Get recent activity
GET    /api/v1/dashboard/storage         - Get storage usage
GET    /api/v1/dashboard/activity        - Get user activity summary
```

## Implementation Priority

### High Priority
1. **Document Models Management** - Core functionality for document templates
2. **Shared Items Management** - Essential for collaboration features
3. **User Dashboard Statistics** - Important for user experience

### Medium Priority
1. **Enhanced Link Rules Management** - Advanced features for document linking
2. **Enhanced Tags Management** - Better tag management capabilities

### Low Priority
1. **System Settings Management** - Administrative configuration

## Frontend Implementation Status

### ✅ Completed
- Admin dropdown component with navigation
- Header integration with admin dropdown
- Sidebar differentiation for admin vs regular users
- Tags management page (frontend only)
- Link rules management page (frontend only)
- Document models management page (frontend only)
- Shared items page (frontend only)
- Updated administration page with new tabs

### ⚠️ Partially Completed
- Tags API integration (some endpoints missing)
- Link rules API integration (some endpoints missing)

### ❌ Not Started
- System settings page implementation
- Dashboard statistics integration
- Real API integration for models and shared items

## Notes

1. **Mock Data**: Currently using mock data for models and shared items pages
2. **API Integration**: Tags and link rules pages are integrated with existing APIs but may need additional endpoints
3. **User Context**: Admin status is determined by email or roles in session context
4. **Responsive Design**: All components are responsive and mobile-friendly
5. **Internationalization**: All text is properly internationalized using the language context

## Next Steps

1. Implement missing backend endpoints for document models
2. Implement shared items endpoints
3. Add dashboard statistics endpoints
4. Enhance existing tag and link rule endpoints
5. Implement system settings endpoints
6. Replace mock data with real API calls
7. Add proper error handling and loading states
8. Implement proper user role-based access control













