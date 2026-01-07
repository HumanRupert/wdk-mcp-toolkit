export namespace CHAINS {
    let ETHEREUM: string;
    let POLYGON: string;
    let ARBITRUM: string;
    let OPTIMISM: string;
    let BASE: string;
    let AVALANCHE: string;
    let BNB: string;
    let PLASMA: string;
    let BITCOIN: string;
    let SOLANA: string;
    let SPARK: string;
    let TON: string;
    let TRON: string;
}
export const DEFAULT_TOKENS: {
    [CHAINS.ETHEREUM]: {
        USDT: {
            address: string;
            decimals: number;
        };
    };
    [CHAINS.POLYGON]: {
        USDT: {
            address: string;
            decimals: number;
        };
    };
    [CHAINS.ARBITRUM]: {
        USDT: {
            address: string;
            decimals: number;
        };
    };
    [CHAINS.OPTIMISM]: {
        USDT: {
            address: string;
            decimals: number;
        };
    };
    [CHAINS.BASE]: {
        USDT: {
            address: string;
            decimals: number;
        };
    };
    [CHAINS.AVALANCHE]: {
        USDT: {
            address: string;
            decimals: number;
        };
    };
    [CHAINS.BNB]: {
        USDT: {
            address: string;
            decimals: number;
        };
    };
    [CHAINS.PLASMA]: {
        USDT: {
            address: string;
            decimals: number;
        };
    };
    [CHAINS.TRON]: {
        USDT: {
            address: string;
            decimals: number;
        };
    };
    [CHAINS.TON]: {
        USDT: {
            address: string;
            decimals: number;
        };
    };
    [CHAINS.SOLANA]: {
        USDT: {
            address: string;
            decimals: number;
        };
    };
};
export class WdkMcpServer extends McpServer {
    /**
     * Creates a new MCP server for Tether Wallet Development Kit.
     *
     * @param {string} name - The server name.
     * @param {string} version - The server version.
     */
    constructor(name: string, version: string);
    /** @type {WDK | null} */
    wdk: WDK | null;
    /** @type {IndexerConfig | null} */
    indexer: IndexerConfig | null;
    /** @type {BitfinexPricingClient | null} */
    pricingClient: BitfinexPricingClient | null;
    /** @type {Set<string>} */
    chains: Set<string>;
    /** @type {TokenRegistry} */
    tokenRegistry: TokenRegistry;
    /**
     * Enables WDK and initializes the wallet development kit.
     *
     * @param {WdkConfig} config - The configuration.
     * @returns {WdkMcpServer} The server instance.
     * @throws {Error} If no seed is provided.
     */
    useWdk(config: WdkConfig): WdkMcpServer;
    /**
     * Enables Indexer for transaction history and UTXO queries.
     *
     * @param {IndexerConfig} config - The configuration.
     * @returns {WdkMcpServer} The server instance.
     * @throws {Error} If no apiKey is provided.
     */
    useIndexer(config: IndexerConfig): WdkMcpServer;
    /**
     * Enables Pricing for Bitfinex price rates.
     *
     * @returns {WdkMcpServer} The server instance.
     */
    usePricing(): WdkMcpServer;
    /**
     * Returns all registered blockchain names.
     *
     * @returns {string[]} The blockchain names.
     */
    getChains(): string[];
    /**
     * Registers a token symbol to contract address mapping.
     *
     * @param {string} chain - The blockchain name.
     * @param {string} symbol - The token symbol (e.g., "USDT").
     * @param {TokenInfo} token - The token info.
     * @returns {WdkMcpServer} The server instance.
     */
    registerToken(chain: string, symbol: string, token: TokenInfo): WdkMcpServer;
    /**
     * Returns the token info for a symbol on a blockchain.
     *
     * @param {string} chain - The blockchain name.
     * @param {string} symbol - The token symbol.
     * @returns {TokenInfo | undefined} The token info.
     */
    getTokenInfo(chain: string, symbol: string): TokenInfo | undefined;
    /**
     * Returns all registered token symbols for a blockchain.
     *
     * @param {string} chain - The blockchain name.
     * @returns {string[]} The token symbols.
     */
    getRegisteredTokens(chain: string): string[];
    /**
     * Registers tools with the server.
     *
     * @param {ToolFunction[]} tools - The tool functions.
     * @returns {WdkMcpServer} The server instance.
     */
    registerTools(tools: ToolFunction[]): WdkMcpServer;
    /**
     * Registers a new wallet to the server.
     *
     * @template {typeof import('@tetherto/wdk-wallet').default} W
     * @param {string} blockchain - The name of the blockchain (e.g., "ethereum").
     * @param {W} WalletManager - The wallet manager class.
     * @param {ConstructorParameters<W>[1]} config - The configuration object.
     * @returns {WdkMcpServer} The server instance.
     * @throws {Error} If useWdk() has not been called.
     */
    registerWallet<W extends typeof import("@tetherto/wdk-wallet").default>(blockchain: string, WalletManager: W, config: ConstructorParameters<W>[1]): WdkMcpServer;
}
export type WDK = import("@tetherto/wdk").default;
export type BitfinexPricingClient = import("@tetherto/wdk-pricing-bitfinex-http").BitfinexPricingClient;
export type TokenInfo = {
    /**
     * - Token contract address.
     */
    address: string;
    /**
     * - Number of decimal places for the token.
     */
    decimals: number;
};
export type IndexerConfig = {
    /**
     * - WDK Indexer API key.
     */
    apiKey: string;
};
export type WdkConfig = {
    /**
     * - BIP-39 seed phrase. Falls back to WDK_SEED env variable.
     */
    seed?: string;
};
export type TokenMap = Map<string, TokenInfo>;
export type TokenRegistry = Map<string, TokenMap>;
export type ToolFunction = (server: WdkMcpServer) => void;
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import WDK from '@tetherto/wdk';
import { BitfinexPricingClient } from '@tetherto/wdk-pricing-bitfinex-http';
