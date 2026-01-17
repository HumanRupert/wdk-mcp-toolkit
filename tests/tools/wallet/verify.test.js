'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { verify } from '../../../src/tools/wallet/verify.js'

describe('verify', () => {
  let server, registerToolMock

  beforeEach(() => {
    registerToolMock = jest.fn()

    server = {
      registerTool: registerToolMock,
      getChains: jest.fn().mockReturnValue(['bitcoin', 'ethereum']),
      wdk: {
        getAccount: jest.fn()
      }
    }
  })

  test('should register tool with name verify', () => {
    verify(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'verify',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      verify(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    describe('protocol interaction', () => {
      test('should call wdk.getAccount with chain and index 0', async () => {
        const verifyMock = jest.fn().mockResolvedValue(true)

        const accountMock = {
          verify: verifyMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          message: 'Hello World',
          signature: '0xsignature123'
        })

        expect(server.wdk.getAccount).toHaveBeenCalledWith('ethereum', 0)
      })

      test('should call verify with message and signature', async () => {
        const verifyMock = jest.fn().mockResolvedValue(true)

        const accountMock = {
          verify: verifyMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          message: 'Hello World',
          signature: '0xsignature123'
        })

        expect(verifyMock).toHaveBeenCalledWith('Hello World', '0xsignature123')
      })
    })

    describe('result formatting', () => {
      test('should return valid true when signature is valid', async () => {
        const verifyMock = jest.fn().mockResolvedValue(true)

        const accountMock = {
          verify: verifyMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          message: 'Hello World',
          signature: '0xsignature123'
        })

        expect(result.structuredContent.valid).toBe(true)
      })

      test('should return valid false when signature is invalid', async () => {
        const verifyMock = jest.fn().mockResolvedValue(false)

        const accountMock = {
          verify: verifyMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          message: 'Hello World',
          signature: '0xinvalidsig'
        })

        expect(result.structuredContent.valid).toBe(false)
      })

      test('should return text content for valid signature', async () => {
        const verifyMock = jest.fn().mockResolvedValue(true)

        const accountMock = {
          verify: verifyMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          message: 'Hello World',
          signature: '0xsignature123'
        })

        expect(result.content[0].text).toBe('Signature is valid: true')
      })

      test('should return text content for invalid signature', async () => {
        const verifyMock = jest.fn().mockResolvedValue(false)

        const accountMock = {
          verify: verifyMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          message: 'Hello World',
          signature: '0xinvalidsig'
        })

        expect(result.content[0].text).toBe('Signature is valid: false')
      })
    })

    describe('error handling', () => {
      test('should return error with message on exception', async () => {
        server.wdk.getAccount.mockRejectedValue(new Error('Wallet not available'))

        const result = await handler({
          chain: 'ethereum',
          message: 'Hello World',
          signature: '0xsignature123'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('Error verifying signature on ethereum: Wallet not available')
      })
    })
  })
})
