import { NextResponse } from 'next/server'

/**
 * Legacy login endpoint - no longer used
 * Authentication is handled via Microsoft Azure AD SSO (MSAL)
 * See: app/login/page.tsx
 */
export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Please use Microsoft SSO login.' },
    { status: 410 } // Gone
  )
}
