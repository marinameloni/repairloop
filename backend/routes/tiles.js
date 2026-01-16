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

module.exports = router
