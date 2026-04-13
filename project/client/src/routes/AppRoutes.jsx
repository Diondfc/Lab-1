import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '../components/Layout/MainLayout.jsx'
import RegisterPage from '../pages/RegisterPage.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import HomePage from '../pages/HomePage.jsx'
import AdminPanel from '../pages/AdminPanel.jsx'
import About from '../components/Layout/MainLayout.jsx'


export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<RegisterPage />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/About" element={<About />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
