const express = require('express')
const controller = require('../controllers/auth')
const validate = require('../controllers/auth.validate')
const router = express.Router()
const trimRequest = require('trim-request')

/*
 Auth routes
*/

/**
 * Register route
 */
router.post(
  '/register',
  trimRequest.all,
  validate.register,
  controller.register
)

/**
 * Verify route
 */
router.post('/verify', trimRequest.all, validate.verify, controller.verify)

/**
 * Forgot password route
 */
router.post(
  '/forgot',
  trimRequest.all,
  validate.forgotPassword,
  controller.forgotPassword
)

/**
 * Reset password route
 */
router.post(
  '/reset',
  trimRequest.all,
  validate.resetPassword,
  controller.resetPassword
)

/**
 * Login route
 */
router.post('/login', trimRequest.all, validate.login, controller.login)

module.exports = router
