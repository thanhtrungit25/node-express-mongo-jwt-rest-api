const base = require('./base')
const {
  check,
  validationResult
} = require('express-validator/check')

exports.register = [
  check('name')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY'),
  check('email')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .normalizeEmail(),
  check('password')
    .exists()
    .withMessage('MISSING')
    .not()
    .isEmpty()
    .withMessage('IS_EMPTY')
    .isLength({
      min: 5
    })
    .withMessage('PASSWORD_TOO_SHORT_MIN_5'),
    (req, res, next) => {
      try {
        validationResult(req).throw()
        return next()
      } catch (err) {
        return base.handleError(res, base.buildErrObject(422, err.array()))
      }
    }
]
