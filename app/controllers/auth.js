const { matchedData } = require('express-validator/filter')
const jwt = require('jsonwebtoken')
const base = require('./base')
const User = require('../models/user')
const UserAccess = require('../models/userAccess')
const uuid = require('uuid')
const moment = require('moment')
const LOGIN_ATTEMPTS = 5
const HOURS_TO_BLOCK = 2

const generateToken = user => {
  const obj = {
    _id: user
  }
  return base.encrypt(
    jwt.sign(obj, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION
    })
  )
}

const setUserInfo = req => {
  const user = {
    _id: req._id,
    name: req.name,
    email: req.email,
    role: req.role,
    verified: req.verified
  }
  return user
}

const saveUserAccessAndReturnToken = async (req, user) => {
  const userAccess = new UserAccess({
    email: user.email,
    ip: base.getIP(req),
    browser: base.getBrowserInfo(req),
    country: base.getCountry(req)
  })
  return new Promise((resolve, reject) => {
    userAccess.save((err) => {
      if (err) {
        reject(base.buildErrObject(422, err.message))
      }
      const userInfo = setUserInfo(user)
      // Return data with access token
      resolve({
        token: generateToken(user._id),
        user: userInfo
      })
    })
  })
}

const returnRegisterToken = (item, userInfo) => {
  userInfo.verification = item.verification
  return {
    token: generateToken(item._id),
    user: userInfo
  }
}

const registerUser = async req => {
  const user = new User({
    name: req.name,
    email: req.email,
    password: req.password,
    verification: uuid.v4()
  })
  return new Promise((resolve, reject) => {
    user.save((err, item) => {
      if (err) {
        reject(base.buildErrObject(422, err.message))
      }
      resolve(item)
    })
  })
}

const userIsBlocked = async user => {
  return new Promise((resolve, reject) => {
    if (user.blockExpires > moment()) {
      reject(base.buildErrObject(409, 'BLOCKED_USER'))
    }
    resolve(true)
  })
}

const blockIsExpired = ({
  loginAttempts,
  blockExpires
}) => loginAttempts > LOGIN_ATTEMPTS && blockExpires <= moment()

const checkLoginAttemptsAndBlockExpires = async user => {
  return new Promise((resolve, reject) => {
    // Let user try to login again after blockexpires, resets user loginAttempts
    if (blockIsExpired(user)) {
      user.loginAttempts = 0
      user.save((err, result) => {
        if (err) {
          reject(base.buildErrObject(422, err.message))
        }
        if (result) {
          resolve(true)
        }
      })
    } else {
      resolve(false)
    }
  })
}

const findUser = async email => {
  return new Promise((resolve, reject) => {
    User.findOne({
      email
    },
    'password loginAttempts blockExpires name email role verified',
    (err, item) => {
      if (err) {
        reject(base.buildErrObject(422, err.message))
      }
      if (!item) {
        reject(base.buildErrObject(404, 'USER_DOES_NOT_EXISTS'))
      }
      resolve(item)
    }
    )
  })
}

const checkPassword = async (password, user) => {
  return new Promise((resolve, reject) => {
    user.comparePassword(password, (err, isMatch) => {
      if (err) {
        reject(base.buildErrObject(422, err.message))
      }
      if (!isMatch) {
        resolve(false)
      }
      resolve(true)
    })
  })
}

const saveLoginAttemptsToDB = async user => {
  return new Promise((resolve, reject) => {
    user.save((err, result) => {
      if (err) {
        reject(base.buildErrObject(422, err.message))
      }
      if (result) {
        resolve(true)
      }
    })
  })
}

const blockUser = user => {
  return new Promise((resolve, reject) => {
    user.blockExpires = moment().add(HOURS_TO_BLOCK, 'hours')
    user.save((err, result) => {
      if (err) {
        reject(base.buildErrObject(422, err.message))
      }
      if (result) {
        resolve(base.buildErrObject(409, 'BLOCKED_USER'))
      }
    })
  })
}

const passwordsDoNotMatch = async user => {
  user.loginAttempts += 1
  await saveLoginAttemptsToDB(user)
  return new Promise((resolve, reject) => {
    if (user.loginAttempts <= LOGIN_ATTEMPTS) {
      resolve(base.buildErrObject(409, 'WRONG_PASSWORD'))
    } else {
      resolve(blockUser(user))
    }
    reject(base.buildErrObject(422, 'ERROR'))
  })
}

/********************
 * Public functions *
 ********************/

exports.login = async (req, res) => {
  try {
    const data = matchedData(req)
    const user = await findUser(data.email)
    // Check userIsBlocked
    await userIsBlocked(user)
    // Check checkLoginAttemptsAndBlockExpires
    await checkLoginAttemptsAndBlockExpires(user)
    // Check checkPassword
    const isPasswordMatch = await checkPassword(data.password, user)
    if (!isPasswordMatch) {
      base.handleError(res, await passwordsDoNotMatch(user))
    } else {
      // all ok, register access and return token
      user.loginAttempts = 0
      await saveLoginAttemptsToDB(user)
      res.status(200).json(await saveUserAccessAndReturnToken(req, user))
    }
  } catch (error) {
    base.handleError(res, error)
  }
}

exports.register = async (req, res) => {
  try {
    req = matchedData(req)
    const doesEmailExists = await base.emailExists(req.email)
    if (!doesEmailExists) {
      const item = await registerUser(req)
      const userInfo = setUserInfo(item)
      const response = returnRegisterToken(item, userInfo)
      // Send registration email message with item user
      res.status(201).json(response)
    }
  } catch (error) {
    base.handleError(res, error)
  }
}
