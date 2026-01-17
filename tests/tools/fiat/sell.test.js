'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { sell } from '../../../src/tools/fiat/sell.js'

describe('sell', () => {
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

    sell(server)

    expect(registerToolMock).not.toHaveBeenCalled()
  })

  test('should register tool with name sell', () => {
    sell(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'sell',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      sell(server)
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
        const sellMock = jest.fn().mockResolvedValue({
          sellUrl: 'https://sell.moonpay.com/abc123'
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getFiatProtocol: jest.fn().mockReturnValue({
            sell: sellMock
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
        const sellMock = jest.fn().mockResolvedValue({
          sellUrl: 'https://sell.moonpay.com/abc123'
        })

        const getFiatProtocolMock = jest.fn().mockReturnValue({
          sell: sellMock
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
          cryptoAmount: '1000000000000000000'
        })

        expect(getFiatProtocolMock).toHaveBeenCalledWith('moonpay')
      })

      test('should call sell with options', async () => {
        const sellMock = jest.fn().mockResolvedValue({
          sellUrl: 'https://sell.moonpay.com/abc123'
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getFiatProtocol: jest.fn().mockReturnValue({
            sell: sellMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          cryptoAmount: '1000000000000000000'
        })

        expect(sellMock).toHaveBeenCalledWith({
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          cryptoAmount: 1000000000000000000n,
          refundAddress: '0x123'
        })
      })

      test('should use provided refundAddress if given', async () => {
        const sellMock = jest.fn().mockResolvedValue({
          sellUrl: 'https://sell.moonpay.com/abc123'
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getFiatProtocol: jest.fn().mockReturnValue({
            sell: sellMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          cryptoAmount: '1000000000000000000',
          refundAddress: '0x456'
        })

        expect(sellMock).toHaveBeenCalledWith(
          expect.objectContaining({
            refundAddress: '0x456'
          })
        )
      })
    })

    describe('result formatting', () => {
      test('should return sellUrl on success', async () => {
        const sellMock = jest.fn().mockResolvedValue({
          sellUrl: 'https://sell.moonpay.com/abc123'
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getFiatProtocol: jest.fn().mockReturnValue({
            sell: sellMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          cryptoAmount: '1000000000000000000'
        })

        expect(result.structuredContent.sellUrl).toBe('https://sell.moonpay.com/abc123')
        expect(result.structuredContent.protocol).toBe('moonpay')
      })

      test('should return text with URL', async () => {
        const sellMock = jest.fn().mockResolvedValue({
          sellUrl: 'https://sell.moonpay.com/abc123'
        })

        const accountMock = {
          getAddress: jest.fn().mockResolvedValue('0x123'),
          getFiatProtocol: jest.fn().mockReturnValue({
            sell: sellMock
          })
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          cryptoAsset: 'eth',
          fiatCurrency: 'USD',
          cryptoAmount: '1000000000000000000'
        })

        expect(result.content[0].text).toContain('https://sell.moonpay.com/abc123')
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
        expect(result.content[0].text).toBe('Error generating sell URL: Network error')
      })
    })
  })
})
