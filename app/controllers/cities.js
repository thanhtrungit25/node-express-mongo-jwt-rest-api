const model = require('../models/city')
const { matchedData } = require('express-validator/filter')
const base = require('./utils')

/*********************
 * Private functions *
 *********************/

 /**
 * Gets all items from database
 */
const getAllItemsFromDB = async () => {
  return new Promise((resolve, reject) => {
    model.find(
      {},
      '-updatedAt -createdAt',
      {
        sort: {
          name: 1
        }
      },
      (err, items) => {
        if (err) {
          reject(base.buildErrObject(422, err.message))
        }
        resolve(items)
      }
    )
  })
}

/**
 * Gets items from database
 * @param {Object} req - request object
 * @param {Object} query - query object
 */
const getItemsFromDB = async (req, query) => {
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

/**
 * Checks if a city already exists in database
 * @param {string} name - name of item
 */
const cityExists = async name => {
  return new Promise((resolve, reject) => {
    model.findOne(
      {
        name
      },
      (err, item) => {
        if (err) {
          reject(base.buildErrObject(422, err.message))
        }
        if (item) {
          reject(base.buildErrObject(422, 'CITY_ALREADY_EXISTS'))
        }
        resolve(false)
      }
    )
  })
}

/**
 * Checks if a city already exists excluding itself
 * @param {string} id - id of item
 * @param {string} name - name of item
 */
const cityExistsExcludingItSelf = async (id, name) => {
  return new Promise((resolve, reject) => {
    model.findOne(
      {
        name,
        _id: {
          $ne: id
        }
      },
      (err, item) => {
        if (err) {
          reject(base.buildErrObject(422, err.message))
        }
        if (item) {
          reject(base.buildErrObject(422, 'CITY_ALREADY_EXISTS'))
        }
        resolve(false)
      }
    )
  })
}

/**
 * Creates a new item in database
 * @param {Object} req - request object
 */
const createItemInDB = async req => {
  return new Promise((resolve, reject) => {
    model.create(req, (err, item) => {
      if (err) {
        reject(base.buildErrObject(422, err.message))
      }
      resolve(item)
    })
  })
}

/**
 * Gets item from database by id
 * @param {string} id - item id
 */
const getItemFromDB = async id => {
  return new Promise((resolve, reject) => {
    model.findById(id, (err, item) => {
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
 * Updates an item in database by id
 * @param {string} id - item id
 * @param {Object} req - request object
 */
const updateItemInDB = async (id, req) => {
  return new Promise((resolve, reject) => {
    model.findByIdAndUpdate(
      id,
      req,
      {
        new: true
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

const deleteItemFromDB = async id => {
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

/********************
 * Public functions *
 ********************/

 /**
 * Get all items function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getAllItems = async (req, res) => {
  try {
    res.status(200).json(await getAllItemsFromDB())
  } catch (error) {
    base.handleError(res, error)
  }
}

/**
 * Get items function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getItems = async (req, res) => {
  try {
    const query = await base.checkQueryString(req.query)
    res.status(200).json(await getItemsFromDB(req, query))
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
    res.status(200).json(await getItemFromDB(id))
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
    req = matchedData(req)
    const doesCityExists = await cityExists(req.name)
    if (!doesCityExists) {
      res.status(201).json(await createItemInDB(req))
    }
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
    const doesCityExists = await cityExistsExcludingItSelf(id, req.name)
    if (!doesCityExists) {
      res.status(200).json(await updateItemInDB(id, req))
    }
  } catch (error) {
    base.handleError(res, error)
  }
}

/**
 * Delete item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.deleteItem = async (req, res) => {
  try {
    req = matchedData(req)
    const id = await base.isIDGood(req.id)
    res.status(200).json(await deleteItemFromDB(id))
  } catch (error) {
    base.handleError(res, error)
  }
}
