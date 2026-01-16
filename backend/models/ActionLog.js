const { db } = require('../server')

class ActionLog {
  static getAll(callback) {
    db.all('SELECT * FROM actions', callback)
  }

  static getByPlayerId(playerId, callback) {
    db.all('SELECT * FROM actions WHERE player_id = ?', [playerId], callback)
  }

  static create(playerId, actionType, targetTileId = null, result = null, callback) {
    db.run(
      'INSERT INTO actions (player_id, action_type, target_tile_id, result) VALUES (?, ?, ?, ?)',
      [playerId, actionType, targetTileId, result],
      function(err) {
        if (err) return callback(err)
        callback(null, { id: this.lastID, playerId, actionType })
      }
    )
  }
}

module.exports = ActionLog
