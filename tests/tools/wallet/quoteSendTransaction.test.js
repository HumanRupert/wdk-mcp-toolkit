'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { quoteSendTransaction } from '../../../src/tools/wallet/quoteSendTransaction.js'
import { createMockServer } from '../../mocks/index.js'

describe('quoteSendTransaction', () => {
  let server, mocks

  const RECIPIENT = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'

  beforeEach(() => {
    const result = createMockServer({ chains: ['bitcoin', 'ethereum'] })
    server = result.server
    mocks = result.mocks
    mocks.account.quoteSendTransaction.mockResolvedValue({ fee: 5000n })
  })

  test('should register tool with name quoteSendTransaction', () => {
    quoteSendTransaction(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'quoteSendTransaction',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      quoteSendTransaction(server)
      handler = server.registerTool.mock.calls[0][2]
    })

    test('should return complete response with fee as string', async () => {
      const result = await handler({
        chain: 'bitcoin',
        to: RECIPIENT,
        value: '100000'
      })

      expect(result.isError).toBeUndefined()
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.structuredContent).toEqual({ fee: '5000' })
    })

    test('should return error with message on exception', async () => {
      mocks.wdk.getAccount.mockRejectedValue(new Error('Network error'))

      const result = await handler({
        chain: 'bitcoin',
        to: RECIPIENT,
        value: '100000'
      })

      expect(result.isError).toBe(true)
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toBe('Error quoting transaction on bitcoin: Network error')
      expect(result.structuredContent).toBeUndefined()
    })
  })
})
