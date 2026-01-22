'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { quoteSwap } from '../../../src/tools/swap/quoteSwap.js'
import { createMockServer } from '../../mocks/index.js'

describe('quoteSwap', () => {
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
  })

  test('should not register tool if no swap chains available', () => {
    server.getSwapChains.mockReturnValue([])

    quoteSwap(server)

    expect(server.registerTool).not.toHaveBeenCalled()
  })

  test('should register tool with name quoteSwap', () => {
    quoteSwap(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'quoteSwap',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      quoteSwap(server)
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

    test('should return tokenInAmount in human readable format', async () => {
      const result = await handler({
        chain: 'ethereum',
        tokenIn: 'USDT',
        tokenOut: 'USDC',
        amount: '100',
        side: 'sell'
      })

      expect(result.structuredContent.tokenInAmount).toBe('100')
    })

    test('should return tokenOutAmount in human readable format', async () => {
      const result = await handler({
        chain: 'ethereum',
        tokenIn: 'USDT',
        tokenOut: 'USDC',
        amount: '100',
        side: 'sell'
      })

      expect(result.structuredContent.tokenOutAmount).toBe('99.85')
    })

    test('should return structured content with protocol label', async () => {
      const result = await handler({
        chain: 'ethereum',
        tokenIn: 'USDT',
        tokenOut: 'USDC',
        amount: '100',
        side: 'sell'
      })

      expect(result.structuredContent.protocol).toBe('velora')
    })

    test('should return fee as string', async () => {
      const result = await handler({
        chain: 'ethereum',
        tokenIn: 'USDT',
        tokenOut: 'USDC',
        amount: '100',
        side: 'sell'
      })

      expect(result.structuredContent.fee).toBe('21000000000000')
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
      expect(result.content[0].text).toBe('Error quoting swap: Network error')
    })
  })
})
