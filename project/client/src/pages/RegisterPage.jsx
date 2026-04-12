import Navbar from '../components/Layout/Navbar.jsx'
import RegistrationForm from '../components/Auth/RegistrationForm.jsx'

function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-200">
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-12">
        <RegistrationForm />
      </main>
    </div>
  )
}

export default RegisterPage
