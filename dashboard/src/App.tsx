import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import About from './pages/About'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CreateRequest from './pages/CreateRequest'
import Appointments from './pages/Appointments'
import Requests from './pages/Requests'
import AIOutputs from './pages/AIOutputs'
import BloodMap from './pages/BloodMap'
import CreateCampaign from './pages/CreateCampaign'
import Campaigns from './pages/Campaigns'
import EditCampaign from './pages/EditCampaign'
import StaffProfile from './pages/StaffProfile'
import UserManagement from './pages/admin/UserManagement'
import SystemSettings from './pages/admin/SystemSettings'
import Layout from './components/Layout'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-headline text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <ThemeProvider>
    <LanguageProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/about" element={
          session ? <Navigate to="/" replace /> : <About />
        } />
        <Route path="/login" element={
          session ? <Navigate to="/" replace /> : <Login />
        } />
        <Route path="/" element={
          session ? <Layout /> : <Navigate to="/about" replace />
        }>
          <Route index element={<Dashboard />} />
          <Route path="create-request" element={<CreateRequest />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="requests" element={<Requests />} />
          <Route path="ai-outputs" element={<AIOutputs />} />
          <Route path="blood-map" element={<BloodMap />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="campaigns/new" element={<CreateCampaign />} />
          <Route path="campaigns/:id/edit" element={<EditCampaign />} />
          <Route path="profile" element={<StaffProfile />} />
          <Route path="admin/users" element={<UserManagement />} />
          <Route path="admin/settings" element={<SystemSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
