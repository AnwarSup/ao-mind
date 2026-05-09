import { ModelRouter } from '../models/ModelRouter.js'
import { PulseProtocol } from '../ao/PulseProtocol.js'
import { logger } from '../utils/Logger.js'

const SUPPORTED_TYPES = ['leaderboard', 'achievement', 'announcement', 'game_tip', 'weekly_recap', 'player_spotlight']
const SUPPORTED_LANGUAGES = ['en', 'id', 'zh', 'jp']

/**
 * ContentGenerator Agent
 *
 * Auto-generates engaging social content for Pulse Protocol.
 * Supports leaderboards, achievements, announcements, and game tips.
 * Posts directly to AO via Pulse Protocol SDK.
 */
export class ContentGenerator {
  constructor(config = {}) {
    this.router = config.router || new ModelRouter({ strategy: 'cost-performance' })
    this.pulse = config.pulse || new PulseProtocol()
    this.generatedCount = 0
  }

  /**
   * Generate social content
   * @param {Object} params
   * @param {string} params.type - 'leaderboard' | 'achievement' | 'announcement' | 'game_tip' | 'weekly_recap'
   * @param {string} [params.game] - Game name
   * @param {string} [params.language] - 'en' | 'id' | 'zh' | 'jp'
   * @param {Object} [params.data] - Content-specific data
   */
  async generate({ type, game = null, language = 'en', data = {} }) {
    if (!SUPPORTED_TYPES.includes(type)) {
      throw new Error(`Unsupported content type: ${type}. Use: ${SUPPORTED_TYPES.join(', ')}`)
    }
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      logger.warn(`Unsupported language: ${language}. Defaulting to 'en'`)
      language = 'en'
    }

    logger.info(`ContentGenerator: generating ${type}${game ? ` for ${game}` : ''} [${language}]`)

    const prompt = this._buildPrompt(type, game, language, data)

    const systemPrompt = `You are a creative social media writer for Ctrl Play — a retro gaming hub built on the AO blockchain (Arweave).
Your content is posted to the Pulse Protocol social graph and should be:
- Engaging and exciting for gaming communities
- Appropriate for the target language: ${language}
- Concise (max 280 chars for tweets, up to 500 chars for long-form)
- Include relevant emojis where appropriate
- Reference AO/Arweave blockchain when relevant

Output JSON only.`

    const result = await this.router.generate(prompt, {
      systemPrompt,
      maxTokens: 512,
      temperature: 0.85
    })

    let parsed
    try {
      const jsonMatch = result.content.match(/```json\n?([\s\S]*?)\n?```/) ||
                        result.content.match(/(\{[\s\S]*\})/s)
      parsed = JSON.parse(jsonMatch ? jsonMatch[1] : result.content)
    } catch {
      parsed = { content: result.content, hashtags: [], emojis: [] }
    }

    this.generatedCount++

    return {
      postId: `post_${Date.now()}`,
      type,
      game,
      language,
      content: parsed.content || parsed.text || result.content,
      hashtags: parsed.hashtags || [],
      shortVersion: parsed.shortVersion || parsed.tweet || null,
      generatedAt: new Date().toISOString(),
      model: result.model,
      tokensUsed: result.tokensUsed
    }
  }

  /**
   * Generate and immediately post to Pulse Protocol
   */
  async generateAndPost(params) {
    const post = await this.generate(params)

    try {
      const txId = await this.pulse.submitPost(post.content)
      post.txId = txId
      post.posted = true
      logger.info(`ContentGenerator: posted to Pulse — txId: ${txId}`)
    } catch (err) {
      logger.error(`ContentGenerator: Pulse post failed — ${err.message}`)
      post.posted = false
      post.postError = err.message
    }

    return post
  }

  /**
   * Post existing content directly to Pulse
   */
  async postToPulse(post) {
    return this.pulse.submitPost(post.content || post)
  }

  /**
   * Batch generate multiple posts (e.g., weekly content calendar)
   */
  async generateBatch(items) {
    logger.info(`ContentGenerator: batch generating ${items.length} posts`)
    const results = await Promise.allSettled(items.map(item => this.generate(item)))
    return results.map((r, i) => ({
      index: i,
      ...(r.status === 'fulfilled' ? r.value : { error: r.reason?.message, type: items[i].type })
    }))
  }

  _buildPrompt(type, game, language, data) {
    const langLabel = { en: 'English', id: 'Indonesian (Bahasa Indonesia)', zh: 'Chinese (Simplified)', jp: 'Japanese' }

    const templates = {
      leaderboard: `Create an exciting leaderboard announcement post in ${langLabel[language]} for ${game || 'Ctrl Play'}.
Top players: ${JSON.stringify(data.topPlayers || [{ name: 'Player1', score: 9850 }, { name: 'Player2', score: 9200 }])}
Make it celebratory and competitive.`,

      achievement: `Write an achievement unlock post in ${langLabel[language]}.
Player: ${data.playerName || 'Anonymous'}
Achievement: "${data.achievement || 'First Victory'}"
Game: ${game || 'Ctrl Play'}
Make it feel special and shareable.`,

      announcement: `Write a game/platform announcement in ${langLabel[language]}.
Title: ${data.title || 'New Update!'}
Details: ${data.details || 'Exciting new features have arrived!'}
Keep it hype and informative.`,

      game_tip: `Write an engaging game tip post in ${langLabel[language]} for ${game || 'Ctrl Play'}.
Tip topic: ${data.topic || 'general strategy'}
Target skill level: ${data.level || 'all players'}
Make it educational but fun.`,

      weekly_recap: `Write a weekly recap post in ${langLabel[language]} for Ctrl Play on AO/Arweave.
Week stats: ${JSON.stringify(data.stats || { gamesPlayed: 1240, newPlayers: 87, topGame: 'Chess' })}
Highlight the most exciting moments.`,

      player_spotlight: `Write a player spotlight post in ${langLabel[language]}.
Player: ${data.playerName || 'TopPlayer'}
Stats: ${JSON.stringify(data.stats || { wins: 47, favoriteGame: 'Chess', rank: 3 })}
Make it feel like a featured interview.`
    }

    return `${templates[type]}

Respond in JSON:
{
  "content": "main post content (max 400 chars)",
  "shortVersion": "tweet-length version (max 280 chars)",
  "hashtags": ["hashtag1", "hashtag2"],
  "emojis": ["🎮", "🏆"]
}`
  }
}
