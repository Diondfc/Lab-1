import Navbar from '../components/Layout/Navbar.jsx'

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-200">
      <Navbar />
      <main className="flex flex-1" aria-label="Home" />
    </div>
  )
}

export default HomePage
