const { body, validationResult } = require('express-validator')

/**
 * Validation rules for player creation
 */
const validatePlayerCreation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and numbers'),
  
  body('password_confirm')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
  
  body('avatar_type')
    .isIn(['girl', 'boy'])
    .withMessage('Invalid avatar type')
]

/**
 * Validation rules for login
 */
const validateLogin = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Invalid username or password'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Invalid username or password')
]

/**
 * Handle validation errors
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    })
  }
  next()
}

module.exports = {
  validatePlayerCreation,
  validateLogin,
  handleValidationErrors
}
