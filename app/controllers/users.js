const {
  matchedData
} = require('express-validator/filter')
const model = require('../models/user')
// const util = require('util')
const base = require('./base')
const uuid = require('uuid')

/*********************
 * Private functions *
 *********************/

const getItems = async (req, query) => {
  const options = await base.listInitOptions(req)
  return new Promise((resolve, reject) => {
    model.paginate(query, options, (err, items) => {
      if (err) {
        reject(base.buildErrObject(422, err.message))
      }
      resolve(base.cleanPaginationID(items))
    })
  })
}

const getItem = async id => {
  return new Promise((resolve, reject) => {
    model.findById(id, (err, item) => {
      if (err) {
        reject(base.buildErrObject(422, err.message))
      }
      if (!item) {
        reject(base.buildErrObject(422, 'NOT_FOUND'))
      }
      resolve(item)
    })
  })
}

const updateItem = async (id, req) => {
  return new Promise((resolve, reject) => {
    model.findByIdAndUpdate(
      id,
      req,
      {
        new: true,
        runValidators: true
      },
      (err, item) => {
        if (err) {
          reject(base.buildErrObject(422, err.message))
        }
        if (!item) {
          reject(base.buildErrObject(404, 'NOT_FOUND'))
        }
        resolve(item)
      }
    )
  })
}

const deleteItem = async id => {
  return new Promise((resolve, reject) => {
    model.findByIdAndRemove(id, (err, item) => {
      if (err) {
        reject(base.buildErrObject(422, err.message))
      }
      if (!item) {
        reject(base.buildErrObject(422, 'NOT_FOUND'))
      }
      resolve(base.buildSuccObject('DELETED'))
    })
  })
}

const createItem = async req => {
  return new Promise((resolve, reject) => {
    const user = new model({
      name: req.name,
      email: req.email,
      password: req.password,
      role: req.role,
      phone: req.phone,
      city: req.city,
      country: req.country,
      verification: uuid.v4()
    })
    user.save((err, item) => {
      if (err) {
        reject(base.buildErrObject(422, err.message))
      }
      item = item.toObject()
      delete item.password
      delete item.blockExpires
      delete item.loginAttemps
      resolve(item)
    })
  })
}

/********************
 * Public functions *
 ********************/

 /**
 * Get items function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getItems = async (req, res) => {
  try {
    const query = await base.checkQueryString(req.query)
    // console.log(util.inspect(query, { showHidden: false, depth: null }))
    res.status(200).json(await getItems(req, query))
  } catch (error) {
    base.handleError(res, error)
  }
}

 /**
 * Create item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.createItem = async (req, res) => {
  try {
    // Gets locale from header 'Accept-Language'
    const locale = req.getLocale()
    req = matchedData(req)
    const doesEmailExists = await base.emailExists(req.email)
    if (!doesEmailExists) {
      const item = await createItem(req)
      base.sendRegistrationEmailMessage(locale, item)
      res.status(201).json(item)
    }
  } catch (error) {
    base.handleError(res, error)
  }
}

/**
 * Get item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getItem = async (req, res) => {
  try {
    req = matchedData(req)
    const id = await base.isIDGood(req.id)
    res.status(200).json(await getItem(id))
  } catch (error) {
    base.handleError(res, error)
  }
}

/**
 * Update item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.updateItem = async (req, res) => {
  try {
    req = matchedData(req)
    const id = await base.isIDGood(req.id)
    const doesEmailExists = await base.emailExistsExcludingMyself(id, req.email)
    if (!doesEmailExists) {
      res.status(200).json(await updateItem(id, req))
    }
  } catch (error) {
    base.handleError(res, error)
  }
}

/**
 * Create item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.deleteItem = async (req, res) => {
  try {
    req = matchedData(req)
    const id = await base.isIDGood(req.id)
    res.status(200).json(await deleteItem(id))
  } catch (error) {
    base.handleError(res, error)
  }
}
