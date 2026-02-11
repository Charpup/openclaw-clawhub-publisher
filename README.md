# OpenClaw ClawHub Publisher

[![OpenClaw Skill](https://img.shields.io/badge/OpenClaw-Skill-blue)](https://clawhub.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> ClawHub skill publisher with token management, retry logic, and CLI-friendly API

## Features

- ✅ **Token Management** - Automatic validation and secure storage
- ✅ **Dual-Mode Publishing** - CLI primary with API fallback
- ✅ **Batch Publishing** - Publish multiple skills at once
- ✅ **Smart Retry** - Exponential backoff on failures
- ✅ **CLI Friendly** - Perfect for automation and CI/CD

## Installation

```bash
git clone https://github.com/Charpup/openclaw-clawhub-publisher.git
cd openclaw-clawhub-publisher
npm install
```

## Quick Start

### 1. Get Token

1. Visit https://clawhub.ai
2. Login → Settings → API Tokens
3. Generate CLI token

### 2. Configure

```bash
export CLAWHUB_TOKEN="clh_your_token_here"
```

### 3. Publish

```bash
# Login
node bin/clawhub-publisher login

# Publish single skill
node bin/clawhub-publisher publish ./my-skill my-skill "My Skill" 1.0.0

# Or use clawhub CLI directly
clawdhub publish . --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

## Usage

### As Library

```javascript
const { ClawHubPublisher } = require('./lib/clawhub-publisher');

const publisher = new ClawHubPublisher({
  token: process.env.CLAWHUB_TOKEN
});

// Login
await publisher.login();

// Publish
const result = await publisher.publish('./my-skill', {
  slug: 'my-skill',
  name: 'My Skill',
  version: '1.0.0',
  tags: 'latest'
});

console.log(result.url); // https://clawhub.ai/skills/my-skill
```

### Batch Publish

```javascript
const results = await publisher.publishAll('./skills', {
  version: '1.0.0',
  tags: 'latest'
});

// results: [{ skill, success, result/error }]
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Unauthorized` | Token expired, regenerate at clawhub.ai |
| `SKILL.md not found` | Check skill directory structure |
| CLI fails | Automatically falls back to API mode |

## License

MIT

## Related

- [ClawHub](https://clawhub.ai) - Skill registry
- [OpenClaw](https://github.com/openclaw/openclaw) - Agent framework
