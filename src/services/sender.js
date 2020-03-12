const aws = require("aws-sdk");

const ses = new aws.SES({ region: "us-east-1" });

function generateEmailParams(template, destination, data) {
  return {
    Source: "no-reply@spacenow.com",
    Destination: {
      ToAddresses: [destination],
      BccAddresses: process.env.BBC_EMAILS.split(" ")
    },
    ConfigurationSetName: "Emails",
    Template: template,
    TemplateData: JSON.stringify(data)
  };
}

exports.senderByTemplateData = async (template, destination, data) => {
  return ses
    .sendTemplatedEmail({
      Source: "no-reply@spacenow.com",
      Destination: {
        ToAddresses: [destination],
        BccAddresses: process.env.BBC_EMAILS.split(" ")
      },
      ConfigurationSetName: "Emails",
      Template: template,
      TemplateData: JSON.stringify(data)
    })
    .promise();
};

exports.sender = async event => {
  const body = JSON.parse(event.body);
  const emailParams = generateEmailParams(body.template, body.destination, JSON.parse(body.data));
  return ses.sendTemplatedEmail(emailParams).promise();
};
