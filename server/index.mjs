import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.mjs'
import meRoutes from './routes/me.mjs'
import providerRoutes from './routes/providers.mjs'
import adminRoutes from './routes/admin.mjs'

const PORT = process.env.PORT || 3001

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRoutes)
app.use('/api/me', meRoutes)
app.use('/api/providers', providerRoutes)
app.use('/api/admin', adminRoutes)

app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Servidor rodando em http://127.0.0.1:${PORT}`)
})
