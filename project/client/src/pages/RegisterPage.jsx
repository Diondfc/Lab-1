import RegistrationForm from '../components/Auth/RegistrationForm.jsx'

function RegisterPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gray-200 dark:bg-slate-900 px-4 py-10 sm:py-12 transition-colors duration-300">
      <RegistrationForm />
    </div>
  )
}

export default RegisterPage
