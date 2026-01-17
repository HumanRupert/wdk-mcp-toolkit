'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { getTokenBalance } from '../../../src/tools/wallet/getTokenBalance.js'

describe('getTokenBalance', () => {
  let server, registerToolMock

  beforeEach(() => {
    registerToolMock = jest.fn()

    server = {
      registerTool: registerToolMock,
      getChains: jest.fn().mockReturnValue(['ethereum']),
      getTokenInfo: jest.fn(),
      getRegisteredTokens: jest.fn(),
      wdk: {
        getAccount: jest.fn()
      }
    }
  })

  test('should register tool with name getTokenBalance', () => {
    getTokenBalance(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'getTokenBalance',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    const USDT_INFO = { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 }

    beforeEach(() => {
      getTokenBalance(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    describe('validation', () => {
      test('should return error if token not registered', async () => {
        server.getTokenInfo.mockReturnValue(undefined)
        server.getRegisteredTokens.mockReturnValue(['USDC', 'DAI'])

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toContain('Token symbol "USDT" not registered')
        expect(result.content[0].text).toContain('USDC, DAI')
      })

      test('should return error if no tokens available', async () => {
        server.getTokenInfo.mockReturnValue(undefined)
        server.getRegisteredTokens.mockReturnValue([])

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toContain('Available tokens: none')
      })
    })

    describe('protocol interaction', () => {
      test('should call wdk.getAccount with chain and index 0', async () => {
        const getTokenBalanceMock = jest.fn().mockResolvedValue(94428840n)

        const accountMock = {
          getTokenBalance: getTokenBalanceMock
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          token: 'USDT'
        })

        expect(server.wdk.getAccount).toHaveBeenCalledWith('ethereum', 0)
      })

      test('should call getTokenBalance with token address', async () => {
        const getTokenBalanceMock = jest.fn().mockResolvedValue(94428840n)

        const accountMock = {
          getTokenBalance: getTokenBalanceMock
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          token: 'USDT'
        })

        expect(getTokenBalanceMock).toHaveBeenCalledWith(USDT_INFO.address)
      })

      test('should uppercase token symbol', async () => {
        const getTokenBalanceMock = jest.fn().mockResolvedValue(94428840n)

        const accountMock = {
          getTokenBalance: getTokenBalanceMock
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          token: 'usdt'
        })

        expect(server.getTokenInfo).toHaveBeenCalledWith('ethereum', 'USDT')
      })
    })

    describe('result formatting', () => {
      test('should convert balance to human readable format', async () => {
        const getTokenBalanceMock = jest.fn().mockResolvedValue(94428840n)

        const accountMock = {
          getTokenBalance: getTokenBalanceMock
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT'
        })

        expect(result.structuredContent.balance).toBe('94.42884')
      })

      test('should return raw balance as string', async () => {
        const getTokenBalanceMock = jest.fn().mockResolvedValue(94428840n)

        const accountMock = {
          getTokenBalance: getTokenBalanceMock
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT'
        })

        expect(result.structuredContent.balanceRaw).toBe('94428840')
      })

      test('should return formatted text content', async () => {
        const getTokenBalanceMock = jest.fn().mockResolvedValue(94428840n)

        const accountMock = {
          getTokenBalance: getTokenBalanceMock
        }

        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT'
        })

        expect(result.content[0].text).toBe('Balance: 94.42884 USDT (94428840 base units)')
      })
    })

    describe('error handling', () => {
      test('should return error with message on exception', async () => {
        server.getTokenInfo.mockReturnValue(USDT_INFO)
        server.wdk.getAccount.mockRejectedValue(new Error('Network error'))

        const result = await handler({
          chain: 'ethereum',
          token: 'USDT'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('Error getting token balance on ethereum: Network error')
      })
    })
  })
})
