'use strict'

import { jest } from '@jest/globals'

export function createMockPricingClient () {
  return {
    getCurrentPrice: jest.fn().mockResolvedValue(42150.50),
    getHistoricalPrice: jest.fn().mockResolvedValue({
      prices: [{ timestamp: 1234567890, price: 42000.00 }]
    })
  }
}

export function createMockIndexerClient () {
  return {
    getTokenBalance: jest.fn().mockResolvedValue({
      tokenBalance: { blockchain: 'ethereum', token: 'usdt', amount: '1000000' }
    }),
    getTokenTransfers: jest.fn().mockResolvedValue({
      transfers: []
    })
  }
}
