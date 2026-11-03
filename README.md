# GoLocal — 出海文化避雷与文案本地化助手

面向出海团队的轻量化本地化辅助网页应用。输入任意目标国家或市场，填写产品信息，并通过可自由输入和组合的标签描述目标人群、营销目的与文案风格，即可生成本地化文案建议、跨文化风险提示与市场适配建议。

基于 **Vue 3 + Vite** 构建，方案生成由 **Kimi（Moonshot）大模型 API** 提供。

## 运行环境

- Node.js ≥ 18（推荐 LTS 版本）
- npm ≥ 9（随 Node.js 自带）

## 本地运行

```bash
npm install
npm run dev
```

打开终端输出的本地地址，默认为 `http://127.0.0.1:5173/`。

本地使用前复制 `.env.example` 为 `.env`（或 `.env.local`），填写服务端 Key：

```env
LLM_API_KEY=sk-...
LLM_PROVIDER_NAME=Kimi
LLM_BASE_URL=https://api.moonshot.cn/v1
LLM_MODEL=kimi-k3.1-pro-highspeed
LLM_MAX_TOKENS=8000
```

密钥只在 Vite 本地服务的服务端代码中读取，不会进入前端构建产物。页面不提供 Key 输入框，访客无需自行配置。

> 兼容说明：代码同时识别旧的 `DEEPSEEK_API_KEY` 等变量名，且任何 OpenAI 兼容协议的服务商都可接入，只需修改 `LLM_BASE_URL` 与 `LLM_MODEL`。

## 部署到 Vercel

项目通过单个 Serverless Function `api/generate.js` 提供 `/api/generate` 接口，Key 只保存在 Vercel 环境变量中。

1. 在 Vercel 导入本仓库。
2. 在项目的 Environment Variables 中添加：
   - `LLM_API_KEY`：你的 Moonshot API Key
   - `LLM_BASE_URL`：可选，默认 `https://api.moonshot.cn/v1`
   - `LLM_MODEL`：可选，默认 `kimi-k3.1-pro-highspeed`
   - `LLM_MAX_TOKENS`：可选，默认 `8000`
3. 重新部署。

也可以使用 CLI：

```bash
npx vercel
npx vercel env add LLM_API_KEY production
npx vercel --prod
```

`vercel.json` 已将该函数的执行时间上限设置为 60 秒。

## 功能

- 自由输入任意目标国家或市场
- 产品名称、卖点输入
- 目标人群、营销目的、文案风格支持建议项选择和自由输入
- SSE 流式展示生成进度和文案预览
- Kimi（Moonshot）大模型生成本地化文案、外语参考与市场适配建议
- JSON 结构化输出与运行时字段校验
- 跨文化风险提示
- 一键复制生成结果

## 项目结构

```
├── api/
│   └── generate.js         # Vercel Serverless Function 入口
├── server/
│   └── ai-proxy.js         # 上游模型请求、Prompt、流式解析与数据校验
├── src/
│   ├── App.vue             # 根组件（状态管理与生成流程）
│   ├── services/ai.js      # 前端 SSE 流读取与结果解析
│   ├── styles/             # variables / base / layout 分层样式
│   └── components/         # TopBar / HeroSection / GeneratorForm / ResultPanel / Toast / TagInput
├── .env.example            # 本地服务端环境变量示例
├── vercel.json             # Serverless Function 配置
└── vite.config.js          # Vite 配置与本地 API 中间件
```

## 安全说明

- 模型 API Key 仅从服务端环境变量读取，前端代码和浏览器网络请求中不包含 Key。
- `/api/generate` 只接受固定表单结构，并限制输入长度、模型和输出 token 范围。
- 模型输出采用 JSON Object 模式，并在服务端校验和裁剪字段，避免异常结构进入前端。
- 公开部署后，任何人都可以调用该接口并消耗你的模型额度。面向公众开放时，建议在 Vercel 配置限流、用量告警或访问认证。

## 技术说明

AI 结果仅用于创意演示与初步参考，不构成专业翻译、法律或市场准入意见。外语内容正式发布前应由目标市场母语者校对，并核验当地法律法规、广告规范、食品标签及进口要求。
