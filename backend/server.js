const express = require('express')
const cors = require('cors')
const http = require('http')
const socketIo = require('socket.io')
const sqlite3 = require('sqlite3').verbose()
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
})

const dbPath = process.env.DB_PATH || path.join(__dirname, 'game.db')
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('❌ Database connection error:', err.message)
  else {
    console.log('✅ Database connected:', dbPath)
    // Initialize schema on startup
    initializeDatabase()
  }
})

// Initialize database schema
function initializeDatabase() {
  // Drop old tables if they exist with wrong schema
  db.run('DROP TABLE IF EXISTS world_tiles', (err) => {
    if (err) console.error('Error dropping old world_tiles:', err.message)
    
    const schemaPath = path.join(__dirname, 'db', 'create_tables.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    db.exec(schema, (err) => {
      if (err) {
        console.error('❌ Failed to initialize database schema:', err.message)
      } else {
        console.log('✅ Database schema initialized')
      }
    })
  })
}

// Export db BEFORE requiring routes
module.exports = { db, io }

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// 1. HELMET - Set secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'http://localhost:3000', 'ws://localhost:3000']
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}))

// 2. RATE LIMITING - Prevent brute force attacks
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
})

// Apply rate limiting to all requests
app.use(limiter)

// Stricter rate limiting for auth routes (10 requests per 15 min)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true, // Don't count successful requests
  message: 'Too many login attempts, please try again later.'
})

// 3. CORS - Restrict cross-origin requests
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Middleware
app.use(express.json({ limit: '10kb' })) // Limit payload size to 10kb
app.use(express.urlencoded({ limit: '10kb', extended: true }))

// ============================================================================
// ROUTES
// ============================================================================

const playersRouter = require('./routes/players')
const tilesRouter = require('./routes/tiles')
const actionsRouter = require('./routes/actions')
const chatRouter = require('./routes/chat')

app.use('/api/players', authLimiter, playersRouter)
app.use('/api/tiles', tilesRouter)
app.use('/api/actions', actionsRouter)
app.use('/api/chat', chatRouter)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development'
  const message = isDevelopment ? err.message : 'Internal server error'
  
  res.status(err.status || 500).json({
    error: message,
    ...(isDevelopment && { details: err.stack })
  })
})

// ============================================================================
// SOCKET.IO EVENTS
// ============================================================================

// Store connected players
const connectedPlayers = {}

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id)

  // Player joins the game
  socket.on('player:join', (data) => {
    console.log(`Player joined: ${data.username} (${data.playerId})`)
    connectedPlayers[data.playerId] = {
      ...data,
      socketId: socket.id
    }
    
    // Broadcast to all clients that a new player joined
    io.emit('player:update', {
      playerId: data.playerId,
      username: data.username,
      x: data.x,
      y: data.y,
      mapId: data.mapId
    })
  })

  // Player moves
  socket.on('player:move', (data) => {
    if (connectedPlayers[data.playerId]) {
      connectedPlayers[data.playerId] = { ...connectedPlayers[data.playerId], ...data }
    }
    
    // Broadcast movement to all other clients
    socket.broadcast.emit('player:move', data)
  })

  // Player sends chat message
  socket.on('chat:message', (data) => {
    console.log(`Chat from ${data.username}: ${data.message}`)
    
    // Broadcast message to ALL clients (frontend filters by playerId)
    io.emit('chat:message', {
      playerId: data.playerId,
      username: data.username,
      message: data.message,
      x: data.x,
      y: data.y,
      mapId: data.mapId
    })
  })

  // Player leaves
  socket.on('player:left', (playerId) => {
    console.log(`Player left: ${playerId}`)
    delete connectedPlayers[playerId]
    
    // Broadcast player left to all clients
    io.emit('player:left', playerId)
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
    
    // Find and remove disconnected player
    for (const playerId in connectedPlayers) {
      if (connectedPlayers[playerId].socketId === socket.id) {
        delete connectedPlayers[playerId]
        io.emit('player:left', playerId)
        break
      }
    }
  })
})

const PORT = process.env.PORT || 3001
const HOST = '0.0.0.0'
server.listen(PORT, HOST, () => {
  console.log(`✅ Server is running on http://${HOST}:${PORT}`)
  console.log(`📍 Environment: ${process.env.NODE_ENV}`)
  console.log(`🔒 CORS enabled for: ${process.env.CORS_ORIGIN}`)
})
