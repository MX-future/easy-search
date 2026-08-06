// 配置加载：支持 .env 文件（无第三方依赖，轻量解析）
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

module.exports = {
  port: Number(process.env.PORT || 3000),
  githubToken: process.env.GITHUB_TOKEN || '',
  openverseToken: process.env.OPENVERSE_TOKEN || '',
  bingApiKey: process.env.BING_API_KEY || '',
  providerTimeoutMs: Number(process.env.PROVIDER_TIMEOUT_MS || 8000),
};
