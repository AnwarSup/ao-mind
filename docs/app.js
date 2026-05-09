/* ============================================================
   AO-Mind — Landing Page JS
   Particles, terminal animation, counters, scroll effects
   ============================================================ */

/* ---- PARTICLES ---- */
(function () {
  const canvas = document.getElementById('particles')
  const ctx = canvas.getContext('2d')
  let W, H, particles = []

  function resize() {
    W = canvas.width  = window.innerWidth
    H = canvas.height = window.innerHeight
  }
  window.addEventListener('resize', resize)
  resize()

  class Particle {
    constructor() { this.reset() }
    reset() {
      this.x  = Math.random() * W
      this.y  = Math.random() * H
      this.r  = Math.random() * 1.5 + 0.3
      this.vx = (Math.random() - 0.5) * 0.25
      this.vy = (Math.random() - 0.5) * 0.25
      this.alpha = Math.random() * 0.4 + 0.05
      this.color = Math.random() > 0.6 ? '#7c3aed' : '#06b6d4'
    }
    update() {
      this.x += this.vx
      this.y += this.vy
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset()
    }
    draw() {
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
      ctx.fillStyle = this.color
      ctx.globalAlpha = this.alpha
      ctx.fill()
    }
  }

  for (let i = 0; i < 110; i++) particles.push(new Particle())

  function loop() {
    ctx.clearRect(0, 0, W, H)
    particles.forEach(p => { p.update(); p.draw() })
    // connect close pairs
    ctx.globalAlpha = 1
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const dist = Math.sqrt(dx*dx + dy*dy)
        if (dist < 90) {
          ctx.beginPath()
          ctx.strokeStyle = '#7c3aed'
          ctx.globalAlpha = (1 - dist / 90) * 0.08
          ctx.lineWidth = 0.6
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.stroke()
        }
      }
    }
    ctx.globalAlpha = 1
    requestAnimationFrame(loop)
  }
  loop()
})()


/* ---- NAVBAR scroll effect ---- */
const navbar = document.getElementById('navbar')
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20)
})

/* ---- MOBILE nav toggle ---- */
document.getElementById('navToggle').addEventListener('click', () => {
  document.querySelector('.nav-links').classList.toggle('open')
})


/* ---- TERMINAL ANIMATION ---- */
const termLines = [
  { type: 'info',    text: '  AO-Mind v1.0.0 — Multi-Agent Framework' },
  { type: 'info',    text: '  Initializing Model Router...' },
  { type: 'success', text: '  ✓ MiMo-V2.5-Pro connected' },
  { type: 'success', text: '  ✓ Claude Sonnet connected (fallback)' },
  { type: 'success', text: '  ✓ AO Connector ready (mu.ao-testnet.xyz)' },
  { type: 'info',    text: '' },
  { type: 'purple',  text: '  [GameAnalyzer]     Analyzing chess position...' },
  { type: 'success', text: '  ✓ Best move: d6  Confidence: 91%  Tokens: 1,842' },
  { type: 'purple',  text: '  [ContractAuditor]  Auditing game-scores.lua...' },
  { type: 'amber',   text: '  ⚠ HIGH: Missing sender verification in Reset-Scores' },
  { type: 'success', text: '  ✓ Audit complete — 3 issues found, report saved' },
  { type: 'purple',  text: '  [ContentGenerator] Generating leaderboard post...' },
  { type: 'success', text: '  ✓ Posted to Pulse Protocol — txId: E8gH...iH6g' },
  { type: 'purple',  text: '  [PlayerPredictor]  Analyzing 200 player profiles...' },
  { type: 'success', text: '  ✓ High churn risk: 12 players flagged' },
  { type: 'info',    text: '' },
  { type: 'success', text: '  ─────────────────────────────────────────' },
  { type: 'success', text: '  Total tokens today: 4,823,441 | Uptime: 99.8%' },
]

const terminal = document.getElementById('terminal')
let tIdx = 0

function addLine(line) {
  const div = document.createElement('div')
  div.className = 't-line'
  div.innerHTML = `<span class="t-${line.type}">${escHtml(line.text)}</span>`
  terminal.appendChild(div)
  terminal.scrollTop = terminal.scrollHeight
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

// cursor element
const cursorEl = document.createElement('span')
cursorEl.className = 't-cursor'
terminal.appendChild(cursorEl)

function typeNextLine() {
  if (tIdx >= termLines.length) return
  const line = termLines[tIdx++]
  addLine(line)
  terminal.appendChild(cursorEl)
  setTimeout(typeNextLine, tIdx < 3 ? 300 : 180)
}

// Start when hero is visible
const heroObs = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) { setTimeout(typeNextLine, 800); heroObs.disconnect() }
}, { threshold: 0.3 })
heroObs.observe(document.getElementById('hero'))


/* ---- COUNTER ANIMATION ---- */
function formatNum(n, target) {
  if (target >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  return Math.round(n).toLocaleString()
}

function animateCounter(el, target, suffix, duration = 1800) {
  let start = null
  const step = ts => {
    if (!start) start = ts
    const pct = Math.min((ts - start) / duration, 1)
    const ease = 1 - Math.pow(1 - pct, 3)
    el.textContent = formatNum(target * ease, target) + suffix
    if (pct < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

const statsObs = new IntersectionObserver(entries => {
  if (!entries[0].isIntersecting) return
  statsObs.disconnect()
  document.querySelectorAll('.stat-card').forEach(card => {
    const target = parseInt(card.dataset.target)
    const suffix = card.dataset.suffix || ''
    const el = card.querySelector('.stat-num')
    animateCounter(el, target, suffix)
  })
}, { threshold: 0.3 })
statsObs.observe(document.getElementById('stats'))


/* ---- BAR CHART ANIMATION ---- */
const chartObs = new IntersectionObserver(entries => {
  if (!entries[0].isIntersecting) return
  chartObs.disconnect()
  document.querySelectorAll('.bar-fill').forEach((bar, i) => {
    const finalPct = bar.style.getPropertyValue('--pct')
    bar.style.setProperty('--pct', '0%')
    setTimeout(() => bar.style.setProperty('--pct', finalPct), i * 80 + 200)
  })
}, { threshold: 0.4 })
const usageSection = document.getElementById('usage')
if (usageSection) chartObs.observe(usageSection)


/* ---- SCROLL REVEAL ---- */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1'
      e.target.style.transform = 'translateY(0)'
    }
  })
}, { threshold: 0.1 })

document.querySelectorAll('.agent-card, .step, .stat-card').forEach(el => {
  el.style.opacity = '0'
  el.style.transform = 'translateY(28px)'
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease'
  revealObs.observe(el)
})


/* ---- SMOOTH scroll for nav links ---- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'))
    if (target) {
      e.preventDefault()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      document.querySelector('.nav-links')?.classList.remove('open')
    }
  })
})
