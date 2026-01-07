'use strict'

import { getCurrentPrice } from './getCurrentPrice.js'
import { getHistoricalPrice } from './getHistoricalPrice.js'

export const pricingTools = [
  getCurrentPrice,
  getHistoricalPrice
]

export {
  getCurrentPrice,
  getHistoricalPrice
}
