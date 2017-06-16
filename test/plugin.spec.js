'use strict'

const sinon = require('sinon')
const Plugin = require('../')

describe('Plugin', () => {
  let getProvider = null
  let provider = {
    request: () => true,
    sdk: {
      VERSION: '2.21.0'
    }
  }
  let providerMock = null

  beforeEach(() => {
    providerMock = sinon.mock(provider)
    getProvider = sinon.stub().returns(provider)
  })

  afterEach(() => {
    providerMock.restore()
  })

  describe('Configuration', () => {
    it('Reads configuration', () => {
      const config = {
        cli: { log: () => {} },
        region: 'us-east-1',
        service: {
          provider: {
            name: 'aws'
          },
          custom: {
            dynamodb: {
              ttl: [
                { table: 'my-table-1', field: 'my-field-1' },
                { table: 'my-table-2', field: 'my-field-2' }
              ]
            }
          }
        },
        getProvider
      }

      const test = new Plugin(config)

      expect(test.list()).toContainEqual({ table: 'my-table-1', field: 'my-field-1' })
      expect(test.list()).toContainEqual({ table: 'my-table-2', field: 'my-field-2' })
    })

    it('Skips on noDeploy', () => {
      let log = jest.fn()

      const config = {
        cli: { log },
        region: 'us-east-1',
        service: {
          provider: {
            name: 'aws'
          }
        },
        getProvider
      }

      return new Plugin(config, { noDeploy: true }).afterDeploy().then(
        () => expect(log).toBeCalledWith('Skipping TTL setting(s) for DynamoDB: Used --noDeploy flag!')
      )
    })

    it('Skips on non-aws provider', () => {
      let log = jest.fn()

      const config = {
        cli: { log },
        region: 'us-east-1',
        service: {
          provider: {
            name: 'google'
          }
        },
        getProvider
      }

      return new Plugin(config, { }).afterDeploy().then(
        () => expect(log).toBeCalledWith('Skipping TTL setting(s) for DynamoDB: Only supported for AWS provider!')
      )
    })

    it('Use the region provided in options by default', () => {
      let log = jest.fn()

      providerMock.expects('request')
        .withArgs('DynamoDB', 'describeTimeToLive')
        .returns(Promise.resolve({ TimeToLiveDescription: { TimeToLiveStatus: false } }))
      providerMock.expects('request')
        .withArgs('DynamoDB', 'updateTimeToLive')
        .returns(Promise.resolve())

      const config = {
        cli: { log },
        service: {
          provider: {
            name: 'aws'
          },
          custom: {
            dynamodb: { ttl: [ { table: 'my-table-1', field: 'my-field-1' } ] }
          }
        },
        getProvider
      }

      return new Plugin(config, { region: 'us-example-1' }).afterDeploy().then(
        () => {
          expect(log).toBeCalledWith('Enabling TTL setting(s) for DynamoDB (us-example-1)')
        }
      )
    })

    it('Skips for unsupported aws-sdk versions', () => {
      let log = jest.fn()

      let unsupportedProvider = {
        request: () => true,
        sdk: {
          VERSION: '2.20.0'
        }
      }

      let unsupportedProviderMock = sinon.mock(unsupportedProvider)
      let unsupportedGetProvider = sinon.stub().returns(unsupportedProvider)

      unsupportedProviderMock.expects('request').never()
      const config = {
        cli: { log },
        region: 'us-east-1',
        version: '1.13.1',
        service: {
          provider: {
            name: 'aws'
          },
          custom: {
            dynamodb: { ttl: [ { table: 'my-table-1', field: 'my-field-1' } ] }
          }
        },
        getProvider: unsupportedGetProvider
      }

      return new Plugin(config, { region: 'eu-west-1' }).afterDeploy().then(
        () => {
          expect(log).toBeCalledWith('Skipping TTL setting(s) for DynamoDB: Use `aws-sdk` version 2.21.0 or newer!')
          unsupportedProviderMock.restore()
        }
      )
    })

    it('Skips when no custom.dynamodb.ttl is found', () => {
      let log = jest.fn()

      providerMock.expects('request').never()

      const config = {
        cli: { log },
        region: 'us-east-1',
        service: {
          provider: {
            name: 'aws'
          },
          custom: {
            dynamodb: { }
          }
        },
        getProvider
      }

      return new Plugin(config, { region: 'eu-west-1' }).afterDeploy().then(
        () => {
          expect(log).toBeCalledWith('Skipping TTL setting(s) for DynamoDB: No configuration found!')
        }
      )
    })

    it('Skips when no custom.dynamodb is found', () => {
      let log = jest.fn()

      providerMock.expects('request').never()

      const config = {
        cli: { log },
        region: 'us-east-1',
        service: {
          provider: {
            name: 'aws'
          },
          custom: { }
        },
        getProvider
      }

      return new Plugin(config, { region: 'eu-west-1' }).afterDeploy().then(
        () => {
          expect(log).toBeCalledWith('Skipping TTL setting(s) for DynamoDB: No configuration found!')
        }
      )
    })

    it('Skips when no custom is found', () => {
      let log = jest.fn()

      providerMock.expects('request').never()

      const config = {
        cli: { log },
        region: 'us-east-1',
        service: {
          provider: {
            name: 'aws'
          }
        },
        getProvider
      }

      return new Plugin(config, { region: 'eu-west-1' }).afterDeploy().then(
        () => {
          expect(log).toBeCalledWith('Skipping TTL setting(s) for DynamoDB: No configuration found!')
        }
      )
    })

    it('Skips when custom.dynamodb.ttl is not an array', () => {
      let log = jest.fn()

      providerMock.expects('request').never()

      const config = {
        cli: { log },
        region: 'us-east-1',
        service: {
          provider: {
            name: 'aws'
          },
          custom: { dynamodb: { ttl: { invalid: true } } }
        },
        getProvider
      }

      return new Plugin(config, { region: 'eu-west-1' }).afterDeploy().then(
        () => {
          expect(log).toBeCalledWith('Skipping TTL setting(s) for DynamoDB: Invalid configuration found!')
        }
      )
    })
  })

  it('Updates TTL setting if not already set', () => {
    let log = jest.fn()

    providerMock.expects('request')
      .withArgs('DynamoDB', 'describeTimeToLive')
      .returns(Promise.resolve({ TimeToLiveDescription: { TimeToLiveStatus: false } }))
    providerMock.expects('request')
      .withArgs('DynamoDB', 'updateTimeToLive')
      .returns(Promise.resolve())

    const config = {
      cli: { log },
      region: 'us-east-1',
      service: {
        provider: {
          name: 'aws'
        },
        custom: {
          dynamodb: { ttl: [ { table: 'my-table-1', field: 'my-field-1' } ] }
        }
      },
      getProvider
    }

    return new Plugin(config, { region: 'eu-west-1' }).afterDeploy().then(
      () => {
        expect(log).toBeCalledWith('Enabling TTL setting(s) for DynamoDB (eu-west-1)')
      }
    )
  })

  it('Does not update TTL configuration if already set', () => {
    providerMock.expects('request')
      .withArgs('DynamoDB', 'describeTimeToLive')
      .returns(Promise.resolve({ TimeToLiveDescription: { TimeToLiveStatus: 'ENABLED' } }))
    providerMock.expects('request')
      .withArgs('DynamoDB', 'updateTimeToLive')
      .never()

    const config = {
      cli: { log: () => {} },
      region: 'us-east-1',
      service: {
        provider: {
          name: 'aws'
        },
        custom: {
          dynamodb: {
            ttl: [ { table: 'my-table-1', field: 'my-field-1' } ]
          }
        }
      },
      getProvider
    }

    return new Plugin(config, { region: 'eu-west-1' }).afterDeploy()
  })

  it('Does work for multiple table configuration #1', () => {
    providerMock.expects('request')
      .withArgs('DynamoDB', 'describeTimeToLive')
      .twice()
      .returns(Promise.resolve({ TimeToLiveDescription: { TimeToLiveStatus: 'ENABLED' } }))
    providerMock.expects('request')
      .withArgs('DynamoDB', 'updateTimeToLive')
      .never()

    const config = {
      cli: { log: () => {} },
      region: 'us-east-1',
      service: {
        provider: {
          name: 'aws'
        },
        custom: {
          dynamodb: {
            ttl: [
              { table: 'my-table-1', field: 'my-field-1' },
              { table: 'my-table-1', field: 'my-field-1' }
            ]
          }
        }
      },
      getProvider
    }

    return new Plugin(config, { region: 'eu-west-1' }).afterDeploy()
  })

  it('Does work for multiple table configuration #2', () => {
    providerMock.expects('request')
      .withArgs('DynamoDB', 'describeTimeToLive')
      .twice()
      .returns(Promise.resolve({ TimeToLiveDescription: { TimeToLiveStatus: false } }))
    providerMock.expects('request')
      .withArgs('DynamoDB', 'updateTimeToLive')
      .twice()
      .returns(Promise.resolve())

    const config = {
      cli: { log: () => {} },
      region: 'us-east-1',
      service: {
        provider: {
          name: 'aws'
        },
        custom: {
          dynamodb: {
            ttl: [
              { table: 'my-table-1', field: 'my-field-1' },
              { table: 'my-table-1', field: 'my-field-1' }
            ]
          }
        }
      },
      getProvider
    }

    return new Plugin(config, { region: 'eu-west-1' }).afterDeploy()
  })

  it('Does work for multiple table configuration #3', () => {
    providerMock.expects('request')
      .withArgs('DynamoDB', 'describeTimeToLive')
      .returns(Promise.resolve({ TimeToLiveDescription: { TimeToLiveStatus: false } }))
      .returns(Promise.resolve({ TimeToLiveDescription: { TimeToLiveStatus: 'ENABLED' } }))
    providerMock.expects('request')
      .withArgs('DynamoDB', 'updateTimeToLive')
      .once()
      .returns(Promise.resolve())

    const config = {
      cli: { log: () => {} },
      region: 'us-east-1',
      service: {
        provider: {
          name: 'aws'
        },
        custom: {
          dynamodb: {
            ttl: [
              { table: 'my-table-1', field: 'my-field-1' },
              { table: 'my-table-1', field: 'my-field-1' }
            ]
          }
        }
      },
      getProvider
    }

    return new Plugin(config, { region: 'eu-west-1' }).afterDeploy()
  })
})
