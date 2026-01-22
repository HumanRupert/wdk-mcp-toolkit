'use strict'

import { jest } from '@jest/globals'

export function createMockSwapProtocol () {
  return {
    quoteSwap: jest.fn().mockResolvedValue({
      tokenInAmount: 100000000n,
      tokenOutAmount: 99850000n,
      fee: 21000000000000n
    }),
    swap: jest.fn().mockResolvedValue({
      hash: '0xswap123',
      tokenInAmount: 100000000n,
      tokenOutAmount: 99850000n,
      fee: 21000000000000n
    })
  }
}

export function createMockBridgeProtocol () {
  return {
    quoteBridge: jest.fn().mockResolvedValue({
      fee: 21000000000000n,
      estimatedTime: 300
    }),
    bridge: jest.fn().mockResolvedValue({
      hash: '0xbridge123',
      fee: 21000000000000n
    })
  }
}

export function createMockLendingProtocol () {
  return {
    quoteSupply: jest.fn().mockResolvedValue({ fee: 21000000000000n }),
    supply: jest.fn().mockResolvedValue({ hash: '0xsupply123', fee: 21000000000000n }),
    quoteWithdraw: jest.fn().mockResolvedValue({ fee: 21000000000000n }),
    withdraw: jest.fn().mockResolvedValue({ hash: '0xwithdraw123', fee: 21000000000000n }),
    quoteBorrow: jest.fn().mockResolvedValue({ fee: 21000000000000n }),
    borrow: jest.fn().mockResolvedValue({ hash: '0xborrow123', fee: 21000000000000n }),
    quoteRepay: jest.fn().mockResolvedValue({ fee: 21000000000000n }),
    repay: jest.fn().mockResolvedValue({ hash: '0xrepay123', fee: 21000000000000n })
  }
}

export function createMockFiatProtocol () {
  return {
    buy: jest.fn().mockResolvedValue({ buyUrl: 'https://buy.moonpay.com/abc123' }),
    sell: jest.fn().mockResolvedValue({ sellUrl: 'https://sell.moonpay.com/abc123' }),
    quoteBuy: jest.fn().mockResolvedValue({
      cryptoAmount: 1000000000000000000n,
      fiatAmount: 350000n,
      fee: 1750n,
      rate: '3500.00'
    }),
    quoteSell: jest.fn().mockResolvedValue({
      cryptoAmount: 1000000000000000000n,
      fiatAmount: 345000n,
      fee: 1725n,
      rate: '3500.00'
    }),
    getSupportedCountries: jest.fn().mockResolvedValue([
      { code: 'US', name: 'United States', isBuyAllowed: true, isSellAllowed: true },
      { code: 'DE', name: 'Germany', isBuyAllowed: true, isSellAllowed: false }
    ]),
    getSupportedFiatCurrencies: jest.fn().mockResolvedValue([
      { code: 'USD', name: 'US Dollar', decimals: 2 },
      { code: 'EUR', name: 'Euro', decimals: 2 }
    ]),
    getSupportedCryptoAssets: jest.fn().mockResolvedValue([
      { code: 'eth', name: 'Ethereum', networkCode: 'ethereum', decimals: 18 },
      { code: 'usdt', name: 'Tether', networkCode: 'ethereum', decimals: 6 }
    ]),
    getTransactionDetail: jest.fn().mockResolvedValue({
      status: 'completed',
      cryptoAsset: 'eth',
      fiatCurrency: 'USD'
    })
  }
}
