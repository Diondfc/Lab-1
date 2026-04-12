import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav className="w-full border-b border-green-900/50 bg-gradient-to-r from-emerald-700 to-green-900 shadow-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="text-lg font-semibold tracking-tight text-white transition hover:text-emerald-100 sm:text-xl"
        >
          UBT Library Management
        </Link>

        <div className="flex items-center gap-6 sm:gap-8">
          <Link
            to="/home"
            className="text-sm font-medium text-green-100 transition hover:text-white"
          >
            Home
          </Link>
          <a
            href="#about"
            className="text-sm font-medium text-green-100 transition hover:text-white"
          >
            About
          </a>
          <Link
            to="/login"
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-green-900"
          >
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
