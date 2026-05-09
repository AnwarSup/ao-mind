import 'dotenv/config'
import { GameAnalyzer } from './agents/GameAnalyzer.js'
import { ContractAuditor } from './agents/ContractAuditor.js'
import { ContentGenerator } from './agents/ContentGenerator.js'
import { PlayerPredictor } from './agents/PlayerPredictor.js'
import { ModelRouter } from './models/ModelRouter.js'
import { tokenCounter } from './utils/TokenCounter.js'
import { logger } from './utils/Logger.js'

/**
 * AO-Mind Orchestrator
 * Manages all 4 agents and coordinates their execution
 */
export class Orchestrator {
  constructor(config = {}) {
    const router = new ModelRouter({ strategy: config.strategy || 'cost-performance' })

    this.agents = {
      gameAnalyzer:    new GameAnalyzer({ router }),
      contractAuditor: new ContractAuditor({ router }),
      contentGenerator: new ContentGenerator({ router }),
      playerPredictor: new PlayerPredictor({ router })
    }

    logger.info('AO-Mind Orchestrator initialized')
    logger.info(`Model strategy: ${config.strategy || 'cost-performance'}`)
  }

  get game()    { return this.agents.gameAnalyzer }
  get audit()   { return this.agents.contractAuditor }
  get content() { return this.agents.contentGenerator }
  get predict() { return this.agents.playerPredictor }

  stats() {
    return tokenCounter.getSummary()
  }
}

// If run directly: demo all agents
if (process.argv[1].endsWith('orchestrator.js')) {
  const orchestrator = new Orchestrator()
  logger.info('Running AO-Mind demo...')

  // Demo: Game Analysis
  const analysis = await orchestrator.game.analyze({
    game: 'chess',
    state: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
    playerLevel: 'intermediate',
    moveHistory: ['e4', 'c5', 'Nf3']
  })
  logger.info(`Game Analysis: ${analysis.bestMove} — ${analysis.explanation?.substring(0, 80)}...`)
  logger.info(`Tokens used: ${analysis.tokensUsed} | Model: ${analysis.model}`)

  logger.info('\n--- Token Summary ---')
  console.log(JSON.stringify(orchestrator.stats(), null, 2))
}
