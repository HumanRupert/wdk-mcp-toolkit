'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { getTokenTransfers } from '../../../src/tools/indexer/getTokenTransfers.js'
import { createMockServer } from '../../mocks/index.js'

describe('getTokenTransfers', () => {
  let server, mocks

  const ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
  const MOCK_TRANSFERS = {
    transfers: [
      {
        blockchain: 'ethereum',
        blockNumber: 12345678,
        transactionHash: '0xabc123',
        token: 'usdt',
        amount: '1000000',
        timestamp: 1699900000,
        from: '0x123',
        to: ADDRESS
      }
    ]
  }

  beforeEach(() => {
    const result = createMockServer()
    server = result.server
    mocks = result.mocks
    mocks.indexerClient.getTokenTransfers.mockResolvedValue(MOCK_TRANSFERS)
  })

  test('should register tool with name getTokenTransfers', () => {
    getTokenTransfers(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'getTokenTransfers',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      getTokenTransfers(server)
      handler = server.registerTool.mock.calls[0][2]
    })

    test('should return transfer count in text content', async () => {
      const result = await handler({
        blockchain: 'ethereum',
        token: 'usdt',
        address: ADDRESS
      })

      expect(result.content[0].text).toContain('Found 1 USDT transfer(s) on ethereum')
    })

    test('should return no transfers message when empty', async () => {
      mocks.indexerClient.getTokenTransfers.mockResolvedValue({ transfers: [] })

      const result = await handler({
        blockchain: 'ethereum',
        token: 'usdt',
        address: ADDRESS
      })

      expect(result.content[0].text).toContain(`No transfers found for ${ADDRESS} on ethereum`)
    })

    test('should return indexer response as structured content', async () => {
      const result = await handler({
        blockchain: 'ethereum',
        token: 'usdt',
        address: ADDRESS
      })

      expect(result.structuredContent).toEqual(MOCK_TRANSFERS)
    })

    test('should return error with message on exception', async () => {
      mocks.indexerClient.getTokenTransfers.mockRejectedValue(new Error('API error'))

      const result = await handler({
        blockchain: 'ethereum',
        token: 'usdt',
        address: ADDRESS
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('Error getting token transfers: API error')
    })
  })
})
