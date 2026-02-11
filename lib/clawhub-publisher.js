#!/usr/bin/env node
/**
 * ClawHub Skill Publisher
 * 封装 ClawHub 发布流程，处理 token 管理和错误重试
 */

const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');
const execAsync = util.promisify(exec);

class ClawHubPublisher {
  constructor(options = {}) {
    this.token = options.token || process.env.CLAWHUB_TOKEN;
    this.registry = options.registry || 'https://www.clawhub.ai';
    this.site = options.site || 'https://clawhub.ai';
  }

  /**
   * 验证 token 有效性
   */
  async verifyToken() {
    try {
      const { stdout } = await execAsync(
        `curl -s "${this.registry}/api/v1/me" -H "Authorization: Bearer ${this.token}"`,
        { timeout: 10000 }
      );
      const response = JSON.parse(stdout);
      return { valid: true, user: response };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * 登录 ClawHub
   */
  async login() {
    if (!this.token) {
      throw new Error('CLAWHUB_TOKEN not set');
    }

    console.log('[ClawHub] Logging in...');
    
    try {
      // 尝试使用 clawhub CLI
      await execAsync(`echo "${this.token}" | clawdhub login --token --no-browser 2>&1`, {
        timeout: 30000
      });
      console.log('[ClawHub] ✓ Login successful');
      return true;
    } catch (cliError) {
      console.log('[ClawHub] CLI login failed, trying API...');
      
      // 备用：直接 API 验证
      const verifyResult = await this.verifyToken();
      if (verifyResult.valid) {
        console.log('[ClawHub] ✓ API token valid');
        return true;
      } else {
        throw new Error(`Token invalid: ${verifyResult.error}`);
      }
    }
  }

  /**
   * 发布 skill
   */
  async publish(skillPath, options = {}) {
    const {
      slug,
      name,
      version = '1.0.0',
      tags = 'latest',
      changelog = ''
    } = options;

    if (!slug || !name) {
      throw new Error('slug and name are required');
    }

    // 验证 skill 目录
    const skillDir = path.resolve(skillPath);
    const skillMdPath = path.join(skillDir, 'SKILL.md');
    
    if (!fs.existsSync(skillMdPath)) {
      throw new Error(`SKILL.md not found in ${skillDir}`);
    }

    console.log(`[ClawHub] Publishing ${slug} v${version}...`);

    try {
      // 方法1: 使用 clawhub CLI
      const cmd = `clawdhub publish "${skillDir}" \
        --slug "${slug}" \
        --name "${name}" \
        --version "${version}" \
        --tags "${tags}" \
        --changelog "${changelog}" \
        --no-input`;

      const { stdout, stderr } = await execAsync(cmd, { timeout: 60000 });
      
      console.log('[ClawHub] ✓ Published successfully');
      return {
        success: true,
        slug,
        version,
        output: stdout,
        errors: stderr
      };
    } catch (cliError) {
      console.log('[ClawHub] CLI publish failed, trying API...');
      return this.publishViaAPI(skillDir, options);
    }
  }

  /**
   * 批量发布 skills
   */
  async publishAll(skillsDir, options = {}) {
    const skills = fs.readdirSync(skillsDir)
      .filter(dir => fs.existsSync(path.join(skillsDir, dir, 'SKILL.md')));

    console.log(`[ClawHub] Found ${skills.length} skills to publish`);

    const results = [];
    for (const skill of skills) {
      try {
        const result = await this.publish(
          path.join(skillsDir, skill),
          { ...options, slug: skill }
        );
        results.push({ skill, success: true, result });
      } catch (error) {
        results.push({ skill, success: false, error: error.message });
      }
    }

    return results;
  }
}

module.exports = { ClawHubPublisher };

// CLI usage
if (require.main === module) {
  const command = process.argv[2];
  const publisher = new ClawHubPublisher();

  (async () => {
    switch (command) {
      case 'login':
        await publisher.login();
        break;
      case 'publish':
        const [skillPath, slug, name, version] = process.argv.slice(3);
        const result = await publisher.publish(skillPath, { slug, name, version });
        console.log(JSON.stringify(result, null, 2));
        break;
      default:
        console.log(`
ClawHub Publisher CLI

Usage:
  clawhub-publisher login
  clawhub-publisher publish <skill-path> <slug> <name> [version]

Environment:
  CLAWHUB_TOKEN - API token for authentication
`);
    }
  })();
}
