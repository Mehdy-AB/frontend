# Frontend Authentication Update Summary

## Changes Made

### 1. Updated Auth Service (`frontend/src/api/services/authService.ts`)

#### Login Request Interface
```typescript
export interface LoginRequest {
  usernameOrEmail: string; // Changed from 'username'
  password: string;
}
```

#### Login Response Interface  
```typescript
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    username: string;
    email: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    jobTitle?: string;
    imageUrl?: string;
    roles: string[];
    permissions: string[];
  };
}
```

#### Key Changes:
- ✅ Updated login endpoint to use `/api/v1/auth/login`
- ✅ Changed request field from `username` to `usernameOrEmail`
- ✅ Added response normalization to handle both camelCase and snake_case
- ✅ Added support for new user fields: `firstName`, `lastName`, `jobTitle`, `imageUrl`
- ✅ Included roles and permissions in response

### 2. Updated NextAuth Configuration (`frontend/src/api/auth/nextAuthConfig.ts`)

#### Key Changes:
- ✅ Updated to use `usernameOrEmail` in login request
- ✅ Passes additional user fields to session: `firstName`, `lastName`, `jobTitle`
- ✅ Maintains compatibility with new response structure

### 3. Updated NextAuth Type Definitions (`frontend/src/lib/next.auth.d.ts`)

#### Added Fields to Session and User Interfaces:
```typescript
firstName?: string | null
lastName?: string | null
jobTitle?: string | null
```

## Authentication Flow

### Login Request Format
```typescript
POST /api/v1/auth/login
{
  "usernameOrEmail": "admin",
  "password": "admin123"
}
```

### Expected Response Format
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id": "011d3712-e195-49c6-8e86-356734ac377c",
    "username": "admin",
    "email": "admin@aebdms.local",
    "displayName": "System Administrator",
    "firstName": "System",
    "lastName": "Administrator",
    "jobTitle": "System Administrator",
    "imageUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    "roles": ["SUPER_ADMIN"],
    "permissions": ["*all permissions*"]
  }
}
```

## Usage

### Login
```typescript
import { authService } from '@/api/services/authService';

const response = await authService.login({
  usernameOrEmail: 'admin',
  password: 'admin123'
});

console.log(response.user.jobTitle); // "System Administrator"
console.log(response.user.imageUrl); // Avatar URL
console.log(response.user.roles); // ["SUPER_ADMIN"]
```

### Accessing User Data in Components
```typescript
import { useSession } from 'next-auth/react';

function MyComponent() {
  const { data: session } = useSession();
  
  console.log(session?.user.firstName);
  console.log(session?.user.jobTitle);
  console.log(session?.user.imageUrl);
  
  return <div>Welcome, {session?.user.displayName}!</div>;
}
```

## Breaking Changes

### ⚠️ Important
1. **Login request field changed**: Use `usernameOrEmail` instead of `username`
2. **New response structure**: User object now includes `firstName`, `lastName`, `jobTitle`, `imageUrl`
3. **Token format**: Backend uses snake_case (`access_token`, `refresh_token`) but frontend normalizes to camelCase

## Testing

### Test Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "admin",
    "password": "admin123"
  }'
```

### Expected Response
- Status: 200 OK
- Access token present
- Refresh token present
- User object with all new fields
- Roles array with SUPER_ADMIN
- Permissions array

## Migration Notes

- No database migration needed
- All changes are API-level
- Backward compatible with existing session data
- New fields are optional and gracefully handle missing data
