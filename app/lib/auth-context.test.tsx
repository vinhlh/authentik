
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './auth-context'
import { supabase } from '@/lib/supabase'

// Clean up mocks
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

// Test Component to consume context
const TestComponent = () => {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div>Loading...</div>
  return <div>{user ? 'Logged In' : 'Logged Out'}</div>
}

describe('AuthProvider', () => {
  it('shows loading state initially', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('resolves to logged out if no session', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    await waitFor(() => {
      expect(screen.getByText('Logged Out')).toBeInTheDocument()
    })
  })
})
