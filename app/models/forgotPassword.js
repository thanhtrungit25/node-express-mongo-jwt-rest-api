const mongoose = require('mongoose')
const validator = require('validator')

const ForgotPassword = new mongoose.Schema(
  {
    email: {
      type: String,
      validate: {
        validator: validator.isEmail,
        message: 'Not a valid email address'
      },
      lowercase: true,
      required: true
    },
    verification: {
      type: String
    },
    used: {
      type: Boolean,
      default: false
    },
    ipRequest: {
      type: String
    },
    browserRequest: {
      type: String
    },
    countryRequest: {
      type: String
    },
    ipChanged: {
      type: String
    },
    browserChanged: {
      type: String
    },
    countryChanged: {
      type: String
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
)

ForgotPassword.index({
  email: 'text',
  verificationKey: 'text'
})
module.exports = mongoose.model('ForgotPassword', ForgotPassword)
