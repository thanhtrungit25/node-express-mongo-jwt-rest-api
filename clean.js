require('dotenv-safe').config()
const initMongo = require('./app/init/mongo')
const models = ['user', 'userAccess', 'city', 'forgotPassword']

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
