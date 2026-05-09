/**
 * Example: Contract Auditor
 * Audits a sample Lua AO smart contract
 */
import 'dotenv/config'
import { ContractAuditor } from '../src/agents/ContractAuditor.js'

const auditor = new ContractAuditor()

console.log('🔍 AO-Mind — Contract Auditor Example\n')

// Sample Lua contract with intentional issues (for demo)
const sampleContract = `
-- Game Score Contract for Ctrl Play on AO
local Handlers = require('handlers')
local json = require('json')

Scores = Scores or {}
Admins = Admins or { Owner = ao.env.Process.Owner }

-- Submit a game score
Handlers.add('Submit-Score', function(msg)
  local game = msg.Tags['Game']
  local score = tonumber(msg.Tags['Score'])
  
  -- BUG: No validation on score value (could be negative or nil)
  -- BUG: No deduplication check
  
  if not Scores[msg.From] then
    Scores[msg.From] = {}
  end
  
  table.insert(Scores[msg.From], {
    game = game,
    score = score,
    timestamp = msg.Timestamp
  })
  
  ao.send({ Target = msg.From, Action = 'Score-Accepted', Data = json.encode({ score = score }) })
end)

-- Admin: Reset scores (VULNERABLE: anyone can call this!)
Handlers.add('Reset-Scores', function(msg)
  Scores = {}  -- BUG: Missing sender verification!
  ao.send({ Target = msg.From, Action = 'Scores-Reset' })
end)

-- Get leaderboard
Handlers.add('Get-Leaderboard', function(msg)
  local game = msg.Tags['Game']
  local leaderboard = {}
  
  for addr, games in pairs(Scores) do
    for _, entry in ipairs(games) do
      if entry.game == game then
        table.insert(leaderboard, { address = addr, score = entry.score })
      end
    end
  end
  
  -- Sort by score descending
  table.sort(leaderboard, function(a, b) return a.score > b.score end)
  
  ao.send({ Target = msg.From, Action = 'Leaderboard', Data = json.encode(leaderboard) })
end)
`

// Full audit
console.log('Running full security audit...\n')
const report = await auditor.audit(sampleContract, {
  processId: 'SAMPLE_PROCESS_ID',
  context: 'Game score contract for Ctrl Play gaming hub on AO blockchain',
  strictMode: true
})

console.log(`Audit ID: ${report.auditId}`)
console.log(`Overall Severity: ${report.severity}`)
console.log(`Security Score: ${report.score}/100`)
console.log(`Issues found: ${report.issues.length}`)
console.log(`  CRITICAL: ${report.criticalCount}`)
console.log(`  HIGH: ${report.highCount}`)
console.log(`  MEDIUM: ${report.mediumCount}`)
console.log(`  LOW: ${report.lowCount}`)
console.log()

if (report.issues.length > 0) {
  console.log('Top Issues:')
  report.issues.slice(0, 3).forEach((issue, i) => {
    console.log(`\n[${i+1}] [${issue.severity}] ${issue.title}`)
    console.log(`    ${issue.description}`)
    console.log(`    Fix: ${issue.recommendation}`)
  })
}

console.log(`\nTokens used: ${report.tokensUsed} | Model: ${report.model}`)
console.log(`Latency: ${report.latencyMs}ms`)
