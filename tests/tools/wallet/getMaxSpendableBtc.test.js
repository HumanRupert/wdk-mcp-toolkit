'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { getMaxSpendableBtc } from '../../../src/tools/wallet/getMaxSpendableBtc.js'
import { createMockServer } from '../../mocks/index.js'

describe('getMaxSpendableBtc', () => {
  let server, mocks

  beforeEach(() => {
    const result = createMockServer()
    server = result.server
    mocks = result.mocks
  })

  test('should register tool with name getMaxSpendableBtc', () => {
    getMaxSpendableBtc(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'getMaxSpendableBtc',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      getMaxSpendableBtc(server)
      handler = server.registerTool.mock.calls[0][2]
    })

    test('should return complete response with all values as strings', async () => {
      const result = await handler({})

      expect(result.isError).toBeUndefined()
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.structuredContent).toEqual({
        amount: '95000000',
        fee: '5000',
        changeValue: '1000'
      })
    })

    test('should return error with message on exception', async () => {
      mocks.wdk.getAccount.mockRejectedValue(new Error('Wallet not registered'))

      const result = await handler({})

      expect(result.isError).toBe(true)
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toBe('Error getting max spendable: Wallet not registered')
      expect(result.structuredContent).toBeUndefined()
    })
  })
})
