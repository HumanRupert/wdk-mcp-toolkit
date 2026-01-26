// Copyright 2025 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
'use strict'

import { password, input, confirm } from '@inquirer/prompts'
import pc from 'picocolors'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { exec as execCallback } from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(execCallback)

/**
 * Runs the WDK MCP Toolkit setup wizard.
 */
export async function runSetupWizard () {
  printBanner()

  // Check prerequisites
  await checkGitignore()

  // Collect credentials
  const config = {}

  // 1. Seed phrase (required)
  config.seed = await collectSeedPhrase()

  // 2. Indexer API key (optional)
  config.indexerApiKey = await collectIndexerApiKey()

  // 3. MoonPay credentials (optional)
  const moonpay = await collectMoonPayCredentials()
  config.moonPayApiKey = moonpay.apiKey
  config.moonPaySecretKey = moonpay.secretKey

  // Install dependencies
  await installDependencies()

  // Generate configuration
  await generateConfig(config)

  // Open VS Code
  await openVsCode()

  printSuccessMessage(config)
}

function printBanner () {
  console.log()
  console.log(pc.cyan(pc.bold('╔══════════════════════════════════════════════════════════╗')))
  console.log(pc.cyan(pc.bold('║           WDK MCP Toolkit Setup Wizard                   ║')))
  console.log(pc.cyan(pc.bold('╚══════════════════════════════════════════════════════════╝')))
  console.log()
  console.log('This wizard configures the WDK MCP server for VS Code GitHub Copilot.')
  console.log()
}

async function checkGitignore () {
  const gitignorePath = path.join(process.cwd(), '.gitignore')
  try {
    const content = await fs.readFile(gitignorePath, 'utf-8')
    if (!content.includes('.vscode')) {
      console.log(pc.yellow('Note: .vscode is not in .gitignore'))
      console.log(pc.yellow('The generated config will contain sensitive data.\n'))

      const proceed = await confirm({
        message: 'Add .vscode to .gitignore?',
        default: true
      })

      if (proceed) {
        await fs.appendFile(gitignorePath, '\n.vscode\n')
        console.log(pc.green('Added .vscode to .gitignore\n'))
      }
    }
  } catch {
    // .gitignore doesn't exist, create it
    await fs.writeFile(gitignorePath, '.vscode\n')
    console.log(pc.green('Created .gitignore with .vscode entry\n'))
  }
}

async function collectSeedPhrase () {
  console.log(pc.yellow(pc.bold('🔐 SEED PHRASE (Required)')))
  console.log(pc.dim('──────────────────────────────────────────────────────────'))
  console.log()
  console.log(pc.yellow('⚠️  SECURITY NOTICE:'))
  console.log(pc.yellow('   • Your seed phrase controls your wallet funds'))
  console.log(pc.yellow('   • It will be stored locally in .vscode/mcp.json (gitignored)'))
  console.log(pc.yellow('   • We recommend using a dedicated development wallet'))
  console.log(pc.yellow('   • Never use your main wallet seed phrase'))
  console.log()

  const seed = await password({
    message: 'Enter your BIP-39 seed phrase (12 or 24 words):',
    mask: '*',
    validate: (value) => {
      if (!value || value.trim() === '') {
        return 'Seed phrase is required for wallet operations'
      }
      const words = value.trim().split(/\s+/)
      if (words.length !== 12 && words.length !== 24) {
        return 'Seed phrase must be 12 or 24 words'
      }
      return true
    }
  })

  console.log()
  return seed.trim()
}

async function collectIndexerApiKey () {
  console.log(pc.blue(pc.bold('📊 WDK INDEXER API KEY (Optional)')))
  console.log(pc.dim('──────────────────────────────────────────────────────────'))
  console.log()
  console.log('Enables transaction history and token transfer queries.')
  console.log()
  console.log(pc.cyan('→ Get your free API key at: ') + pc.underline('https://wdk-api.tether.io/register'))
  console.log()
  console.log(pc.dim('Press Enter to skip if you don\'t need transaction history.'))
  console.log()

  const apiKey = await password({
    message: 'WDK Indexer API key:',
    mask: '*'
  })

  if (!apiKey || apiKey.trim() === '') {
    console.log(pc.yellow('⏭️  Skipping indexer — transaction history tools will be disabled'))
    console.log()
    return null
  }

  console.log()
  return apiKey.trim()
}

async function collectMoonPayCredentials () {
  console.log(pc.magenta(pc.bold('💳 MOONPAY CREDENTIALS (Optional)')))
  console.log(pc.dim('──────────────────────────────────────────────────────────'))
  console.log()
  console.log('Enables fiat on/off-ramp — buy and sell crypto with USD, EUR, etc.')
  console.log()
  console.log(pc.cyan('→ Get your API keys from: ') + pc.underline('https://dashboard.moonpay.com/'))
  console.log()
  console.log(pc.dim('Press Enter to skip if you don\'t need fiat capabilities.'))
  console.log()

  const apiKey = await input({
    message: 'MoonPay API key:'
  })

  if (!apiKey || apiKey.trim() === '') {
    console.log(pc.yellow('⏭️  Skipping MoonPay — fiat tools will be disabled'))
    console.log()
    return { apiKey: null, secretKey: null }
  }

  const secretKey = await password({
    message: 'MoonPay Secret key:',
    mask: '*',
    validate: (value) => {
      if (!value || value.trim() === '') {
        return 'Secret key is required when API key is provided'
      }
      return true
    }
  })

  console.log()
  return {
    apiKey: apiKey.trim(),
    secretKey: secretKey.trim()
  }
}

