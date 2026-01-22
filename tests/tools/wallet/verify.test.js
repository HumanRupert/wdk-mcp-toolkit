'use strict'

import { beforeEach, describe, expect, test } from '@jest/globals'

import { verify } from '../../../src/tools/wallet/verify.js'
import { createMockServer } from '../../mocks/index.js'

describe('verify', () => {
  let server, mocks

  beforeEach(() => {
    const result = createMockServer({ chains: ['bitcoin', 'ethereum'] })
    server = result.server
    mocks = result.mocks
  })

  test('should register tool with name verify', () => {
    verify(server)

    expect(server.registerTool).toHaveBeenCalledWith(
      'verify',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      verify(server)
      handler = server.registerTool.mock.calls[0][2]
    })

    test('should return complete response when signature is valid', async () => {
      const result = await handler({
        chain: 'ethereum',
        message: 'Hello World',
        signature: '0xsignature123'
      })

      expect(result.isError).toBeUndefined()
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toBe('Signature is valid: true')
      expect(result.structuredContent).toEqual({ valid: true })
    })

    test('should return complete response when signature is invalid', async () => {
      mocks.account.verify.mockResolvedValue(false)

      const result = await handler({
        chain: 'ethereum',
        message: 'Hello World',
        signature: '0xinvalidsig'
      })

      expect(result.isError).toBeUndefined()
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toBe('Signature is valid: false')
      expect(result.structuredContent).toEqual({ valid: false })
    })

    test('should return error with message on exception', async () => {
      mocks.wdk.getAccount.mockRejectedValue(new Error('Wallet not available'))

      const result = await handler({
        chain: 'ethereum',
        message: 'Hello World',
        signature: '0xsignature123'
      })

      expect(result.isError).toBe(true)
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toBe('Error verifying signature on ethereum: Wallet not available')
      expect(result.structuredContent).toBeUndefined()
    })
  })
})
