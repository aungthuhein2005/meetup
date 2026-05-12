export type LatLng = { lat: number; lng: number }

export type UserProfile = {
  id: string
  name: string
  email: string
  interests: string[]
  location: LatLng | null
  radiusKm: number
  profileImage?: string
  createdAt: Date
  joinedMeetups: number
  createdMeetups: number
  onboardingComplete: boolean
}

export type Meetup = {
  id: string
  title: string
  description: string
  tags: string[]
  creatorId: string
  place: { name: string; lat: number; lng: number; address: string }
  time: { start: Date; end: Date }
  maxParticipants: number
  participants: string[]
  participantCount: number
  locationSharingEnabled: boolean
  status: 'active' | 'cancelled' | 'completed'
  createdAt: Date
  imageUrl?: string
}

export type LiveLocation = {
  userId: string
  lat: number
  lng: number
  updatedAt: Date
}
