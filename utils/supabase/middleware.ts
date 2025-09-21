import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // ⚠️ Must be called, do not remove
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl
  const isOAuthCallback =
    url.searchParams.has('code') ||
    url.searchParams.has('state') ||
    url.searchParams.has('error_description')

  if (isOAuthCallback) {
    return supabaseResponse
  }

  // Protect routes
  if (
    !user &&
    !url.pathname.startsWith('/login') &&
    !url.pathname.startsWith('/register') &&
    !url.pathname.startsWith('/reset-password') &&
    !url.pathname.startsWith('/update-password') &&
    !url.pathname.startsWith('/error')
  ) {
    const redirectUrl = url.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}
