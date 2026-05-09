/**
 * Example: Player Predictor
 * Analyzes player behavior from on-chain Arweave data
 */
import 'dotenv/config'
import { PlayerPredictor } from '../src/agents/PlayerPredictor.js'

const predictor = new PlayerPredictor({ churnThreshold: 0.65 })

console.log('📊 AO-Mind — Player Predictor Example\n')

// Example player address (replace with real Arweave address)
const playerAddress = 'MlV6DeOtRmakDOf6vgOBlif795tcWimgyPsYYNQ8q1Y'

console.log(`Analyzing player: ${playerAddress.substring(0, 12)}...\n`)

const prediction = await predictor.predict(playerAddress)

console.log(`Churn Risk: ${Math.round(prediction.churnRisk * 100)}%`)
console.log(`Engagement: ${prediction.engagementTrajectory}`)
console.log(`Favorite Game: ${prediction.favoriteGame}`)
console.log(`Peak Hours: ${prediction.peakHours?.join(', ')}:00`)
console.log(`Skill Level: ${prediction.skillLevel}`)
console.log(`Confidence: ${prediction.confidence}%`)
console.log()

if (prediction.alerts?.length > 0) {
  console.log('⚠️  Alerts:')
  prediction.alerts.forEach(alert => {
    console.log(`  [${alert.severity}] ${alert.message}`)
  })
  console.log()
}

console.log('Retention Suggestions:')
prediction.retentionSuggestions?.forEach((s, i) => {
  console.log(`  ${i+1}. ${s}`)
})

console.log(`\nTokens used: ${prediction.tokensUsed} | Model: ${prediction.model}`)
