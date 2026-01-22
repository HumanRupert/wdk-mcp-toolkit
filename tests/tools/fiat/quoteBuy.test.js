'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { quoteBuy } from '../../../src/tools/fiat/quoteBuy.js'
import { createMockServer } from '../../mocks/index.js'

describe('quoteBuy', () => {
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

    quoteBuy(server)

    expect(server.registerTool).not.toHaveBeenCalled()
  })

  test('should register tool with name quoteBuy', () => {
    quoteBuy(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'quoteBuy',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      quoteBuy(server)
      handler = server.registerTool.mock.calls[0][2]
    })

    test('should return error if no fiat protocol for chain', async () => {
      server.getFiatProtocols.mockReturnValue([])

      const result = await handler({
        chain: 'ethereum',
        cryptoAsset: 'eth',
        fiatCurrency: 'USD',
        amount: '10000',
        amountType: 'fiat'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('No fiat protocol registered for ethereum.')
      expect(result.structuredContent).toBeUndefined()
    })

    test('should return complete response with quote', async () => {
      const result = await handler({
        chain: 'ethereum',
        cryptoAsset: 'eth',
        fiatCurrency: 'USD',
        amount: '350000',
        amountType: 'fiat'
      })

      expect(result.isError).toBeUndefined()
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.structuredContent).toEqual({
        protocol: 'moonpay',
        cryptoAsset: 'eth',
        fiatCurrency: 'USD',
        cryptoAmount: '1000000000000000000',
        fiatAmount: '350000',
        fee: '1750',
        rate: '3500.00'
      })
    })

    test('should return error with message on exception', async () => {
      mocks.wdk.getAccount.mockRejectedValue(new Error('Network error'))

      const result = await handler({
        chain: 'ethereum',
        cryptoAsset: 'eth',
        fiatCurrency: 'USD',
        amount: '350000',
        amountType: 'fiat'
      })

      expect(result.isError).toBe(true)
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toBe('Error quoting buy: Network error')
      expect(result.structuredContent).toBeUndefined()
    })
  })
})
