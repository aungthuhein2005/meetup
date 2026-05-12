import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AuthLayout, OnboardingGuard } from './components/AuthLayout'
import { AuthProvider } from './context/AuthContext'
import { isFirebaseConfigured } from './lib/firebase'
import { AssistantPage } from './pages/AssistantPage'
import { CreateMeetupPage } from './pages/CreateMeetupPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { MeetupDetailPage } from './pages/MeetupDetailPage'
import { OnboardingPage } from './pages/OnboardingPage'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AuthLayout />}>
        <Route element={<AppShell />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<OnboardingGuard />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/meetups/new" element={<CreateMeetupPage />} />
            <Route path="/meetups/:id" element={<MeetupDetailPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
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
