# 🧠 AO-Mind — Multi-Agent AI Framework for Arweave/AO Blockchain

<div align="center">

![AO-Mind Banner](https://img.shields.io/badge/AO--Mind-Multi--Agent%20AI-blueviolet?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJMMiA3bDEwIDUgMTAtNS0xMC01ek0yIDE3bDEwIDUgMTAtNS0xMC01eiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)](https://nodejs.org/)
[![Built on AO](https://img.shields.io/badge/Built%20on-AO%20%7C%20Arweave-orange)](https://ao.computer/)
[![MiMo Powered](https://img.shields.io/badge/AI-MiMo%20%7C%20Claude%20%7C%20GPT-blue)](https://platform.xiaomimimo.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

**An open-source multi-agent AI framework that brings intelligent automation to the AO (Arweave) blockchain ecosystem — powering smart game analysis, Lua contract auditing, content generation, and on-chain player analytics.**

[📖 Docs](#documentation) · [🚀 Quick Start](#quick-start) · [🤖 Agents](#agents) · [💡 Examples](#examples) · [🤝 Contributing](#contributing)

</div>

---

## 🌟 Why AO-Mind?

The [AO computer](https://ao.computer/) on Arweave is one of the most ambitious decentralized compute platforms — but building intelligent applications on top of it still requires heavy manual effort. AO-Mind bridges this gap by providing **four specialized AI agents** that automate the most repetitive, high-cognitive-load tasks in AO development and gaming.

Currently used in production for **[Ctrl Play](https://ctrlplayfrontend_arlink.arweave.net/)** — a retro gaming hub on AO — AO-Mind processes **~4.8M tokens/day** across a team of 20+ developers and players, saving roughly **35+ hours/week** of manual work.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AO-Mind Core                            │
│                                                                 │
│   ┌──────────────┐    ┌─────────────────────────────────────┐  │
│   │  Model Router│───▶│           Agent Orchestrator        │  │
│   │              │    │                                     │  │
│   │ • MiMo-V2.5  │    │  ┌──────────┐  ┌───────────────┐  │  │
│   │   (Reasoning)│    │  │  Game    │  │    Contract   │  │  │
│   │ • Claude     │    │  │ Analyzer │  │    Auditor    │  │  │
│   │   (Analysis) │    │  └──────────┘  └───────────────┘  │  │
│   │ • GPT-4o     │    │  ┌──────────┐  ┌───────────────┐  │  │
│   │   (Content)  │    │  │ Content  │  │    Player     │  │  │
│   │ • Deepseek   │    │  │Generator │  │   Predictor   │  │  │
│   │   (Codebase) │    │  └──────────┘  └───────────────┘  │  │
│   └──────────────┘    └─────────────────────────────────────┘  │
│                                    │                            │
│                       ┌────────────▼────────────┐              │
│                       │     AO Connector         │              │
│                       │  • Arweave GraphQL       │              │
│                       │  • AO Process Messaging  │              │
│                       │  • Pulse Protocol SDK    │              │
│                       └─────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🤖 Agents

### 1. 🎮 Game Analyzer
Analyzes game states in real-time using **MiMo-V2.5-Pro** for deep reasoning. Supports Chess, Pacman, 4 Cards, and all Ctrl Play games.

- Evaluates board states and recommends optimal moves
- Detects player patterns and adapts difficulty
- Generates post-game analysis reports stored on Arweave
- **Avg consumption**: ~1.4M tokens/day

### 2. 🔍 Contract Auditor
Audits **Lua smart contracts** deployed on AO processes for bugs, logic flaws, and security vulnerabilities.

- Static analysis of Lua code with AI-powered reasoning
- Checks for reentrancy, overflow, and access control issues
- Generates detailed audit reports with severity scores
- Integrates with AO process deployment pipeline
- **Avg consumption**: ~1.1M tokens/day

### 3. ✍️ Content Generator
Auto-generates engaging social posts and game descriptions for the **Pulse Protocol** social graph.

- Creates leaderboard announcements, achievement posts, game tips
- Supports multi-language output (EN, ID, ZH, JP)
- Batch generation for scheduled content pipelines
- **Avg consumption**: ~800K tokens/day

### 4. 📊 Player Predictor
Tracks on-chain player activity and predicts churn, engagement peaks, and behavior patterns.

- Fetches player history from Arweave via GraphQL
- Builds behavioral profiles using token-efficient embeddings
- Sends alerts to AO processes when churn risk is detected
- **Avg consumption**: ~1.5M tokens/day

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- An Arweave wallet (`.json` keyfile)
- API keys: MiMo, Claude (optional), OpenAI (optional)

### Installation

```bash
git clone https://github.com/AnwarSup/ao-mind.git
cd ao-mind
npm install
```

### Configuration

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Required — MiMo API (xiaomimimo)
MIMO_API_KEY=your_mimo_api_key
MIMO_BASE_URL=https://api.xiaomimimo.com/v1

# Optional — Fallback models
CLAUDE_API_KEY=your_claude_key
OPENAI_API_KEY=your_openai_key
DEEPSEEK_API_KEY=your_deepseek_key

# AO / Arweave
ARWEAVE_WALLET_PATH=./wallet.json
AO_GATEWAY=https://mu.ao-testnet.xyz
PULSE_PROCESS_ID=E8gHiH6gpkfFZywTbQj13F9SUH8N9tWrFsgGisOPHV4
```

### Run

```bash
# Analyze a chess game state
node examples/analyze-game.js

# Audit a Lua smart contract
node examples/audit-contract.js

# Generate Pulse Protocol content
node examples/generate-content.js

# Start full agent pipeline
npm run agents
```

---

## 💡 Examples

### Game Analysis

```javascript
import { GameAnalyzer } from './src/agents/GameAnalyzer.js'

const analyzer = new GameAnalyzer()

const result = await analyzer.analyze({
  game: 'chess',
  state: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
  playerLevel: 'intermediate',
  moveHistory: ['e4', 'c5', 'Nf3']
})

console.log(result.bestMove)       // "d6"
console.log(result.explanation)    // Detailed AI reasoning
console.log(result.tokensUsed)     // 1842
```

### Contract Audit

```javascript
import { ContractAuditor } from './src/agents/ContractAuditor.js'
import fs from 'fs'

const auditor = new ContractAuditor()
const luaCode = fs.readFileSync('./contracts/game-scores.lua', 'utf8')

const report = await auditor.audit(luaCode, {
  processId: 'YOUR_AO_PROCESS_ID',
  strictMode: true
})

console.log(report.severity)       // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
console.log(report.issues)         // Array of findings
console.log(report.suggestions)    // AI-generated fix suggestions
```

### Content Generation

```javascript
import { ContentGenerator } from './src/agents/ContentGenerator.js'

const gen = new ContentGenerator()

const post = await gen.generate({
  type: 'leaderboard',
  game: 'Just Slide',
  topPlayers: [
    { name: 'Player1', score: 9850, address: '0xabc...' },
    { name: 'Player2', score: 9200, address: '0xdef...' }
  ],
  language: 'en'
})

// Auto-post to Pulse Protocol
await gen.postToPulse(post)
console.log(post.content)
console.log(post.txId)  // Arweave transaction ID
```

---

## 📊 Token Usage (Production Stats)

> Data from Ctrl Play production deployment, 30-day average

| Agent | Daily Tokens | Primary Model | Use Frequency |
|---|---|---|---|
| Game Analyzer | ~1,400,000 | MiMo-V2.5-Pro | Per game session |
| Contract Auditor | ~1,100,000 | MiMo-V2.5-Pro + Deepseek | Per deploy |
| Content Generator | ~800,000 | MiMo-V2.5 Omni | Hourly |
| Player Predictor | ~1,500,000 | Claude (analysis) | Every 6h |
| **Total** | **~4,800,000** | **Multi-model** | **24/7** |

---

## 🔧 Model Router

AO-Mind's **Model Router** automatically selects the best model for each task based on complexity, speed, and cost:

```javascript
import { ModelRouter } from './src/models/ModelRouter.js'

const router = new ModelRouter({
  strategy: 'cost-performance', // 'speed' | 'quality' | 'cost-performance'
  fallback: true
})

// Router picks MiMo for reasoning tasks (cost-efficient)
const response = await router.complete({
  task: 'reasoning',
  prompt: 'Analyze this chess position...',
  maxTokens: 2048
})

console.log(response.model)     // "mimo-v2.5-pro"
console.log(response.content)
console.log(response.latencyMs) // ~340ms
```

**Routing logic:**
| Task Type | Primary Model | Fallback |
|---|---|---|
| Deep reasoning | MiMo-V2.5-Pro | Claude Opus |
| Code analysis | MiMo-V2.5-Pro + Deepseek | GPT-4o |
| Content gen | MiMo-V2.5 Omni | GPT-4o |
| Player analytics | Claude Sonnet | MiMo-V2.5 |
| Fast completions | MiMo-V2.5 | GPT-4o-mini |

---

## 📁 Project Structure

```
ao-mind/
├── src/
│   ├── agents/
│   │   ├── GameAnalyzer.js       # Chess, Pacman, card game AI
│   │   ├── ContractAuditor.js    # Lua AO contract security analysis
│   │   ├── ContentGenerator.js   # Pulse Protocol content automation
│   │   └── PlayerPredictor.js    # Behavioral analytics + churn detection
│   ├── models/
│   │   ├── MiMoClient.js         # Xiaomi MiMo API wrapper
│   │   ├── ClaudeClient.js       # Anthropic Claude wrapper
│   │   ├── OpenAIClient.js       # OpenAI GPT wrapper
│   │   ├── DeepseekClient.js     # Deepseek wrapper
│   │   └── ModelRouter.js        # Intelligent multi-model routing
│   ├── ao/
│   │   ├── AOConnector.js        # AO process messaging
│   │   ├── ArweaveGraphQL.js     # On-chain data fetching
│   │   └── PulseProtocol.js      # Pulse social graph SDK
│   └── utils/
│       ├── TokenCounter.js       # Token usage tracking
│       ├── Logger.js             # Structured logging
│       └── RateLimiter.js        # API rate limit management
├── examples/
│   ├── analyze-game.js
│   ├── audit-contract.js
│   ├── generate-content.js
│   └── predict-player.js
├── contracts/
│   └── game-scores.lua           # Sample AO Lua contract
├── docs/
│   ├── architecture.md
│   ├── model-routing.md
│   └── ao-integration.md
├── .github/
│   └── workflows/
│       └── ci.yml
├── .env.example
├── package.json
└── README.md
```

---

## 🤝 Contributing

PRs are welcome! Check out [CONTRIBUTING.md](./CONTRIBUTING.md).

1. Fork the repo
2. Create your feature branch: `git checkout -b feat/amazing-agent`
3. Commit: `git commit -m 'feat: add amazing agent'`
4. Push: `git push origin feat/amazing-agent`
5. Open a Pull Request

---

## 📄 License

MIT © [AnwarSup](https://github.com/AnwarSup)

---

<div align="center">
  Built with ❤️ on <a href="https://ao.computer/">AO/Arweave</a> · Powered by <a href="https://platform.xiaomimimo.com/">Xiaomi MiMo</a>, Claude & GPT
</div>
