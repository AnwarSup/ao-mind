/**
 * Example: Game Analysis
 * Analyzes a chess position using MiMo-V2.5-Pro
 */
import 'dotenv/config'
import { GameAnalyzer } from '../src/agents/GameAnalyzer.js'

const analyzer = new GameAnalyzer()

console.log('🎮 AO-Mind — Game Analyzer Example\n')

// Example 1: Chess position analysis
console.log('--- Chess Analysis ---')
const chessResult = await analyzer.analyze({
  game: 'chess',
  state: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
  playerLevel: 'intermediate',
  moveHistory: ['e4', 'c5', 'Nf3'],
  objective: 'full_analysis'
})

console.log(`Best Move: ${chessResult.bestMove}`)
console.log(`Explanation: ${chessResult.explanation}`)
console.log(`Confidence: ${chessResult.confidence}%`)
console.log(`Tokens used: ${chessResult.tokensUsed} | Model: ${chessResult.model}`)
console.log(`Latency: ${chessResult.latencyMs}ms\n`)

// Example 2: Beginner tips
console.log('--- Beginner Tips ---')
const beginnerResult = await analyzer.analyze({
  game: 'chess',
  state: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
  playerLevel: 'beginner',
  objective: 'explain'
})

console.log(`Tip: ${beginnerResult.tips?.join(' | ')}`)
console.log(`Tokens: ${beginnerResult.tokensUsed}\n`)

// Session stats
const stats = analyzer.getStats()
console.log(`--- Session Stats ---`)
console.log(`Total analyses: ${stats.totalAnalyses}`)
console.log(`Total tokens: ${stats.totalTokens.toLocaleString()}`)
