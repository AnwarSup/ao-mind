import { ModelRouter } from '../models/ModelRouter.js'
import { logger } from '../utils/Logger.js'

const SUPPORTED_GAMES = ['chess', 'pacman', '4cards', 'justslide', 'weaveword', 'generic']

/**
 * GameAnalyzer Agent
 *
 * Analyzes game states in real-time using MiMo-V2.5-Pro.
 * Returns best moves, tactical explanations, and player-level tips.
 * Works with all Ctrl Play games on AO/Arweave.
 */
export class GameAnalyzer {
  constructor(config = {}) {
    this.router = config.router || new ModelRouter({ strategy: 'cost-performance' })
    this.sessionStats = { totalAnalyses: 0, totalTokens: 0 }
  }

  /**
   * Analyze a game state
   * @param {Object} params
   * @param {string} params.game - 'chess' | 'pacman' | '4cards' | 'justslide' | 'weaveword'
   * @param {string} params.state - Game state (FEN for chess, JSON for others)
   * @param {string} [params.playerLevel] - 'beginner' | 'intermediate' | 'advanced'
   * @param {string[]} [params.moveHistory] - Previous moves
   * @param {string} [params.objective] - 'best_move' | 'explain' | 'full_analysis'
   */
  async analyze({ game, state, playerLevel = 'intermediate', moveHistory = [], objective = 'full_analysis' }) {
    if (!SUPPORTED_GAMES.includes(game.toLowerCase())) {
      logger.warn(`Unknown game type: ${game}. Using generic analyzer.`)
      game = 'generic'
    }

    const prompt = this._buildPrompt(game, state, playerLevel, moveHistory, objective)

    const systemPrompt = `You are an expert AI game analyst for the Ctrl Play gaming platform built on the AO blockchain (Arweave). 
Your role is to analyze game states and provide:
1. The optimal next move or action
2. A clear tactical explanation suited to the player's level
3. Pattern detection from move history
4. A confidence score (0-100)

Always respond in valid JSON format.`

    logger.info(`GameAnalyzer: analyzing ${game} state [${playerLevel}]`)

    const result = await this.router.reason(prompt, {
      systemPrompt,
      maxTokens: 1024,
      temperature: 0.2
    })

    this.sessionStats.totalAnalyses++
    this.sessionStats.totalTokens += result.tokensUsed

    let parsed
    try {
      const jsonMatch = result.content.match(/```json\n?([\s\S]*?)\n?```/) ||
                        result.content.match(/(\{[\s\S]*\})/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[1] : result.content)
    } catch {
      parsed = { bestMove: null, explanation: result.content, confidence: 0 }
    }

    return {
      game,
      playerLevel,
      bestMove: parsed.bestMove || parsed.best_move || null,
      explanation: parsed.explanation || parsed.reasoning || '',
      alternatives: parsed.alternatives || [],
      confidence: parsed.confidence || 0,
      patterns: parsed.patterns || [],
      tips: parsed.tips || [],
      model: result.model,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs
    }
  }

  /**
   * Batch analyze multiple game sessions (efficient for leaderboard processing)
   */
  async analyzeBatch(sessions) {
    logger.info(`GameAnalyzer: batch analyzing ${sessions.length} sessions`)
    const results = await Promise.allSettled(sessions.map(s => this.analyze(s)))
    return results.map((r, i) => ({
      sessionId: sessions[i].sessionId || i,
      ...(r.status === 'fulfilled' ? r.value : { error: r.reason?.message })
    }))
  }

  /**
   * Generate post-game analysis report (stored on Arweave)
   */
  async generateReport({ game, moves, winner, duration, playerAddresses }) {
    const prompt = `Generate a comprehensive post-game analysis report for a ${game} game.
Game data:
- Moves played: ${JSON.stringify(moves)}
- Winner: ${winner}
- Duration: ${duration} seconds
- Players: ${JSON.stringify(playerAddresses)}

Include: key turning points, mistakes, missed opportunities, skill assessment, and improvement suggestions.
Format as JSON with fields: summary, turningPoints, mistakes, skillRatings, suggestions.`

    const result = await this.router.reason(prompt, { maxTokens: 2048 })

    return {
      reportId: `report_${Date.now()}`,
      game,
      winner,
      generatedAt: new Date().toISOString(),
      content: result.content,
      tokensUsed: result.tokensUsed
    }
  }

  _buildPrompt(game, state, playerLevel, moveHistory, objective) {
    const gameInstructions = {
      chess: `Chess game (FEN notation). Current position: ${state}`,
      pacman: `Pacman game. Current state: ${JSON.stringify(state)}`,
      '4cards': `4 Cards game. Current hand/state: ${JSON.stringify(state)}`,
      justslide: `Just Slide puzzle. Current board: ${JSON.stringify(state)}`,
      weaveword: `Weave Word game. Current letters/state: ${JSON.stringify(state)}`,
      generic: `Game state: ${JSON.stringify(state)}`
    }

    return `
${gameInstructions[game] || gameInstructions.generic}

Player level: ${playerLevel}
Move history: ${moveHistory.length > 0 ? moveHistory.join(', ') : 'No previous moves'}
Objective: ${objective}

Analyze this game state and provide a JSON response with:
{
  "bestMove": "the recommended move",
  "explanation": "why this is the best move (adapted to ${playerLevel} level)",
  "alternatives": ["alternative1", "alternative2"],
  "confidence": 85,
  "patterns": ["pattern detected from history"],
  "tips": ["tip for improvement"]
}
`
  }

  getStats() {
    return this.sessionStats
  }
}
