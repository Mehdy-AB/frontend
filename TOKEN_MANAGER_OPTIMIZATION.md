# TokenManager Performance Optimization

## Problem Solved
The original TokenManager was calling `getSession()` on every API request, causing 2+ second delays due to:
- Network/IO overhead for session retrieval
- Cookie parsing repeatedly
- Multiple concurrent `getSession()` calls

## Solution Implemented

### 1. In-Memory Token Caching
- Tokens are stored in memory after initial load
- `getSession()` is called only once on app startup
- Subsequent requests use cached tokens (milliseconds vs seconds)

### 2. Robust Refresh Queue
- Only one token refresh happens at a time
- Concurrent requests wait for the single refresh to complete
- No duplicate refresh calls

### 3. Smart Expiry Detection
- Tokens are considered expired 60 seconds before actual expiry
- Automatic refresh when needed
- Fallback to session if memory cache is empty

## Key Features

### Fast Token Retrieval
```typescript
// Before: 2+ seconds (calls getSession every time)
const token = await tokenManager.getValidAccessToken();

// After: <10ms (uses memory cache)
const token = await tokenManager.getValidAccessToken();
```

### Automatic Initialization
The TokenManager is automatically initialized on app startup via `TokenManagerInitializer` component in the root layout.

### Event-Driven Updates
- Listens for `auth:refresh` events
- Updates memory cache when NextAuth session changes
- Maintains consistency across the app

## Performance Benefits

1. **Initial Load**: One `getSession()` call on startup
2. **Subsequent Requests**: Memory access only (<10ms)
3. **Token Refresh**: Single refresh for all waiting requests
4. **Concurrent Safety**: Queue system prevents race conditions

## Usage

### For API Clients
No changes needed - the existing interceptor works the same:
```typescript
this.client.interceptors.request.use(
  async (config) => {
    const accessToken = await tokenManager.getValidAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  }
);
```

### For Manual Token Access
```typescript
// Fast synchronous access (if token is loaded)
const token = tokenManager.getAccessTokenSync();

// Async access with refresh if needed
const token = await tokenManager.getValidAccessToken();
```

## Monitoring

The optimized TokenManager includes performance logging:
- Initialization status
- Token refresh events
- Performance timing for token retrieval
- Queue status during concurrent requests

Check browser console for logs like:
```
TokenManager: Initializing...
TokenManager: Initialized with token, expires at: 2024-01-01T12:00:00.000Z
TokenManager: getValidAccessToken took 2.34ms (cached)
TokenManager: Token expired, starting refresh...
TokenManager: getValidAccessToken took 150.67ms (refreshed)
```

## Security Notes

- Tokens are stored in memory only (not localStorage)
- Automatic cleanup on auth failure
- Secure refresh token handling
- No token persistence across browser sessions (security best practice)
