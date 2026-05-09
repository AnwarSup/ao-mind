import Anthropic from '@anthropic-ai/sdk'
import { logger } from '../utils/Logger.js'
import { tokenCounter } from '../utils/TokenCounter.js'

/**
 * Anthropic Claude Client — used for deep analysis tasks
 * and as fallback when MiMo is rate-limited
 */
export class ClaudeClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.CLAUDE_API_KEY
    this.defaultModel = config.model || process.env.CLAUDE_DEFAULT_MODEL || 'claude-sonnet-4-5'

    if (!this.apiKey) {
      throw new Error('Claude API key required. Set CLAUDE_API_KEY in .env')
    }

    this.client = new Anthropic({ apiKey: this.apiKey })
  }

  async complete({ prompt, systemPrompt, model, maxTokens = 2048, temperature = 0.7 }) {
    const modelName = model || this.defaultModel
    const startTime = Date.now()

    try {
      const response = await this.client.messages.create({
        model: modelName,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt || 'You are a helpful AI assistant.',
        messages: [{ role: 'user', content: prompt }]
      })

      const latencyMs = Date.now() - startTime
      const usage = response.usage

      tokenCounter.record({
        model: modelName,
        provider: 'claude',
        promptTokens: usage.input_tokens,
        completionTokens: usage.output_tokens,
        totalTokens: usage.input_tokens + usage.output_tokens,
        latencyMs
      })

      logger.debug(`Claude [${modelName}] — ${usage.input_tokens + usage.output_tokens} tokens, ${latencyMs}ms`)

      return {
        content: response.content[0]?.text || '',
        model: modelName,
        provider: 'claude',
        tokensUsed: usage.input_tokens + usage.output_tokens,
        promptTokens: usage.input_tokens,
        completionTokens: usage.output_tokens,
        latencyMs
      }
    } catch (err) {
      logger.error(`Claude request failed: ${err.message}`)
      throw err
    }
  }
}
