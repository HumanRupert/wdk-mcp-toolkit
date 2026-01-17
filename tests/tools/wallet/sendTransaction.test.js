'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { sendTransaction } from '../../../src/tools/wallet/sendTransaction.js'

describe('sendTransaction', () => {
  let server, registerToolMock

  beforeEach(() => {
    registerToolMock = jest.fn()

    server = {
      registerTool: registerToolMock,
      getChains: jest.fn().mockReturnValue(['bitcoin', 'ethereum']),
      wdk: {
        getAccount: jest.fn()
      },
      server: {
        elicitInput: jest.fn()
      }
    }
  })

  test('should register tool with name sendTransaction', () => {
    sendTransaction(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'sendTransaction',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      sendTransaction(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    describe('validation', () => {
      test('should return error if value is zero', async () => {
        const result = await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '0'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toContain('Amount must be greater than zero')
      })

      test('should return error if value is negative', async () => {
        const result = await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '-100'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toContain('Amount must be greater than zero')
      })
    })

    describe('protocol interaction', () => {
      test('should call wdk.getAccount with chain and index 0', async () => {
        const quoteSendTransactionMock = jest.fn().mockResolvedValue({ fee: 5000n })
        const sendTransactionMock = jest.fn().mockResolvedValue({ hash: '0xabc', fee: 5000n })

        const accountMock = {
          quoteSendTransaction: quoteSendTransactionMock,
          sendTransaction: sendTransactionMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.server.elicitInput.mockResolvedValue({ action: 'accept', content: { confirmed: true } })

        await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '100000'
        })

        expect(server.wdk.getAccount).toHaveBeenCalledWith('bitcoin', 0)
      })

      test('should call quoteSendTransaction before sending', async () => {
        const quoteSendTransactionMock = jest.fn().mockResolvedValue({ fee: 5000n })
        const sendTransactionMock = jest.fn().mockResolvedValue({ hash: '0xabc', fee: 5000n })

        const accountMock = {
          quoteSendTransaction: quoteSendTransactionMock,
          sendTransaction: sendTransactionMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.server.elicitInput.mockResolvedValue({ action: 'accept', content: { confirmed: true } })

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

      test('should call sendTransaction with to and value', async () => {
        const quoteSendTransactionMock = jest.fn().mockResolvedValue({ fee: 5000n })
        const sendTransactionMock = jest.fn().mockResolvedValue({ hash: '0xabc', fee: 5000n })

        const accountMock = {
          quoteSendTransaction: quoteSendTransactionMock,
          sendTransaction: sendTransactionMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.server.elicitInput.mockResolvedValue({ action: 'accept', content: { confirmed: true } })

        await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '100000'
        })

        expect(sendTransactionMock).toHaveBeenCalledWith({
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: 100000n
        })
      })
    })

    describe('confirmation flow', () => {
      test('should call elicitInput for confirmation', async () => {
        const quoteSendTransactionMock = jest.fn().mockResolvedValue({ fee: 5000n })
        const sendTransactionMock = jest.fn().mockResolvedValue({ hash: '0xabc', fee: 5000n })

        const accountMock = {
          quoteSendTransaction: quoteSendTransactionMock,
          sendTransaction: sendTransactionMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.server.elicitInput.mockResolvedValue({ action: 'accept', content: { confirmed: true } })

        await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '100000'
        })

        expect(server.server.elicitInput).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('TRANSACTION CONFIRMATION')
          })
        )
      })

      test('should return cancelled message if user declines', async () => {
        const quoteSendTransactionMock = jest.fn().mockResolvedValue({ fee: 5000n })

        const accountMock = {
          quoteSendTransaction: quoteSendTransactionMock,
          sendTransaction: jest.fn()
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.server.elicitInput.mockResolvedValue({ action: 'reject' })

        const result = await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '100000'
        })

        expect(result.content[0].text).toBe('Transaction cancelled by user. No funds were spent.')
      })

      test('should not call sendTransaction if user declines', async () => {
        const quoteSendTransactionMock = jest.fn().mockResolvedValue({ fee: 5000n })
        const sendTransactionMock = jest.fn()

        const accountMock = {
          quoteSendTransaction: quoteSendTransactionMock,
          sendTransaction: sendTransactionMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.server.elicitInput.mockResolvedValue({ action: 'reject' })

        await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '100000'
        })

        expect(sendTransactionMock).not.toHaveBeenCalled()
      })
    })

    describe('result formatting', () => {
      test('should return hash on success', async () => {
        const quoteSendTransactionMock = jest.fn().mockResolvedValue({ fee: 5000n })
        const sendTransactionMock = jest.fn().mockResolvedValue({ hash: '0xabc123', fee: 5000n })

        const accountMock = {
          quoteSendTransaction: quoteSendTransactionMock,
          sendTransaction: sendTransactionMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.server.elicitInput.mockResolvedValue({ action: 'accept', content: { confirmed: true } })

        const result = await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '100000'
        })

        expect(result.structuredContent.hash).toBe('0xabc123')
      })

      test('should return fee as string', async () => {
        const quoteSendTransactionMock = jest.fn().mockResolvedValue({ fee: 5000n })
        const sendTransactionMock = jest.fn().mockResolvedValue({ hash: '0xabc', fee: 5000n })

        const accountMock = {
          quoteSendTransaction: quoteSendTransactionMock,
          sendTransaction: sendTransactionMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)
        server.server.elicitInput.mockResolvedValue({ action: 'accept', content: { confirmed: true } })

        const result = await handler({
          chain: 'bitcoin',
          to: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          value: '100000'
        })

        expect(result.structuredContent.fee).toBe('5000')
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
        expect(result.content[0].text).toBe('Error sending transaction on bitcoin: Network error')
      })
    })
  })
})
