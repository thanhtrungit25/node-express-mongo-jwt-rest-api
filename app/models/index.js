const fs = require('fs')
const modelsPath = './app/models/'
const { removeExtensionFromFile } = require('../controllers/utils')

module.exports = function loadModels() {
  /*
   * Load models dynamically
   */

  // Loop models path and loads every file as a model except this file
  fs.readdirSync(modelsPath).filter(file => {
    // Take filename and remove last part (extension)
    const moduleFile = removeExtensionFromFile(file)
    // Prevents loading of this file
    return moduleFile !== 'index' ? require(`./${moduleFile}`) : ''
  })
}
