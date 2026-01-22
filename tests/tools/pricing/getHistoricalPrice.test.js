'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { getHistoricalPrice } from '../../../src/tools/pricing/getHistoricalPrice.js'
import { createMockServer } from '../../mocks/index.js'

describe('getHistoricalPrice', () => {
  let server, mocks

  const MOCK_SERIES = [
    [1709906400000, 42000, 42100, 42200, 41900, 1000],
    [1709910000000, 42100, 42050, 42150, 42000, 800]
  ]

  beforeEach(() => {
    const result = createMockServer()
    server = result.server
    mocks = result.mocks
    mocks.pricingClient.getHistoricalPrice.mockResolvedValue(MOCK_SERIES)
  })

  test('should register tool with name getHistoricalPrice', () => {
    getHistoricalPrice(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'getHistoricalPrice',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      getHistoricalPrice(server)
      handler = server.registerTool.mock.calls[0][2]
    })

    test('should return data points count in text content', async () => {
      const result = await handler({ from: 'BTC', to: 'USD' })

      expect(result.content[0].text).toContain('2 data points')
    })

    test('should return points in structured content', async () => {
      const result = await handler({ from: 'BTC', to: 'USD' })

      expect(result.structuredContent.points).toEqual(MOCK_SERIES)
    })

    test('should uppercase currencies in output', async () => {
      const result = await handler({ from: 'btc', to: 'usd' })

      expect(result.structuredContent.from).toBe('BTC')
      expect(result.structuredContent.to).toBe('USD')
    })

    test('should not include start and end in result when not provided', async () => {
      const result = await handler({ from: 'BTC', to: 'USD' })

      expect(result.structuredContent.start).toBeUndefined()
      expect(result.structuredContent.end).toBeUndefined()
    })

    test('should include start and end in result when provided', async () => {
      const start = 1709906400000
      const end = 1709913600000

      const result = await handler({ from: 'BTC', to: 'USD', start, end })

      expect(result.structuredContent.start).toBe(start)
      expect(result.structuredContent.end).toBe(end)
    })

    test('should return 0 data points when series is empty', async () => {
      mocks.pricingClient.getHistoricalPrice.mockResolvedValue([])

      const result = await handler({ from: 'BTC', to: 'USD' })

      expect(result.content[0].text).toContain('0 data points')
    })

    test('should return error with message on exception', async () => {
      mocks.pricingClient.getHistoricalPrice.mockRejectedValue(new Error('Invalid time range'))

      const result = await handler({ from: 'BTC', to: 'USD' })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('Error getting historical price: Invalid time range')
    })
  })
})
