import axios from 'axios'
import { logger } from '../utils/Logger.js'
import { tokenCounter } from '../utils/TokenCounter.js'

/**
 * Xiaomi MiMo API Client
 * Supports MiMo-V2.5-Pro (reasoning) and MiMo-V2.5 Omni (multimodal)
 */
export class MiMoClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.MIMO_API_KEY
    this.baseURL = config.baseURL || process.env.MIMO_BASE_URL || 'https://api.xiaomimimo.com/v1'
    this.defaultModel = config.model || process.env.MIMO_DEFAULT_MODEL || 'mimo-v2.5-pro'

    if (!this.apiKey) {
      throw new Error('MiMo API key is required. Set MIMO_API_KEY in .env')
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    })
  }

  /**
   * Send a chat completion request
   */
  async complete({ prompt, systemPrompt, model, maxTokens = 2048, temperature = 0.7, stream = false }) {
    const modelName = model || this.defaultModel
    const messages = []

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    messages.push({ role: 'user', content: prompt })

    const startTime = Date.now()

    try {
      const response = await this.client.post('/chat/completions', {
        model: modelName,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream
      })

      const result = response.data
      const usage = result.usage || {}
      const latencyMs = Date.now() - startTime

      tokenCounter.record({
        model: modelName,
        provider: 'mimo',
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
        latencyMs
      })

      logger.debug(`MiMo [${modelName}] — ${usage.total_tokens || 0} tokens, ${latencyMs}ms`)

      return {
        content: result.choices[0]?.message?.content || '',
        model: modelName,
        provider: 'mimo',
        tokensUsed: usage.total_tokens || 0,
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        latencyMs
      }
    } catch (err) {
      logger.error(`MiMo request failed: ${err.message}`)
      throw err
    }
  }

  /**
   * Reasoning-optimized completion (uses MiMo-V2.5-Pro)
   */
  async reason(prompt, options = {}) {
    return this.complete({
      prompt,
      model: 'mimo-v2.5-pro',
      maxTokens: options.maxTokens || 4096,
      temperature: options.temperature || 0.2,
      ...options
    })
  }

  /**
   * Multimodal completion (uses MiMo-V2.5 Omni)
   */
  async multimodal(prompt, imageBase64, options = {}) {
    const messages = [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
      ]
    }]

    const response = await this.client.post('/chat/completions', {
      model: 'mimo-v2.5-omni',
      messages,
      max_tokens: options.maxTokens || 2048
    })

    return response.data.choices[0]?.message?.content || ''
  }
}
