'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { borrow } from '../../../src/tools/lending/borrow.js'
import { createMockServer } from '../../mocks/index.js'

describe('borrow', () => {
  let server, mocks

  beforeEach(() => {
    const result = createMockServer({
      chains: ['ethereum'],
      lendingChains: ['ethereum'],
      tokens: {
        ethereum: {
          USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 }
        }
      }
    })
    server = result.server
    mocks = result.mocks
    mocks.lendingProtocol.borrow.mockResolvedValue({
      hash: '0xabc123',
      fee: 21000000000000n
    })
  })

  test('should not register tool if no lending chains available', () => {
    server.getLendingChains.mockReturnValue([])

    borrow(server)

    expect(server.registerTool).not.toHaveBeenCalled()
  })

  test('should register tool with name borrow', () => {
    borrow(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'borrow',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      borrow(server)
      handler = server.registerTool.mock.calls[0][2]
    })

    test('should return error if no lending protocols for chain', async () => {
      server.getLendingProtocols.mockReturnValue([])

      const result = await handler({
        chain: 'ethereum',
        token: 'USDT',
        amount: '100'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('No lending protocol registered for ethereum.')
    })

    test('should return error if token not registered', async () => {
      server.getTokenInfo.mockReturnValue(undefined)

      const result = await handler({
        chain: 'ethereum',
        token: 'USDT',
        amount: '100'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('Token USDT not registered for ethereum.')
    })

    test('should return cancelled message when user declines', async () => {
      server.server.elicitInput.mockResolvedValue({ action: 'reject' })

      const result = await handler({
        chain: 'ethereum',
        token: 'USDT',
        amount: '100'
      })

      expect(result.content[0].text).toBe('Borrow cancelled by user. No debt was created.')
    })

    test('should return hash in result when user confirms', async () => {
      const result = await handler({
        chain: 'ethereum',
        token: 'USDT',
        amount: '100'
      })

      expect(result.structuredContent.hash).toBe('0xabc123')
      expect(result.structuredContent.success).toBe(true)
    })

    test('should return error with message on exception', async () => {
      mocks.wdk.getAccount.mockRejectedValue(new Error('Network error'))

      const result = await handler({
        chain: 'ethereum',
        token: 'USDT',
        amount: '100'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('Error executing borrow: Network error')
    })
  })
})
