import { AOConnector } from './AOConnector.js'
import { logger } from '../utils/Logger.js'

const DEFAULT_PULSE_PROCESS = 'E8gHiH6gpkfFZywTbQj13F9SUH8N9tWrFsgGisOPHV4'

/**
 * PulseProtocol SDK — Wrapper for Pulse Protocol on AO
 * Used by ContentGenerator to post to the social graph
 *
 * Pulse Protocol: https://pulseprotocol.vercel.app/
 * Originally built for Ctrl Play, now open for any platform
 */
export class PulseProtocol {
  constructor(config = {}) {
    this.processId = config.processId || process.env.PULSE_PROCESS_ID || DEFAULT_PULSE_PROCESS
    this.ao = config.ao || new AOConnector()
  }

  /**
   * Submit a post to Pulse Protocol
   * @param {string} content - Post content
   * @param {Object} [metadata] - Additional metadata
   */
  async submitPost(content, metadata = {}) {
    logger.info(`PulseProtocol: submitting post (${content.length} chars)`)

    const tags = [
      { name: 'Content-Type', value: 'text/plain' },
      { name: 'Source', value: 'ao-mind' },
      ...Object.entries(metadata).map(([k, v]) => ({ name: k, value: String(v) }))
    ]

    const result = await this.ao.send({
      processId: this.processId,
      action: 'SUBMIT_POST',
      data: content,
      tags
    })

    logger.info(`PulseProtocol: post submitted — msgId: ${result.messageId}`)
    return result.messageId
  }

  /**
   * Get recent posts from Pulse
   */
  async getPosts(limit = 20) {
    const result = await this.ao.dryRun({
      processId: this.processId,
      action: 'GET_POSTS',
      data: { limit }
    })

    try {
      const output = result?.Messages?.[0]?.Data
      return output ? JSON.parse(output) : []
    } catch {
      return []
    }
  }

  /**
   * Get player profile from Pulse
   */
  async getProfile(playerAddress) {
    const result = await this.ao.dryRun({
      processId: this.processId,
      action: 'GET_PROFILE',
      data: { address: playerAddress }
    })

    try {
      const output = result?.Messages?.[0]?.Data
      return output ? JSON.parse(output) : null
    } catch {
      return null
    }
  }
}
