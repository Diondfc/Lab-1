const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '.env') })

const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/authRoutes')

const PORT = Number(process.env.PORT) || 5001
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

const app = express()

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
)
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRoutes)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: 'Server error. Please try again later.' })
})

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})
