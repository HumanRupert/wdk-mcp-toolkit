'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { quoteBridge } from '../../../src/tools/bridge/quoteBridge.js'
import { createMockServer } from '../../mocks/index.js'

describe('quoteBridge', () => {
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
  })

  test('should not register tool if no bridge chains available', () => {
    server.getBridgeChains.mockReturnValue([])

    quoteBridge(server)

    expect(server.registerTool).not.toHaveBeenCalled()
  })

  test('should register tool with name quoteBridge', () => {
    quoteBridge(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'quoteBridge',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      quoteBridge(server)
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

    test('should return structured content with protocol and chain info', async () => {
      const result = await handler({
        chain: 'ethereum',
        targetChain: 'arbitrum',
        token: 'USDT',
        amount: '100'
      })

      expect(result.structuredContent.protocol).toBe('usdt0')
      expect(result.structuredContent.sourceChain).toBe('ethereum')
      expect(result.structuredContent.targetChain).toBe('arbitrum')
    })

    test('should return fees as strings', async () => {
      const result = await handler({
        chain: 'ethereum',
        targetChain: 'arbitrum',
        token: 'USDT',
        amount: '100'
      })

      expect(result.structuredContent.fee).toBe('21000000000000')
      expect(result.structuredContent.bridgeFee).toBe('500000000000000')
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
      expect(result.content[0].text).toBe('Error quoting bridge: Network error')
    })
  })
})
