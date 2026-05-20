import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { Timestamp, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { auth, db, isFirebaseConfigured } from '../lib/firebase'
import type { UserProfile } from '../types/models'

type AuthState = {
  firebaseReady: boolean
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signInEmail: (email: string, password: string) => Promise<void>
  signUpEmail: (name: string, email: string, password: string) => Promise<void>
  signOutUser: () => Promise<void>
  refreshProfile: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

function mapProfile(uid: string, data: Record<string, unknown>): UserProfile {
  const loc = data.location as { lat: number; lng: number } | null | undefined
  return {
    id: uid,
    name: String(data.name ?? ''),
    email: String(data.email ?? ''),
    interests: Array.isArray(data.interests) ? (data.interests as string[]) : [],
    location:
      loc && typeof loc.lat === 'number' && typeof loc.lng === 'number'
        ? { lat: loc.lat, lng: loc.lng }
        : null,
    radiusKm: Number(data.radiusKm ?? 5),
    profileImage: data.profileImage ? String(data.profileImage) : undefined,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate()
        : new Date(),
    joinedMeetups: Number(data.joinedMeetups ?? 0),
    createdMeetups: Number(data.createdMeetups ?? 0),
    onboardingComplete: Boolean(data.onboardingComplete),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    if (!auth || !db || !user) {
      setProfile(null)
      return
    }
    const ref = doc(db, 'users', user.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      setProfile(null)
      return
    }
    setProfile(mapProfile(user.uid, snap.data() as Record<string, unknown>))
  }, [user])

  useEffect(() => {
    if (!isFirebaseConfigured() || !auth || !db) {
      setLoading(false)
      return
    }
    const a = auth
    const d = db
    const unsub = onAuthStateChanged(a, async (u) => {
      setUser(u)
      if (!u) {
        setProfile(null)
        setLoading(false)
        return
      }
      const ref = doc(d, 'users', u.uid)
      const snap = await getDoc(ref)
      if (!snap.exists()) {
        setProfile(null)
      } else {
        setProfile(mapProfile(u.uid, snap.data() as Record<string, unknown>))
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const signInEmail = useCallback(async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase Auth is not configured.')
    }
    await signInWithEmailAndPassword(auth, email, password)
  }, [])

  const signUpEmail = useCallback(
    async (name: string, email: string, password: string) => {
      if (!auth || !db) {
        throw new Error('Firebase is not configured.')
      }
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await setDoc(
        doc(db, 'users', cred.user.uid),
        {
          name,
          email,
          interests: [],
          location: null,
          radiusKm: 5,
          createdAt: serverTimestamp(),
          joinedMeetups: 0,
          createdMeetups: 0,
          onboardingComplete: false,
        },
        { merge: true },
      )
    },
    [],
  )

  const signOutUser = useCallback(async () => {
    if (!auth) {
      return
    }
    await signOut(auth)
  }, [])

  const sendPasswordReset = useCallback(async (email: string) => {
    if (!auth) {
      throw new Error('Firebase Auth is not configured.')
    }
    const trimmed = email.trim()
    if (!trimmed) {
      throw new Error('Please enter your email.')
    }
    await sendPasswordResetEmail(auth, trimmed)
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      firebaseReady: isFirebaseConfigured() && Boolean(auth && db),
      user,
      profile,
      loading,
      signInEmail,
      signUpEmail,
      signOutUser,
      refreshProfile,
      sendPasswordReset,
    }),
    [
      user,
      profile,
      loading,
      signInEmail,
      signUpEmail,
      signOutUser,
      refreshProfile,
      sendPasswordReset,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
