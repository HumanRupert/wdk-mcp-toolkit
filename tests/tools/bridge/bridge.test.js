'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { bridge } from '../../../src/tools/bridge/bridge.js'
import { createMockServer } from '../../mocks/index.js'

describe('bridge', () => {
  let server, mocks

  beforeEach(() => {
    const result = createMockServer({
      chains: ['ethereum'],
      bridgeChains: ['ethereum'],
      tokens: {
        ethereum: {
          USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 }
        }
      }
    })
    server = result.server
    mocks = result.mocks
    mocks.bridgeProtocol.quoteBridge.mockResolvedValue({
      fee: 21000000000000n,
      bridgeFee: 500000000000000n
    })
    mocks.bridgeProtocol.bridge.mockResolvedValue({
      hash: '0xabc123',
      fee: 21000000000000n,
      bridgeFee: 500000000000000n
    })
  })

  test('should not register tool if no bridge chains available', () => {
    server.getBridgeChains.mockReturnValue([])

    bridge(server)

    expect(server.registerTool).not.toHaveBeenCalled()
  })

  test('should register tool with name bridge', () => {
    bridge(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'bridge',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      bridge(server)
      handler = server.registerTool.mock.calls[0][2]
    })

    test('should return error if no bridge protocols for chain', async () => {
      server.getBridgeProtocols.mockReturnValue([])

      const result = await handler({
        chain: 'ethereum',
        targetChain: 'arbitrum',
        token: 'USDT',
        amount: '100'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('No bridge protocol registered for ethereum.')
    })

    test('should return error if token not registered', async () => {
      server.getTokenInfo.mockReturnValue(undefined)

      const result = await handler({
        chain: 'ethereum',
        targetChain: 'arbitrum',
        token: 'USDT',
        amount: '100'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('Token USDT not registered for ethereum.')
    })

    test('should return cancelled message when user declines', async () => {
      server.server.elicitInput.mockResolvedValue({ action: 'accept', content: { confirmed: false } })

      const result = await handler({
        chain: 'ethereum',
        targetChain: 'arbitrum',
        token: 'USDT',
        amount: '100'
      })

      expect(result.content[0].text).toBe('Bridge cancelled by user. No funds were spent.')
    })

    test('should return cancelled message when action is not accept', async () => {
      server.server.elicitInput.mockResolvedValue({ action: 'decline' })

      const result = await handler({
        chain: 'ethereum',
        targetChain: 'arbitrum',
        token: 'USDT',
        amount: '100'
      })

      expect(result.content[0].text).toBe('Bridge cancelled by user. No funds were spent.')
    })

    test('should return hash in result when user confirms', async () => {
      const result = await handler({
        chain: 'ethereum',
        targetChain: 'arbitrum',
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
        targetChain: 'arbitrum',
        token: 'USDT',
        amount: '100'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('Error executing bridge: Network error')
    })
  })
})
