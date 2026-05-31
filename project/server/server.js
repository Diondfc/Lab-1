const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '.env') })

const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/authRoutes')
const eventsRoutes = require('./routes/events.routes')
const locationsRoutes = require('./routes/locations.routes')
const userRoutes = require('./routes/user.routes')
const rolesRoutes = require('./routes/roles.routes')
const booksRoutes = require('./routes/books.routes')
const loanRoutes = require('./routes/loan.routes')
const returnRoutes = require('./routes/return.routes')
const fineRoutes = require('./routes/fine.routes')
const ratingRoutes = require('./routes/rating.routes')
const bookshelfRoutes = require('./routes/bookshelf.routes')
const messageRoutes = require('./routes/message.routes')
const requestRoutes = require('./routes/request.routes')
const notificationRoutes = require('./routes/notification.routes')
const auditLogRoutes = require('./routes/audit-log.routes')
const dashboardRoutes = require('./routes/dashboard.routes')
const userClaimsRoutes = require('./routes/user-claims.routes')
const userTokensRoutes = require('./routes/user-tokens.routes')

const authorsRoutes = require('./routes/authors.routes')
const categoriesRoutes = require('./routes/categories.routes')
const publishersRoutes = require('./routes/publishers.routes')
const membersRoutes = require('./routes/members.routes')
const reservationsRoutes = require('./routes/reservations.routes')
const bookreviewsRoutes = require('./routes/bookreviews.routes')


const PORT = Number(process.env.PORT) || 5001

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
]
const envOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : []
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])]

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error('FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in project/server/.env.')
  process.exit(1)
}

const app = express()

function isAllowedOrigin(origin) {
  if (!origin) return true
  if (allowedOrigins.includes(origin)) return true
  // Dev: allow any localhost / 127.0.0.1 port (Vite may use 5173, 5174, …)
  if (process.env.NODE_ENV !== 'production') {
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return true
    }
  }
  return false
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
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
app.use('/api/roles', rolesRoutes)
app.use('/api/books', booksRoutes)
app.use('/api/loans', loanRoutes)
app.use('/api/returns', returnRoutes)
app.use('/api/fines', fineRoutes)
app.use('/api/ratings', ratingRoutes)
app.use('/api/bookshelf', bookshelfRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/audit-logs', auditLogRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/user-claims', userClaimsRoutes)
app.use('/api/user-tokens', userTokensRoutes)

app.use('/api/authors', authorsRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/publishers', publishersRoutes)
app.use('/api/members', membersRoutes)
app.use('/api/reservations', reservationsRoutes)
app.use('/api/bookreviews', bookreviewsRoutes)


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
