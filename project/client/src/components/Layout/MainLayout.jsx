import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex w-full flex-1 flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
