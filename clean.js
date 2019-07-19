require('dotenv-safe').config()
const initMongo = require('./config/mongo')
const fs = require('fs')
const modelPath = './app/models'

// Removes extension from file
const removeExtension = file => {
  file = file
    .split('.')
    .slice(0, -1)
    .join('.')
    .toString()
  return file
}

// Loop models path and load every file as model except index file
const models = fs
  .readdirSync(modelPath)
  .filter(file => {
    return file !== 'index.js'
  })
  .map(file => {
    return removeExtension(file)
  })

initMongo()

const deleteModelFromDB = model =>
  new Promise((resolve, reject) => {
    model = require(`./app/models/${model}`)
    model.deleteMany({}, (err, row) => {
      if (err) {
        reject(err)
      } else {
        resolve(row)
      }
    })
  })

const clean = async () => {
  try {
    const promiseArray = models.map(
      async model => await deleteModelFromDB(model)
    )
    await Promise.all(promiseArray)
    process.exit(0)
  } catch (err) {
    console.log(err)
    process.exit(0)
  }
}

clean()
