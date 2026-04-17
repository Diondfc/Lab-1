import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'

export default function MainLayout() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user')
    return storedUser ? JSON.parse(storedUser) : null
  })

  useEffect(() => {
    const syncUser = (event) => {
      if (event.key === 'user') {
        setUser(event.newValue ? JSON.parse(event.newValue) : null)
      }
    }

    window.addEventListener('storage', syncUser)
    return () => window.removeEventListener('storage', syncUser)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar user={user} setUser={setUser} />
      <main className="flex w-full flex-1 flex-col">
        <Outlet context={{ user, setUser }} />
      </main>
      <Footer />
    </div>
  )
}
