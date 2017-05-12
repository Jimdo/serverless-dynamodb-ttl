'use strict'

var AWS = require('aws-sdk-mock')
const Plugin = require('../')

describe('Plugin', () => {
  afterEach(() => {
    AWS.restore('DynamoDB')
  })

  describe('Configuration', () => {
    it('Reads configuration', () => {
      const config = {
        cli: { log: () => {} },
        service: {
          provider: {
            name: 'aws',
            region: 'us-east-1'
          },
          custom: {
            dynamodb: {
              ttl: [
                { table: 'my-table-1', field: 'my-field-1' },
                { table: 'my-table-2', field: 'my-field-2' }
              ]
            }
          }
        }
      }

      const test = new Plugin(config)

      expect(test.list()).toContainEqual({ table: 'my-table-1', field: 'my-field-1' })
      expect(test.list()).toContainEqual({ table: 'my-table-2', field: 'my-field-2' })
    })

    it('Skips on noDeploy', () => {
      let log = jest.fn()

      const config = {
        cli: { log },
        service: {
          provider: {
            name: 'aws',
            region: 'us-east-1'
          }
        }
      }

      return new Plugin(config, { noDeploy: true }).afterDeploy().then(
        () => expect(log).toBeCalledWith('Skipping TTL setting(s) for DynamoDB: Used --noDeploy flag!')
      )
    })

    it('Skips on non-aws provider', () => {
      let log = jest.fn()

      const config = {
        cli: { log },
        service: {
          provider: {
            name: 'google',
            region: 'us-east-1'
          }
        }
      }

      return new Plugin(config, { }).afterDeploy().then(
        () => expect(log).toBeCalledWith('Skipping TTL setting(s) for DynamoDB: Only supported for AWS provider!')
      )
    })

    it('Use default service region', () => {
      let log = jest.fn()
      let dynamoDBdescribeTimeToLiveSpy = jest.fn((_, cb) => cb(null, { TimeToLiveDescription: { TimeToLiveStatus: false } }))
      let dynamoDBupdateTimeToLiveSpy = jest.fn((_, cb) => cb(null, ''))

      AWS.mock('DynamoDB', 'describeTimeToLive', dynamoDBdescribeTimeToLiveSpy)
      AWS.mock('DynamoDB', 'updateTimeToLive', dynamoDBupdateTimeToLiveSpy)

      const config = {
        cli: { log },
        service: {
          provider: {
            name: 'aws',
            region: 'us-example-1'
          },
          custom: {
            dynamodb: { ttl: [ { table: 'my-table-1', field: 'my-field-1' } ] }
          }
        }
      }

      return new Plugin(config, { }).afterDeploy().then(
        () => {
          expect(log).toBeCalledWith('Enabling TTL setting(s) for DynamoDB (us-example-1)')
          expect(dynamoDBdescribeTimeToLiveSpy).toHaveBeenCalledTimes(1)
          expect(dynamoDBupdateTimeToLiveSpy).toHaveBeenCalledTimes(1)
        }
      )
    })

    it('Use custom region with --region', () => {
      let log = jest.fn()
      let dynamoDBdescribeTimeToLiveSpy = jest.fn((_, cb) => cb(null, { TimeToLiveDescription: { TimeToLiveStatus: false } }))
      let dynamoDBupdateTimeToLiveSpy = jest.fn((_, cb) => cb(null, ''))

      AWS.mock('DynamoDB', 'describeTimeToLive', dynamoDBdescribeTimeToLiveSpy)
      AWS.mock('DynamoDB', 'updateTimeToLive', dynamoDBupdateTimeToLiveSpy)

      const config = {
        cli: { log },
        service: {
          provider: {
            name: 'aws',
            region: 'us-example-1'
          },
          custom: {
            dynamodb: { ttl: [ { table: 'my-table-1', field: 'my-field-1' } ] }
          }
        }
      }

      return new Plugin(config, { region: 'us-awesome-1' }).afterDeploy().then(
        () => {
          expect(log).toBeCalledWith('Enabling TTL setting(s) for DynamoDB (us-awesome-1)')
          expect(dynamoDBdescribeTimeToLiveSpy).toHaveBeenCalledTimes(1)
          expect(dynamoDBupdateTimeToLiveSpy).toHaveBeenCalledTimes(1)
        }
      )
    })

    it('Skips when no custom.dynamodb.ttl is found', () => {
      let log = jest.fn()
      let dynamoDBdescribeTimeToLiveSpy = jest.fn((_, cb) => cb(null, ''))
      let dynamoDBupdateTimeToLiveSpy = jest.fn((_, cb) => cb(null, ''))

      AWS.mock('DynamoDB', 'describeTimeToLive', dynamoDBdescribeTimeToLiveSpy)
      AWS.mock('DynamoDB', 'updateTimeToLive', dynamoDBupdateTimeToLiveSpy)

      const config = {
        cli: { log },
        service: {
          provider: {
            name: 'aws',
            region: 'us-east-1'
          },
          custom: {
            dynamodb: { }
          }
        }
      }

      return new Plugin(config, { region: 'eu-west-1' }).afterDeploy().then(
        () => {
          expect(log).toBeCalledWith('Skipping TTL setting(s) for DynamoDB: No configuration found!')
          expect(dynamoDBdescribeTimeToLiveSpy).toHaveBeenCalledTimes(0)
          expect(dynamoDBupdateTimeToLiveSpy).toHaveBeenCalledTimes(0)
        }
      )
    })

    it('Skips when no custom.dynamodb is found', () => {
      let log = jest.fn()
      let dynamoDBdescribeTimeToLiveSpy = jest.fn((_, cb) => cb(null, ''))
      let dynamoDBupdateTimeToLiveSpy = jest.fn((_, cb) => cb(null, ''))

      AWS.mock('DynamoDB', 'describeTimeToLive', dynamoDBdescribeTimeToLiveSpy)
      AWS.mock('DynamoDB', 'updateTimeToLive', dynamoDBupdateTimeToLiveSpy)

      const config = {
        cli: { log },
        service: {
          provider: {
            name: 'aws',
            region: 'us-east-1'
          },
          custom: { }
        }
      }

      return new Plugin(config, { region: 'eu-west-1' }).afterDeploy().then(
        () => {
          expect(log).toBeCalledWith('Skipping TTL setting(s) for DynamoDB: No configuration found!')
          expect(dynamoDBdescribeTimeToLiveSpy).toHaveBeenCalledTimes(0)
          expect(dynamoDBupdateTimeToLiveSpy).toHaveBeenCalledTimes(0)
        }
      )
    })

    it('Skips when no custom is found', () => {
      let log = jest.fn()
      let dynamoDBdescribeTimeToLiveSpy = jest.fn((_, cb) => cb(null, ''))
      let dynamoDBupdateTimeToLiveSpy = jest.fn((_, cb) => cb(null, ''))

      AWS.mock('DynamoDB', 'describeTimeToLive', dynamoDBdescribeTimeToLiveSpy)
      AWS.mock('DynamoDB', 'updateTimeToLive', dynamoDBupdateTimeToLiveSpy)

      const config = {
        cli: { log },
        service: {
          provider: {
            name: 'aws',
            region: 'us-east-1'
          }
        }
      }

      return new Plugin(config, { region: 'eu-west-1' }).afterDeploy().then(
        () => {
          expect(log).toBeCalledWith('Skipping TTL setting(s) for DynamoDB: No configuration found!')
          expect(dynamoDBdescribeTimeToLiveSpy).toHaveBeenCalledTimes(0)
          expect(dynamoDBupdateTimeToLiveSpy).toHaveBeenCalledTimes(0)
        }
      )
    })

    it('Skips when custom.dynamodb.ttl is not an array', () => {
      let log = jest.fn()
      let dynamoDBdescribeTimeToLiveSpy = jest.fn((_, cb) => cb(null, ''))
      let dynamoDBupdateTimeToLiveSpy = jest.fn((_, cb) => cb(null, ''))

      AWS.mock('DynamoDB', 'describeTimeToLive', dynamoDBdescribeTimeToLiveSpy)
      AWS.mock('DynamoDB', 'updateTimeToLive', dynamoDBupdateTimeToLiveSpy)

      const config = {
        cli: { log },
        service: {
          provider: {
            name: 'aws',
            region: 'us-east-1'
          },
          custom: { dynamodb: { ttl: { invalid: true } } } }
      }

      return new Plugin(config, { region: 'eu-west-1' }).afterDeploy().then(
        () => {
          expect(log).toBeCalledWith('Skipping TTL setting(s) for DynamoDB: Invalid configuration found!')
          expect(dynamoDBdescribeTimeToLiveSpy).toHaveBeenCalledTimes(0)
          expect(dynamoDBupdateTimeToLiveSpy).toHaveBeenCalledTimes(0)
        }
      )
    })
  })

  it('Updates TTL setting if not alreadt set', () => {
    let log = jest.fn()
    let dynamoDBdescribeTimeToLiveSpy = jest.fn((_, cb) => cb(null, { TimeToLiveDescription: { TimeToLiveStatus: false } }))
    let dynamoDBupdateTimeToLiveSpy = jest.fn((_, cb) => cb(null, ''))

    AWS.mock('DynamoDB', 'describeTimeToLive', dynamoDBdescribeTimeToLiveSpy)
    AWS.mock('DynamoDB', 'updateTimeToLive', dynamoDBupdateTimeToLiveSpy)

    const config = {
      cli: { log },
      service: {
        provider: {
          name: 'aws',
          region: 'us-east-1'
        },
        custom: {
          dynamodb: { ttl: [ { table: 'my-table-1', field: 'my-field-1' } ] }
        }
      }
    }

    return new Plugin(config, { region: 'eu-west-1' }).afterDeploy().then(
      () => {
        expect(log).toBeCalledWith('Enabling TTL setting(s) for DynamoDB (eu-west-1)')
        expect(dynamoDBdescribeTimeToLiveSpy).toHaveBeenCalledTimes(1)
        expect(dynamoDBupdateTimeToLiveSpy).toHaveBeenCalledTimes(1)
      }
    )
  })

  it('Does not update TTL configuration if already set', () => {
    let dynamoDBdescribeTimeToLiveSpy = jest.fn((_, cb) => cb(null, { TimeToLiveDescription: { TimeToLiveStatus: 'ENABLED' } }))
    let dynamoDBupdateTimeToLiveSpy = jest.fn((_, cb) => cb(null, ''))

    AWS.mock('DynamoDB', 'describeTimeToLive', dynamoDBdescribeTimeToLiveSpy)
    AWS.mock('DynamoDB', 'updateTimeToLive', dynamoDBupdateTimeToLiveSpy)

    const config = {
      cli: { log: () => {} },
      service: {
        provider: {
          name: 'aws',
          region: 'us-east-1'
        },
        custom: {
          dynamodb: {
            ttl: [ { table: 'my-table-1', field: 'my-field-1' } ]
          }
        }
      }
    }

    return new Plugin(config, { region: 'eu-west-1' }).afterDeploy().then(
      () => {
        expect(dynamoDBdescribeTimeToLiveSpy).toHaveBeenCalledTimes(1)
        expect(dynamoDBupdateTimeToLiveSpy).toHaveBeenCalledTimes(0)
      }
    )
  })

  it('Does work for multiple table configuration #1', () => {
    let dynamoDBdescribeTimeToLiveSpy = jest.fn((_, cb) => cb(null, { TimeToLiveDescription: { TimeToLiveStatus: 'ENABLED' } }))
    let dynamoDBupdateTimeToLiveSpy = jest.fn((_, cb) => cb(null, ''))

    AWS.mock('DynamoDB', 'describeTimeToLive', dynamoDBdescribeTimeToLiveSpy)
    AWS.mock('DynamoDB', 'updateTimeToLive', dynamoDBupdateTimeToLiveSpy)

    const config = {
      cli: { log: () => {} },
      service: {
        provider: {
          name: 'aws',
          region: 'us-east-1'
        },
        custom: {
          dynamodb: {
            ttl: [
              { table: 'my-table-1', field: 'my-field-1' },
              { table: 'my-table-1', field: 'my-field-1' }
            ]
          }
        }
      }
    }

    return new Plugin(config, { region: 'eu-west-1' }).afterDeploy().then(
      () => {
        expect(dynamoDBdescribeTimeToLiveSpy).toHaveBeenCalledTimes(2)
        expect(dynamoDBupdateTimeToLiveSpy).toHaveBeenCalledTimes(0)
      }
    )
  })

  it('Does work for multiple table configuration #2', () => {
    let dynamoDBdescribeTimeToLiveSpy = jest.fn((_, cb) => cb(null, { TimeToLiveDescription: { TimeToLiveStatus: false } }))
    let dynamoDBupdateTimeToLiveSpy = jest.fn((_, cb) => cb(null, ''))

    AWS.mock('DynamoDB', 'describeTimeToLive', dynamoDBdescribeTimeToLiveSpy)
    AWS.mock('DynamoDB', 'updateTimeToLive', dynamoDBupdateTimeToLiveSpy)

    const config = {
      cli: { log: () => {} },
      service: {
        provider: {
          name: 'aws',
          region: 'us-east-1'
        },
        custom: {
          dynamodb: {
            ttl: [
              { table: 'my-table-1', field: 'my-field-1' },
              { table: 'my-table-1', field: 'my-field-1' }
            ]
          }
        }
      }
    }

    return new Plugin(config, { region: 'eu-west-1' }).afterDeploy().then(
      () => {
        expect(dynamoDBdescribeTimeToLiveSpy).toHaveBeenCalledTimes(2)
        expect(dynamoDBupdateTimeToLiveSpy).toHaveBeenCalledTimes(2)
      }
    )
  })

  it('Does work for multiple table configuration #3', () => {
    let dynamoDBdescribeTimeToLiveSpy = jest.fn()
        .mockImplementationOnce((_, cb) => cb(null, { TimeToLiveDescription: { TimeToLiveStatus: false } }))
        .mockImplementationOnce((_, cb) => cb(null, { TimeToLiveDescription: { TimeToLiveStatus: 'ENABLED' } }))

    let dynamoDBupdateTimeToLiveSpy = jest.fn((_, cb) => cb(null, ''))

    AWS.mock('DynamoDB', 'describeTimeToLive', dynamoDBdescribeTimeToLiveSpy)
    AWS.mock('DynamoDB', 'updateTimeToLive', dynamoDBupdateTimeToLiveSpy)

    const config = {
      cli: { log: () => {} },
      service: {
        provider: {
          name: 'aws',
          region: 'us-east-1'
        },
        custom: {
          dynamodb: {
            ttl: [
              { table: 'my-table-1', field: 'my-field-1' },
              { table: 'my-table-1', field: 'my-field-1' }
            ]
          }
        }
      }
    }

    return new Plugin(config, { region: 'eu-west-1' }).afterDeploy().then(
      () => {
        expect(dynamoDBdescribeTimeToLiveSpy).toHaveBeenCalledTimes(2)
        expect(dynamoDBupdateTimeToLiveSpy).toHaveBeenCalledTimes(1)
      }
    )
  })
})
