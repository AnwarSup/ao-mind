import { ModelRouter } from '../models/ModelRouter.js'
import { ArweaveGraphQL } from '../ao/ArweaveGraphQL.js'
import { logger } from '../utils/Logger.js'

/**
 * PlayerPredictor Agent
 *
 * Tracks on-chain player activity and predicts:
 * - Churn risk (will they stop playing?)
 * - Engagement peaks (when are they most active?)
 * - Game preferences evolution
 * - Skill progression trajectory
 *
 * Fetches data from Arweave GraphQL, runs ML-style behavioral analysis via MiMo.
 */
export class PlayerPredictor {
  constructor(config = {}) {
    this.router = config.router || new ModelRouter({ strategy: 'cost-performance' })
    this.graphql = config.graphql || new ArweaveGraphQL()
    this.predictions = new Map()
    this.alertThresholds = {
      churnRisk: config.churnThreshold || 0.7,
      engagementDrop: config.engagementThreshold || 0.5
    }
  }

  /**
   * Predict player behavior from on-chain data
   * @param {string} playerAddress - Arweave wallet address
   * @param {Object} options
   */
  async predict(playerAddress, options = {}) {
    logger.info(`PlayerPredictor: analyzing ${playerAddress.substring(0, 8)}...`)

    // Fetch on-chain activity
    const onChainData = await this.graphql.getPlayerActivity(playerAddress)

    const prompt = `Analyze this AO/Arweave gaming player's behavioral data and predict their engagement trajectory.

Player address: ${playerAddress.substring(0, 8)}...
On-chain activity (last 30 days):
${JSON.stringify(onChainData, null, 2)}

Analyze and predict:
1. Churn risk score (0.0 to 1.0) — how likely they are to stop playing
2. Engagement trajectory — rising, stable, declining, or at_risk
3. Peak activity windows — when they play most
4. Favorite game pattern
5. Skill progression speed
6. Personalized retention suggestions (what would keep them engaged)

JSON response:
{
  "churnRisk": 0.35,
  "engagementTrajectory": "rising|stable|declining|at_risk",
  "peakHours": [18, 19, 20, 21],
  "favoriteGame": "chess",
  "skillLevel": "intermediate",
  "skillProgressionRate": "fast|moderate|slow",
  "daysUntilChurn": null,
  "retentionSuggestions": ["suggestion1", "suggestion2"],
  "predictedNextSession": "ISO date estimate",
  "confidence": 78,
  "summary": "Brief behavioral summary"
}`

    const result = await this.router.reason(prompt, {
      maxTokens: 1024,
      temperature: 0.3
    })

    let prediction
    try {
      const jsonMatch = result.content.match(/(\{[\s\S]*\})/s)
      prediction = JSON.parse(jsonMatch ? jsonMatch[1] : result.content)
    } catch {
      prediction = { churnRisk: 0.5, engagementTrajectory: 'unknown', summary: result.content }
    }

    const enriched = {
      playerAddress,
      analyzedAt: new Date().toISOString(),
      ...prediction,
      alerts: this._generateAlerts(prediction),
      model: result.model,
      tokensUsed: result.tokensUsed
    }

    this.predictions.set(playerAddress, enriched)
    return enriched
  }

  /**
   * Batch predict for multiple players (e.g., full platform scan)
   */
  async predictBatch(playerAddresses, options = {}) {
    const { concurrency = 5 } = options
    logger.info(`PlayerPredictor: batch predicting ${playerAddresses.length} players`)

    const results = []
    for (let i = 0; i < playerAddresses.length; i += concurrency) {
      const batch = playerAddresses.slice(i, i + concurrency)
      const batchResults = await Promise.allSettled(batch.map(addr => this.predict(addr)))
      results.push(...batchResults.map((r, j) => ({
        playerAddress: batch[j],
        ...(r.status === 'fulfilled' ? r.value : { error: r.reason?.message })
      })))
    }

    return results
  }

  /**
   * Get high-churn-risk players (for retention campaigns)
   */
  async getChurnRiskPlayers(playerAddresses, threshold = null) {
    const predictions = await this.predictBatch(playerAddresses)
    const churnThreshold = threshold || this.alertThresholds.churnRisk
    return predictions
      .filter(p => !p.error && p.churnRisk >= churnThreshold)
      .sort((a, b) => b.churnRisk - a.churnRisk)
  }

  /**
   * Generate platform-wide engagement summary
   */
  async platformSummary(playerAddresses) {
    const predictions = await this.predictBatch(playerAddresses)
    const valid = predictions.filter(p => !p.error)

    const avgChurnRisk = valid.reduce((sum, p) => sum + (p.churnRisk || 0), 0) / valid.length
    const trajectories = valid.reduce((acc, p) => {
      acc[p.engagementTrajectory] = (acc[p.engagementTrajectory] || 0) + 1
      return acc
    }, {})

    return {
      totalAnalyzed: valid.length,
      avgChurnRisk: Math.round(avgChurnRisk * 100) / 100,
      trajectoryBreakdown: trajectories,
      highRiskCount: valid.filter(p => p.churnRisk >= 0.7).length,
      risingEngagement: trajectories.rising || 0,
      generatedAt: new Date().toISOString()
    }
  }

  _generateAlerts(prediction) {
    const alerts = []
    if (prediction.churnRisk >= this.alertThresholds.churnRisk) {
      alerts.push({
        type: 'CHURN_RISK',
        severity: prediction.churnRisk >= 0.9 ? 'CRITICAL' : 'HIGH',
        message: `High churn risk: ${Math.round(prediction.churnRisk * 100)}%`
      })
    }
    if (prediction.engagementTrajectory === 'declining') {
      alerts.push({
        type: 'ENGAGEMENT_DROP',
        severity: 'MEDIUM',
        message: 'Engagement trajectory is declining'
      })
    }
    return alerts
  }
}
