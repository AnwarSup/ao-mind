import { ModelRouter } from '../models/ModelRouter.js'
import { logger } from '../utils/Logger.js'

const SEVERITY_LEVELS = ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

/**
 * ContractAuditor Agent
 *
 * Audits Lua smart contracts deployed on AO processes.
 * Detects logic flaws, security vulnerabilities, and gas inefficiencies.
 * Generates structured audit reports with severity scores.
 */
export class ContractAuditor {
  constructor(config = {}) {
    this.router = config.router || new ModelRouter({ strategy: 'cost-performance' })
    this.auditHistory = []
  }

  /**
   * Audit a Lua smart contract
   * @param {string} luaCode - The Lua source code to audit
   * @param {Object} options
   * @param {string} [options.processId] - AO Process ID (for context)
   * @param {boolean} [options.strictMode] - Enable strict security checks
   * @param {string} [options.context] - Additional context about the contract
   */
  async audit(luaCode, options = {}) {
    const { processId, strictMode = false, context = '' } = options

    logger.info(`ContractAuditor: auditing contract${processId ? ` [${processId}]` : ''} (${luaCode.length} chars)`)

    const systemPrompt = `You are an expert AO/Arweave Lua smart contract security auditor.
You specialize in:
1. Identifying security vulnerabilities in Lua code running on AO processes
2. Detecting logic errors, edge cases, and potential exploits
3. Checking for proper message handling, handler registration, and state management
4. Reviewing token contract patterns (transfer, mint, burn, balances)
5. Assessing gas/compute efficiency

Common AO-specific issues to check:
- Missing sender verification (msg.From validation)
- Reentrancy via ao.send() in handlers
- Integer overflow in token arithmetic
- Unguarded admin functions
- Missing error handling in handlers
- State mutation without proper guards
- Incorrect use of ao.env and ao.id

Respond ONLY in valid JSON format.`

    const prompt = `Audit this AO Lua smart contract${context ? ` (Context: ${context})` : ''}:

\`\`\`lua
${luaCode}
\`\`\`

${strictMode ? 'STRICT MODE: Flag even minor issues.' : ''}

Provide a comprehensive audit in this JSON format:
{
  "summary": "Brief overall assessment",
  "severity": "INFO|LOW|MEDIUM|HIGH|CRITICAL",
  "score": 85,
  "issues": [
    {
      "id": "ISSUE-001",
      "severity": "HIGH",
      "title": "Issue title",
      "description": "Detailed description",
      "lineNumber": 42,
      "code": "relevant code snippet",
      "recommendation": "How to fix it",
      "references": ["AO docs reference"]
    }
  ],
  "strengths": ["What the contract does well"],
  "suggestions": ["General improvement suggestions"],
  "gasAnalysis": "Notes on compute efficiency",
  "overallRisk": "Assessment of deploying this contract"
}`

    // Use MiMo-Pro + Deepseek for code analysis
    const mimoResult = await this.router.analyzeCode(prompt, {
      systemPrompt,
      maxTokens: 3000,
      temperature: 0.1
    })

    let parsed
    try {
      const jsonMatch = mimoResult.content.match(/```json\n?([\s\S]*?)\n?```/) ||
                        mimoResult.content.match(/(\{[\s\S]*\})/s)
      parsed = JSON.parse(jsonMatch ? jsonMatch[1] : mimoResult.content)
    } catch {
      logger.warn('Failed to parse audit JSON, returning raw content')
      parsed = {
        summary: mimoResult.content,
        severity: 'UNKNOWN',
        score: 0,
        issues: [],
        strengths: [],
        suggestions: []
      }
    }

    const report = {
      auditId: `audit_${Date.now()}`,
      processId: processId || null,
      auditedAt: new Date().toISOString(),
      linesOfCode: luaCode.split('\n').length,
      severity: parsed.severity || 'INFO',
      score: parsed.score || 100,
      summary: parsed.summary || '',
      issues: (parsed.issues || []).sort((a, b) =>
        SEVERITY_LEVELS.indexOf(b.severity) - SEVERITY_LEVELS.indexOf(a.severity)
      ),
      criticalCount: (parsed.issues || []).filter(i => i.severity === 'CRITICAL').length,
      highCount: (parsed.issues || []).filter(i => i.severity === 'HIGH').length,
      mediumCount: (parsed.issues || []).filter(i => i.severity === 'MEDIUM').length,
      lowCount: (parsed.issues || []).filter(i => i.severity === 'LOW').length,
      strengths: parsed.strengths || [],
      suggestions: parsed.suggestions || [],
      gasAnalysis: parsed.gasAnalysis || '',
      overallRisk: parsed.overallRisk || '',
      model: mimoResult.model,
      tokensUsed: mimoResult.tokensUsed,
      latencyMs: mimoResult.latencyMs
    }

    this.auditHistory.push({
      auditId: report.auditId,
      processId,
      severity: report.severity,
      issueCount: report.issues.length,
      tokensUsed: report.tokensUsed
    })

    logger.info(`ContractAuditor: audit complete — severity: ${report.severity}, issues: ${report.issues.length}`)
    return report
  }

  /**
   * Quick security check (faster, lower token usage)
   */
  async quickCheck(luaCode) {
    const prompt = `Quick security scan of this AO Lua contract. List only CRITICAL and HIGH severity issues:

\`\`\`lua
${luaCode.substring(0, 2000)}${luaCode.length > 2000 ? '\n... (truncated)' : ''}
\`\`\`

JSON response: { "hasCritical": bool, "issues": [{ "severity": "HIGH|CRITICAL", "title": "...", "line": N }] }`

    const result = await this.router.analyzeCode(prompt, { maxTokens: 512, temperature: 0.1 })

    try {
      const jsonMatch = result.content.match(/(\{[\s\S]*\})/s)
      return JSON.parse(jsonMatch ? jsonMatch[1] : result.content)
    } catch {
      return { hasCritical: false, issues: [], raw: result.content }
    }
  }

  getAuditHistory() {
    return this.auditHistory
  }
}
