const express = require('express')
const Player = require('../models/Player')
const { generateToken, verifyToken } = require('../middleware/auth')
const { validatePlayerCreation, validateLogin, handleValidationErrors } = require('../middleware/validators')

const router = express.Router()

// GET all players (public)
router.get('/', (req, res) => {
  Player.getAll((err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch players' })
    res.json(rows)
  })
})

// GET player by id (authenticated)
router.get('/:id', verifyToken, (req, res) => {
  Player.getById(req.params.id, (err, row) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch player' })
    if (!row) return res.status(404).json({ error: 'Player not found' })
    res.json(row)
  })
})

// POST create player (register)
router.post('/', validatePlayerCreation, handleValidationErrors, (req, res) => {
  const { username, password, password_confirm, avatar_type } = req.body
  
  Player.create(req.body, (err, player) => {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Username already taken' })
      }
      return res.status(500).json({ error: 'Failed to create account' })
    }
    
    // Generate token
    const token = generateToken(player.id, player.username)
    
    res.status(201).json({
      player: {
        id: player.id,
        username: player.username,
        avatar_type: player.avatar_type
      },
      token
    })
  })
})

// POST login
router.post('/auth/login', validateLogin, handleValidationErrors, (req, res) => {
  const { username, password } = req.body
  
  Player.authenticate(username, password, (err, player) => {
    if (err) return res.status(500).json({ error: 'Authentication failed' })
    if (!player) return res.status(401).json({ error: 'Invalid username or password' })
    
    // Generate token
    const token = generateToken(player.id, player.username)
    
    res.json({
      player: {
        id: player.id,
        username: player.username,
        avatar_type: player.avatar_type
      },
      token
    })
  })
})

// PUT update player (authenticated)
router.put('/:id', verifyToken, (req, res) => {
  // Only allow users to update their own data
  if (req.player.id != req.params.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  
  Player.update(req.params.id, req.body, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to update player' })
    Player.getById(req.params.id, (err, player) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch player' })
      res.json(player)
    })
  })
})

// DELETE player (authenticated)
router.delete('/:id', verifyToken, (req, res) => {
  // Only allow users to delete their own account
  if (req.player.id != req.params.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  
  Player.delete(req.params.id, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to delete account' })
    res.json({ message: 'Account deleted' })
  })
})

module.exports = router
