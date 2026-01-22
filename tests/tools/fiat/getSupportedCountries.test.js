'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { getSupportedCountries } from '../../../src/tools/fiat/getSupportedCountries.js'
import { createMockServer } from '../../mocks/index.js'

describe('getSupportedCountries', () => {
  let server, mocks

  beforeEach(() => {
    const result = createMockServer({
      chains: ['ethereum'],
      fiatChains: ['ethereum']
    })
    server = result.server
    mocks = result.mocks
  })

  test('should not register tool if no fiat chains available', () => {
    server.getFiatChains.mockReturnValue([])

    getSupportedCountries(server)

    expect(server.registerTool).not.toHaveBeenCalled()
  })

  test('should register tool with name getSupportedCountries', () => {
    getSupportedCountries(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'getSupportedCountries',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      getSupportedCountries(server)
      handler = server.registerTool.mock.calls[0][2]
    })

    test('should return error if no fiat protocols for chain', async () => {
      server.getFiatProtocols.mockReturnValue([])

      const result = await handler({ chain: 'ethereum' })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('No fiat protocol registered for ethereum.')
      expect(result.structuredContent).toBeUndefined()
    })

    test('should return countries with code, name, and buy/sell flags', async () => {
      const result = await handler({ chain: 'ethereum' })

      expect(result.isError).toBeUndefined()
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.structuredContent).toEqual([
        { code: 'US', name: 'United States', isBuyAllowed: true, isSellAllowed: true },
        { code: 'DE', name: 'Germany', isBuyAllowed: true, isSellAllowed: false }
      ])
    })

    test('should return error with message on exception', async () => {
      mocks.wdk.getAccount.mockRejectedValue(new Error('Network error'))

      const result = await handler({ chain: 'ethereum' })

      expect(result.isError).toBe(true)
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toBe('Error getting supported countries: Network error')
      expect(result.structuredContent).toBeUndefined()
    })
  })
})
