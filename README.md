# 🔍 聚合搜索 · 全网资源一站直达

一个**资源聚合搜索**网页应用：输入关键词（如"钢铁侠"），后端并发调用多个数据源，统一整理为正版官方渠道与免费合法资源，前端按分类展示。

> ⚖️ **合规说明**：本应用仅聚合 **正版官方渠道**（B站/腾讯视频/爱奇艺正版观看页、软件官网等）与 **免费合法资源**（开源软件、学术论文、CC 授权素材），不提供任何盗版侵权下载链接与磁力内容。

## ✨ 功能

- **多源聚合**：一次搜索并发查询 5 个数据源，结果去重、分类、排序
- **分类浏览**：全部 / 软件工具 / 影视 / 音乐 / 学术论文 / 图标素材 / 百科文档
- **数据源状态**：每个数据源实时显示 ✓/⚠️ 状态，单源失败不影响整体
- **配置化扩展**：`server/providers/` 下新增一个文件即可接入新数据源

## 🔌 数据源

| 数据源 | 覆盖类型 | 说明 |
|---|---|---|
| GitHub Search API | 开源软件/工具 | 按 Star 排序，显示语言/许可证 |
| OpenAlex API | 学术论文 | 免费无 key，含年份、期刊、被引数 |
| Iconify API | SVG 图标素材 | 海量开源图标，免费可商用 |
| Bing RSS（国内版） | 通用网页 + 正版影视/音乐/软件渠道 | 无需 key，按分类标记正版平台结果 |
| Bing Web Search API | 通用网页（增强） | 可选，配置 key 后启用 |

## 🚀 快速开始

```bash
# 1. 安装依赖（Node >= 18）
npm install

# 2. 启动服务（本地开发）
npm start
# ➜ http://localhost:3000

# 3. 可选：配置 API key（提升限流与搜索能力）
cp .env.example .env
# 编辑 .env，填入 GITHUB_TOKEN / OPENVERSE_TOKEN / BING_API_KEY 等
```

## 🌐 部署到 Netlify

项目已内置 **Netlify Functions** 适配：前端静态文件发布到 `public/`，后端聚合逻辑由 `netlify/functions/` 无服务器函数承载，`/api/*` 请求自动路由到函数，无需额外配置。

### 方式一：GitHub 导入（推荐，支持持续部署）

