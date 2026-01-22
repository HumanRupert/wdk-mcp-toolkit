'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { getIndexerTokenBalance } from '../../../src/tools/indexer/getTokenBalance.js'
import { createMockServer } from '../../mocks/index.js'

describe('getIndexerTokenBalance', () => {
  let server, mocks

  const ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'

  beforeEach(() => {
    const result = createMockServer()
    server = result.server
    mocks = result.mocks
  })

  test('should register tool with name getIndexerTokenBalance', () => {
    getIndexerTokenBalance(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'getIndexerTokenBalance',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      getIndexerTokenBalance(server)
      handler = server.registerTool.mock.calls[0][2]
    })

    test('should return balance in text content', async () => {
      const result = await handler({ blockchain: 'ethereum', token: 'usdt', address: ADDRESS })

      expect(result.content[0].text).toBe('Balance: 1000000 USDT on ethereum')
    })

    test('should return 0 if tokenBalance.amount is undefined', async () => {
      mocks.indexerClient.getTokenBalance.mockResolvedValue({
        tokenBalance: { blockchain: 'ethereum', token: 'usdt' }
      })

      const result = await handler({ blockchain: 'ethereum', token: 'usdt', address: ADDRESS })

      expect(result.content[0].text).toBe('Balance: 0 USDT on ethereum')
    })

    test('should return indexer response as structured content', async () => {
      const result = await handler({ blockchain: 'ethereum', token: 'usdt', address: ADDRESS })

      expect(result.structuredContent).toEqual({
        tokenBalance: { blockchain: 'ethereum', token: 'usdt', amount: '1000000' }
      })
    })

    test('should return error with message on exception', async () => {
      mocks.indexerClient.getTokenBalance.mockRejectedValue(new Error('API error'))

      const result = await handler({ blockchain: 'ethereum', token: 'usdt', address: ADDRESS })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('Error getting indexed token balance: API error')
    })
  })
})
