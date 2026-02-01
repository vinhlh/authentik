
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RestaurantCard, Restaurant } from './restaurant-card'
import * as AuthContextObj from '@/lib/auth-context'

// Mock dependencies
vi.mock('@/lib/auth-context', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/lib/i18n-context', () => ({
  useLanguage: () => ({
    language: 'en',
    t: (key: string) => key,
  }),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const mockRestaurant: Restaurant = {
  id: 'test-1',
  name: 'Test Restaurant',
  rating: 4.8,
  location: 'Da Nang',
  cuisine: 'Vietnamese',
  price: '$$',
  tags: ['Local'],
  image: '/test.jpg',
  alt: 'Test Alt',
  badge: { text: 'Local Favorite', type: 'local' },
}

describe('RestaurantCard', () => {
  it('renders restaurant details correctly', () => {
    // Mock unauthorized state
    vi.spyOn(AuthContextObj, 'useAuth').mockReturnValue({
      user: null,
      isLoading: false,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      session: null,
      profile: null
    })

    render(<RestaurantCard restaurant={mockRestaurant} />)

    expect(screen.getByText('Test Restaurant')).toBeInTheDocument()
    expect(screen.getByText('4.8')).toBeInTheDocument()
    expect(screen.getByText('Local Favorite')).toBeInTheDocument()
  })

  it('shows distance when userLocation is provided', () => {
    vi.spyOn(AuthContextObj, 'useAuth').mockReturnValue({
      user: null,
      isLoading: false,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      session: null,
      profile: null
    })

    const restaurantWithCoordinates = {
      ...mockRestaurant,
      coordinates: { lat: 16.0544, lng: 108.2022 },
    }
    const userLocation = { lat: 16.0544, lng: 108.2022 } // Same location, 0km

    render(
      <RestaurantCard
        restaurant={restaurantWithCoordinates}
        userLocation={userLocation}
      />
    )

    expect(screen.getAllByText('0m')[0]).toBeInTheDocument()
  })
})
