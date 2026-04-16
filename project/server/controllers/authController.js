const bcrypt = require('bcrypt')
const { pool } = require('../config/db')

const SALT_ROUNDS = 10

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())

const passwordRuleErrors = (password) => {
  const p = String(password || '')
  const errors = []
  if (p.length < 8) errors.push('at least 8 characters')
  if (!/[A-Z]/.test(p)) errors.push('one uppercase letter')
  if (!/[a-z]/.test(p)) errors.push('one lowercase letter')
  if (!/\d/.test(p)) errors.push('one number')
  return errors
}

async function register(req, res) {
  try {
    const full_name = typeof req.body.full_name === 'string' ? req.body.full_name.trim() : ''
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const password = req.body.password

    if (!full_name) {
      return res.status(400).json({ message: 'Full name is required.' })
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' })
    }
    const pwdIssues = passwordRuleErrors(password)
    if (pwdIssues.length) {
      return res.status(400).json({
        message: `Password must contain ${pwdIssues.join(', ')}.`,
      })
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS)

    const [result] = await pool.execute(
      'INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)',
      [full_name, email, hash]
    )

    return res.status(201).json({
      message: 'Registration successful.',
      user: { id: result.insertId, full_name, email },
    })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'An account with this email already exists.' })
    }
    console.error('register error:', err)
    return res.status(500).json({ message: 'Server error. Please try again later.' })
  }
}

async function login(req, res) {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const password = req.body.password

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' })
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Password is required.' })
    }

    const [rows] = await pool.execute(
      'SELECT id, full_name, email, password FROM users WHERE email = ? LIMIT 1',
      [email]
    )

    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const user = rows[0]
    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    return res.json({
      message: 'Login successful.',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
      },
    })
  } catch (err) {
    console.error('login error:', err)
    return res.status(500).json({ message: 'Server error. Please try again later.' })
  }
}

module.exports = { register, login }
