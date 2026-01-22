'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { quoteTransfer } from '../../../src/tools/wallet/quoteTransfer.js'
import { createMockServer } from '../../mocks/index.js'

describe('quoteTransfer', () => {
  let server, mocks

  const RECIPIENT = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'

  beforeEach(() => {
    const result = createMockServer({
      chains: ['ethereum'],
      tokens: {
        ethereum: {
          USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 }
        }
      }
    })
    server = result.server
    mocks = result.mocks
  })

  test('should register tool with name quoteTransfer', () => {
    quoteTransfer(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'quoteTransfer',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      quoteTransfer(server)
      handler = server.registerTool.mock.calls[0][2]
    })

    test('should return error if token not registered', async () => {
      server.getTokenInfo.mockReturnValue(undefined)
      server.getRegisteredTokens.mockReturnValue(['USDC', 'DAI'])

      const result = await handler({
        chain: 'ethereum',
        token: 'USDT',
        recipient: RECIPIENT,
        amount: '100'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('Token symbol "USDT" not registered')
      expect(result.structuredContent).toBeUndefined()
    })

    test('should return error if amount is invalid', async () => {
      const result = await handler({
        chain: 'ethereum',
        token: 'USDT',
        recipient: RECIPIENT,
        amount: 'invalid'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('Invalid amount')
      expect(result.structuredContent).toBeUndefined()
    })

    test('should return error if amount is zero', async () => {
      const result = await handler({
        chain: 'ethereum',
        token: 'USDT',
        recipient: RECIPIENT,
        amount: '0'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('Amount must be greater than zero')
      expect(result.structuredContent).toBeUndefined()
    })

    test('should return complete response with fee', async () => {
      const result = await handler({
        chain: 'ethereum',
        token: 'USDT',
        recipient: RECIPIENT,
        amount: '100'
      })

      expect(result.isError).toBeUndefined()
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toContain('Estimated fee for transferring 100 USDT')
      expect(result.structuredContent).toEqual({ fee: '21000000000000' })
    })

    test('should return error with message on exception', async () => {
      mocks.wdk.getAccount.mockRejectedValue(new Error('Network error'))

      const result = await handler({
        chain: 'ethereum',
        token: 'USDT',
        recipient: RECIPIENT,
        amount: '100'
      })

      expect(result.isError).toBe(true)
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toBe('Error quoting transfer on ethereum: Network error')
      expect(result.structuredContent).toBeUndefined()
    })
  })
})
