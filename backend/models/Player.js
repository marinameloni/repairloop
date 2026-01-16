const { db } = require('../server')
const bcrypt = require('bcrypt')

class Player {
  static getAll(callback) {
    db.all('SELECT * FROM players', callback)
  }

  static getById(id, callback) {
    db.get('SELECT * FROM players WHERE id = ?', [id], callback)
  }

  static getByUsername(username, callback) {
    db.get('SELECT * FROM players WHERE username = ?', [username], callback)
  }

  static create(data, callback) {
    const { username, password, avatar_type, x = 0, y = 0, target_x = 0, target_y = 0, direction = 'down', action = 'idle' } = data
    
    // Hash password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return callback(err)
      
      db.run(
        `INSERT INTO players (username, password, avatar_type, x, y, target_x, target_y, direction, action) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [username, hashedPassword, avatar_type, x, y, target_x, target_y, direction, action],
        function(err) {
          if (err) return callback(err)
          callback(null, { 
            id: this.lastID, 
            username, 
            avatar_type, 
            x, 
            y, 
            target_x, 
            target_y, 
            direction, 
            action 
          })
        }
      )
    })
  }

  static authenticate(username, password, callback) {
    this.getByUsername(username, (err, player) => {
      if (err) return callback(err)
      if (!player) return callback(null, null)
      
      bcrypt.compare(password, player.password, (err, isMatch) => {
        if (err) return callback(err)
        if (!isMatch) return callback(null, null)
        
        // Return player without password
        const { password, ...playerWithoutPassword } = player
        callback(null, playerWithoutPassword)
      })
    })
  }

  static update(id, data, callback) {
    const { x, y, target_x, target_y, direction, action } = data
    db.run(
      `UPDATE players SET x = ?, y = ?, target_x = ?, target_y = ?, direction = ?, action = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [x, y, target_x, target_y, direction, action, id],
      callback
    )
  }

  static delete(id, callback) {
    db.run('DELETE FROM players WHERE id = ?', [id], callback)
  }
}

module.exports = Player
