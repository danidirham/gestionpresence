import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
// import Index from './pages/Index' // Commenté car nous n'utilisons plus la page d'accueil
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Recognition from './pages/Recognition'
import Messages from './pages/Messages'
import Settings from './pages/Settings'
import AbsenceAlerts from './pages/AbsenceAlerts'
import NotFound from './pages/NotFound'
import Unauthorized from './pages/Unauthorized'
import { ThemeProvider } from './contexts/ThemeContext'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Toaster
          position="top-right"
          theme="system" // This will follow the system theme
          className="dark:text-white dark:bg-gray-800"
        />
        <Routes>
          {/* Redirection de la page d'accueil vers la page de connexion */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/recognition" element={<Recognition />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/alerts" element={<AbsenceAlerts />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
