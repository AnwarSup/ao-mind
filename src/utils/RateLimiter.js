/**
 * RateLimiter — Prevent API rate limit errors
 * Token bucket algorithm per provider
 */
export class RateLimiter {
  constructor(config = {}) {
    this.limits = {
      mimo: { rpm: parseInt(process.env.RATE_LIMIT_RPM) || 60, tokens: [] },
      claude: { rpm: 50, tokens: [] },
      openai: { rpm: 60, tokens: [] },
      deepseek: { rpm: 30, tokens: [] }
    }
  }

  async acquire(provider = 'mimo') {
    const limit = this.limits[provider]
    if (!limit) return

    const now = Date.now()
    const windowStart = now - 60000

    // Remove old tokens outside the window
    limit.tokens = limit.tokens.filter(t => t > windowStart)

    if (limit.tokens.length >= limit.rpm) {
      const waitMs = limit.tokens[0] - windowStart
      if (waitMs > 0) {
        await new Promise(r => setTimeout(r, waitMs + 100))
        return this.acquire(provider)
      }
    }

    limit.tokens.push(now)
  }
}

export const rateLimiter = new RateLimiter()
