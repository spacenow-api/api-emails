'use strict'

const r = require('./../helpers/response.utils')
const listingService = require('./../services/listing.service')

module.exports.main = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false
  listingService
    .sendEmailCompleteListing()
    .then(data => callback(null, r.success(data)))
    .catch(err => callback(null, r.failure(err)))
}
