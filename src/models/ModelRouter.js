import { MiMoClient } from './MiMoClient.js'
import { ClaudeClient } from './ClaudeClient.js'
import { DeepseekClient } from './DeepseekClient.js'
import { logger } from '../utils/Logger.js'

/**
 * ModelRouter — Intelligent multi-model routing
 *
 * Strategies:
 *  - cost-performance: MiMo first (cheapest), fallback to others
 *  - quality: Best model for task type, cost secondary
 *  - speed: Fastest model first
 */
export class ModelRouter {
  constructor(config = {}) {
    this.strategy = config.strategy || process.env.MODEL_STRATEGY || 'cost-performance'
    this.enableFallback = config.fallback ?? (process.env.ENABLE_FALLBACK !== 'false')

    // Initialize all available clients
    this.clients = {}

    try {
      this.clients.mimo = new MiMoClient()
    } catch (e) {
      logger.warn('MiMo client init failed:', e.message)
    }
    try {
      this.clients.claude = new ClaudeClient()
    } catch (e) {
      logger.warn('Claude client init failed:', e.message)
    }
    try {
      this.clients.deepseek = new DeepseekClient()
    } catch (e) {
      logger.warn('Deepseek client init failed:', e.message)
    }

    // Routing table: task → [primary, ...fallbacks]
    this.routes = {
      reasoning:   ['mimo', 'claude', 'deepseek'],
      coding:      ['mimo', 'deepseek', 'claude'],
      analysis:    ['claude', 'mimo', 'deepseek'],
      content:     ['mimo', 'claude'],
      fast:        ['mimo', 'claude'],
      multimodal:  ['mimo', 'claude']
    }
  }

  /**
   * Route and execute a completion
   * @param {Object} params
   * @param {string} params.task - 'reasoning' | 'coding' | 'analysis' | 'content' | 'fast'
   * @param {string} params.prompt
   * @param {string} [params.systemPrompt]
   * @param {number} [params.maxTokens]
   * @param {number} [params.temperature]
   */
  async complete({ task = 'reasoning', prompt, systemPrompt, maxTokens, temperature }) {
    const queue = this.routes[task] || this.routes.reasoning

    for (const providerKey of queue) {
      const client = this.clients[providerKey]
      if (!client) continue

      try {
        logger.info(`Router → ${providerKey} [task: ${task}]`)
        const result = await client.complete({ prompt, systemPrompt, maxTokens, temperature })
        result.routedTo = providerKey
        result.taskType = task
        return result
      } catch (err) {
        logger.warn(`Provider ${providerKey} failed: ${err.message}`)
        if (!this.enableFallback) throw err
        logger.info(`Falling back from ${providerKey}...`)
      }
    }

    throw new Error(`All providers exhausted for task: ${task}`)
  }

  /** Shortcut: reasoning-heavy task */
  async reason(prompt, options = {}) {
    return this.complete({ task: 'reasoning', prompt, ...options })
  }

  /** Shortcut: code/Lua analysis */
  async analyzeCode(prompt, options = {}) {
    return this.complete({ task: 'coding', prompt, ...options })
  }

  /** Shortcut: content generation */
  async generate(prompt, options = {}) {
    return this.complete({ task: 'content', prompt, ...options })
  }
}
