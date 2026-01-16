const express = require('express')
const ActionLog = require('../models/ActionLog')

const router = express.Router()

// GET all actions
router.get('/', (req, res) => {
  ActionLog.getAll((err, rows) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(rows)
  })
})

// GET actions by player
router.get('/player/:playerId', (req, res) => {
  ActionLog.getByPlayerId(req.params.playerId, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(rows)
  })
})

// POST create action
router.post('/', (req, res) => {
  const { playerId, actionType, targetTileId, result } = req.body
  ActionLog.create(playerId, actionType, targetTileId, result, (err, action) => {
    if (err) return res.status(500).json({ error: err.message })
    res.status(201).json(action)
  })
})

module.exports = router