async function installDependencies () {
  console.log(pc.dim('──────────────────────────────────────────────────────────'))
  process.stdout.write(pc.cyan('⏳ Installing required dependencies...'))

  const deps = [
    '@tetherto/wdk-wallet-btc',
    '@tetherto/wdk-wallet-evm',
    '@tetherto/wdk-protocol-swap-velora-evm',
    '@tetherto/wdk-protocol-bridge-usdt0-evm',
    '@tetherto/wdk-protocol-lending-aave-evm',
    '@tetherto/wdk-protocol-fiat-moonpay'
  ]

  try {
    await exec(`npm install ${deps.join(' ')}`, { cwd: process.cwd() })
    console.log(pc.green(' ✓'))
  } catch (error) {
    console.log(pc.red(' ✗'))
    console.log(pc.red(`Failed to install dependencies: ${error.message}`))
    console.log(pc.yellow('You may need to install them manually:'))
    console.log(pc.dim(`npm install ${deps.join(' ')}`))
  }
}

async function generateConfig (config) {
  process.stdout.write(pc.cyan('⏳ Generating .vscode/mcp.json...'))

  const mcpConfig = {
    servers: {
      wdk: {
        type: 'stdio',
        command: 'node',
        args: ['examples/basic/index.js'],
        env: {
          WDK_SEED: config.seed
        }
      }
    }
  }

  // Add optional environment variables
  if (config.indexerApiKey) {
    mcpConfig.servers.wdk.env.WDK_INDEXER_API_KEY = config.indexerApiKey
  }

  if (config.moonPayApiKey) {
    mcpConfig.servers.wdk.env.MOONPAY_API_KEY = config.moonPayApiKey
    mcpConfig.servers.wdk.env.MOONPAY_SECRET_KEY = config.moonPaySecretKey
  }

  // Create .vscode directory if it doesn't exist
  const vscodeDir = path.join(process.cwd(), '.vscode')
  await fs.mkdir(vscodeDir, { recursive: true })

  // Write configuration
  const configPath = path.join(vscodeDir, 'mcp.json')
  await fs.writeFile(configPath, JSON.stringify(mcpConfig, null, 2) + '\n')

  // Set restrictive permissions on Unix systems
  if (process.platform !== 'win32') {
    await fs.chmod(configPath, 0o600)
  }

  console.log(pc.green(' ✓'))
}

async function openVsCode () {
  process.stdout.write(pc.cyan('⏳ Opening VS Code...'))

  try {
    await exec('code .', { cwd: process.cwd() })
    console.log(pc.green(' ✓'))
  } catch {
    console.log(pc.yellow(' (VS Code CLI not found)'))
    console.log(pc.dim('   Open VS Code manually in this directory'))
  }
}

function printSuccessMessage (config) {
  const enabledCapabilities = [
    'Wallet Operations (Ethereum, Arbitrum, Bitcoin)',
    'Pricing Data',
    'Token Swaps (Velora)',
    'Cross-chain Bridge (USDT0)',
    'DeFi Lending (Aave)'
  ]
  const disabledCapabilities = []

  if (config.indexerApiKey) {
    enabledCapabilities.push('Transaction History')
  } else {
    disabledCapabilities.push('Transaction History')
  }

  if (config.moonPayApiKey) {
    enabledCapabilities.push('Fiat On/Off-Ramp (MoonPay)')
  } else {
    disabledCapabilities.push('Fiat On/Off-Ramp (MoonPay)')
  }

  console.log()
  console.log(pc.green(pc.bold('╔══════════════════════════════════════════════════════════╗')))
  console.log(pc.green(pc.bold('║                 Setup Complete! ✓                        ║')))
  console.log(pc.green(pc.bold('╚══════════════════════════════════════════════════════════╝')))
  console.log()
  console.log(pc.bold('Enabled capabilities:'))
  enabledCapabilities.forEach(cap => {
    console.log(pc.green(`  ✓ ${cap}`))
  })

  if (disabledCapabilities.length > 0) {
    console.log()
    console.log(pc.dim('Disabled capabilities (re-run setup to enable):'))
    disabledCapabilities.forEach(cap => {
      console.log(pc.dim(`  ○ ${cap}`))
    })
  }

  console.log()
  console.log(pc.bold('Next steps:'))
  console.log('  1. In VS Code, open ' + pc.cyan('.vscode/mcp.json'))
  console.log('  2. Click the ' + pc.cyan('"Start"') + ' button above the server config')
  console.log('  3. Open GitHub Copilot Chat → Select ' + pc.cyan('"Agent"') + ' mode')
  console.log('  4. Try: ' + pc.cyan('"What\'s my ethereum address?"'))
  console.log()
  console.log(pc.yellow(pc.bold('🔒 Remember: Never commit .vscode/mcp.json to git!')))
  console.log()
}
