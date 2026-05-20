import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AuthLayout, OnboardingGuard } from './components/AuthLayout'
import { AuthProvider } from './context/AuthContext'
import { isFirebaseConfigured } from './lib/firebase'
import { AssistantPage } from './pages/AssistantPage'
import { CreateMeetupPage } from './pages/CreateMeetupPage'
import { DevSeedPage } from './pages/DevSeedPage'
import { HomePage } from './pages/HomePage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { MeetupDetailPage } from './pages/MeetupDetailPage'
import { MeetupLandingPage } from './pages/MeetupLandingPage'
import { MyEventsPage } from './pages/MyEventsPage'
import { OnboardingPage } from './pages/OnboardingPage'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/m/:id" element={<MeetupLandingPage />} />
      <Route element={<AuthLayout />}>
        <Route element={<AppShell />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<OnboardingGuard />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/me" element={<MyEventsPage />} />
            <Route path="/meetups/new" element={<CreateMeetupPage />} />
            <Route path="/meetups/:id" element={<MeetupDetailPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/dev/seed" element={<DevSeedPage />} />
          </Route>
        </Route>
      </Route>
      <Route
        path="*"
        element={
          <Navigate to={isFirebaseConfigured() ? '/' : '/login'} replace />
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
