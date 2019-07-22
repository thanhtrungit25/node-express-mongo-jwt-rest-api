require('dotenv-safe').config()
const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const compression = require('compression')
const helmet = require('helmet')
const cors = require('cors')
const passport = require('passport')
const initMongo = require('./config/mongo')
const i18n = require('i18n')

const app = express()

// Setup express server
app.set('port', process.env.PORT || 3000)

// i18n
i18n.configure({
  locales: ['en', 'es'],
  directory: `${__dirname}/locales`,
  defaultLocale: 'en',
  objectNotation: true
})
app.use(i18n.init)

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

app.use(
  bodyParser.json({
    limit: '20mb'
  })
)
app.use(
  bodyParser.urlencoded({
    limit: '20mb',
    extended: true
  })
) /* for parsing application/x-www-urlencoded */
app.use(cors())
app.use(passport.initialize())
app.use(compression())
app.use(helmet())

// Redis cache enabled only for production
if (process.env.NODE_ENV === 'production') {
  console.log('redis init production mode')
  const getExpeditiousCache = require('express-expeditious')
  const cache = getExpeditiousCache({
    // Namespace used to prevent cache conflicts, must be alphanumeric
    namespace: 'expresscache',
    // Store cache entries for 1 minute (can also pass milliseconds e.g 60000)
    defaultTtl: '1 minute',
    engine: require('expeditious-engine-redis')({
      // options for the redis driver
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
    })
  })
  app.use(cache)
}
app.use(express.static('public'))
app.use(require('./app/routes'))
app.listen(app.get('port'))

// Init MongoDB
initMongo()

module.exports = app // for testing
