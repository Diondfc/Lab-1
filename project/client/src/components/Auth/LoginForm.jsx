import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiUrl } from '../../lib/api.js'
import { parseApiJson } from '../../lib/parseApiJson.js'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const inputNormal =
  'border-slate-300 focus:border-green-600 focus:ring-2 focus:ring-green-100'

function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const navigate = useNavigate()

  const validate = () => {
    const next = {}
    const email = formData.email.trim()
    if (!email) next.email = 'Email is required.'
    else if (!emailRegex.test(email)) next.email = 'Please enter a valid email address.'
    if (!formData.password) next.password = 'Password is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccessMessage('')
    if (!validate()) return

    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      })

      const data = await parseApiJson(response)

      if (!response.ok) {
        throw new Error(data.message || 'Sign in failed. Please check your details.')
      }

      setSuccessMessage(data.message || 'Login successful.')
      setTimeout(() => {
        navigate('/home', { replace: true })
      }, 1200)
    } catch (err) {
      setErrors({ api: err.message || 'Something went wrong. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-lg md:p-10"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-green-800">Sign In</h2>
          <p className="mt-2 text-sm text-slate-600">Welcome back to the Library Management System</p>
        </div>

        {successMessage && (
          <div className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
            {successMessage}
          </div>
        )}

        {errors.api && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errors.api}
          </div>
        )}

        <div>
          <label htmlFor="login-email" className="mb-2 block font-semibold text-slate-700">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            placeholder="you@example.com"
            className={`w-full rounded-xl border px-4 py-3 outline-none transition ${
              errors.email ? 'border-red-500 focus:ring-2 focus:ring-red-200' : inputNormal
            }`}
          />
          {errors.email && <p className="mt-2 text-sm text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="login-password" className="mb-2 block font-semibold text-slate-700">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            placeholder="Your password"
            className={`w-full rounded-xl border px-4 py-3 outline-none transition ${
              errors.password ? 'border-red-500 focus:ring-2 focus:ring-red-200' : inputNormal
            }`}
          />
          {errors.password && <p className="mt-2 text-sm text-red-500">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full rounded-xl bg-green-700 py-3 font-semibold text-white shadow-md transition duration-200 hover:bg-green-800 ${
            isLoading ? 'cursor-not-allowed opacity-50' : ''
          }`}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>

        <p className="text-center text-sm text-slate-600">
          Need an account?{' '}
          <Link to="/" className="font-semibold text-green-700 hover:underline">
            Register here
          </Link>
        </p>
      </form>
    </div>
  )
}

export default LoginForm
