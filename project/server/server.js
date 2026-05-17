const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '.env') })

const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/authRoutes')
const eventsRoutes = require('./routes/events.routes')
const locationsRoutes = require('./routes/locations.routes')
const userRoutes = require('./routes/user.routes')
const booksRoutes = require('./routes/books.routes')
const loanRoutes = require('./routes/loan.routes')
const returnRoutes = require('./routes/return.routes')
const ratingRoutes = require('./routes/rating.routes')
const bookshelfRoutes = require('./routes/bookshelf.routes')
const messageRoutes = require('./routes/message.routes')
const requestRoutes = require('./routes/request.routes')

const PORT = Number(process.env.PORT) || 5001

const defaultOrigins = ['http://localhost:5173', 'http://localhost:3000']
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : defaultOrigins

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Copy project/server/.env.example to .env and set JWT_SECRET.')
  process.exit(1)
}

const app = express()

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`))
      }
    },
    credentials: true,
  }),
)
app.use(express.json())

const uploadsDir = path.join(__dirname, 'uploads')
require('fs').mkdirSync(uploadsDir, { recursive: true })
app.use('/uploads', express.static(uploadsDir))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/locations', locationsRoutes)
app.use('/api/users', userRoutes)
app.use('/api/books', booksRoutes)
app.use('/api/loans', loanRoutes)
app.use('/api/returns', returnRoutes)
app.use('/api/ratings', ratingRoutes)
app.use('/api/bookshelf', bookshelfRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/requests', requestRoutes)

app.use((err, _req, res, _next) => {
  if (err.message?.startsWith('CORS blocked')) {
    return res.status(403).json({ message: err.message })
  }
  console.error(err)
  res.status(500).json({ message: 'Server error. Please try again later.' })
})

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`)
})
