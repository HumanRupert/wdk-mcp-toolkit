'use strict'

import { z } from 'zod'

export function getCurrentPrice (server) {
  server.registerTool(
    'getCurrentPrice',
    {
      title: 'Get Current Price',
      description: `Get the current spot price for a trading pair.

This tool fetches the latest price for a base/quote currency pair from Bitfinex. Returns the current market price as a number.

Args:
  - base (REQUIRED): Base currency symbol (e.g., "BTC", "ETH", "XAU")
  - quote (REQUIRED): Quote currency symbol (e.g., "USD", "EUR", "USDT")

Returns:
  Text format: "{base}/{quote}: {price}"
  
  Structured output:
  {
    "base": "BTC",
    "quote": "USD",
    "price": 42150.50
  }

Examples:
  - Use when: "What's the current Bitcoin price?"
  - Use when: "How much is ETH worth in USD?"
  - Don't use when: You need historical prices (use getHistoricalPrice instead)

Error Handling:
  - Returns error if the trading pair is not supported
  - Returns error if the API request fails`,
      inputSchema: z.object({
        base: z.string().describe('Base currency symbol (e.g., "BTC", "ETH")'),
        quote: z.string().describe('Quote currency symbol (e.g., "USD", "USDT")')
      }),
      outputSchema: z.object({
        base: z.string(),
        quote: z.string(),
        price: z.number()
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ base, quote }) => {
      try {
        const baseUpper = base.toUpperCase()
        const quoteUpper = quote.toUpperCase()

        const price = await server.pricingClient.getCurrentPrice(baseUpper, quoteUpper)

        return {
          content: [{
            type: 'text',
            text: `${baseUpper}/${quoteUpper}: ${price}`
          }],
          structuredContent: {
            base: baseUpper,
            quote: quoteUpper,
            price
          }
        }
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Error getting current price: ${error.message}`
          }]
        }
      }
    }
  )
}
