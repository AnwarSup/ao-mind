import axios from 'axios'
import { logger } from '../utils/Logger.js'

const ARWEAVE_GATEWAY = 'https://arweave.net/graphql'

/**
 * ArweaveGraphQL — Fetch on-chain data from Arweave
 * Used by PlayerPredictor to get player activity history
 */
export class ArweaveGraphQL {
  constructor(config = {}) {
    this.gateway = config.gateway || ARWEAVE_GATEWAY
  }

  async query(gqlQuery, variables = {}) {
    try {
      const response = await axios.post(this.gateway, {
        query: gqlQuery,
        variables
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      })
      return response.data?.data || {}
    } catch (err) {
      logger.error(`ArweaveGraphQL query failed: ${err.message}`)
      return {}
    }
  }

  /**
   * Get player activity from Arweave transactions
   */
  async getPlayerActivity(playerAddress, limit = 100) {
    const gql = `
      query GetPlayerActivity($address: String!, $limit: Int!) {
        transactions(
          owners: [$address]
          tags: [{ name: "App-Name", values: ["CtrlPlay", "ao-mind"] }]
          first: $limit
          sort: HEIGHT_DESC
        ) {
          edges {
            node {
              id
              block { timestamp height }
              tags { name value }
            }
          }
        }
      }
    `

    const data = await this.query(gql, { address: playerAddress, limit })
    const edges = data?.transactions?.edges || []

    // Process transactions into activity summary
    const sessions = edges.map(e => ({
      txId: e.node.id,
      timestamp: e.node.block?.timestamp,
      blockHeight: e.node.block?.height,
      tags: Object.fromEntries((e.node.tags || []).map(t => [t.name, t.value]))
    }))

    // Build activity profile
    const gameFrequency = {}
    const hourlyActivity = new Array(24).fill(0)
    const weeklyActivity = []

    for (const session of sessions) {
      const game = session.tags['Game'] || 'unknown'
      gameFrequency[game] = (gameFrequency[game] || 0) + 1

      if (session.timestamp) {
        const date = new Date(session.timestamp * 1000)
        hourlyActivity[date.getUTCHours()]++
        weeklyActivity.push(date.toISOString().split('T')[0])
      }
    }

    const recentDays = new Set(weeklyActivity.slice(0, 20)).size
    const totalSessions = sessions.length

    return {
      playerAddress,
      totalSessions,
      sessionLast7Days: weeklyActivity.filter(d => {
        const diff = (Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24)
        return diff <= 7
      }).length,
      sessionLast30Days: totalSessions,
      activeDaysLast30: recentDays,
      gameFrequency,
      topGame: Object.entries(gameFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown',
      peakHours: hourlyActivity
        .map((count, hour) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(h => h.hour),
      firstSeen: sessions[sessions.length - 1]?.timestamp,
      lastSeen: sessions[0]?.timestamp,
      rawSessions: sessions.slice(0, 20) // last 20 for context
    }
  }

  /**
   * Get recent game scores from Pulse Protocol process
   */
  async getLeaderboard(processId, game, limit = 10) {
    const gql = `
      query GetLeaderboard($process: String!, $limit: Int!) {
        transactions(
          tags: [
            { name: "App-Name", values: ["CtrlPlay"] }
            { name: "Action", values: ["Submit-Score"] }
          ]
          recipients: [$process]
          first: $limit
          sort: HEIGHT_DESC
        ) {
          edges {
            node {
              id
              owner { address }
              tags { name value }
            }
          }
        }
      }
    `

    const data = await this.query(gql, { process: processId, limit })
    const edges = data?.transactions?.edges || []

    return edges
      .map(e => {
        const tags = Object.fromEntries((e.node.tags || []).map(t => [t.name, t.value]))
        return {
          playerAddress: e.node.owner?.address,
          score: parseInt(tags['Score'] || '0'),
          game: tags['Game'] || game,
          txId: e.node.id
        }
      })
      .sort((a, b) => b.score - a.score)
  }
}
