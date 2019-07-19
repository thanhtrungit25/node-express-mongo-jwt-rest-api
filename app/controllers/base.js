const nodemailer = require('nodemailer')
const mg = require('nodemailer-mailgun-transport')
const crypto = require('crypto')
const requestIp = require('request-ip')
const algorithm = 'aes-256-ecb'
const password = process.env.JWT_SECRET
const User = require('../models/user')

const buildSort = (sort, order) => {
  const sortBy = {}
  sortBy[sort] = order
  return sortBy
}

exports.getIP = req => requestIp.getClientIp(req)

exports.getBrowserInfo = req => req.headers['user-agent']

exports.getCountry = req =>
  req.headers['cf-ipcountry'] ? req.headers['cf-ipcountry'] : 'XX'

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

exports.isIDGood = async id => {
  console.log('id:', id)
  return new Promise((resolve, reject) => {
    const goodID = String(id).match(/^[0-9a-fA-F]{24}$/)
    return goodID
      ? resolve(id)
      : reject(this.buildErrObject(422, 'ID_MALFORMED'))
  })
}

exports.checkQueryString = async query => {
  // eslint-disable-next-line consistent-return
  return new Promise((resolve, reject) => {
    try {
      if (
        typeof query.filter !== 'undefined' &&
        typeof query.fields !== 'undefined'
      ) {
        const data = {
          $or: []
        }
        const array = []
        // Takes fields param and builds an array by splitting with ','
        const arrayFields = query.fields.split(',')
        // Adds SQL Like %word% with regex
        arrayFields.map(item => {
          array.push({
            [item]: {
              $regex: new RegExp(query.filter, 'i')
            }
          })
        })
        // Puts array result in data
        data.$or = array
        resolve(data)
      } else {
        resolve({})
      }
    } catch (err) {
      console.log(err.message)
      return reject(this.buildErrObject(422, 'ERROR_WITH_FILTER'))
    }
  })
}

exports.listInitOptions = async req => {
  const order = req.query.order || -1
  const sort = req.query.sort || 'createdAt'
  const sortBy = buildSort(sort, order)
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  const options = {
    sort: sortBy,
    lean: true,
    page,
    limit
  }
  return options
}

// Hack for mongoose-paginate, removes 'id' from results
exports.cleanPaginationID = result => {
  result.docs.map(element => delete element.id)
  return result
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

exports.sendRegistrationEmailMessage = async user => {
  const subject = 'Verirify your email at myProject'
  const htmlMessage = `<p>Helo ${user.name}.</p> <p>Welcome! To verify your email, please click in this link:</p> <p>${process.env.FRONTEND_URL}/verify/${user.verification}</p> <p>Thank you.</p>`
  const data = {
    user,
    subject,
    htmlMessage
  }
  const email = {
    subject,
    htmlMessage,
    verification: user.verification
  }

  if (process.env.NODE_ENV === 'production') {
    this.sendEmail(data, messageSent =>
      messageSent
        ? console.log(`Email SENT to: ${user.email}`)
        : console.log(`Email FAILED to: ${user.email}`)
    )
  } else if (process.env.NODE_ENV === 'development') {
    console.log(email)
  }
}

exports.sendResetPasswordEmailMessage = async user => {
  const subject = 'Password recovery'
  const htmlMessage = `<p>To recover the password for user: ${user.email}</p> <p>click the following link:</p> <p>${process.env.FRONTEND_URL}/reset/${user.verification}</p> <p>If this was a mistake, you can ignore this message.</p> <p>Thank you.</p>`
  const data = {
    user,
    subject,
    htmlMessage
  }
  const email = {
    subject,
    htmlMessage,
    verification: user.verification
  }
  if (process.env.NODE_ENV === 'production') {
    this.sendEmail(data, messageSent =>
      messageSent
        ? console.log(`Email SENT to: ${user.email}`)
        : console.log(`Email FAILED to: ${user.email}`)
    )
  } else if (process.env.NODE_ENV === 'development') {
    console.log(email)
  }
}

exports.sendEmail = async (data, callback) => {
  const auth = {
    auth: {
      // eslint-disable-next-line camelcase
      api_key: process.env.EMAIL_SMTP_API_MAILGUN,
      domain: process.env.EMAIL_SMTP_DOMAIN_MAILGUN
    }
  }
  const transporter = nodemailer.createTransport(mg(auth))
  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: `${data.user.name} <${data.user.email}>`,
    subject: data.subject,
    html: data.htmlMessage
  }
  transporter.sendMail(mailOptions, err => {
    if (err) {
      return callback(false)
    }
    return callback(true)
  })
}

exports.removeExtensionFromFile = file => {
  file = file
    .split('.')
    .slice(0, -1)
    .join('.')
    .toString()
  return file
}
