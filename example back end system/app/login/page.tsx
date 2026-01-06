'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'

// MSAL types (loaded from CDN)
declare global {
  interface Window {
    msal: {
      PublicClientApplication: new (config: MSALConfig) => MSALInstance
      LogLevel: {
        Error: number
        Warning: number
        Info: number
        Verbose: number
      }
    }
  }
}

interface MSALConfig {
  auth: {
    clientId: string
    authority: string
    redirectUri: string
    navigateToLoginRequestUrl: boolean
  }
  cache: {
    cacheLocation: string
    storeAuthStateInCookie: boolean
  }
  system?: {
    allowNativeBroker: boolean
    loggerOptions: {
      loggerCallback: (level: number, message: string, containsPii: boolean) => void
      logLevel: number
    }
  }
}

interface MSALAccount {
  username: string
  name?: string
  localAccountId: string
}

interface MSALInstance {
  initialize: () => Promise<void>
  handleRedirectPromise: () => Promise<{ account: MSALAccount } | null>
  getActiveAccount: () => MSALAccount | null
  getAllAccounts: () => MSALAccount[]
  setActiveAccount: (account: MSALAccount) => void
  loginRedirect: (request: { scopes: string[], prompt: string }) => Promise<void>
  logoutRedirect: (options: { postLogoutRedirectUri: string }) => void
}

function LoginContent() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authInProgress, setAuthInProgress] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get return URL from params OR from stored session (MSAL loses URL params on redirect)
  const paramReturnUrl = searchParams.get('returnUrl')
  const storedReturnUrl = typeof window !== 'undefined' ? sessionStorage.getItem('hook_login_return') : null
  const returnUrl = paramReturnUrl || storedReturnUrl || '/admin'

  useEffect(() => {
    // Load MSAL from CDN
    const script = document.createElement('script')
    script.src = 'https://alcdn.msauth.net/browser/2.38.0/js/msal-browser.min.js'
    script.async = true
    script.onload = () => initializeMsal()
    script.onerror = () => {
      setError('Failed to load authentication library. Please refresh.')
      setLoading(false)
    }
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  const initializeMsal = async () => {
    try {
      if (!window.msal || !window.msal.PublicClientApplication) {
        setError('Authentication system failed to load. Please refresh.')
        setLoading(false)
        return
      }

      const LogLevel = window.msal.LogLevel

      const msalConfig: MSALConfig = {
        auth: {
          // TODO: Replace with your Azure AD app registration details
          clientId: process.env.NEXT_PUBLIC_MSAL_CLIENT_ID || 'd67be044-6aaa-4d01-ada2-da0cc50d2034',
          authority: process.env.NEXT_PUBLIC_MSAL_AUTHORITY || 'https://login.microsoftonline.com/61ffc6bc-d9ce-458b-8120-d32187c3770d',
          redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login',
          navigateToLoginRequestUrl: false
        },
        cache: {
          cacheLocation: 'sessionStorage',
          storeAuthStateInCookie: true
        },
        system: {
          allowNativeBroker: false,
          loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
              if (containsPii) return
              if (message?.includes('popup') || message?.includes('window closed')) return
              if (level === LogLevel.Error) console.error('[Auth]', message)
            },
            logLevel: LogLevel.Warning
          }
        }
      }

      const msalInstance = new window.msal.PublicClientApplication(msalConfig)
      
      if (typeof msalInstance.initialize === 'function') {
        await msalInstance.initialize()
      }

      // Check for redirect response
      const response = await msalInstance.handleRedirectPromise()
      if (response && response.account) {
        msalInstance.setActiveAccount(response.account)
        handleSuccessfulAuth(response.account, msalInstance)
        return
      }

      // Check existing session
      const activeAccount = msalInstance.getActiveAccount()
      const allAccounts = msalInstance.getAllAccounts()
      const account = activeAccount || allAccounts[0]

      if (account) {
        msalInstance.setActiveAccount(account)
        handleSuccessfulAuth(account, msalInstance)
        return
      }

      // Store instance for later use
      ;(window as Window & { msalInstance?: MSALInstance }).msalInstance = msalInstance
      setLoading(false)
    } catch (e) {
      console.error('MSAL init error:', e)
      setError('Authentication system failed. Please refresh.')
      setLoading(false)
    }
  }

  const handleSuccessfulAuth = (account: MSALAccount, msalInstance: MSALInstance) => {
    // Store session
    sessionStorage.setItem('hookSession', JSON.stringify({
      token: 'authenticated',
      user: {
        email: account.username,
        name: account.name || account.username,
        role: 'admin'
      },
      expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    }))
    
    // Store MSAL instance reference
    ;(window as Window & { msalInstance?: MSALInstance }).msalInstance = msalInstance
    
    // Get stored return URL (MSAL redirect loses URL params)
    const storedReturn = sessionStorage.getItem('hook_login_return')
    sessionStorage.removeItem('hook_login_return')
    
    // Redirect to return URL (decode it first)
    const destination = storedReturn ? decodeURIComponent(storedReturn) : decodeURIComponent(returnUrl)
    router.push(destination)
  }

  const signIn = async () => {
    if (authInProgress) {
      setError('Sign-in already in progress...')
      return
    }

    setError(null)
    setAuthInProgress(true)

    const msalInstance = (window as Window & { msalInstance?: MSALInstance }).msalInstance
    if (!msalInstance) {
      setError('Authentication not ready. Please refresh.')
      setAuthInProgress(false)
      return
    }

    try {
      // Store return URL before redirect (MSAL will lose URL params)
      sessionStorage.setItem('hook_login_return', returnUrl)
      
      await msalInstance.loginRedirect({
        scopes: ['openid', 'profile', 'User.Read'],
        prompt: 'select_account'
      })
    } catch (e: unknown) {
      console.error('Login error:', e)
      const error = e as { errorCode?: string, errorMessage?: string, message?: string }
      if (error.errorCode === 'user_cancelled') {
        setError('Sign-in cancelled. Try again when ready.')
      } else if (error.errorCode === 'interaction_in_progress') {
        setError('Another sign-in in progress. Please wait.')
      } else {
        setError('Sign-in failed. Please try again.')
      }
      setAuthInProgress(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-zinc-600 border-t-red rounded-full mx-auto mb-4" />
          <p className="text-zinc-500">Loading authentication...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/">
              <Logo className="w-16 h-16 mx-auto mb-4" />
            </Link>
            <h1 className="font-display text-2xl font-bold text-white">Admin Login</h1>
            <p className="text-zinc-500 mt-2">Eek Mechanical dispatch platform</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red/10 border border-red/20 text-red px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Sign in button */}
          <button
            onClick={signIn}
            disabled={authInProgress}
            className="w-full bg-white hover:bg-zinc-100 text-black font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Microsoft logo */}
            <svg className="w-5 h-5" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
              <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
            </svg>
            {authInProgress ? 'Signing in...' : 'Sign in with Microsoft'}
          </button>

          {/* Security features */}
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <div className="grid grid-cols-2 gap-4 text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Encrypted
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Single Sign-On
              </div>
            </div>
          </div>

          {/* Help link */}
          <p className="text-center text-zinc-600 text-sm mt-6">
            Need help? Call{' '}
            <a href="tel:0800769000" className="text-red hover:underline">
              0800 769 000
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}

// Main page component wrapped in Suspense for useSearchParams
export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-zinc-600 border-t-red rounded-full mx-auto mb-4" />
          <p className="text-zinc-500">Loading...</p>
        </div>
      </main>
    }>
      <LoginContent />
    </Suspense>
  )
}
