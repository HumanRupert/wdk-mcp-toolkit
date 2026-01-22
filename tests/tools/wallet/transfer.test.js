'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { transfer } from '../../../src/tools/wallet/transfer.js'
import { createMockServer } from '../../mocks/index.js'

describe('transfer', () => {
  let server, mocks

  const RECIPIENT = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'

  beforeEach(() => {
    const result = createMockServer({
      chains: ['ethereum'],
      tokens: {
        ethereum: {
          USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
          USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 }
        }
      }
    })
    server = result.server
    mocks = result.mocks
  })

  test('should register tool with name transfer', () => {
    transfer(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'transfer',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      transfer(server)
      handler = server.registerTool.mock.calls[0][2]
    })

    test('should throw if token not registered', async () => {
      server.getTokenInfo.mockReturnValue(undefined)
      server.getRegisteredTokens.mockReturnValue(['USDT', 'USDC'])

      const result = await handler({
        chain: 'ethereum',
        token: 'UNKNOWN',
        to: RECIPIENT,
        amount: '100'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('Token "UNKNOWN" not registered for ethereum')
      expect(result.content[0].text).toContain('Available tokens: USDT, USDC')
    })

    test('should throw if amount is not a number', async () => {
      const result = await handler({
        chain: 'ethereum',
        token: 'USDT',
        to: RECIPIENT,
        amount: 'abc'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('Invalid amount format')
    })

    test('should throw if amount is zero', async () => {
      const result = await handler({
        chain: 'ethereum',
        token: 'USDT',
        to: RECIPIENT,
        amount: '0'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('Amount must be greater than zero')
    })

    test('should throw if amount is negative', async () => {
      const result = await handler({
        chain: 'ethereum',
        token: 'USDT',
        to: RECIPIENT,
        amount: '-10'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('Negative amounts are not allowed')
    })

    test('should return cancelled message when user declines', async () => {
      server.server.elicitInput.mockResolvedValue({ action: 'accept', content: { confirmed: false } })

      const result = await handler({
        chain: 'ethereum',
        token: 'USDT',
        to: RECIPIENT,
        amount: '100'
      })

      expect(result.content[0].text).toBe('Transfer cancelled by user. No funds were spent.')
    })

    test('should return cancelled message when action is not accept', async () => {
      server.server.elicitInput.mockResolvedValue({ action: 'decline' })

      const result = await handler({
        chain: 'ethereum',
        token: 'USDT',
        to: RECIPIENT,
        amount: '100'
      })

      expect(result.content[0].text).toBe('Transfer cancelled by user. No funds were spent.')
    })

    test('should return hash in result when user confirms', async () => {
      const result = await handler({
        chain: 'ethereum',
        token: 'USDT',
        to: RECIPIENT,
        amount: '100'
      })

      expect(result.structuredContent.hash).toBe('0xabc123')
    })

    test('should return fee as string', async () => {
      const result = await handler({
        chain: 'ethereum',
        token: 'USDT',
        to: RECIPIENT,
        amount: '100'
      })

      expect(result.structuredContent.fee).toBe('21000000000000')
    })

    test('should return error with chain name in message', async () => {
      mocks.wdk.getAccount.mockRejectedValue(new Error('Network error'))

      const result = await handler({
        chain: 'ethereum',
        token: 'USDT',
        to: RECIPIENT,
        amount: '100'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('Error transferring token on ethereum: Network error')
    })
  })
})
