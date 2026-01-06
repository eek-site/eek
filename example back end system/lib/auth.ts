// Auth configuration - will integrate with your auth provider
// Options: NextAuth.js, Clerk, Auth0, or custom JWT

export type UserRole = 'customer' | 'operator' | 'dispatcher' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: UserRole
  createdAt: Date
}

export interface Session {
  user: User
  accessToken: string
  expiresAt: Date
}

// Placeholder auth functions - implement with your chosen provider
export async function getSession(): Promise<Session | null> {
  // TODO: Implement session retrieval
  return null
}

export async function signIn(email: string, password: string): Promise<Session | null> {
  // TODO: Implement sign in
  console.log('Sign in attempt:', email)
  return null
}

export async function signOut(): Promise<void> {
  // TODO: Implement sign out
}

export function requireAuth(allowedRoles?: UserRole[]) {
  // Middleware helper for protected routes
  return async function checkAuth() {
    const session = await getSession()
    
    if (!session) {
      return { redirect: '/login' }
    }
    
    if (allowedRoles && !allowedRoles.includes(session.user.role)) {
      return { redirect: '/unauthorized' }
    }
    
    return { session }
  }
}
