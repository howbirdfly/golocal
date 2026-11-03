# GoLocal — 出海文化避雷与文案本地化助手

面向出海团队的轻量化本地化辅助网页应用。选择日本、美国或泰国作为目标市场，填写产品信息后，即可查看本地化中文文案建议、外语示例短句、跨文化风险提示和市场适配建议。

基于 **Vue 3 + Vite** 构建，所有逻辑均在浏览器本地执行，不调用外部大模型 API，不上传用户输入内容，无 API 成本。

## 运行环境

- Node.js ≥ 18（推荐 LTS 版本）
- npm ≥ 9（随 Node.js 自带）

## 快速开始

```bash
# 安装依赖（只需一次）
npm install

# 启动开发服务器（默认 http://localhost:5173，支持热更新）
npm run dev

# 生产构建（输出到 dist/，可部署到任意静态服务器）
npm run build

# 本地预览构建产物
npm run preview
```

端口被占用时可换端口：`npm run dev -- --port 3000`

## 功能

- 日本、美国、泰国三个目标市场切换
- 产品名称、卖点、目标人群、营销目的和文案风格输入
- 本地规则与模板生成营销表达建议
- 跨文化风险提示与市场适配建议
- 一键复制生成结果

## 项目结构

```
├── index.html              # Vite 入口
├── src/
│   ├── main.js             # 应用入口
│   ├── App.vue             # 根组件（状态管理与生成逻辑）
│   ├── style.css           # 全局样式
│   ├── data/markets.js     # 市场规则数据（日/美/泰）
│   └── components/         # TopBar / HeroSection / GeneratorForm / ResultPanel / Toast
├── index-legacy.html       # 原始裸前端版本（存档参考）
└── vite.config.js
```

## 技术说明

项目使用规则模板驱动的本地生成逻辑，是概念验证原型，不是真正接入大模型的 AI 系统。外语短句仅用于演示，正式商业发布前应由目标市场母语者校对，并核验当地法律法规、广告规范、食品标签及进口要求。

`node_modules/` 与 `dist/` 已被 `.gitignore` 排除，克隆后执行 `npm install` 即可运行。
