'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { getSupportedCryptoAssets } from '../../../src/tools/fiat/getSupportedCryptoAssets.js'
import { createMockServer } from '../../mocks/index.js'

describe('getSupportedCryptoAssets', () => {
  let server, mocks

  beforeEach(() => {
    const result = createMockServer({
      chains: ['ethereum'],
      fiatChains: ['ethereum']
    })
    server = result.server
    mocks = result.mocks
  })

  test('should not register tool if no fiat chains available', () => {
    server.getFiatChains.mockReturnValue([])

    getSupportedCryptoAssets(server)

    expect(server.registerTool).not.toHaveBeenCalled()
  })

  test('should register tool with name getSupportedCryptoAssets', () => {
    getSupportedCryptoAssets(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'getSupportedCryptoAssets',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      getSupportedCryptoAssets(server)
      handler = server.registerTool.mock.calls[0][2]
    })

    test('should return error if no fiat protocol for chain', async () => {
      server.getFiatProtocols.mockReturnValue([])

      const result = await handler({ chain: 'ethereum' })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('No fiat protocol registered for ethereum.')
    })

    test('should return assets array in structured content', async () => {
      const result = await handler({ chain: 'ethereum' })

      expect(result.structuredContent).toEqual([
        { code: 'eth', name: 'Ethereum', networkCode: 'ethereum', decimals: 18 },
        { code: 'usdt', name: 'Tether', networkCode: 'ethereum', decimals: 6 }
      ])
    })

    test('should return text content with asset codes', async () => {
      const result = await handler({ chain: 'ethereum' })

      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toContain('eth')
    })

    test('should return error with message on exception', async () => {
      mocks.wdk.getAccount.mockRejectedValue(new Error('Network error'))

      const result = await handler({ chain: 'ethereum' })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toBe('Error getting supported crypto assets: Network error')
    })
  })
})
