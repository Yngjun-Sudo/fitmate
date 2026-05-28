# 🇨🇳 FitMate 国内可访问部署指南

> **问题**: `*.vercel.app` 在国内被 DNS 污染/SNI 阻断，前端和后端都无法访问。
> **方案**: 前端部署到 Netlify，后端部署到 Render（新加坡节点），均可从国内正常访问。

---

## 架构变更

```
用户(国内) → Netlify(前端) → Render(后端,新加坡) → Neon(数据库) → DeepSeek(API)
```

---

## 第一步：部署后端到 Render

### 1.1 创建 Render 账号
- 访问 https://render.com
- 用 GitHub 账号登录

### 1.2 创建 Web Service
1. Dashboard → **New** → **Web Service**
2. 选择 `Yngjun-Sudo/fitmate` 仓库
3. 配置：
   - **Name**: `fitmate-server`
   - **Root Directory**: `server` ⚠️ 必须！
   - **Runtime**: Node
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && node dist/index.js`
   - **Region**: Singapore
   - **Plan**: Free

### 1.3 添加环境变量

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `LOCAL_DEV` | `true` |
| `JWT_SECRET` | `fitmate-jwt-secret-2026-production` |
| `DEEPSEEK_API_KEY` | `sk-ab371294817d49b29e2d2e27cd11b5c3` |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` |
| `CORS_ORIGIN` | `https://你的netlify域名.netlify.app,https://fitmate-ashen.vercel.app` |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_W4MaJceKo7Xy@ep-muddy-poetry-aqx19dpb.apirest.c-8.us-east-1.aws.neon.tech:5432/neondb?sslmode=require` |

### 1.4 等待部署完成
- Render 会自动构建和启动
- 记下分配的域名，格式如 `https://fitmate-server-xxxx.onrender.com`
- 测试: `curl https://fitmate-server-xxxx.onrender.com/api/health` 应返回 `{"code":0,...}`

---

## 第二步：部署前端到 Netlify

### 2.1 创建 Netlify 账号
- 访问 https://netlify.com
- 用 GitHub 账号登录

### 2.2 创建站点
1. Dashboard → **Add new site** → **Import an existing project**
2. 选择 `Yngjun-Sudo/fitmate` 仓库
3. 配置：
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist`
   - **Functions directory**: 留空

### 2.3 添加环境变量
在 Site settings → Environment variables 中添加：

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://fitmate-server-xxxx.onrender.com` （替换为第一步的 Render 域名）|

### 2.4 触发重新部署
- 添加环境变量后，点击 **Deploys** → **Trigger deploy** → **Deploy site**
- 记下分配的域名，格式如 `https://fitmate-xxxx.netlify.app`

---

## 第三步：更新 CORS

回到 Render Dashboard → fitmate-server → Environment：
- 更新 `CORS_ORIGIN` 为你的 Netlify 域名:
  ```
  https://fitmate-xxxx.netlify.app,https://fitmate-ashen.vercel.app
  ```
- 保存后 Render 会自动重新部署

---

## 第四步：验证

1. 用国内网络访问 Netlify 域名 → 应能打开页面
2. 注册/登录 → 应能正常工作
3. AI 助手说"帮我制定训练计划" → 应创建计划并显示跳转按钮
4. 点击"查看训练计划"按钮 → 应跳转到训练计划页面

---

## 国内访问速度参考

| 平台 | 延迟 | 可用性 |
|------|------|--------|
| Vercel | 🔴 超时 | 不可用 |
| Netlify | 🟡 200-500ms | 可用 |
| Render(新加坡) | 🟡 100-300ms | 可用 |
| DeepSeek API | 🟢 <100ms | 可用 |

---

## 回退方案

如果 Netlify 也无法访问（罕见情况），可以：
1. 使用 Cloudflare Pages（需自定义域名）
2. 部署到腾讯云/阿里云
3. 使用自定义域名 + Vercel（域名不被 SNI 阻断）
