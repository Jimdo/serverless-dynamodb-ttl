'use strict'

const assert = require('assert')
const util = require('util')
const cmp = require('semver-compare')

const MINIMUM_COMPATIBLE_AWSSDK_VERSION = '2.21.0'

class Plugin {
  constructor (serverless, options) {
    this.serverless = serverless
    this.provider = serverless.getProvider('aws')
    this.options = options || {}

    this.hooks = {
      'after:deploy:deploy': this.afterDeploy.bind(this)
    }
  }

  validate () {
    assert(this.serverless, 'Invalid serverless configuration')
    assert(this.serverless.service, 'Invalid serverless configuration')
    assert(this.serverless.service.provider, 'Invalid serverless configuration')
    assert(this.serverless.service.provider.name, 'Invalid serverless configuration')
    assert(this.serverless.service.provider.name === 'aws', 'Only supported for AWS provider')

    assert(
      cmp(this.provider.sdk.VERSION, MINIMUM_COMPATIBLE_AWSSDK_VERSION) > -1,
      util.format('Use `aws-sdk` version %s or newer', MINIMUM_COMPATIBLE_AWSSDK_VERSION)
    )

    assert(this.options && !this.options.noDeploy, 'Used --noDeploy flag')
    assert(this.list().constructor === Array, 'Invalid configuration found')
    assert(this.list().length > 0, 'No configuration found')
  }

  afterDeploy () {
    return Promise.resolve().then(
      this.validate.bind(this)
    ).then(
      () => this.serverless.cli.log(util.format('Enabling TTL setting(s) for DynamoDB (%s)', this.options.region))
    ).then(
      () => this.list().map(
        data => this.check(data.table).then(
          enabled => enabled || this.enable(data)
        )
      )
    ).catch(
      err => this.serverless.cli.log(util.format('Skipping TTL setting(s) for DynamoDB: %s!', err.message))
    )
  }

  check (table) {
    return this.provider.request('DynamoDB', 'describeTimeToLive', {
      TableName: table
    }).then(
      res => res.TimeToLiveDescription.TimeToLiveStatus === 'ENABLED'
    )
  }

  enable (data) {
    return this.provider.request('DynamoDB', 'updateTimeToLive', {
      TableName: data.table,
      TimeToLiveSpecification: {
        AttributeName: data.field,
        Enabled: true
      }
    })
  }

  list () {
    try {
      return this.serverless.service.custom.dynamodb.ttl || []
    } catch (e) {
      return []
    }
  }
}

module.exports = Plugin
