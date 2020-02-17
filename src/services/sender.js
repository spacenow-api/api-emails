const aws = require("aws-sdk");

const ses = new aws.SES({ region: "us-east-1" });

function generateEmailParams(template, data) {
  return {
    Source: "no-reply@spacenow.com",
    Destination: {
      ToAddresses: [data.email],
      BccAddresses: process.env.BBC_EMAILS.split(" ")
      // BccAddresses: ["team@spacenow.com", "baydr@spacenow.com", "barrett@spacenow.com"]
    },
    ReplyToAddresses: ["no-reply@spacenow.com"],
    ConfigurationSetName: "Emails",
    Template: template,
    TemplateData: JSON.stringify(data)
  };
}

exports.senderByTemplateData = async (templateName, emailDestination, templateData) => {
  return ses
    .sendTemplatedEmail({
      Source: "no-reply@spacenow.com",
      Destination: {
        ToAddresses: [emailDestination],
        BccAddresses: process.env.BBC_EMAILS.split(" ")
        // BccAddresses: ["team@spacenow.com", "baydr@spacenow.com", "barrett@spacenow.com"]
      },
      ReplyToAddresses: ["no-reply@spacenow.com"],
      ConfigurationSetName: "Emails",
      Template: templateName,
      TemplateData: JSON.stringify(templateData)
    })
    .promise();
};

exports.sender = async event => {
  const body = JSON.parse(event.body);
  const emailParams = generateEmailParams(body.template, JSON.parse(body.data));
  return ses.sendTemplatedEmail(emailParams).promise();
};
