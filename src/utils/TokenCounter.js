/**
 * TokenCounter — Track token usage across all providers
 * Logs daily usage stats for reporting & cost monitoring
 */
class TokenCounter {
  constructor() {
    this.sessions = {}
    this.daily = {}
    this.startTime = Date.now()
  }

  record({ model, provider, promptTokens, completionTokens, totalTokens, latencyMs }) {
    const today = new Date().toISOString().split('T')[0]

    if (!this.daily[today]) {
      this.daily[today] = { total: 0, byProvider: {}, byModel: {}, requests: 0 }
    }

    const day = this.daily[today]
    day.total += totalTokens
    day.requests++
    day.byProvider[provider] = (day.byProvider[provider] || 0) + totalTokens
    day.byModel[model] = (day.byModel[model] || 0) + totalTokens

    if (process.env.LOG_TOKEN_USAGE === 'true') {
      const uptimeHours = (Date.now() - this.startTime) / 3600000
      const projectedDaily = uptimeHours > 0 ? Math.round(day.total / uptimeHours * 24) : 0
      console.debug(`[Tokens] Today: ${day.total.toLocaleString()} | Projected/day: ${projectedDaily.toLocaleString()}`)
    }
  }

  getToday() {
    const today = new Date().toISOString().split('T')[0]
    return this.daily[today] || { total: 0, byProvider: {}, byModel: {}, requests: 0 }
  }

  getSummary() {
    const allDays = Object.values(this.daily)
    const totalTokens = allDays.reduce((s, d) => s + d.total, 0)
    const totalRequests = allDays.reduce((s, d) => s + d.requests, 0)

    return {
      totalTokens,
      totalRequests,
      avgTokensPerRequest: totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0,
      dailyBreakdown: this.daily,
      uptimeHours: Math.round((Date.now() - this.startTime) / 3600000 * 10) / 10
    }
  }
}

export const tokenCounter = new TokenCounter()
