'use strict'

var AWS = require('aws-sdk-mock')
const Plugin = require('../')

describe('Plugin', () => {
  afterEach(() => {
    AWS.restore('DynamoDB')
  })

  it('reads configuration', () => {
    const config = {
      cli: { log: () => {} },
      service: {
        custom: {
          dynamodb: {
            ttl: [
              {
                table: 'my-table-1',
                field: 'my-field-1'
              },
              {
                table: 'my-table-2',
                field: 'my-field-2'
              }
            ]
          }
        }
      }
    }

    const test = new Plugin(config)

    expect(test.configuration()).toContainEqual({ table: 'my-table-1', field: 'my-field-1' })
    expect(test.configuration()).toContainEqual({ table: 'my-table-2', field: 'my-field-2' })
  })

  it('Works without configuration', () => {
    let dynamoDBdescribeTimeToLiveSpy = jest.fn((_, cb) => cb(null, ''))
    let dynamoDBupdateTimeToLiveSpy = jest.fn((_, cb) => cb(null, ''))

    AWS.mock('DynamoDB', 'describeTimeToLive', dynamoDBdescribeTimeToLiveSpy)
    AWS.mock('DynamoDB', 'updateTimeToLive', dynamoDBupdateTimeToLiveSpy)

    const config = {
      cli: { log: () => {} },
      service: {
        custom: {
          dynamodb: { }
        }
      }
    }

    return new Plugin(config, { region: 'eu-west-1' }).afterDeploy().then(
      () => {
        expect(dynamoDBdescribeTimeToLiveSpy).toHaveBeenCalledTimes(0)
        expect(dynamoDBupdateTimeToLiveSpy).toHaveBeenCalledTimes(0)
      }
    )
  })

  it('Updates TTL setting if not alreadt set', () => {
    let dynamoDBdescribeTimeToLiveSpy = jest.fn((_, cb) => cb(null, { TimeToLiveDescription: { TimeToLiveStatus: false } }))
    let dynamoDBupdateTimeToLiveSpy = jest.fn((_, cb) => cb(null, ''))

    AWS.mock('DynamoDB', 'describeTimeToLive', dynamoDBdescribeTimeToLiveSpy)
    AWS.mock('DynamoDB', 'updateTimeToLive', dynamoDBupdateTimeToLiveSpy)

    const config = {
      cli: { log: () => {} },
      service: {
        custom: {
          dynamodb: {
            ttl: [
              {
                table: 'my-table-1',
                field: 'my-field-1'
              }
            ]
          }
        }
      }
    }

    return new Plugin(config, { region: 'eu-west-1' }).afterDeploy().then(
      () => {
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
        custom: {
          dynamodb: {
            ttl: [
              {
                table: 'my-table-1',
                field: 'my-field-1'
              }
            ]
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
        custom: {
          dynamodb: {
            ttl: [
              {
                table: 'my-table-1',
                field: 'my-field-1'
              },
              {
                table: 'my-table-1',
                field: 'my-field-1'
              }
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
        custom: {
          dynamodb: {
            ttl: [
              {
                table: 'my-table-1',
                field: 'my-field-1'
              },
              {
                table: 'my-table-1',
                field: 'my-field-1'
              }
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
        .mockImplementationOnce((_, cb) => cb(null, { TimeToLiveDescription: { TimeToLiveStatus: false }}))
        .mockImplementationOnce((_, cb) => cb(null, { TimeToLiveDescription: { TimeToLiveStatus: 'ENABLED' }}))

    let dynamoDBupdateTimeToLiveSpy = jest.fn((_, cb) => cb(null, ''))

    AWS.mock('DynamoDB', 'describeTimeToLive', dynamoDBdescribeTimeToLiveSpy)
    AWS.mock('DynamoDB', 'updateTimeToLive', dynamoDBupdateTimeToLiveSpy)

    const config = {
      cli: { log: () => {} },
      service: {
        custom: {
          dynamodb: {
            ttl: [
              {
                table: 'my-table-1',
                field: 'my-field-1'
              },
              {
                table: 'my-table-1',
                field: 'my-field-1'
              }
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
