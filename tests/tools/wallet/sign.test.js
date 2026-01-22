'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { sign } from '../../../src/tools/wallet/sign.js'
import { createMockServer } from '../../mocks/index.js'

describe('sign', () => {
  let server, mocks

  beforeEach(() => {
    const result = createMockServer({ chains: ['bitcoin', 'ethereum'] })
    server = result.server
    mocks = result.mocks
  })

  test('should register tool with name sign', () => {
    sign(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'sign',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      sign(server)
      handler = server.registerTool.mock.calls[0][2]
    })

    test('should return error if message is empty', async () => {
      const result = await handler({ chain: 'ethereum', message: '' })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('Message cannot be empty')
      expect(result.structuredContent).toBeUndefined()
    })

    test('should return error if message is whitespace', async () => {
      const result = await handler({ chain: 'ethereum', message: '   ' })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('Message cannot be empty')
      expect(result.structuredContent).toBeUndefined()
    })

    test('should return complete response with signature', async () => {
      const result = await handler({ chain: 'ethereum', message: 'Hello World' })

      expect(result.isError).toBeUndefined()
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toBe('Message signed. Signature: 0xsignature123abc')
      expect(result.structuredContent).toEqual({ signature: '0xsignature123abc' })
    })

    test('should return error with message on exception', async () => {
      mocks.wdk.getAccount.mockRejectedValue(new Error('Wallet not available'))

      const result = await handler({ chain: 'ethereum', message: 'Hello World' })

      expect(result.isError).toBe(true)
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toBe('Error signing message on ethereum: Wallet not available')
      expect(result.structuredContent).toBeUndefined()
    })
  })
})
