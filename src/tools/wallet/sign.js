'use strict'

import { z } from 'zod'

export function sign (server) {
  const chains = server.getChains()

  server.registerTool(
    'sign',
    {
      title: 'Sign Message',
      description: `Sign a message using the wallet's private key.

This tool signs an arbitrary message using the wallet's private key, producing a cryptographic signature that can be verified later. The signature proves ownership of the wallet without revealing the private key.

Args:
  - chain (REQUIRED): The blockchain to use for signing
  - message (REQUIRED): The message to sign (string)

Returns:
  Text format: "Message signed. Signature: {signature}"
  
  Structured output:
  {
    "signature": "0xabc123..."
  }

Examples:
  - Use when: "Sign the message 'Hello World' with my ethereum wallet"
  - Use when: "Create a signature for 'I agree to terms'"
  - Don't use when: You want to verify a signature (use verify instead)

Error Handling:
  - Returns error if wallet is not registered for the specified chain
  - Returns error if message is empty`,
      inputSchema: z.object({
        chain: z.enum(chains).describe('The blockchain to use for signing'),
        message: z.string().describe('The message to sign')
      }),
      outputSchema: z.object({
        signature: z.string().describe('The message signature')
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ chain, message }) => {
      try {
        if (!message || message.trim().length === 0) {
          throw new Error('Message cannot be empty')
        }

        const account = await server.wdk.getAccount(chain, 0)
        const signature = await account.sign(message)

        return {
          content: [{
            type: 'text',
            text: `Message signed. Signature: ${signature}`
          }],
          structuredContent: {
            signature
          }
        }
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Error signing message on ${chain}: ${error.message}`
          }]
        }
      }
    }
  )
}
