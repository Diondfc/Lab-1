import { Routes, Route, Navigate } from 'react-router-dom'
import RegisterPage from '../pages/RegisterPage.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import HomePage from '../pages/HomePage.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RegisterPage />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
