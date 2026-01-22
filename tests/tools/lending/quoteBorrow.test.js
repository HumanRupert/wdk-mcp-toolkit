'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { quoteBorrow } from '../../../src/tools/lending/quoteBorrow.js'
import { createMockServer } from '../../mocks/index.js'

describe('quoteBorrow', () => {
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
  })

  test('should not register tool if no lending chains available', () => {
    server.getLendingChains.mockReturnValue([])

    quoteBorrow(server)

    expect(server.registerTool).not.toHaveBeenCalled()
  })

  test('should register tool with name quoteBorrow', () => {
    quoteBorrow(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'quoteBorrow',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      quoteBorrow(server)
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

    test('should return structured content with protocol and chain info', async () => {
      const result = await handler({
        chain: 'ethereum',
        token: 'USDT',
        amount: '100'
      })

      expect(result.structuredContent.protocol).toBe('aave')
      expect(result.structuredContent.chain).toBe('ethereum')
      expect(result.structuredContent.token).toBe('USDT')
    })

    test('should return fee as string', async () => {
      const result = await handler({
        chain: 'ethereum',
        token: 'USDT',
        amount: '100'
      })

      expect(result.structuredContent.fee).toBe('21000000000000')
    })

    test('should return error with message on exception', async () => {
      mocks.wdk.getAccount.mockRejectedValue(new Error('Network error'))

      const result = await handler({
        chain: 'ethereum',
        token: 'USDT',
        amount: '100'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('Error quoting borrow: Network error')
    })
  })
})
