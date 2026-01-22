'use strict'

import { jest } from '@jest/globals'

import { createMockWdk, createMockAccount } from './wdk.js'
import { createMockPricingClient, createMockIndexerClient } from './clients.js'
import {
  createMockSwapProtocol,
  createMockBridgeProtocol,
  createMockLendingProtocol,
  createMockFiatProtocol
} from './protocols.js'

export function createMockServer (options = {}) {
  const {
    chains = ['ethereum'],
    swapChains = [],
    bridgeChains = [],
    lendingChains = [],
    fiatChains = [],
    tokens = { ethereum: { USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 } } }
  } = options

  const wdk = createMockWdk()
  const account = createMockAccount()
  const swapProtocol = createMockSwapProtocol()
  const bridgeProtocol = createMockBridgeProtocol()
  const lendingProtocol = createMockLendingProtocol()
  const fiatProtocol = createMockFiatProtocol()
  const pricingClient = createMockPricingClient()
  const indexerClient = createMockIndexerClient()

  account.getSwapProtocol.mockReturnValue(swapProtocol)
  account.getBridgeProtocol.mockReturnValue(bridgeProtocol)
  account.getLendingProtocol.mockReturnValue(lendingProtocol)
  account.getFiatProtocol.mockReturnValue(fiatProtocol)

  wdk.getAccount.mockResolvedValue(account)

  const server = {
    registerTool: jest.fn(),

    getChains: jest.fn().mockReturnValue(chains),
    getSwapChains: jest.fn().mockReturnValue(swapChains),
    getSwapProtocols: jest.fn().mockReturnValue(swapChains.length ? ['velora'] : []),
    getBridgeChains: jest.fn().mockReturnValue(bridgeChains),
    getBridgeProtocols: jest.fn().mockReturnValue(bridgeChains.length ? ['usdt0'] : []),
    getLendingChains: jest.fn().mockReturnValue(lendingChains),
    getLendingProtocols: jest.fn().mockReturnValue(lendingChains.length ? ['aave'] : []),
    getFiatChains: jest.fn().mockReturnValue(fiatChains),
    getFiatProtocols: jest.fn().mockReturnValue(fiatChains.length ? ['moonpay'] : []),

    getTokenInfo: jest.fn().mockImplementation((chain, symbol) => tokens[chain]?.[symbol.toUpperCase()]),
    getRegisteredTokens: jest.fn().mockImplementation((chain) => Object.keys(tokens[chain] || {})),

    wdk,
    pricingClient,
    indexerClient,

    server: {
      elicitInput: jest.fn().mockResolvedValue({ action: 'accept', content: { confirmed: true } })
    }
  }

  return {
    server,
    mocks: {
      wdk,
      account,
      swapProtocol,
      bridgeProtocol,
      lendingProtocol,
      fiatProtocol,
      pricingClient,
      indexerClient
    }
  }
}
