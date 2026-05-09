import { createDataItemSigner, message, result, dryrun } from '@permaweb/aoconnect'
import Arweave from 'arweave'
import fs from 'fs'
import { logger } from '../utils/Logger.js'

/**
 * AOConnector — Interface for AO process messaging
 * Handles sending messages, reading results, and dry-run evaluation
 */
export class AOConnector {
  constructor(config = {}) {
    this.walletPath = config.walletPath || process.env.ARWEAVE_WALLET_PATH || './wallet.json'
    this.muUrl = config.muUrl || process.env.AO_GATEWAY || 'https://mu.ao-testnet.xyz'
    this.cuUrl = config.cuUrl || process.env.AO_CU_URL || 'https://cu.ao-testnet.xyz'

    this.arweave = Arweave.init({
      host: 'arweave.net',
      port: 443,
      protocol: 'https'
    })

    this._wallet = null
    this._signer = null
  }

  async init() {
    if (!this._wallet) {
      try {
        const walletData = fs.readFileSync(this.walletPath, 'utf8')
        this._wallet = JSON.parse(walletData)
        this._signer = createDataItemSigner(this._wallet)
        const address = await this.arweave.wallets.jwkToAddress(this._wallet)
        logger.info(`AOConnector: initialized with wallet ${address.substring(0, 8)}...`)
      } catch (err) {
        logger.warn(`AOConnector: wallet not found at ${this.walletPath} — running in read-only mode`)
      }
    }
    return this
  }

  /**
   * Send a message to an AO process
   */
  async send({ processId, action, data = {}, tags = [] }) {
    await this.init()
    if (!this._signer) throw new Error('Wallet required to send messages')

    const allTags = [
      { name: 'Action', value: action },
      ...tags,
      { name: 'Source', value: 'ao-mind' }
    ]

    logger.info(`AOConnector: sending message to ${processId.substring(0, 8)}... [Action: ${action}]`)

    const msgId = await message({
      process: processId,
      signer: this._signer,
      tags: allTags,
      data: typeof data === 'string' ? data : JSON.stringify(data)
    })

    return { messageId: msgId, processId, action }
  }

  /**
   * Read the result of a message
   */
  async getResult({ processId, messageId }) {
    const res = await result({ process: processId, message: messageId })
    return res
  }

  /**
   * Send and wait for result
   */
  async sendAndWait({ processId, action, data = {}, tags = [], pollInterval = 1000, maxAttempts = 15 }) {
    const { messageId } = await this.send({ processId, action, data, tags })

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, pollInterval))
      try {
        const res = await this.getResult({ processId, messageId })
        if (res?.Messages?.length > 0 || res?.Output) {
          return res
        }
      } catch (err) {
        if (i === maxAttempts - 1) throw err
      }
    }

    throw new Error(`Timeout waiting for result from process ${processId}`)
  }

  /**
   * Dry-run: read process state without writing to chain
   */
  async dryRun({ processId, action, data = {}, tags = [] }) {
    const allTags = [
      { name: 'Action', value: action },
      ...tags
    ]

    const res = await dryrun({
      process: processId,
      tags: allTags,
      data: typeof data === 'string' ? data : JSON.stringify(data)
    })

    return res
  }
}
