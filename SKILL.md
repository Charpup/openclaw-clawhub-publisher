---
name: clawhub-publisher
description: ClawHub skill publisher with token management and retry logic
author: Galatea
version: "1.0.0"
openclaw_version: ">=2026.2.0"
---

# ClawHub Publisher

封装 ClawHub 发布流程，自动处理 token 验证、CLI/API 回退、批量发布。

## 功能

- ✅ **Token 验证** - 自动验证 API token 有效性
- ✅ **双模式发布** - CLI 优先，API 回退
- ✅ **批量发布** - 一键发布多个 skills
- ✅ **错误重试** - 智能重试机制

## 安装

```bash
cd ~/.openclaw/workspace/skills/clawhub-publisher
npm install
```

## 配置

### 1. 设置 Token

```bash
# 方法1: 环境变量
export CLAWHUB_TOKEN="clh_xxxx"

# 方法2: 创建 .env 文件
echo "CLAWHUB_TOKEN=clh_xxxx" > .env
```

**获取 Token**:
1. 访问 https://clawhub.ai
2. 登录 → Settings → API Tokens
3. 生成 CLI token

### 2. 验证登录

```bash
node lib/clawhub-publisher.js login
```

## 使用方法

### 发布单个 skill

```javascript
const { ClawHubPublisher } = require('./lib/clawhub-publisher');

const publisher = new ClawHubPublisher();

// 登录
await publisher.login();

// 发布
const result = await publisher.publish('./my-skill', {
  slug: 'my-skill',
  name: 'My Skill',
  version: '1.0.0',
  tags: 'latest',
  changelog: 'Initial release'
});

console.log(result.url); // https://clawhub.ai/skills/my-skill
```

### CLI 发布

```bash
# 登录
node lib/clawhub-publisher.js login

# 发布
node lib/clawhub-publisher.js publish \
  ./my-skill \
  my-skill \
  "My Skill" \
  1.0.0
```

### 批量发布

```javascript
const results = await publisher.publishAll('./skills', {
  version: '1.0.0',
  tags: 'latest'
});

// results: [{ skill, success, result/error }]
```

## 故障排查

| 问题 | 解决方案 |
|------|----------|
| `Unauthorized` | Token 过期，重新生成 |
| `SKILL.md not found` | 检查 skill 目录结构 |
| CLI 失败 | 自动回退到 API 模式 |

## 工作原理

```
发布流程:
1. 验证 Token
2. 尝试 CLI 发布 (clawdhub publish)
3. CLI 失败 → 回退到 API 发布
4. 返回结果 + URL
```

## License

MIT
