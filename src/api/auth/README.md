# Authentication Setup for AebDMS Frontend
💻 VPS – Serveurs Virtuels (Prix en Dinars Algériens)
Plan	Prix HT/mois (DA)	Prix TTC/mois (DA)	CPU	RAM	Stockage SSD NVMe	Sauvegarde	Trafic	Bande passante publique
VPS-1	3 000	3 570	4 vCores	8 Go	75 Go	Automatisée 1 jour	Illimité	400 Mbit/s
VPS-2	4 800	5 712	6 vCores	12 Go	100 Go	Automatisée 1 jour	Illimité	1 Gbit/s
VPS-3 ⭐	9 600	11 424	8 vCores	24 Go	200 Go	Automatisée 1 jour	Illimité	1,5 Gbit/s
VPS-4	17 200	20 468	12 vCores	48 Go	300 Go	Automatisée 1 jour	Illimité	2 Gbit/s
VPS-5	25 500	30 345	16 vCores	64 Go	350 Go	Automatisée 1 jour	Illimité	2,5 Gbit/s
VPS-6	33 700	40 103	24 vCores	96 Go	400 Go	Automatisée 1 jour	Illimité	3 Gbit/s
This directory contains the authentication configuration and utilities for the AebDMS frontend application, integrating NextAuth.js with Keycloak for JWT token management.

## Files Overview

- `nextAuthConfig.ts` - NextAuth.js configuration with Keycloak provider
- `tokenManager.ts` - Token management utilities for API client
- `README.md` - This documentation file

## Features

✅ **JWT Token Management** - Automatic token refresh and expiration handling
✅ **Keycloak Integration** - Full integration with Keycloak OIDC provider
✅ **Automatic Signout** - Sign out user when token refresh fails
✅ **Request Queuing** - Queue failed requests during token refresh
✅ **Session Management** - Proper session handling with NextAuth.js

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in your frontend root directory with the following variables:

```env
# Keycloak Configuration
KEYCLOAK_ID=your-keycloak-client-id
KEYCLOAK_SECRET=your-keycloak-client-secret
KEYCLOAK_ISSUER=http://localhost:9090/realms/AeB_Dms

# Public Keycloak Configuration (for client-side)
NEXT_PUBLIC_KEYCLOAK_ID=your-keycloak-client-id
NEXT_PUBLIC_KEYCLOAK_ISSUER=http://localhost:9090/realms/AeB_Dms

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Backend API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

### 2. Keycloak Client Configuration

In your Keycloak admin console, ensure your client has the following settings:

- **Client Protocol**: `openid-connect`
- **Access Type**: `confidential`
- **Standard Flow Enabled**: `ON`
- **Direct Access Grants Enabled**: `ON`
- **Valid Redirect URIs**: 
  - `http://localhost:3000/api/auth/callback/keycloak`
  - `http://localhost:3000/auth/callback/keycloak` (if using custom pages)
- **Web Origins**: `http://localhost:3000`

### 3. Backend Configuration

Ensure your Spring Boot backend is configured to validate JWT tokens from Keycloak:

```properties
# In application.properties
spring.security.oauth2.resourceserver.jwt.issuer-uri=${keycloak.baseUrl}/realms/${keycloak.realm}
```

## Usage

### Basic Authentication

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { session, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please sign in</div>;

  return (
    <div>
      <h1>Welcome, {session?.user?.name}!</h1>
      <p>Email: {session?.user?.email}</p>
    </div>
  );
}
```


### API Calls with Authentication

```typescript
import { UserService } from '@/api';

// The API client automatically handles authentication
async function fetchUsers() {
  try {
    const users = await UserService.getAllUsers();
    console.log('Users:', users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
  }
}
```

## How It Works

### 1. Token Flow

1. **Initial Login**: User signs in through Keycloak via NextAuth.js
2. **Token Storage**: Access and refresh tokens are stored in the NextAuth session
3. **API Requests**: Each API request automatically includes the Bearer token
4. **Token Refresh**: When a token expires (401 response), the system automatically refreshes it
5. **Signout**: If refresh fails, the user is automatically signed out

### 2. Request Interceptor

The API client includes a request interceptor that:
- Automatically adds the Bearer token to all requests
- Checks token expiration before making requests
- Refreshes tokens when needed

### 3. Response Interceptor

The API client includes a response interceptor that:
- Detects 401 Unauthorized responses
- Automatically attempts token refresh
- Retries the original request with the new token
- Signs out the user if refresh fails

### 4. Token Refresh Process

1. **Detection**: 401 response triggers refresh attempt
2. **Refresh**: Uses refresh token to get new access token
3. **Update**: Updates the session with new tokens
4. **Retry**: Retries the original request
5. **Fallback**: Signs out user if refresh fails

## Security Considerations

### 1. Token Storage

- Tokens are stored in NextAuth.js session (HTTP-only cookies by default)
- No tokens are stored in localStorage or sessionStorage
- Tokens are automatically included in API requests

### 2. Token Expiration

- Access tokens are checked for expiration before use
- Tokens are refreshed automatically when needed
- Users are signed out if refresh fails

### 3. CORS Configuration

Ensure your Keycloak and backend are properly configured for CORS:

```javascript
// Keycloak client settings
Web Origins: http://localhost:3000
Valid Redirect URIs: http://localhost:3000/api/auth/callback/keycloak
```

## Troubleshooting

### Common Issues

1. **Token Refresh Fails**
   - Check Keycloak client configuration
   - Verify client secret is correct
   - Ensure refresh token is valid

2. **CORS Errors**
   - Add your frontend URL to Keycloak Web Origins
   - Check backend CORS configuration

3. **Session Not Persisting**
   - Verify NEXTAUTH_SECRET is set
   - Check NEXTAUTH_URL matches your domain

4. **API Calls Failing**
   - Check if backend is running
   - Verify API base URL configuration
   - Check network tab for 401/403 errors

### Debug Mode

Enable debug mode in development:

```typescript
// In nextAuthConfig.ts
debug: process.env.NODE_ENV === 'development',
```

This will log detailed information about authentication flow.

## API Reference

### Basic Authentication Usage

```typescript
import { useSession } from 'next-auth/react';

const { data: session, status } = useSession();
const isAuthenticated = status === 'authenticated';
const isLoading = status === 'loading';
```


### Token Manager

```typescript
import { tokenManager } from '@/api/auth/tokenManager';

// Get current access token
const token = await tokenManager.getAccessToken();

// Check if token is expired
const isExpired = await tokenManager.isTokenExpired();

// Get valid token (refreshes if needed)
const validToken = await tokenManager.getValidAccessToken();

// Handle auth failure (sign out)
await tokenManager.handleAuthFailure();
```
