'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { getFeeRates } from '../../../src/tools/wallet/getFeeRates.js'

describe('getFeeRates', () => {
  let server, registerToolMock

  beforeEach(() => {
    registerToolMock = jest.fn()

    server = {
      registerTool: registerToolMock,
      getChains: jest.fn().mockReturnValue(['bitcoin', 'ethereum']),
      wdk: {
        getFeeRates: jest.fn()
      }
    }
  })

  test('should register tool with name getFeeRates', () => {
    getFeeRates(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'getFeeRates',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      getFeeRates(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    describe('protocol interaction', () => {
      test('should call wdk.getFeeRates with chain', async () => {
        server.wdk.getFeeRates.mockResolvedValue({
          normal: 10000n,
          fast: 20000n
        })

        await handler({ chain: 'bitcoin' })

        expect(server.wdk.getFeeRates).toHaveBeenCalledWith('bitcoin')
      })
    })

    describe('result formatting', () => {
      test('should return fee rates with bigint converted to string', async () => {
        server.wdk.getFeeRates.mockResolvedValue({
          normal: 10000n,
          fast: 20000n
        })

        const result = await handler({ chain: 'bitcoin' })

        expect(result.structuredContent.normal).toBe('10000')
        expect(result.structuredContent.fast).toBe('20000')
      })

      test('should return text content with JSON', async () => {
        server.wdk.getFeeRates.mockResolvedValue({
          normal: 10000n,
          fast: 20000n
        })

        const result = await handler({ chain: 'bitcoin' })

        expect(result.content[0].type).toBe('text')
        expect(result.content[0].text).toContain('10000')
      })
    })

    describe('error handling', () => {
      test('should return error with message on exception', async () => {
        server.wdk.getFeeRates.mockRejectedValue(new Error('Network error'))

        const result = await handler({ chain: 'bitcoin' })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('Error getting fee rates on bitcoin: Network error')
      })
    })
  })
})
