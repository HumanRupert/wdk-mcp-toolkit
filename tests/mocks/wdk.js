'use strict'

import { jest } from '@jest/globals'

export function createMockWdk () {
  return {
    getFeeRates: jest.fn().mockResolvedValue({ normal: 10000n, fast: 20000n }),
    getAccount: jest.fn()
  }
}

export function createMockAccount () {
  return {
    getAddress: jest.fn().mockResolvedValue('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'),
    getBalance: jest.fn().mockResolvedValue(1000000000000000000n),
    transfer: jest.fn().mockResolvedValue({ hash: '0xabc123', fee: 21000000000000n }),
    quoteTransfer: jest.fn().mockResolvedValue({ fee: 21000000000000n }),
    sign: jest.fn().mockResolvedValue('0xsignature123abc'),
    verify: jest.fn().mockResolvedValue(true),
    getTokenBalance: jest.fn().mockResolvedValue(1000000n),
    quoteSendTransaction: jest.fn().mockResolvedValue({ fee: 21000000000000n }),
    sendTransaction: jest.fn().mockResolvedValue({ hash: '0xabc123' }),
    getMaxSpendable: jest.fn().mockResolvedValue({ amount: 95000000n, fee: 5000n, changeValue: 1000n }),

    getSwapProtocol: jest.fn(),
    getBridgeProtocol: jest.fn(),
    getLendingProtocol: jest.fn(),
    getFiatProtocol: jest.fn()
  }
}
