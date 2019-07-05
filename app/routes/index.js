const express = require('express')
const router = express.Router()

/*
 * Load routes statically and/or dynamically
 */

// Load Auth route
router.use('/', require('./auth'))

 /*
 * Setup routes for index
 */

router.get('/', (req, res) => {
  res.send('API Home')
})

/*
 * Handle 404 error
 */

router.use('*', (req, res) => {
  res.status(404).json({
    errors: {
      msg: 'NOT_FOUND'
    }
  })
})

module.exports = router
