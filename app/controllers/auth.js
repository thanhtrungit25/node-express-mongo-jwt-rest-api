const { matchedData } = require('express-validator/filter')
const jwt = require('jsonwebtoken')
const base = require('./base')
const User = require('../models/user')
const uuid = require('uuid')

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

/********************
 * Public functions *
 ********************/

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
