'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { getTransactionDetail } from '../../../src/tools/fiat/getTransactionDetail.js'
import { createMockServer } from '../../mocks/index.js'

describe('getTransactionDetail', () => {
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

    getTransactionDetail(server)

    expect(server.registerTool).not.toHaveBeenCalled()
  })

  test('should register tool with name getFiatTransactionDetail', () => {
    getTransactionDetail(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'getFiatTransactionDetail',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      getTransactionDetail(server)
      handler = server.registerTool.mock.calls[0][2]
    })

    test('should return error if no fiat protocol for chain', async () => {
      server.getFiatProtocols.mockReturnValue([])

      const result = await handler({
        chain: 'ethereum',
        txId: 'tx123'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('No fiat protocol registered for ethereum.')
      expect(result.structuredContent).toBeUndefined()
    })

    test('should return transaction detail in structured content', async () => {
      const result = await handler({
        chain: 'ethereum',
        txId: 'tx123'
      })

      expect(result.isError).toBeUndefined()
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.structuredContent.protocol).toBe('moonpay')
      expect(result.structuredContent.txId).toBe('tx123')
      expect(result.structuredContent.status).toBe('completed')
      expect(result.structuredContent.cryptoAsset).toBe('eth')
      expect(result.structuredContent.fiatCurrency).toBe('USD')
    })

    test('should return error with message on exception', async () => {
      mocks.wdk.getAccount.mockRejectedValue(new Error('Network error'))

      const result = await handler({
        chain: 'ethereum',
        txId: 'tx123'
      })

      expect(result.isError).toBe(true)
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toBe('Error getting transaction detail: Network error')
      expect(result.structuredContent).toBeUndefined()
    })
  })
})
