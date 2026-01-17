const express = require('express')
const WorldTile = require('../models/WorldTile')

const router = express.Router()

// GET all tiles
router.get('/', (req, res) => {
  WorldTile.getAll((err, rows) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(rows)
  })
})

// GET blocked tiles for a map
router.get('/map/:mapId', (req, res) => {
  const { mapId } = req.params
  const { db } = require('../server')
  db.all(
    'SELECT x, y, is_blocked, block_type FROM world_tiles WHERE world_state_id = ? AND is_blocked = 1',
    [mapId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message })
      res.json(rows || [])
    }
  )
})

// GET tile by id
router.get('/:id', (req, res) => {
  WorldTile.getById(req.params.id, (err, row) => {
    if (err) return res.status(500).json({ error: err.message })
    if (!row) return res.status(404).json({ error: 'Tile not found' })
    res.json(row)
  })
})

// POST create tile
router.post('/', (req, res) => {
  const { x, y, type } = req.body
  WorldTile.create(x, y, type || 'grass', (err, tile) => {
    if (err) return res.status(500).json({ error: err.message })
    res.status(201).json(tile)
  })
})

// PUT update tile
router.put('/:id', (req, res) => {
  WorldTile.update(req.params.id, req.body, (err) => {
    if (err) return res.status(500).json({ error: err.message })
    WorldTile.getById(req.params.id, (err, tile) => {
      if (err) return res.status(500).json({ error: err.message })
      res.json(tile)
    })
  })
})

// DELETE tile
router.delete('/:id', (req, res) => {
  WorldTile.delete(req.params.id, (err) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Tile deleted' })
  })
})

// POST save tiles (bulk update for blocked tiles)
router.post('/save', (req, res) => {
  const { mapId, tiles } = req.body
  
  if (!Array.isArray(tiles)) {
    return res.status(400).json({ error: 'tiles must be an array' })
  }

  // Update each blocked tile
  let completed = 0
  let hasError = false

  if (tiles.length === 0) {
    return res.json({ message: 'No tiles to save' })
  }

  tiles.forEach(tile => {
    WorldTile.update(tile.x, tile.y, mapId, { is_blocked: true }, (err) => {
      completed++
      if (err && !hasError) {
        hasError = true
        return res.status(500).json({ error: err.message })
      }
      
      if (completed === tiles.length && !hasError) {
        res.json({ message: `Updated ${tiles.length} tiles` })
      }
    })
  })
})

module.exports = router
