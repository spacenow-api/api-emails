const aws = require('aws-sdk')
const ses = new aws.SES()

function generateEmailParams(template, body) {
  return {
    Source: process.env.EMAIL,
    Destination: { ToAddresses: [process.env.EMAIL] },
    ReplyToAddresses: [body.email],
    ConfigurationSetName: "Emails",
    Template: template,
    TemplateData: JSON.stringify(body)
  }
}

exports.sender = async (event) => {
  const emailParams = generateEmailParams(event.template, event.body)
  return ses.sendTemplatedEmail(emailParams).promise()
}