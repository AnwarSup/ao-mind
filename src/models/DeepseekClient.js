import OpenAI from 'openai'
import { logger } from '../utils/Logger.js'
import { tokenCounter } from '../utils/TokenCounter.js'

/**
 * Deepseek Client — used for codebase-level reasoning
 * and Lua contract deep analysis
 */
export class DeepseekClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.DEEPSEEK_API_KEY
    this.baseURL = config.baseURL || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'
    this.defaultModel = 'deepseek-coder'

    if (!this.apiKey) {
      logger.warn('Deepseek API key not set — this provider will be skipped')
    }

    this.client = new OpenAI({
      apiKey: this.apiKey || 'placeholder',
      baseURL: this.baseURL
    })
  }

  async complete({ prompt, systemPrompt, maxTokens = 2048, temperature = 0.1 }) {
    if (!this.apiKey) throw new Error('Deepseek API key not configured')

    const startTime = Date.now()
    const modelName = this.defaultModel

    const response = await this.client.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt || 'You are an expert Lua and blockchain developer.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: maxTokens,
      temperature
    })

    const latencyMs = Date.now() - startTime
    const usage = response.usage

    tokenCounter.record({
      model: modelName,
      provider: 'deepseek',
      promptTokens: usage?.prompt_tokens || 0,
      completionTokens: usage?.completion_tokens || 0,
      totalTokens: usage?.total_tokens || 0,
      latencyMs
    })

    return {
      content: response.choices[0]?.message?.content || '',
      model: modelName,
      provider: 'deepseek',
      tokensUsed: usage?.total_tokens || 0,
      latencyMs
    }
  }
}
