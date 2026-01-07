'use strict'

import { z } from 'zod'
import { INDEXER_BASE_URL, SUPPORTED_BLOCKCHAINS, SUPPORTED_TOKENS } from './constants.js'

export function getTokenTransfers (server) {
  server.registerTool(
    'getTokenTransfers',
    {
      title: 'Get Token Transfers',
      description: `Get token transfer history for an address using the WDK Indexer API.

This tool retrieves the token transfer history for a specific address on a given blockchain. Returns a list of transfers including transaction hashes, amounts, timestamps, and sender/recipient addresses.

Supported blockchains: ${SUPPORTED_BLOCKCHAINS.join(', ')}
Supported tokens: ${SUPPORTED_TOKENS.join(', ')}

Args:
  - blockchain (REQUIRED): The blockchain to query
  - token (REQUIRED): The token to query (usdt, xaut, btc)
  - address (REQUIRED): The wallet address to get transfers for
  - limit (OPTIONAL): Number of transfers to return (1-1000, default: 10)
  - fromTs (OPTIONAL): Start timestamp (unix seconds, default: 0)
  - toTs (OPTIONAL): End timestamp (unix seconds)
  - sort (OPTIONAL): Sort order - "asc" or "desc" (default: "desc")

Returns:
  JSON format:
  {
    "transfers": [
      {
        "blockchain": "ethereum",
        "blockNumber": 12345678,
        "transactionHash": "0xabc...",
        "token": "usdt",
        "amount": "1000000",
        "timestamp": 1699900000,
        "from": "0x123...",
        "to": "0x456..."
      }
    ]
  }

Examples:
  - Use when: "Show my USDT transfer history on ethereum"
  - Use when: "Get the last 50 USDT transfers for address 0x..."
  - Use when: "What transfers happened to my address in the last week?"
  - Don't use when: You need real-time balance (use getTokenBalance from wallet tools)

Error Handling:
  - Returns error if blockchain is not supported
  - Returns error if token is not supported
  - Returns error if address is invalid
  - Returns error if API key is invalid (401)
  - Returns error if rate limit exceeded (429)`,
      inputSchema: z.object({
        blockchain: z.enum(SUPPORTED_BLOCKCHAINS).describe('The blockchain to query'),
        token: z.enum(SUPPORTED_TOKENS).describe('The token to query (usdt, xaut, btc)'),
        address: z.string().min(1).describe('The wallet address to get transfers for'),
        limit: z.number().int().min(1).max(1000).optional().describe('Number of transfers to return (1-1000, default: 10)'),
        fromTs: z.number().int().optional().describe('Start timestamp (unix seconds)'),
        toTs: z.number().int().optional().describe('End timestamp (unix seconds)'),
        sort: z.enum(['asc', 'desc']).optional().describe('Sort order (default: desc)')
      }),
      outputSchema: z.object({
        transfers: z.array(z.object({
          blockchain: z.string(),
          blockNumber: z.number(),
          transactionHash: z.string(),
          transferIndex: z.number().optional(),
          token: z.string(),
          amount: z.string(),
          timestamp: z.number(),
          transactionIndex: z.number().optional(),
          logIndex: z.number().optional(),
          from: z.string(),
          to: z.string()
        }))
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ blockchain, token, address, limit, fromTs, toTs, sort }) => {
      try {
        const url = new URL(`${INDEXER_BASE_URL}/api/v1/${blockchain}/${token}/${address}/token-transfers`)

        if (limit !== undefined) url.searchParams.set('limit', limit.toString())
        if (fromTs !== undefined) url.searchParams.set('fromTs', fromTs.toString())
        if (toTs !== undefined) url.searchParams.set('toTs', toTs.toString())
        if (sort !== undefined) url.searchParams.set('sort', sort)

        const response = await fetch(url.toString(), {
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

        const transferCount = data.transfers?.length || 0
        const summary = transferCount === 0
          ? `No transfers found for ${address} on ${blockchain}`
          : `Found ${transferCount} ${token.toUpperCase()} transfer(s) on ${blockchain}`

        return {
          content: [{
            type: 'text',
            text: `${summary}\n\n${JSON.stringify(data, null, 2)}`
          }],
          structuredContent: data
        }
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Error getting token transfers: ${error.message}`
          }]
        }
      }
    }
  )
}
