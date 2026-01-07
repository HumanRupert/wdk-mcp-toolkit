'use strict'

import { z } from 'zod'

export function verify (server) {
  const chains = server.getChains()

  server.registerTool(
    'verify',
    {
      title: 'Verify Message Signature',
      description: `Verify a message signature.

This tool verifies that a signature was created by this wallet's private key for a given message. This is a read-only operation that does NOT use the private key or modify anything.

Args:
  - chain (REQUIRED): The blockchain to use for verification
  - message (REQUIRED): The original message (string)
  - signature (REQUIRED): The signature to verify (string)

Returns:
  Text format: "Signature is valid: {true/false}"
  
  Structured output:
  {
    "valid": true
  }

Examples:
  - Use when: "Verify signature 0xabc... for message 'Hello World'"
  - Use when: "Check if this signature is valid"
  - Don't use when: You want to create a signature (use sign instead)

Error Handling:
  - Returns error if wallet is not registered for the specified chain
  - Returns error if message or signature is empty
  - Returns valid: false if signature is invalid`,
      inputSchema: z.object({
        chain: z.enum(chains).describe('The blockchain to use for verification'),
        message: z.string().describe('The original message'),
        signature: z.string().describe('The signature to verify')
      }),
      outputSchema: z.object({
        valid: z.boolean().describe('True if the signature is valid')
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ chain, message, signature }) => {
      try {
        if (!message || message.trim().length === 0) {
          throw new Error('Message cannot be empty')
        }

        if (!signature || signature.trim().length === 0) {
          throw new Error('Signature cannot be empty')
        }

        const account = await server.wdk.getAccount(chain, 0)
        const valid = await account.verify(message, signature)

        return {
          content: [{
            type: 'text',
            text: `Signature is valid: ${valid}`
          }],
          structuredContent: {
            valid
          }
        }
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Error verifying signature on ${chain}: ${error.message}`
          }]
        }
      }
    }
  )
}
