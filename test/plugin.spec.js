'use strict'

const Plugin = require('../')

it('works', () => {
  const p = new Plugin({foo: 'bar'}, {})

  expect(p.serverless).toHaveProperty('foo', 'bar')
})
