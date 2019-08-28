const serviceSender = require('./../services/sender')
const responseUtils = require('./../utils/response-util')

module.exports.send = async (event) => {

  try {
    const data = await serviceSender.sender(event);
    return responseUtils.success(data)
  } catch (e) {
    return responseUtils.failure(e)
  }

}