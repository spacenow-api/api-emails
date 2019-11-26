'use strict'

const r = require('./../helpers/response.utils')
const bookingService = require('./../services/booking.service')

module.exports.main = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false
  bookingService
    .sendEmailReadyToPay(event.pathParameters.bookingId)
    .then((data) => callback(null, r.success(data)))
    .catch((err) => callback(null, r.failure(err)))
}
