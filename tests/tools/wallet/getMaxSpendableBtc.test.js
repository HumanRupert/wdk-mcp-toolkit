'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { getMaxSpendableBtc } from '../../../src/tools/wallet/getMaxSpendableBtc.js'

describe('getMaxSpendableBtc', () => {
  let server, registerToolMock

  beforeEach(() => {
    registerToolMock = jest.fn()

    server = {
      registerTool: registerToolMock,
      wdk: {
        getAccount: jest.fn()
      }
    }
  })

  test('should register tool with name getMaxSpendableBtc', () => {
    getMaxSpendableBtc(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'getMaxSpendableBtc',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      getMaxSpendableBtc(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    describe('protocol interaction', () => {
      test('should call wdk.getAccount with bitcoin and index 0', async () => {
        const getMaxSpendableMock = jest.fn().mockResolvedValue({
          amount: 95000000n,
          fee: 5000n,
          changeValue: 0n
        })

        const accountMock = {
          getMaxSpendable: getMaxSpendableMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({})

        expect(server.wdk.getAccount).toHaveBeenCalledWith('bitcoin', 0)
      })

      test('should call getMaxSpendable on account', async () => {
        const getMaxSpendableMock = jest.fn().mockResolvedValue({
          amount: 95000000n,
          fee: 5000n,
          changeValue: 0n
        })

        const accountMock = {
          getMaxSpendable: getMaxSpendableMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({})

        expect(getMaxSpendableMock).toHaveBeenCalled()
      })
    })

    describe('result formatting', () => {
      test('should return amount as string', async () => {
        const getMaxSpendableMock = jest.fn().mockResolvedValue({
          amount: 95000000n,
          fee: 5000n,
          changeValue: 0n
        })

        const accountMock = {
          getMaxSpendable: getMaxSpendableMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({})

        expect(result.structuredContent.amount).toBe('95000000')
      })

      test('should return fee as string', async () => {
        const getMaxSpendableMock = jest.fn().mockResolvedValue({
          amount: 95000000n,
          fee: 5000n,
          changeValue: 0n
        })

        const accountMock = {
          getMaxSpendable: getMaxSpendableMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({})

        expect(result.structuredContent.fee).toBe('5000')
      })

      test('should return changeValue as string', async () => {
        const getMaxSpendableMock = jest.fn().mockResolvedValue({
          amount: 95000000n,
          fee: 5000n,
          changeValue: 1000n
        })

        const accountMock = {
          getMaxSpendable: getMaxSpendableMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({})

        expect(result.structuredContent.changeValue).toBe('1000')
      })
    })

    describe('error handling', () => {
      test('should return error with message on exception', async () => {
        server.wdk.getAccount.mockRejectedValue(new Error('Wallet not registered'))

        const result = await handler({})

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('Error getting max spendable: Wallet not registered')
      })
    })
  })
})
