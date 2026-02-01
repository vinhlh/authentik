
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LoginModal } from './login-modal'
import * as AuthContextObj from '@/lib/auth-context'

vi.mock('@/lib/auth-context', () => ({
  useAuth: vi.fn(),
}))

describe('LoginModal', () => {
  it('does not render when closed', () => {
    vi.spyOn(AuthContextObj, 'useAuth').mockReturnValue({
      user: null, isLoading: false, signInWithGoogle: vi.fn(), signOut: vi.fn(), session: null, profile: null
    })
    render(<LoginModal isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByText('Welcome to Authentik')).not.toBeInTheDocument()
  })

  it('renders correctly when open', () => {
    vi.spyOn(AuthContextObj, 'useAuth').mockReturnValue({
      user: null, isLoading: false, signInWithGoogle: vi.fn(), signOut: vi.fn(), session: null, profile: null
    })
    render(<LoginModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('Welcome to Authentik')).toBeInTheDocument()
  })

  it('calls signInWithGoogle when button is clicked', () => {
    const signInMock = vi.fn()
    vi.spyOn(AuthContextObj, 'useAuth').mockReturnValue({
      user: null, isLoading: false, signInWithGoogle: signInMock, signOut: vi.fn(), session: null, profile: null
    })

    render(<LoginModal isOpen={true} onClose={vi.fn()} />)

    const googleButton = screen.getByText('Continue with Google')
    fireEvent.click(googleButton)

    expect(signInMock).toHaveBeenCalled()
  })

  it('closes automatically when user logs in', () => {
    const onCloseMock = vi.fn()
    const { rerender } = render(<LoginModal isOpen={true} onClose={onCloseMock} />)

    // Simulate login by updating the mock
    vi.spyOn(AuthContextObj, 'useAuth').mockReturnValue({
      user: { id: 'test' } as any, isLoading: false, signInWithGoogle: vi.fn(), signOut: vi.fn(), session: null, profile: null
    })

    // Rerender with new hook value
    rerender(<LoginModal isOpen={true} onClose={onCloseMock} />)

    expect(onCloseMock).toHaveBeenCalled()
  })
})
