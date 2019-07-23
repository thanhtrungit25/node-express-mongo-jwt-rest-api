const base = require('./utils')
const model = require('../models/user')
const { matchedData } = require('express-validator/filter')

/*********************
 * Private functions *
 *********************/

 /**
 * Gets profile from database by id
 * @param {string} id - user id
 */
const getProfileFromDB = async id => {
  return new Promise((resolve, reject) => {
    model.findById(id, '-_id -updatedAt -createdAt', (err, user) => {
      if (err) {
        reject(base.buildErrObject(422, err.message))
      }
      if (!user) {
        reject(base.buildErrObject(404, 'NOT_FOUND'))
      }
      resolve(user)
    })
  })
}

/**
 * Updates profile in database
 * @param {Object} req - request object
 * @param {string} id - user id
 */
const updateProfileInDB = async (req, id) => {
  return new Promise((resolve, reject) => {
    model.findByIdAndUpdate(
      id,
      req,
      {
        new: true,
        runValidators: true,
        select: '-role -_id -updatedAt -createdAt'
      },
      (err, user) => {
        if (err) {
          reject(base.buildErrObject(422, err.message))
        }
        if (!user) {
          reject(base.buildErrObject(404, 'NOT_FOUND'))
        }
        resolve(user)
      }
    )
  })
}

/**
 * Finds user by id
 * @param {string} email - user id
 */
const findUser = async id => {
  return new Promise((resolve, reject) => {
    model.findById(id, 'password email', (err, item) => {
      if (err) {
        reject(base.buildErrObject(422, err.message))
      }
      if (!item) {
        reject(base.buildErrObject(404, 'NOT_FOUND'))
      }
      resolve(item)
    })
  })
}

/**
 * Checks is password matches
 * @param {string} password - password
 * @param {Object} user - user object
 * @returns {boolean}
 */
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

/**
 * Changes password in database
 * @param {string} id - user id
 * @param {Object} req - request object
 */
const changePasswordInDB = async (id, req) => {
  return new Promise((resolve, reject) => {
    model.findById(id, '+password', (err, user) => {
      if (err) {
        reject(base.buildErrObject(422, err.message))
      }
      if (!user) {
        reject(base.buildErrObject(404, 'NOT_FOUND'))
      }

      // Assign new password to user instance model
      user.password = req.newPassword

      // Save in DB
      user.save(error => {
        if (error) {
          reject(base.buildErrObject(422, error.message))
        }
        resolve(base.buildSuccObject('PASSWORD_CHANGED'))
      })
    })
  })
}

/*********************
 * Private functions *
 *********************/

/**
 * Get profile function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getProfile = async (req, res) => {
  try {
    const id = await base.isIDGood(req.user._id)
    res.status(200).json(await getProfileFromDB(id))
  } catch (error) {
    base.handleError(res, error)
  }
}

/**
 * Update profile function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.updateProfile = async (req, res) => {
  try {
    const id = await base.isIDGood(req.user._id)
    req = matchedData(req)
    res.status(200).json(await updateProfileInDB(req, id))
  } catch (error) {
    base.handleError(res, error)
  }
}

const passwordsDoNotMatch = async () => {
  return new Promise(resolve => {
    resolve(base.buildErrObject(409, 'WRONG_PASSWORD'))
  })
}

/**
 * Change password function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.changePassword = async (req, res) => {
  try {
    const id = await base.isIDGood(req.user._id)
    const user = await findUser(id)
    req = matchedData(req)
    const isPasswordMatch = await checkPassword(req.oldPassword, user)
    if (!isPasswordMatch) {
      base.handleError(res, await passwordsDoNotMatch())
    } else {
      // all ok, procceed to change password
      res.status(200).json(await changePasswordInDB(id, req))
    }

  } catch (error) {
    base.handleError(res, error)
  }
}
