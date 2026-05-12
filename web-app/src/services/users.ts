import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { LatLng } from '../types/models'

export async function saveUserOnboarding(
  uid: string,
  input: {
    name: string
    interests: string[]
    location: LatLng | null
    radiusKm: number
  },
): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }
  await setDoc(
    doc(db, 'users', uid),
    {
      name: input.name,
      interests: input.interests,
      location: input.location,
      radiusKm: input.radiusKm,
      onboardingComplete: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
