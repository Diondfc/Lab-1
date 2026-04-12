import Navbar from '../components/Layout/Navbar.jsx'
import LoginForm from '../components/Auth/LoginForm.jsx'

function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-200">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-12">
        <LoginForm />
      </main>
    </div>
  )
}

export default LoginPage
