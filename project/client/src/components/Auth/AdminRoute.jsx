import { Navigate, Outlet, useOutletContext } from 'react-router-dom'

function AdminRoute() {
  const { user } = useOutletContext() || {}
  const storedUser = localStorage.getItem('user')
  const currentUser = user || (storedUser ? JSON.parse(storedUser) : null)

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  const isStaff =
    currentUser.role === 'Admin' || currentUser.role === 'Librarian'

  if (!isStaff) {
    return <Navigate to="/home" replace />
  }

  return <Outlet />
}

export default AdminRoute
