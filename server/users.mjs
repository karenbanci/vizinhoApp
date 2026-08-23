export function cleanUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    isProvider: !!row.is_provider,
    createdAt: row.created_at,
  }
}

export function parseServices(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return []
    }
  }
  return []
}

export function mapProviderRow(row) {
  return {
    id: row.user_id + 1000,
    name: row.name,
    category: row.category,
    categoryLabel: row.category_label,
    nationality: row.nationality || 'BR',
    country: row.country || 'BR',
    state: row.state || '',
    city: row.city || '',
    rating: 0,
    reviews: 0,
    price: row.price || '',
    location: row.location || '',
    description: row.description || '',
    bio: row.bio || '',
    photoId: row.photo_id,
    portfolioIds: [],
    reviewsList: [],
    verified: false,
    badge: null,
    availability: row.availability || '',
    availableNow: !!row.available_now,
    deliveryInfo: '',
    services: parseServices(row.services),
  }
}

export function mapProviderDetail(row) {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category,
    categoryLabel: row.category_label,
    nationality: row.nationality || 'BR',
    country: row.country || 'BR',
    state: row.state || '',
    city: row.city || '',
    description: row.description || '',
    bio: row.bio || '',
    price: row.price || '',
    location: row.location || '',
    availability: row.availability || '',
    availableNow: !!row.available_now,
    photoId: row.photo_id,
    services: parseServices(row.services),
  }
}
