'use strict'

import { getAddress } from './getAddress.js'
import { getBalance } from './getBalance.js'
import { getFeeRates } from './getFeeRates.js'
import { getMaxSpendableBtc } from './getMaxSpendableBtc.js'
import { getTokenBalance } from './getTokenBalance.js'
import { quoteSendTransaction } from './quoteSendTransaction.js'
import { quoteTransfer } from './quoteTransfer.js'
import { sendTransaction } from './sendTransaction.js'
import { transfer } from './transfer.js'
import { sign } from './sign.js'
import { verify } from './verify.js'

export const walletReadTools = [
  getAddress,
  getBalance,
  getFeeRates,
  getMaxSpendableBtc,
  getTokenBalance,
  quoteSendTransaction,
  quoteTransfer
]

export const walletWriteTools = [
  sendTransaction,
  transfer,
  sign,
  verify
]

export const walletTools = [
  ...walletReadTools,
  ...walletWriteTools
]

export {
  getAddress,
  getBalance,
  getFeeRates,
  getMaxSpendableBtc,
  getTokenBalance,
  quoteSendTransaction,
  quoteTransfer,
  sendTransaction,
  transfer,
  sign,
  verify
}
