'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { getAddress } from '../../../src/tools/wallet/getAddress.js'
import { createMockServer } from '../../mocks/index.js'

describe('getAddress', () => {
  let server, mocks

  beforeEach(() => {
    const result = createMockServer({ chains: ['ethereum', 'bitcoin'] })
    server = result.server
    mocks = result.mocks
  })

  test('should register tool with name getAddress', () => {
    getAddress(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'getAddress',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      getAddress(server)
      handler = server.registerTool.mock.calls[0][2]
    })

    test('should return address in text content', async () => {
      const result = await handler({ chain: 'ethereum' })

      expect(result.content[0].text).toBe('Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7')
    })

    test('should return address in structured content', async () => {
      const result = await handler({ chain: 'ethereum' })

      expect(result.structuredContent.address).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7')
    })

    test('should return error with message on exception', async () => {
      mocks.wdk.getAccount.mockRejectedValue(new Error('Wallet not found'))

      const result = await handler({ chain: 'ethereum' })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('Error getting address on ethereum: Wallet not found')
    })
  })
})
