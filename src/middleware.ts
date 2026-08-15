import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const authPages = ['/login', '/signup', '/forgot-password', '/reset-password']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = await getToken({ req, secret: process.env.AUTH_SECRET })
  const isLoggedIn = Boolean(token)

  if (pathname.startsWith('/dashboard') && !isLoggedIn) {
    const url = new URL('/login', req.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (pathname === '/' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  if (pathname === '/' && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (authPages.includes(pathname) && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
