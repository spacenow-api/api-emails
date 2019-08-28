module.exports.success = payload => buildResponse(200, JSON.stringify(payload))

module.exports.failure = err => buildResponse(500, JSON.stringify(err.message))

const buildResponse = (statusCode, body) => {
  return {
    statusCode: statusCode,
    headers: {
      'Access-Control-Allow-Origin': process.env.DOMAIN,
      'Access-Control-Allow-Headers': 'x-requested-with',
      'Access-Control-Allow-Credentials': true
    },
    body
  }
}
