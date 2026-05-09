-- ============================================================
-- game-scores.lua — Ctrl Play Score Contract (AO Process)
-- Audited by AO-Mind ContractAuditor v1.0
-- ============================================================

local json = require('json')

-- State
Scores = Scores or {}
GameRegistry = GameRegistry or {}
Owner = Owner or ao.env.Process.Owner

-- ============================================================
-- Internal helpers
-- ============================================================

local function isOwner(address)
  return address == Owner
end

local function validateScore(score)
  return type(score) == 'number' and score >= 0 and score <= 9999999
end

local function validateGame(game)
  return type(game) == 'string' and #game > 0 and #game <= 50
end

-- ============================================================
-- Handlers
-- ============================================================

-- Register a game (owner only)
Handlers.add('Register-Game', function(msg)
  assert(isOwner(msg.From), 'Unauthorized: only owner can register games')
  
  local game = msg.Tags['Game']
  assert(validateGame(game), 'Invalid game name')
  
  GameRegistry[game] = {
    name = game,
    registeredAt = msg.Timestamp,
    active = true
  }
  
  ao.send({
    Target = msg.From,
    Action = 'Game-Registered',
    Data = json.encode({ game = game })
  })
end)

-- Submit a score
Handlers.add('Submit-Score', function(msg)
  local game = msg.Tags['Game']
  local score = tonumber(msg.Tags['Score'])
  
  assert(validateGame(game), 'Invalid game name')
  assert(validateScore(score), 'Invalid score: must be a number between 0 and 9,999,999')
  assert(GameRegistry[game] and GameRegistry[game].active, 'Game not registered or inactive')
  
  if not Scores[game] then
    Scores[game] = {}
  end
  
  -- Update personal best only (prevent leaderboard spam)
  local existing = Scores[game][msg.From]
  if not existing or score > existing.score then
    Scores[game][msg.From] = {
      score = score,
      submittedAt = msg.Timestamp,
      txId = msg.Id
    }
  end
  
  ao.send({
    Target = msg.From,
    Action = 'Score-Accepted',
    Data = json.encode({
      game = game,
      score = score,
      isPersonalBest = not existing or score > existing.score
    })
  })
end)

-- Get leaderboard for a game
Handlers.add('Get-Leaderboard', function(msg)
  local game = msg.Tags['Game']
  local limit = tonumber(msg.Tags['Limit']) or 10
  
  assert(validateGame(game), 'Invalid game name')
  assert(limit >= 1 and limit <= 100, 'Limit must be between 1 and 100')
  
  local entries = {}
  
  if Scores[game] then
    for address, data in pairs(Scores[game]) do
      table.insert(entries, {
        address = address,
        score = data.score,
        submittedAt = data.submittedAt
      })
    end
  end
  
  -- Sort descending
  table.sort(entries, function(a, b) return a.score > b.score end)
  
  -- Trim to limit
  local result = {}
  for i = 1, math.min(limit, #entries) do
    result[i] = entries[i]
    result[i].rank = i
  end
  
  ao.send({
    Target = msg.From,
    Action = 'Leaderboard',
    Data = json.encode(result)
  })
end)

-- Reset scores for a game (owner only)
Handlers.add('Reset-Game-Scores', function(msg)
  assert(isOwner(msg.From), 'Unauthorized: only owner can reset scores')
  
  local game = msg.Tags['Game']
  assert(validateGame(game), 'Invalid game name')
  
  Scores[game] = {}
  
  ao.send({
    Target = msg.From,
    Action = 'Scores-Reset',
    Data = json.encode({ game = game })
  })
end)

-- Transfer ownership
Handlers.add('Transfer-Ownership', function(msg)
  assert(isOwner(msg.From), 'Unauthorized: only owner can transfer ownership')
  
  local newOwner = msg.Tags['New-Owner']
  assert(type(newOwner) == 'string' and #newOwner > 0, 'Invalid new owner address')
  
  local prevOwner = Owner
  Owner = newOwner
  
  ao.send({
    Target = msg.From,
    Action = 'Ownership-Transferred',
    Data = json.encode({ from = prevOwner, to = newOwner })
  })
end)
