'use strict'

const AWS = require('aws-sdk')
const util = require('util')

class Plugin {
  constructor (serverless, options) {
    this.serverless = serverless
    this.options = options || {}

    this.dynamodb = new AWS.DynamoDB({ region: this.options.region })

    this.hooks = {
      'after:deploy:deploy': this.afterDeploy.bind(this)
    }
  }

  afterDeploy () {
    if (typeof this.options.noDeploy !== 'undefined' && this.options.noDeploy) {
      return Promise.resolve()
    }

    const list = this.configuration()

    if (list.length === 0) {
      this.serverless.cli.log('Skipping TTL setting(s) for DynamoDB: no configuration found')
      
      return Promise.resolve()
    }

    this.serverless.cli.log('Enabling TTL setting(s) for DynamoDB')

    return Promise.all(
      this.configuration().map(
        data => this.check(data.table).then(
          enabled => enabled || this.enable(data)
        )
      )
    ).catch(
      error => this.serverless.cli.log(util.format('Failed to set TTL for DynamoDB: %s', error))
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
    if (this.serverless && this.serverless.service && this.serverless.service.custom && this.serverless.service.custom.dynamodb) {
      return this.serverless.service.custom.dynamodb.ttl || []
    }
  }
}

module.exports = Plugin
