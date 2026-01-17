'use strict'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

import { sign } from '../../../src/tools/wallet/sign.js'

describe('sign', () => {
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

  test('should register tool with name sign', () => {
    sign(server)

    expect(registerToolMock).toHaveBeenCalledWith(
      'sign',
      expect.any(Object),
      expect.any(Function)
    )
  })

  describe('handler', () => {
    let handler

    beforeEach(() => {
      sign(server)
      handler = registerToolMock.mock.calls[0][2]
    })

    describe('validation', () => {
      test('should return error if message is empty', async () => {
        const result = await handler({
          chain: 'ethereum',
          message: ''
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toContain('Message cannot be empty')
      })

      test('should return error if message is whitespace', async () => {
        const result = await handler({
          chain: 'ethereum',
          message: '   '
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toContain('Message cannot be empty')
      })
    })

    describe('protocol interaction', () => {
      test('should call wdk.getAccount with chain and index 0', async () => {
        const signMock = jest.fn().mockResolvedValue('0xsignature123')

        const accountMock = {
          sign: signMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          message: 'Hello World'
        })

        expect(server.wdk.getAccount).toHaveBeenCalledWith('ethereum', 0)
      })

      test('should call sign with message', async () => {
        const signMock = jest.fn().mockResolvedValue('0xsignature123')

        const accountMock = {
          sign: signMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        await handler({
          chain: 'ethereum',
          message: 'Hello World'
        })

        expect(signMock).toHaveBeenCalledWith('Hello World')
      })
    })

    describe('result formatting', () => {
      test('should return signature on success', async () => {
        const signMock = jest.fn().mockResolvedValue('0xsignature123abc')

        const accountMock = {
          sign: signMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          message: 'Hello World'
        })

        expect(result.structuredContent.signature).toBe('0xsignature123abc')
      })

      test('should return text content with signature', async () => {
        const signMock = jest.fn().mockResolvedValue('0xsignature123')

        const accountMock = {
          sign: signMock
        }

        server.wdk.getAccount.mockResolvedValue(accountMock)

        const result = await handler({
          chain: 'ethereum',
          message: 'Hello World'
        })

        expect(result.content[0].text).toBe('Message signed. Signature: 0xsignature123')
      })
    })

    describe('error handling', () => {
      test('should return error with message on exception', async () => {
        server.wdk.getAccount.mockRejectedValue(new Error('Wallet not available'))

        const result = await handler({
          chain: 'ethereum',
          message: 'Hello World'
        })

        expect(result.isError).toBe(true)
        expect(result.content[0].text).toBe('Error signing message on ethereum: Wallet not available')
      })
    })
  })
})
