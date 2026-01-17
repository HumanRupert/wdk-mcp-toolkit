'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { quoteSendTransaction } from '../../../src/tools/wallet/quoteSendTransaction.js'

describe('quoteSendTransaction', () => {
  let server, registerToolMock

  beforeEach(() => {
    registerToolMock = jest.fn()

    server = {
      registerTool: registerToolMock,
      getChains: jest.fn().mockReturnValue(['bitcoin', 'ethereum']),
      wdk: {
        getAccount: jest.fn()
      }
    }
  })

  test('should register tool with name quoteSendTransaction', () => {
    quoteSendTransaction(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'quoteSendTransaction',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      quoteSendTransaction(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    describe('protocol interaction', () => {
      test('should call wdk.getAccount with chain and index 0', async () => {
        const quoteSendTransactionMock = jest.fn().mockResolvedValue({
          fee: 5000n
        })

        const accountMock = {
          quoteSendTransaction: quoteSendTransactionMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '100000'
        })

        expect(server.wdk.getAccount).toHaveBeenCalledWith('bitcoin', 0)
      })

      test('should call quoteSendTransaction with to and value', async () => {
        const quoteSendTransactionMock = jest.fn().mockResolvedValue({
          fee: 5000n
        })

        const accountMock = {
          quoteSendTransaction: quoteSendTransactionMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '100000'
        })

        expect(quoteSendTransactionMock).toHaveBeenCalledWith({
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: 100000n
        })
      })

      test('should convert value to BigInt', async () => {
        const quoteSendTransactionMock = jest.fn().mockResolvedValue({
          fee: 5000n
        })

        const accountMock = {
          quoteSendTransaction: quoteSendTransactionMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
          value: '1000000000000000000'
        })

        expect(quoteSendTransactionMock).toHaveBeenCalledWith({
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
          value: 1000000000000000000n
        })
      })
    })

    describe('result formatting', () => {
      test('should return fee as string', async () => {
        const quoteSendTransactionMock = jest.fn().mockResolvedValue({
          fee: 5000n
        })

        const accountMock = {
          quoteSendTransaction: quoteSendTransactionMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '100000'
        })

        expect(result.structuredContent.fee).toBe('5000')
      })

      test('should return text content with JSON', async () => {
        const quoteSendTransactionMock = jest.fn().mockResolvedValue({
          fee: 5000n
        })

        const accountMock = {
          quoteSendTransaction: quoteSendTransactionMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '100000'
        })

        expect(result.content[0].type).toBe('text')
        expect(result.content[0].text).toContain('5000')
      })
    })

    describe('error handling', () => {
      test('should return error with message on exception', async () => {
        server.wdk.getAccount.mockRejectedValue(new Error('Network error'))

        const result = await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '100000'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('Error quoting transaction on bitcoin: Network error')
      })
    })
  })
})
