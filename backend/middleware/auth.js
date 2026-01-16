const jwt = require('jsonwebtoken')

/**
 * Generate JWT token
 */
function generateToken(playerId, username) {
  return jwt.sign(
    { id: playerId, username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '7d' }
  )
}

/**
 * Verify JWT token middleware
 */
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.player = decoded
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' })
    }
    return res.status(401).json({ error: 'Invalid token' })
  }
}

module.exports = { generateToken, verifyToken }
