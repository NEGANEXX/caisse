import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Read the auth_role cookie
  const authRole = request.cookies.get('auth_role')?.value

  // Protect /manager routes
  if (pathname.startsWith('/manager')) {
    if (authRole !== 'Manager') {
      // Redirect unauthorized users to login page
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Protect /staff routes
  if (pathname.startsWith('/staff')) {
    if (authRole !== 'Staff' && authRole !== 'Manager') {
      // Redirect unauthorized users to login page
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // If user is already logged in, prevent them from seeing the login page again
  if (pathname === '/') {
    if (authRole === 'Manager') {
      return NextResponse.redirect(new URL('/manager', request.url))
    } else if (authRole === 'Staff') {
      return NextResponse.redirect(new URL('/staff/cash', request.url))
    }
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - backgrounds (background images)
     * - any other public images (like .webp, .jpg)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.webp|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
}
