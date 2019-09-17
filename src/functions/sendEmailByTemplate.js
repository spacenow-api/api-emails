'use strict'

const r = require('./../helpers/response.utils')
const senderService = require('./../services/sender')

module.exports.main = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false
  senderService
    .sender(event)
    .then((data) => callback(null, r.success(data)))
    .catch((err) => callback(null, r.failure(err)))
}
