# FitMate 健身APP — 云部署指南

## 架构

```
用户浏览器 → Cloudflare Pages (前端) → Render (后端 API) → Render PostgreSQL
```

## 部署步骤

### 1. 推送代码到 GitHub

```bash
cd C:\Users\Administrator\WorkBuddy\2026-05-24-11-43-54
git init
git add .
git commit -m "FitMate: 云部署适配"
git remote add origin git@github.com:Yngjun-Sudo/fitmate.git
git push -u origin main
```

### 2. Render 部署后端

1. 登录 [Render](https://render.com)
2. 创建 **New PostgreSQL** 数据库：
   - 名称：`fitmate-db`
   - 区域：Singapore
   - 免费版
3. 创建 **New Web Service**：
   - 连接 GitHub 仓库 `Yngjun-Sudo/fitmate`
   - Root Directory: `server`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - 环境变量添加：
     - `DATABASE_URL`（从 Render PostgreSQL 复制连接串）
     - `DEEPSEEK_API_KEY`（`sk-ab371294817d49b29e2d2e27cd11b5c3`）
     - `CORS_ORIGIN`（Cloudflare Pages 域名）

### 3. Cloudflare Pages 部署前端

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Pages → Create → Connect to Git → `Yngjun-Sudo/fitmate`
3. Build settings:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Environment variables:
   - `VITE_API_URL` = Render 后端地址（如 `https://fitmate-server.onrender.com`）

### 4. 验证

访问 Cloudflare Pages 分配的域名，注册账号测试完整流程。

## 环境变量清单

| 服务 | 变量 | 值 |
|------|------|-----|
| Render 后端 | `DATABASE_URL` | PostgreSQL 连接串 |
| Render 后端 | `DEEPSEEK_API_KEY` | `sk-ab371294817d49b29e2d2e27cd11b5c3` |
| Render 后端 | `CORS_ORIGIN` | Cloudflare Pages 域名 |
| Cloudflare Pages | `VITE_API_URL` | Render 后端 URL |

## 本地开发（部署后）

```bash
# 后端（仍用 SQLite）
cd server && npm run dev  # :3001

# 前端
cd client && npm run dev  # :5173
```
