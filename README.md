# ⚡️ Serverless Plugin to set DynamoDB TTL

[![npm](https://img.shields.io/npm/v/serverless-dynamodb-ttl.svg)](https://www.npmjs.com/package/serverless-dynamodb-ttl)
[![CircleCI](https://img.shields.io/circleci/project/github/Jimdo/serverless-dynamodb-ttl.svg)](https://circleci.com/gh/Jimdo/serverless-dynamodb-ttl)
[![license](https://img.shields.io/github/license/Jimdo/serverless-dynamodb-ttl.svg)](https://github.com/Jimdo/serverless-dynamodb-ttl/blob/master/LICENSE.md)
[![Coveralls](https://img.shields.io/coveralls/Jimdo/serverless-dynamodb-ttl.svg)](https://coveralls.io/github/Jimdo/serverless-dynamodb-ttl)

## About the plugin

It's not possible to use [DynamoDB's TTL feature](https://aws.amazon.com/blogs/aws/new-manage-dynamodb-items-using-time-to-live-ttl/) with CloudFormation yet. Use this plugin to configure TTL for your DynamoDB with [Serverless](https://serverless.com).

## Usage

Add the npm package to your project:

```bash
# Via yarn
$ yarn add serverless-dynamodb-ttl

# Via npm
$ npm install serverless-dynamodb-ttl --save
```

Add the plugin to your `serverless.yml`:

```yaml
plugins:
  - serverless-dynamodb-ttl
```

Configure TTL in `serverless.yml`:

```yaml
custom:
  dynamodb:
    ttl:
      - table: your-dynamodb-table-name
        field: your-ttl-property-name
```

That's it! After the next deployment (`sls deploy`) serverless will configure your TTL properties in DynamoDB.

## License

Feel free to use the code, it's released using the [MIT license](https://github.com/Jimdo/serverless-dynamodb-ttl/blob/master/LICENSE.md).

## Contributors

- [Oleksii Zeleniuk](https://github.com/alexzelenuyk)
- [Sebastian Müller](https://github.com/sbstjn)

## Contribution

You are more than welcome to contribute to this project! 😘

To make sure you have a pleasant experience, please read our [code of conduct](CODE_OF_CONDUCT.md). It outlines our core values and believes and will make working together a happier experience.

### Run the tests

```bash
# Via yarn
$ yarn test

# Via npm
$ npm test
```

This will also run [standardjs](https://standardjs.com/) to ensure the changes match the desired code style.

