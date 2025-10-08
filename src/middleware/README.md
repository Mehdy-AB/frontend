# Authentication Middleware

This directory contains the authentication middleware and related components for protecting routes in the AebDMS frontend application.

## Files Overview

- `middleware.ts` - NextAuth middleware for route protection
- `../app/auth/signin/page.tsx` - Custom sign-in page
- `../app/auth/error/page.tsx` - Custom error page for authentication errors
- `../components/auth/` - Authentication components

## How It Works

### 1. Middleware Protection

The `middleware.ts` file uses NextAuth's `withAuth` middleware to protect all routes except:

- `/api/auth/*` - NextAuth.js API routes
- `/_next/static/*` - Static files
- `/_next/image/*` - Image optimization files
- `/favicon.ico` - Favicon file
- Public assets (images, etc.)

### 2. Route Protection Flow

1. **User visits protected route** → Middleware checks authentication
2. **If not authenticated** → Redirects to `/auth/signin`
3. **User signs in** → Redirected back to original route
4. **If authenticated** → Access granted to route

### 3. Custom Pages

#### Sign-in Page (`/auth/signin`)
- Custom UI for authentication
- Handles sign-in with Keycloak
- Shows loading states and error messages
- Redirects to home page after successful authentication

#### Error Page (`/auth/error`)
- Displays authentication errors
- Provides user-friendly error messages
- Offers retry and navigation options

## Usage

### Basic Route Protection

All routes are automatically protected by the middleware. No additional configuration needed.

### Using Authentication Components

```typescript
import { ProtectedRoute, SignOutButton, LoadingSpinner } from '@/components/auth'

// Protect a component
function MyPage() {
  return (
    <ProtectedRoute>
      <div>This content is only visible to authenticated users</div>
    </ProtectedRoute>
  )
}

// Add sign-out button
function Header() {
  return (
    <header>
      <h1>My App</h1>
      <SignOutButton />
    </header>
  )
}

// Show loading spinner
function LoadingPage() {
  return <LoadingSpinner message="Loading data..." size="lg" />
}
```

### Checking Authentication Status

```typescript
import { useSession } from 'next-auth/react'

function MyComponent() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') return <div>Loading...</div>
  if (status === 'unauthenticated') return <div>Please sign in</div>
  
  return <div>Welcome, {session?.user?.name}!</div>
}
```

## Configuration

### Environment Variables

Make sure these environment variables are set in your `.env.local`:

```env
# Keycloak Configuration
KEYCLOAK_ID=your-keycloak-client-id
KEYCLOAK_SECRET=your-keycloak-client-secret
KEYCLOAK_ISSUER=http://localhost:9090/realms/AeB_Dms

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

### Keycloak Client Configuration

In your Keycloak admin console, ensure your client has:

- **Valid Redirect URIs**: 
  - `http://localhost:3000/api/auth/callback/keycloak`
  - `http://localhost:3000/auth/callback/keycloak`
- **Web Origins**: `http://localhost:3000`

## Customization

### Customizing Protected Routes

To exclude specific routes from protection, modify the `matcher` in `middleware.ts`:

```typescript
export const config = {
  matcher: [
    // Add routes to exclude from protection
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public|about).*)",
  ],
}
```

### Customizing Sign-in Page

Modify `src/app/auth/signin/page.tsx` to customize the sign-in experience:

- Change the UI design
- Add additional authentication providers
- Customize error handling
- Add branding elements

### Customizing Error Page

Modify `src/app/auth/error/page.tsx` to customize error handling:

- Add specific error messages
- Customize error UI
- Add support contact information
- Add retry mechanisms

## Security Considerations

### 1. Route Protection

- All routes are protected by default
- Middleware runs on the edge for fast authentication checks
- No sensitive data is exposed to unauthenticated users

### 2. Session Management

- Sessions are managed by NextAuth.js
- JWT tokens are stored securely
- Automatic token refresh is handled

### 3. Error Handling

- Authentication errors are handled gracefully
- Users are provided with clear error messages
- Fallback mechanisms prevent app crashes

## Troubleshooting

### Common Issues

1. **Infinite redirect loops**
   - Check Keycloak redirect URI configuration
   - Verify NEXTAUTH_URL matches your domain

2. **Middleware not working**
   - Ensure `middleware.ts` is in the root directory
   - Check that NextAuth is properly configured

3. **Sign-in page not loading**
   - Verify the custom sign-in page exists
   - Check for any TypeScript errors

4. **Authentication errors**
   - Check Keycloak client configuration
   - Verify environment variables are set correctly

### Debug Mode

Enable debug mode in development:

```typescript
// In nextAuthConfig.ts
debug: process.env.NODE_ENV === 'development',
```

This will log detailed information about the authentication flow.

## API Reference

### Middleware

```typescript
// middleware.ts
export default withAuth(
  function middleware(req) {
    // Custom middleware logic
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Authorization logic
        return !!token
      },
    },
  }
)
```

### ProtectedRoute Component

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

<ProtectedRoute fallback={<CustomLoading />}>
  <YourContent />
</ProtectedRoute>
```

### SignOutButton Component

```typescript
interface SignOutButtonProps {
  className?: string
  children?: React.ReactNode
  variant?: 'button' | 'link'
}

<SignOutButton variant="link" className="text-red-600">
  Logout
</SignOutButton>
```

### LoadingSpinner Component

```typescript
interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

<LoadingSpinner message="Loading..." size="lg" />
```

