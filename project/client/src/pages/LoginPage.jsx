import { useOutletContext } from 'react-router-dom'
import LoginForm from '../components/Auth/LoginForm.jsx'

function LoginPage() {
  const { setUser } = useOutletContext()

  return (
    <div className="flex flex-1 items-center justify-center bg-gray-200 px-4 py-10 sm:py-12">
      <LoginForm setUser={setUser} />
    </div>
  )
}

export default LoginPage
