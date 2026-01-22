'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { getBalance } from '../../../src/tools/wallet/getBalance.js'
import { createMockServer } from '../../mocks/index.js'

describe('getBalance', () => {
  let server, mocks

  beforeEach(() => {
    const result = createMockServer({ chains: ['ethereum', 'bitcoin'] })
    server = result.server
    mocks = result.mocks
  })

  test('should register tool with name getBalance', () => {
    getBalance(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'getBalance',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      getBalance(server)
      handler = server.registerTool.mock.calls[0][2]
    })

    test('should return balance with wei unit for ethereum', async () => {
      const result = await handler({ chain: 'ethereum' })

      expect(result.content[0].text).toBe('Balance: 1000000000000000000 wei')
    })

    test('should return balance with satoshis unit for bitcoin', async () => {
      mocks.account.getBalance.mockResolvedValue(100000000n)

      const result = await handler({ chain: 'bitcoin' })

      expect(result.content[0].text).toBe('Balance: 100000000 satoshis')
    })

    test('should return balance with base units for other chains', async () => {
      server.getChains.mockReturnValue(['polygon'])
      getBalance(server)
      handler = server.registerTool.mock.calls[1][2]

      mocks.account.getBalance.mockResolvedValue(1000000n)

      const result = await handler({ chain: 'polygon' })

      expect(result.content[0].text).toBe('Balance: 1000000 base units')
    })

    test('should return balance as string in structured content', async () => {
      const result = await handler({ chain: 'ethereum' })

      expect(result.structuredContent.balance).toBe('1000000000000000000')
    })

    test('should return error with message on exception', async () => {
      mocks.wdk.getAccount.mockRejectedValue(new Error('Provider not connected'))

      const result = await handler({ chain: 'ethereum' })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('Error getting balance on ethereum: Provider not connected')
    })
  })
})
