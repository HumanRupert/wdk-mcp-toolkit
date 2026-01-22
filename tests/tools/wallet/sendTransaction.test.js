'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { sendTransaction } from '../../../src/tools/wallet/sendTransaction.js'
import { createMockServer } from '../../mocks/index.js'

describe('sendTransaction', () => {
  let server, mocks

  const RECIPIENT = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'

  beforeEach(() => {
    const result = createMockServer({ chains: ['bitcoin', 'ethereum'] })
    server = result.server
    mocks = result.mocks
    mocks.account.quoteSendTransaction.mockResolvedValue({ fee: 5000n })
    mocks.account.sendTransaction.mockResolvedValue({ hash: '0xabc123', fee: 5000n })
  })

  test('should register tool with name sendTransaction', () => {
    sendTransaction(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'sendTransaction',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      sendTransaction(server)
      handler = server.registerTool.mock.calls[0][2]
    })

    test('should return error if value is zero', async () => {
      const result = await handler({
        chain: 'bitcoin',
        to: RECIPIENT,
        value: '0'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('Amount must be greater than zero')
      expect(result.structuredContent).toBeUndefined()
    })

    test('should return error if value is negative', async () => {
      const result = await handler({
        chain: 'bitcoin',
        to: RECIPIENT,
        value: '-100'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('Amount must be greater than zero')
      expect(result.structuredContent).toBeUndefined()
    })

    test('should return cancelled message if user declines', async () => {
      server.server.elicitInput.mockResolvedValue({ action: 'reject' })

      const result = await handler({
        chain: 'bitcoin',
        to: RECIPIENT,
        value: '100000'
      })

      expect(result.content[0].text).toBe('Transaction cancelled by user. No funds were spent.')
      expect(result.structuredContent).toBeUndefined()
    })

    test('should return complete response on success', async () => {
      const result = await handler({
        chain: 'bitcoin',
        to: RECIPIENT,
        value: '100000'
      })

      expect(result.isError).toBeUndefined()
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.structuredContent).toEqual({
        hash: '0xabc123',
        fee: '5000'
      })
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
      expect(result.content[0].text).toBe('Error sending transaction on bitcoin: Network error')
      expect(result.structuredContent).toBeUndefined()
    })
  })
})
