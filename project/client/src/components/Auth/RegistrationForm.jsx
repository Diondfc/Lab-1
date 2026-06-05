import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiClient } from '../../lib/api.js'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function passwordRequirementMessages(password) {
  const p = String(password || '')
  const missing = []
  if (p.length < 8) missing.push('at least 8 characters')
  if (!/[A-Z]/.test(p)) missing.push('one uppercase letter')
  if (!/[a-z]/.test(p)) missing.push('one lowercase letter')
  if (!/\d/.test(p)) missing.push('one number')
  return missing
}

const inputNormal =
  'border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20'

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const navigate = useNavigate()

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required.'
    }

    const email = formData.email.trim()
    if (!email) {
      newErrors.email = 'Email is required.'
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address.'
    }

    const pwdMissing = passwordRequirementMessages(formData.password)
    if (pwdMissing.length) {
      newErrors.password = `Password must include ${pwdMissing.join(', ')}.`
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords must match.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccessMessage('')
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const response = await apiClient.post('/api/auth/register', {
        full_name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      })

      const data = response.data


      setSuccessMessage(data.message || 'Registration successful! Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (error) {
      console.error('Registration Error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Something went wrong. Please try again.'
      setErrors({ api: errorMessage })
    }
    finally {
      setIsLoading(false)
    }
  }

  const pwdHints = passwordRequirementMessages(formData.password)

  return (
    <div className="w-full max-w-md">
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 shadow-lg md:p-10 transition-colors duration-300"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">Sign Up</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Join the Library Management System</p>
        </div>

        {successMessage && (
          <div className="rounded-xl border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/30 px-4 py-3 text-sm text-green-800 dark:text-green-300">
            {successMessage}
          </div>
        )}

        {errors.api && (
          <div className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {errors.api}
          </div>
        )}

        <div>
          <label htmlFor="reg-name" className="mb-2 block font-semibold text-slate-700 dark:text-slate-300">
            Full Name
          </label>
          <input
            id="reg-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            className={`w-full rounded-xl border px-4 py-3 outline-none transition ${errors.name ? 'border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900/30 dark:bg-slate-700 dark:text-white' : inputNormal
              }`}
          />
          {errors.name && <p className="mt-2 text-sm text-red-500">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="reg-email" className="mb-2 block font-semibold text-slate-700 dark:text-slate-300">
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@example.com"
            className={`w-full rounded-xl border px-4 py-3 outline-none transition ${errors.email ? 'border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900/30 dark:bg-slate-700 dark:text-white' : inputNormal
              }`}
          />
          {errors.email && <p className="mt-2 text-sm text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="reg-password" className="mb-2 block font-semibold text-slate-700 dark:text-slate-300">
            Password
          </label>
          <input
            id="reg-password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="At least 8 characters"
            className={`w-full rounded-xl border px-4 py-3 outline-none transition ${errors.password ? 'border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900/30 dark:bg-slate-700 dark:text-white' : inputNormal
              }`}
          />
          {errors.password && <p className="mt-2 text-sm text-red-500">{errors.password}</p>}
          {!errors.password && pwdHints.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Still needed: {pwdHints.join('; ')}.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="reg-confirm" className="mb-2 block font-semibold text-slate-700 dark:text-slate-300">
            Confirm Password
          </label>
          <input
            id="reg-confirm"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Repeat your password"
            className={`w-full rounded-xl border px-4 py-3 outline-none transition ${errors.confirmPassword
              ? 'border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900/30 dark:bg-slate-700 dark:text-white'
              : inputNormal
              }`}
          />
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-red-500">{errors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full rounded-xl bg-indigo-600 py-3 font-semibold text-slate-900 shadow-lg shadow-indigo-600/20 transition duration-200 hover:bg-indigo-500 ${isLoading ? 'cursor-not-allowed opacity-50' : ''
            }`}
        >
          {isLoading ? 'Creating Account...' : 'Register'}
        </button>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Login here
          </Link>
        </p>
      </form>
    </div>
  )
}

export default RegistrationForm
