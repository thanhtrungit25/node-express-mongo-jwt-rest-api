const crypto = require('crypto')
const requestIp = require('request-ip')
const algorithm = 'aes-256-ecb'
const password = process.env.JWT_SECRET
const User = require('../models/user')

exports.getIP = req => requestIp.getClientIp(req)

exports.getBrowserInfo = req => req.headers['user-agent']

exports.getCountry = req => req.headers['cf-ipcountry'] ? req.headers['cf-ipcountry'] : 'XX'

exports.emailExists = async email => {
  return new Promise((resolve, reject) => {
    User.findOne(
      {
        email
      },
      (err, item) => {
        if (err) {
          reject(this.buildErrObject(422, err.message))
        }
        if (item) {
          reject(this.buildErrObject(422, 'EMAIL_ALREADY_EXISTS'))
        }
        resolve(false)
      }
    )
  })
}

exports.emailExistsExcludingMyself = async (id, email) => {
  return new Promise((resolve, reject) => {
    User.findOne(
      {
        email,
        _id: {
          $ne: id
        }
      },
      (err, item) => {
        if (err) {
          reject(this.buildErrObject(422, err.message))
        }
        if (item) {
          reject(this.buildErrObject(422, 'EMAIL_ALREADY_EXISTS'))
        }
        resolve(false)
      }
    )
  })
}

exports.buildErrObject = (code, message) => {
  return {
    code,
    message
  }
}

exports.buildSuccObject = msg => {
  return {
    msg
  }
}

exports.handleError = (res, err) => {
  // Prints error in console
  if (process.env.NODE_ENV === 'development') {
    console.log(err)
  }
  // Sends erros to user
  res.status(err.code).json({
    errors: {
      msg: err.message
    }
  })
}

exports.encrypt = text => {
  const cipher = crypto.createCipher(algorithm, password)
  let crypted = cipher.update(text, 'utf8', 'hex')
  crypted += cipher.final('hex')
  return crypted
}

exports.decrypt = text => {
  try {
    const decipher = crypto.createDecipher(algorithm, password)
    let dec = decipher.update(text, 'hex', 'utf8')
    dec += decipher.final('utf8')
    return dec
  } catch (err) {
    return err
  }
}
