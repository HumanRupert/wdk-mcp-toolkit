'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { swap } from '../../../src/tools/swap/swap.js'
import { createMockServer } from '../../mocks/index.js'

describe('swap', () => {
  let server, mocks

  beforeEach(() => {
    const result = createMockServer({
      chains: ['ethereum'],
      swapChains: ['ethereum'],
      tokens: {
        ethereum: {
          USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
          USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 }
        }
      }
    })
    server = result.server
    mocks = result.mocks
    mocks.swapProtocol.quoteSwap.mockResolvedValue({
      tokenInAmount: 100000000n,
      tokenOutAmount: 99850000n,
      fee: 21000000000000n
    })
    mocks.swapProtocol.swap.mockResolvedValue({
      hash: '0xabc123',
      tokenInAmount: 100000000n,
      tokenOutAmount: 99850000n,
      fee: 21000000000000n
    })
  })

  test('should not register tool if no swap chains available', () => {
    server.getSwapChains.mockReturnValue([])

    swap(server)

    expect(server.registerTool).not.toHaveBeenCalled()
  })

  test('should register tool with name swap', () => {
    swap(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'swap',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      swap(server)
      handler = server.registerTool.mock.calls[0][2]
    })

    test('should return error if no swap protocols for chain', async () => {
      server.getSwapProtocols.mockReturnValue([])

      const result = await handler({
        chain: 'ethereum',
        tokenIn: 'USDT',
        tokenOut: 'USDC',
        amount: '100',
        side: 'sell'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('No swap protocol registered for ethereum.')
    })

    test('should return error if tokenIn not registered', async () => {
      server.getTokenInfo.mockReturnValue(undefined)

      const result = await handler({
        chain: 'ethereum',
        tokenIn: 'USDT',
        tokenOut: 'USDC',
        amount: '100',
        side: 'sell'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('Token USDT not registered for ethereum.')
    })

    test('should return error if tokenOut not registered', async () => {
      server.getTokenInfo
        .mockReturnValueOnce({ address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 })
        .mockReturnValueOnce(undefined)

      const result = await handler({
        chain: 'ethereum',
        tokenIn: 'USDT',
        tokenOut: 'USDC',
        amount: '100',
        side: 'sell'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('Token USDC not registered for ethereum.')
    })

    test('should return cancelled message when user declines', async () => {
      server.server.elicitInput.mockResolvedValue({ action: 'accept', content: { confirmed: false } })

      const result = await handler({
        chain: 'ethereum',
        tokenIn: 'USDT',
        tokenOut: 'USDC',
        amount: '100',
        side: 'sell'
      })

      expect(result.content[0].text).toBe('Swap cancelled by user. No funds were spent.')
    })

    test('should return cancelled message when action is not accept', async () => {
      server.server.elicitInput.mockResolvedValue({ action: 'decline' })

      const result = await handler({
        chain: 'ethereum',
        tokenIn: 'USDT',
        tokenOut: 'USDC',
        amount: '100',
        side: 'sell'
      })

      expect(result.content[0].text).toBe('Swap cancelled by user. No funds were spent.')
    })

    test('should return hash in result when user confirms', async () => {
      const result = await handler({
        chain: 'ethereum',
        tokenIn: 'USDT',
        tokenOut: 'USDC',
        amount: '100',
        side: 'sell'
      })

      expect(result.structuredContent.hash).toBe('0xabc123')
    })

    test('should format amounts in human readable form', async () => {
      const result = await handler({
        chain: 'ethereum',
        tokenIn: 'USDT',
        tokenOut: 'USDC',
        amount: '100',
        side: 'sell'
      })

      expect(result.structuredContent.tokenInAmount).toBe('100')
      expect(result.structuredContent.tokenOutAmount).toBe('99.85')
    })

    test('should return error with message on exception', async () => {
      mocks.wdk.getAccount.mockRejectedValue(new Error('Network error'))

      const result = await handler({
        chain: 'ethereum',
        tokenIn: 'USDT',
        tokenOut: 'USDC',
        amount: '100',
        side: 'sell'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('Error executing swap: Network error')
    })
  })
})
