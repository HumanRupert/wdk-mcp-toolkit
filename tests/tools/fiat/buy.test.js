'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { buy } from '../../../src/tools/fiat/buy.js'
import { createMockServer } from '../../mocks/index.js'

describe('buy', () => {
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

    buy(server)

    expect(server.registerTool).not.toHaveBeenCalled()
  })

  test('should register tool with name buy', () => {
    buy(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'buy',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      buy(server)
      handler = server.registerTool.mock.calls[0][2]
    })

    test('should return error if no fiat protocol for chain', async () => {
      server.getFiatProtocols.mockReturnValue([])

      const result = await handler({
        chain: 'ethereum',
        cryptoAsset: 'eth',
        fiatCurrency: 'USD',
        amount: '100',
        amountType: 'fiat'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('No fiat protocol registered for ethereum.')
      expect(result.structuredContent).toBeUndefined()
    })

    test('should return complete response on success', async () => {
      const result = await handler({
        chain: 'ethereum',
        cryptoAsset: 'eth',
        fiatCurrency: 'USD',
        amount: '100',
        amountType: 'fiat'
      })

      expect(result.isError).toBeUndefined()
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toContain('https://buy.moonpay.com/abc123')
      expect(result.structuredContent).toEqual({
        buyUrl: 'https://buy.moonpay.com/abc123',
        protocol: 'moonpay'
      })
    })

    test('should return error with message on exception', async () => {
      mocks.wdk.getAccount.mockRejectedValue(new Error('Network error'))

      const result = await handler({
        chain: 'ethereum',
        cryptoAsset: 'eth',
        fiatCurrency: 'USD',
        amount: '100',
        amountType: 'fiat'
      })

      expect(result.isError).toBe(true)
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toBe('Error generating buy URL: Network error')
      expect(result.structuredContent).toBeUndefined()
    })
  })
})
