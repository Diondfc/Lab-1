import { Navigate, Outlet, useOutletContext } from 'react-router-dom'
import { isStaffRole } from '../../lib/roles.js'

function AdminRoute() {
  const { user } = useOutletContext() || {}
  const storedUser = localStorage.getItem('user')
  const token = localStorage.getItem('token')
  const currentUser = user || (storedUser ? JSON.parse(storedUser) : null)

  if (!currentUser || !token) {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    return <Navigate to="/login" replace />
  }

  const isStaff = isStaffRole(currentUser.role)

  if (!isStaff) {
    return <Navigate to="/home" replace />
  }

  return <Outlet />
}

export default AdminRoute
