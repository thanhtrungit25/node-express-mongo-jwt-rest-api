const express = require('express')
const controller = require('../controllers/auth')
const validate = require('../controllers/auth.validate')
const router = express.Router()
const trimRequest = require('trim-request')

/*
 ROUTES
*/
router.post(
  '/register',
  trimRequest.all,
  validate.register,
  controller.register
)

router.post(
  '/login',
  trimRequest.all,
  validate.login,
  controller.login
)

module.exports = router
