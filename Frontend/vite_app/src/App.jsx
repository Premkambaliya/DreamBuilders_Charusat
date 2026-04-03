import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/auth/Login'
import SignUp from './pages/auth/SignUp'
import Dashboard from './pages/Dashboard'
import LandingPage from './pages/LandingPage'
import AnalyzeCall from './pages/AnalyzeCall'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLogin = async () => {
    setIsAuthenticated(true)
  }

  const handleSignup = async () => {
    setIsAuthenticated(true)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <Login
              onLogin={handleLogin}
              isAuthenticated={isAuthenticated}
            />
          }
        />
        <Route
          path="/signup"
          element={
            <SignUp
              onSignup={handleSignup}
              isAuthenticated={isAuthenticated}
            />
          }
        />
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/analyze"
          element={isAuthenticated ? <AnalyzeCall /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
