const aws = require('aws-sdk')
const ses = new aws.SES({ region: "us-east-1" })

function generateEmailParams(template, data) {
  return {
    Source: process.env.EMAIL,
    Destination: { ToAddresses: [data.email] },
    ReplyToAddresses: [process.env.EMAIL],
    ConfigurationSetName: "Emails",
    Template: template,
    TemplateData: JSON.stringify(data)
  }
}

exports.sender = async (event) => {
  const body = JSON.parse(event.body)
  const emailParams = generateEmailParams(body.template, JSON.parse(body.data))
  return ses.sendTemplatedEmail(emailParams).promise()
}