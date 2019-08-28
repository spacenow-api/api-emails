# emails api

## Available Scripts

In the project directory, you can run:

Create a template

### `aws ses create-template --cli-input-json templates/'template-name'.json`

Send the template with mock-data

### `serverless invoke local --function send --path mocks/'mock-data'.json`
