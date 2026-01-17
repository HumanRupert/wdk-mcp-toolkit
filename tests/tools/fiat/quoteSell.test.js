'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { quoteSell } from '../../../src/tools/fiat/quoteSell.js'

describe('quoteSell', () => {
  let server, registerToolMock

  beforeEach(() => {
    registerToolMock = jest.fn()

    server = {
      registerTool: registerToolMock,
      getFiatChains: jest.fn().mockReturnValue(['ethereum']),
      getFiatProtocols: jest.fn().mockReturnValue(['moonpay']),
      wdk: {
        getAccount: jest.fn()
      }
    }
  })

  test('should not register tool if no fiat chains available', () => {
    server.getFiatChains.mockReturnValue([])

    quoteSell(server)

    expect(registerToolMock).not.toHaveBeenCalled()
  })

  test('should register tool with name quoteSell', () => {
    quoteSell(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'quoteSell',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      quoteSell(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    describe('validation', () => {
      test('should return error if no fiat protocol for chain', async () => {
        server.getFiatProtocols.mockReturnValue([])

        const result = await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          cryptoAmount: '1000000000000000000'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('No fiat protocol registered for ethereum.')
      })
    })

    describe('protocol interaction', () => {
      test('should call wdk.getAccount with chain and index 0', async () => {
        const quoteSellMock = jest.fn().mockResolvedValue({
          cryptoAmount: 1000000000000000000n,
          fiatAmount: 345000n,
          fee: 1725n,
          rate: '3500.00'
        })

        const accountMock = {
          getFiatProtocol: jest.fn().mockReturnValue({
            quoteSell: quoteSellMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          cryptoAmount: '1000000000000000000'
        })

        expect(server.wdk.getAccount).toHaveBeenCalledWith('ethereum', 0)
      })

      test('should call getFiatProtocol with first protocol label', async () => {
        const quoteSellMock = jest.fn().mockResolvedValue({
          cryptoAmount: 1000000000000000000n,
          fiatAmount: 345000n,
          fee: 1725n,
          rate: '3500.00'
        })

        const getFiatProtocolMock = jest.fn().mockReturnValue({
          quoteSell: quoteSellMock
        })

        const accountMock = {
          getFiatProtocol: getFiatProtocolMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          cryptoAmount: '1000000000000000000'
        })

        expect(getFiatProtocolMock).toHaveBeenCalledWith('moonpay')
      })

      test('should call quoteSell with options', async () => {
        const quoteSellMock = jest.fn().mockResolvedValue({
          cryptoAmount: 1000000000000000000n,
          fiatAmount: 345000n,
          fee: 1725n,
          rate: '3500.00'
        })

        const accountMock = {
          getFiatProtocol: jest.fn().mockReturnValue({
            quoteSell: quoteSellMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          cryptoAmount: '1000000000000000000'
        })

        expect(quoteSellMock).toHaveBeenCalledWith({
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          cryptoAmount: 1000000000000000000n
        })
      })
    })

    describe('result formatting', () => {
      test('should return quote in structured content', async () => {
        const quoteSellMock = jest.fn().mockResolvedValue({
          cryptoAmount: 1000000000000000000n,
          fiatAmount: 345000n,
          fee: 1725n,
          rate: '3500.00'
        })

        const accountMock = {
          getFiatProtocol: jest.fn().mockReturnValue({
            quoteSell: quoteSellMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          cryptoAmount: '1000000000000000000'
        })

        expect(result.structuredContent.protocol).toBe('moonpay')
        expect(result.structuredContent.cryptoAsset).toBe('eth')
        expect(result.structuredContent.fiatCurrency).toBe('USD')
        expect(result.structuredContent.cryptoAmount).toBe('1000000000000000000')
        expect(result.structuredContent.fiatAmount).toBe('345000')
        expect(result.structuredContent.fee).toBe('1725')
        expect(result.structuredContent.rate).toBe('3500.00')
      })

      test('should return text content with JSON', async () => {
        const quoteSellMock = jest.fn().mockResolvedValue({
          cryptoAmount: 1000000000000000000n,
          fiatAmount: 345000n,
          fee: 1725n,
          rate: '3500.00'
        })

        const accountMock = {
          getFiatProtocol: jest.fn().mockReturnValue({
            quoteSell: quoteSellMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          cryptoAmount: '1000000000000000000'
        })

        expect(result.content[0].type).toBe('text')
        expect(result.content[0].text).toContain('moonpay')
      })
    })

    describe('error handling', () => {
      test('should return error with message on exception', async () => {
        server.wdk.getAccount.mockRejectedValue(new Error('Network error'))

        const result = await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          cryptoAmount: '1000000000000000000'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('Error quoting sell: Network error')
      })
    })
  })
})
