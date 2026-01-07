'use strict'

import { z } from 'zod'
import { INDEXER_BASE_URL, SUPPORTED_BLOCKCHAINS, SUPPORTED_TOKENS } from './constants.js'

export function getIndexerTokenBalance (server) {
  server.registerTool(
    'getIndexerTokenBalance',
    {
      title: 'Get Indexed Token Balance',
      description: `Get token balance for an address using the WDK Indexer API.

This tool retrieves the current token balance for a specific address on a given blockchain via the Indexer API. This is useful for querying balances across multiple chains without needing a wallet connection.

Note: This queries the indexed balance which may have slight delay compared to real-time blockchain state. For real-time balances from your wallet, use the wallet's getTokenBalance tool instead.

Supported blockchains: ${SUPPORTED_BLOCKCHAINS.join(', ')}
Supported tokens: ${SUPPORTED_TOKENS.join(', ')}

Args:
  - blockchain (REQUIRED): The blockchain to query
  - token (REQUIRED): The token to query (usdt, xaut, btc)
  - address (REQUIRED): The wallet address to get balance for

Returns:
  Text format: "Balance: {amount} {token} on {blockchain}"
  
  Structured output:
  {
    "tokenBalance": {
      "blockchain": "ethereum",
      "token": "usdt",
      "amount": "1000000"
    }
  }

Examples:
  - Use when: "What's the USDT balance of 0x... on ethereum?"
  - Use when: "Check XAUT balance for this address on polygon"
  - Use when: "How much BTC does address bc1... have?"
  - Don't use when: You need your own wallet's real-time balance (use wallet getTokenBalance)

Error Handling:
  - Returns error if blockchain is not supported
  - Returns error if token is not supported
  - Returns error if address is invalid
  - Returns error if API key is invalid (401)
  - Returns error if rate limit exceeded (429)`,
      inputSchema: z.object({
        blockchain: z.enum(SUPPORTED_BLOCKCHAINS).describe('The blockchain to query'),
        token: z.enum(SUPPORTED_TOKENS).describe('The token to query (usdt, xaut, btc)'),
        address: z.string().min(1).describe('The wallet address to get balance for')
      }),
      outputSchema: z.object({
        tokenBalance: z.object({
          blockchain: z.string(),
          token: z.string(),
          amount: z.string()
        })
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ blockchain, token, address }) => {
      try {
        const url = `${INDEXER_BASE_URL}/api/v1/${blockchain}/${token}/${address}/token-balances`

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'x-api-key': server.indexer.apiKey,
            Accept: 'application/json'
          }
        })

        if (!response.ok) {
          const errorBody = await response.text()
          if (response.status === 401) {
            throw new Error('Invalid API key')
          }
          if (response.status === 429) {
            throw new Error('Rate limit exceeded. Try again later.')
          }
          throw new Error(`Indexer API error (${response.status}): ${errorBody}`)
        }

        const data = await response.json()
        const balance = data.tokenBalance?.amount || '0'

        return {
          content: [{
            type: 'text',
            text: `Balance: ${balance} ${token.toUpperCase()} on ${blockchain}`
          }],
          structuredContent: data
        }
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Error getting indexed token balance: ${error.message}`
          }]
        }
      }
    }
  )
}