1. 将项目推送到 GitHub 仓库
2. 登录 [Netlify](https://app.netlify.com) → **Add new site → Import an existing project** → 选择该仓库
3. 构建配置自动读取 `netlify.toml`（publish = `public`，无需构建命令），直接点 **Deploy**
4. 部署完成后，在 **Site settings → Environment variables** 添加：
   - `GITHUB_TOKEN`（强烈建议，匿名 API 限流 10 次/小时）
   - `BING_API_KEY`（可选，增强通用搜索）
5. 之后每次 push 到仓库会自动重新部署

### 方式二：Netlify CLI

```bash
npm i -g netlify-cli
netlify login
netlify deploy --prod   # 首次部署
netlify deploy          # 预览部署（生成临时预览 URL）
```

### 本地验证函数（无需启动 Express）

```bash
node test-functions.js "钢铁侠" all   # 模拟 Netlify 函数调用
```

### Netlify 函数说明

| 路由 | 函数 | 说明 |
|---|---|---|
| `/api/search` | `netlify/functions/search.js` | 聚合搜索（复用 `server/` 全部逻辑） |
| `/api/health` | `netlify/functions/health.js` | 健康检查 |

> ⚠️ Netlify Functions 同步函数最长 **10s**（可配置到 26s）。聚合搜索为并发请求，最慢源约 5s，实测 4~5s 返回，处于安全范围。若后续接入更慢的数据源，可在函数内 `exports.config = { maxDuration: 26 }` 延长超时。

## 📡 API

```
GET /api/search?q=钢铁侠&type=all&limit=12
```

| 参数 | 说明 | 默认 |
|---|---|---|
| `q` | 搜索关键词（必填） | - |
| `type` | `all` `software` `video` `music` `paper` `image` `document` `general` | `all` |
| `limit` | 每源返回条数上限 (1~20) | `12` |

响应结构：

```json
{
  "query": "钢铁侠",
  "type": "all",
  "total": 32,
  "results": [
    {
      "id": "itunes-123",
      "title": "钢铁侠MARK50机器人",
      "type": "software",
      "source": "App Store 正版",
      "url": "https://apps.apple.com/...",
      "desc": "...",
      "meta": "2019 · 免费",
      "image": "https://...artwork.jpg",
      "extra": {}
    }
  ],
  "errors": [],
  "providers": [{ "name": "itunes", "label": "iTunes 正版渠道" }]
}
```

## 🧩 架构

```
resource-search/
├── netlify.toml            # Netlify 部署配置（publish + functions + 路由）
├── netlify/functions/      # Netlify 无服务器函数（search / health）
├── server/
│   ├── index.js            # Express 入口 + 路由（本地开发用）
│   ├── config.js           # 环境变量配置（.env / Netlify Env）
│   ├── search.js           # 聚合调度：并发 / 去重 / 排序 / 降级
│   └── providers/          # 数据源适配器（每源一个文件）
│       ├── github.js       # GitHub 开源（含 403 退避重试）
│       ├── openalex.js     # 学术论文
│       ├── iconify.js      # SVG 图标素材
│       ├── bingrss.js      # Bing 国内版 RSS（正版渠道兜底）
│       ├── bing.js         # Bing API（可选）
│       └── local.js        # 本地爬虫索引数据源
├── crawler/                # 聚焦爬虫（搜索引擎式，合规）
│   ├── crawler.js          # BFS 抓取主流程（robots 遵守/限速/黑名单）
│   ├── config.js           # 种子站点/深度/限速/黑名单配置
│   ├── robots.js           # robots.txt 解析
│   ├── parser.js           # HTML 解析 + 中文 bigram 分词
│   ├── indexer.js          # 倒排索引 + TF-IDF 查询
│   └── store.js            # JSON 持久化
├── data/crawl/index.json   # 爬虫索引（提交入库，Netlify 部署自动带上）
└── public/
    ├── index.html          # 单页应用
    ├── style.css           # 深色科技风样式
    └── app.js              # 搜索/过滤/渲染逻辑
```

## 🕷 爬虫机制（搜索引擎式）

内置一个**合规的聚焦爬虫**：从种子站点广度优先抓取公开页面，解析正文，构建中文倒排索引（bigram 分词 + TF-IDF 相关度），结果接入搜索接口的"本地爬虫索引"数据源。

**合规保障**：
- ✅ 遵守各站点 `robots.txt`（不抓取被禁止的路径）
- ✅ 礼貌限速（同域 ≥1.5s 间隔）、标识 UA 与联系方式
- ✅ 黑名单排除盗版/磁力/影视下载站（域名 + 标题双层过滤）
- ✅ 仅抓取公开页面，只递归同域链接

**使用**：

```bash
# 运行爬虫（种子/深度/限速在 crawler/config.js 配置）
npm run crawl

# 生成的索引会自动接入搜索接口，搜索 "JavaScript" 试试
# 提交 data/crawl/index.json 到仓库后，Netlify 部署自动包含该索引
```

**工作原理**：`抓取 -> 解析(标题/正文/链接) -> 去重 -> 倒排索引 -> TF-IDF 检索`。新增种子站点只需编辑 `crawler/config.js` 的 `SEED_URLS`。

## 🛠 新增一个数据源

1. 在 `server/providers/` 下新建 `xxx.js`，导出 `{ search(query, limit, opts) }`，返回统一结构的结果数组（字段见上）
2. 在 `server/search.js` 的 `PROVIDERS` 和 `TYPE_ROUTES` 中注册
3. 前端自动展示该来源标签，无需改动

## 📝 已知限制

- GitHub 匿名搜索 API 限流 **10 次/小时**（IP 共享），建议在 `.env` / Netlify 环境变量配置 `GITHUB_TOKEN`（提升至 30 次/分）
- arXiv API 在部分网络环境被限流，已由 OpenAlex 替代为主力学术源
- 影视/音乐分类的结果来自 Bing 搜索到的**正版平台页面**（B站/腾讯视频/爱奇艺/网易云等），站内播放与下载需在对应平台操作；本应用不提供任何盗版或磁力下载源
