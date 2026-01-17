'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { buy } from '../../../src/tools/fiat/buy.js'

describe('buy', () => {
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

    buy(server)

    expect(registerToolMock).not.toHaveBeenCalled()
  })

  test('should register tool with name buy', () => {
    buy(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'buy',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      buy(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    describe('validation', () => {
      test('should return error if no fiat protocol for chain', async () => {
        server.getFiatProtocols.mockReturnValue([])

        const result = await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          amount: '100',
          amountType: 'fiat'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('No fiat protocol registered for ethereum.')
      })
    })

    describe('protocol interaction', () => {
      test('should call wdk.getAccount with chain and index 0', async () => {
        const buyMock = jest.fn().mockResolvedValue({
          buyUrl: 'https://buy.moonpay.com/abc123'
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getFiatProtocol: jest.fn().mockReturnValue({
            buy: buyMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          amount: '100',
          amountType: 'fiat'
        })

        expect(server.wdk.getAccount).toHaveBeenCalledWith('ethereum', 0)
      })

      test('should call getFiatProtocol with first protocol label', async () => {
        const buyMock = jest.fn().mockResolvedValue({
          buyUrl: 'https://buy.moonpay.com/abc123'
        })

        const getFiatProtocolMock = jest.fn().mockReturnValue({
          buy: buyMock
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getFiatProtocol: getFiatProtocolMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          amount: '100',
          amountType: 'fiat'
        })

        expect(getFiatProtocolMock).toHaveBeenCalledWith('moonpay')
      })

      test('should call buy with fiatAmount when amountType is fiat', async () => {
        const buyMock = jest.fn().mockResolvedValue({
          buyUrl: 'https://buy.moonpay.com/abc123'
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getFiatProtocol: jest.fn().mockReturnValue({
            buy: buyMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          amount: '10000',
          amountType: 'fiat'
        })

        expect(buyMock).toHaveBeenCalledWith({
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          fiatAmount: 10000n,
          recipient: '0x123'
        })
      })

      test('should call buy with cryptoAmount when amountType is crypto', async () => {
        const buyMock = jest.fn().mockResolvedValue({
          buyUrl: 'https://buy.moonpay.com/abc123'
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getFiatProtocol: jest.fn().mockReturnValue({
            buy: buyMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          amount: '1000000000000000000',
          amountType: 'crypto'
        })

        expect(buyMock).toHaveBeenCalledWith({
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          cryptoAmount: 1000000000000000000n,
          recipient: '0x123'
        })
      })

      test('should use provided recipient if given', async () => {
        const buyMock = jest.fn().mockResolvedValue({
          buyUrl: 'https://buy.moonpay.com/abc123'
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getFiatProtocol: jest.fn().mockReturnValue({
            buy: buyMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          amount: '100',
          amountType: 'fiat',
          recipient: '0x456'
        })

        expect(buyMock).toHaveBeenCalledWith(
          expect.objectContaining({
            recipient: '0x456'
          })
        )
      })
    })

    describe('result formatting', () => {
      test('should return buyUrl on success', async () => {
        const buyMock = jest.fn().mockResolvedValue({
          buyUrl: 'https://buy.moonpay.com/abc123'
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getFiatProtocol: jest.fn().mockReturnValue({
            buy: buyMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          amount: '100',
          amountType: 'fiat'
        })

        expect(result.structuredContent.buyUrl).toBe('https://buy.moonpay.com/abc123')
        expect(result.structuredContent.protocol).toBe('moonpay')
      })

      test('should return text with URL', async () => {
        const buyMock = jest.fn().mockResolvedValue({
          buyUrl: 'https://buy.moonpay.com/abc123'
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getFiatProtocol: jest.fn().mockReturnValue({
            buy: buyMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          amount: '100',
          amountType: 'fiat'
        })

        expect(result.content[0].text).toContain('https://buy.moonpay.com/abc123')
      })
    })

    describe('error handling', () => {
      test('should return error with message on exception', async () => {
        server.wdk.getAccount.mockRejectedValue(new Error('Network error'))

        const result = await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          amount: '100',
          amountType: 'fiat'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('Error generating buy URL: Network error')
      })
    })
  })
})
