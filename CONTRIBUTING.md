# Contributing to AO-Mind

Thank you for your interest! We welcome contributions of all kinds.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/ao-mind.git`
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env` and add your API keys
5. Create a feature branch: `git checkout -b feat/your-feature`

## Development Guidelines

- Follow existing code style (ES Modules, async/await)
- Add JSDoc comments for public methods
- Include an example in `examples/` for new features
- Test your changes before submitting

## Adding a New Agent

1. Create `src/agents/YourAgent.js`
2. Use `ModelRouter` for all LLM calls
3. Export from `src/index.js`
4. Add an example in `examples/your-agent.js`
5. Document in README.md

## Submitting a PR

- Keep PRs focused — one feature/fix per PR
- Write a clear description of what changed and why
- Reference any related issues

## Questions?

Open an issue or discussion on GitHub.
