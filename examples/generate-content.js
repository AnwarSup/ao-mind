/**
 * Example: Content Generator
 * Generates social content for Pulse Protocol
 */
import 'dotenv/config'
import { ContentGenerator } from '../src/agents/ContentGenerator.js'

const gen = new ContentGenerator()

console.log('✍️  AO-Mind — Content Generator Example\n')

// Example 1: Leaderboard post (English)
console.log('--- Leaderboard Post (EN) ---')
const leaderboard = await gen.generate({
  type: 'leaderboard',
  game: 'Chess',
  language: 'en',
  data: {
    topPlayers: [
      { name: 'ChessKing_AO', score: 9850, address: '0xabc...' },
      { name: 'StrategyMaster', score: 9200, address: '0xdef...' },
      { name: 'BlitzPlayer99', score: 8800, address: '0xghi...' }
    ]
  }
})
console.log(`Content: ${leaderboard.content}`)
console.log(`Tweet: ${leaderboard.shortVersion}`)
console.log(`Hashtags: ${leaderboard.hashtags?.join(' ')}`)
console.log(`Tokens: ${leaderboard.tokensUsed}\n`)

// Example 2: Achievement unlock (Indonesian)
console.log('--- Achievement Post (ID/Bahasa) ---')
const achievement = await gen.generate({
  type: 'achievement',
  game: 'Pacman',
  language: 'id',
  data: {
    playerName: 'GamerHebat',
    achievement: 'Perfect Score — 100 pellets tanpa mati!'
  }
})
console.log(`Content: ${achievement.content}`)
console.log(`Tokens: ${achievement.tokensUsed}\n`)

// Example 3: Game tip
console.log('--- Game Tip ---')
const tip = await gen.generate({
  type: 'game_tip',
  game: 'Just Slide',
  language: 'en',
  data: {
    topic: 'solving the puzzle faster using corner strategy',
    level: 'intermediate'
  }
})
console.log(`Tip: ${tip.content}`)
console.log(`Tokens: ${tip.tokensUsed}\n`)

// Example 4: Weekly recap
console.log('--- Weekly Recap ---')
const recap = await gen.generate({
  type: 'weekly_recap',
  language: 'en',
  data: {
    stats: {
      gamesPlayed: 3420,
      newPlayers: 147,
      topGame: 'Chess',
      totalTransactions: 8940,
      arweaveBlocks: 1200
    }
  }
})
console.log(`Recap: ${recap.content}`)
console.log(`Tokens: ${recap.tokensUsed}`)
