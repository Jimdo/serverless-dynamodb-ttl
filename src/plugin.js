'use strict'

const assert = require('assert')
const util = require('util')
const AWS = require('aws-sdk')

class Plugin {
  constructor (serverless, options) {
    this.serverless = serverless
    this.options = options || {}

    this.dynamodb = new AWS.DynamoDB({ region: this.options.region })

    this.hooks = {
      'after:deploy:deploy': this.afterDeploy.bind(this)
    }
  }

  validate () {
    assert(this.options && !this.options.noDeploy, 'noDeploy')
    assert(this.configuration().constructor === Array, 'invalid configuration found')
    assert(this.configuration().length > 0, 'no configuration found')
  }

  afterDeploy () {
    return Promise.resolve().then(
      this.validate.bind(this)
    ).then(
      () => this.serverless.cli.log('Enabling TTL setting(s) for DynamoDB')
    ).then(
      () => this.configuration().map(
        data => this.check(data.table).then(
          enabled => enabled || this.enable(data)
        )
      )
    ).catch(
      err => this.serverless.cli.log(util.format('Skipping TTL setting(s) for DynamoDB: %s', err.message))
    )
  }

  check (table) {
    return this.dynamodb.describeTimeToLive(
      {
        TableName: table
      }
    ).promise().then(
      res => res.TimeToLiveDescription.TimeToLiveStatus === 'ENABLED'
    )
  }

  enable (data) {
    return this.dynamodb.updateTimeToLive(
      {
        TableName: data.table,
        TimeToLiveSpecification: {
          AttributeName: data.field,
          Enabled: true
        }
      }
    ).promise()
  }

  configuration () {
    try {
      return this.serverless.service.custom.dynamodb.ttl || []
    } catch (e) {
      return []
    }
  }
}

module.exports = Plugin
