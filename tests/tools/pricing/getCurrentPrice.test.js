'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { getCurrentPrice } from '../../../src/tools/pricing/getCurrentPrice.js'
import { createMockServer } from '../../mocks/index.js'

describe('getCurrentPrice', () => {
  let server, mocks

  beforeEach(() => {
    const result = createMockServer()
    server = result.server
    mocks = result.mocks
  })

  test('should register tool with name getCurrentPrice', () => {
    getCurrentPrice(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'getCurrentPrice',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      getCurrentPrice(server)
      handler = server.registerTool.mock.calls[0][2]
    })

    test('should return price in text content', async () => {
      const result = await handler({ base: 'BTC', quote: 'USD' })

      expect(result.content[0].text).toBe('BTC/USD: 42150.5')
    })

    test('should return structured content with base, quote, and price', async () => {
      const result = await handler({ base: 'BTC', quote: 'USD' })

      expect(result.structuredContent).toEqual({
        base: 'BTC',
        quote: 'USD',
        price: 42150.50
      })
    })

    test('should uppercase currencies in output', async () => {
      const result = await handler({ base: 'btc', quote: 'usd' })

      expect(result.structuredContent.base).toBe('BTC')
      expect(result.structuredContent.quote).toBe('USD')
    })

    test('should return error with message on exception', async () => {
      mocks.pricingClient.getCurrentPrice.mockRejectedValue(new Error('Pair not supported'))

      const result = await handler({ base: 'XYZ', quote: 'USD' })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('Error getting current price: Pair not supported')
    })
  })
})
