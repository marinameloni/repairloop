const { db } = require('../server')

class WorldTile {
  static getAll(callback) {
    db.all('SELECT * FROM tiles', callback)
  }

  static getById(id, callback) {
    db.get('SELECT * FROM tiles WHERE id = ?', [id], callback)
  }

  static getByCoordinates(x, y, callback) {
    db.get('SELECT * FROM tiles WHERE x = ? AND y = ?', [x, y], callback)
  }

  static create(x, y, type = 'grass', callback) {
    db.run(
      'INSERT INTO tiles (x, y, type) VALUES (?, ?, ?)',
      [x, y, type],
      function(err) {
        if (err) return callback(err)
        callback(null, { id: this.lastID, x, y, type })
      }
    )
  }

  static update(id, data, callback) {
    const { type, state } = data
    db.run(
      'UPDATE tiles SET type = ?, state = ? WHERE id = ?',
      [type, state, id],
      callback
    )
  }

  static delete(id, callback) {
    db.run('DELETE FROM tiles WHERE id = ?', [id], callback)
  }
}

module.exports = WorldTile
