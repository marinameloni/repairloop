const express = require('express')
const { db } = require('../server')

const router = express.Router()

// GET all messages
router.get('/', (req, res) => {
  db.all('SELECT * FROM chat_messages ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(rows)
  })
})

// POST send message
router.post('/', (req, res) => {
  const { playerId, content } = req.body
  db.run(
    'INSERT INTO chat_messages (player_id, content) VALUES (?, ?)',
    [playerId, content],
    function(err) {
      if (err) return res.status(500).json({ error: err.message })
      res.status(201).json({ id: this.lastID, playerId, content })
    }
  )
})

module.exports = router
