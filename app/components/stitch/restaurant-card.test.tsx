import { render, screen } from '@testing-library/react'
import { RestaurantCard, Restaurant } from './restaurant-card'
import { describe, it, expect } from 'vitest'

const mockRestaurant: Restaurant = {
  id: '123',
  name: 'Test Restaurant',
  rating: 4.5,
  location: 'Downtown',
  cuisine: 'Vietnamese',
  price: '$$',
  tags: ['Pho', 'Lunch'],
  image: 'https://example.com/image.jpg',
  alt: 'Restaurant image',
  badge: { text: 'Test Badge', type: 'local' }
}

describe('RestaurantCard', () => {
  it('renders restaurant information correctly', () => {
    render(<RestaurantCard restaurant={mockRestaurant} />)

    expect(screen.getByText('Test Restaurant')).toBeInTheDocument()
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText(/Downtown/)).toBeInTheDocument()
    expect(screen.getByText(/Vietnamese/)).toBeInTheDocument()
    expect(screen.getByText('Test Badge')).toBeInTheDocument()
  })

  it('renders without badge when not provided', () => {
    const noBadgeRestaurant = { ...mockRestaurant, badge: undefined }
    render(<RestaurantCard restaurant={noBadgeRestaurant} />)

    expect(screen.queryByText('Test Badge')).not.toBeInTheDocument()
  })
})
