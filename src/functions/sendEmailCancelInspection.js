'use strict'

const r = require('../helpers/response.utils')
const messageService = require('../services/message.service')

module.exports.main = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false
  messageService
    .sendEmailCancelInspectionNotification(event.pathParameters.messageId)
    .then(data => callback(null, r.success(data)))
    .catch(err => callback(null, r.failure(err)))
}
