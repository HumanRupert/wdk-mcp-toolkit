'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { getSupportedFiatCurrencies } from '../../../src/tools/fiat/getSupportedFiatCurrencies.js'
import { createMockServer } from '../../mocks/index.js'

describe('getSupportedFiatCurrencies', () => {
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

    getSupportedFiatCurrencies(server)

    expect(server.registerTool).not.toHaveBeenCalled()
  })

  test('should register tool with name getSupportedFiatCurrencies', () => {
    getSupportedFiatCurrencies(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'getSupportedFiatCurrencies',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      getSupportedFiatCurrencies(server)
      handler = server.registerTool.mock.calls[0][2]
    })

    test('should return error if no fiat protocol for chain', async () => {
      server.getFiatProtocols.mockReturnValue([])

      const result = await handler({ chain: 'ethereum' })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('No fiat protocol registered for ethereum.')
    })

    test('should return currencies array in structured content', async () => {
      const result = await handler({ chain: 'ethereum' })

      expect(result.structuredContent).toEqual([
        { code: 'USD', name: 'US Dollar', decimals: 2 },
        { code: 'EUR', name: 'Euro', decimals: 2 }
      ])
    })

    test('should return text content with currency codes', async () => {
      const result = await handler({ chain: 'ethereum' })

      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toContain('USD')
    })

    test('should return error with message on exception', async () => {
      mocks.wdk.getAccount.mockRejectedValue(new Error('Network error'))

      const result = await handler({ chain: 'ethereum' })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('Error getting supported fiat currencies: Network error')
    })
  })
})
