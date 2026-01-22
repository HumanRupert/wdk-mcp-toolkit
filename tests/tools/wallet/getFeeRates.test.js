'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { getFeeRates } from '../../../src/tools/wallet/getFeeRates.js'
import { createMockServer } from '../../mocks/index.js'

describe('getFeeRates', () => {
  let server, mocks

  beforeEach(() => {
    const result = createMockServer({ chains: ['bitcoin', 'ethereum'] })
    server = result.server
    mocks = result.mocks
  })

  test('should register tool with name getFeeRates', () => {
    getFeeRates(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'getFeeRates',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      getFeeRates(server)
      handler = server.registerTool.mock.calls[0][2]
    })

    test('should return complete response with fee rates as strings', async () => {
      const result = await handler({ chain: 'bitcoin' })

      expect(result.isError).toBeUndefined()
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.structuredContent).toEqual({
        normal: '10000',
        fast: '20000'
      })
    })

    test('should return error with message on exception', async () => {
      mocks.wdk.getFeeRates.mockRejectedValue(new Error('Network error'))

      const result = await handler({ chain: 'bitcoin' })

      expect(result.isError).toBe(true)
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toBe('Error getting fee rates on bitcoin: Network error')
      expect(result.structuredContent).toBeUndefined()
    })
  })
})
