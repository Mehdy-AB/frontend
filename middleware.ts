import { withAuth } from "next-auth/middleware"
import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse } from "next/server"
import { locales, defaultLocale } from './src/i18n/config'

// Create the intl middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed' // Changed to 'as-needed' to support both old and new routes
})

// Combine auth and intl middleware
export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname
    const token = req.nextauth.token
    
    // Allow access to auth pages (signin, error) for non-authenticated users
    if (pathname.startsWith('/auth/')) {
      // If user is authenticated and trying to access signin, redirect to home
      if (token && pathname === '/auth/signin') {
        return NextResponse.redirect(new URL('/', req.url))
      }
      // Allow access to auth pages for non-authenticated users
      return NextResponse.next()
    }
    
    // Handle root route first - redirect to signin if not authenticated
    if (pathname === '/') {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
      // If authenticated, let intl middleware handle the redirect to locale
      const intlResponse = intlMiddleware(req)
      if (intlResponse) {
        return intlResponse
      }
    }
    
    // Handle locale-based routes
    if (pathname.startsWith('/en/') || pathname.startsWith('/fr/') || pathname.startsWith('/ar/')) {
      // First handle internationalization for locale-based routes
      const intlResponse = intlMiddleware(req)
      
      // If intl middleware returns a response (redirect), use it
      if (intlResponse) {
        return intlResponse
      }
      
      // After handling intl, check authentication for these routes
      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
    }
    
    // For all other routes, require authentication
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname
        
        // Allow access to auth pages without token
        if (pathname.startsWith('/auth/')) {
          return true
        }
        
        // Allow access to public assets
        if (pathname.startsWith('/_next/') || pathname.startsWith('/api/auth/') || pathname.includes('.')) {
          return true
        }
        
        // Require token for all other routes
        return !!token
      },
    },
  }
)

// Configure which routes to protect
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
