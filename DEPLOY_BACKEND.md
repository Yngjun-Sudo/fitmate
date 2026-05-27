# FitMate 后端 Vercel 部署指南

## 准备工作

### 1. 确认代码已推送
```bash
cd C:\Users\Administrator\WorkBuddy\2026-05-24-11-43-54
git add .
git commit -m "Prepare backend for Vercel deployment"
git push origin main
```

### 2. 准备 Neon 数据库凭据
- **数据库用户**: `neondb_owner`
- **数据库密码**: `npg_W4MaJceKo7Xy`
- **Host**: `ep-muddy-poetry-aqx19dpb.apirest.c-8.us-east-1.aws.neon.tech`
- **端口**: `5432`
- **数据库名**: `neondb`

**完整连接字符串**:
```
postgresql://neondb_owner:npg_W4MaJceKo7Xy@ep-muddy-poetry-aqx19dpb.apirest.c-8.us-east-1.aws.neon.tech:5432/neondb?sslmode=require
```

---

## Vercel 部署步骤

### 步骤 1: 登录 Vercel
1. 访问 https://vercel.com
2. 点击 "Login" → 选择 "Continue with GitHub"
3. 授权 Vercel 访问你的 GitHub 账号

### 步骤 2: 创建新项目
1. 在 Vercel Dashboard 点击 "Add New..." → "Project"
2. 选择 "Import Git Repository"
3. 找到并选择 `Yngjun-Sudo/fitmate` 仓库
4. **重要**: 点击 "Configure Project" 后，选择 **仅部署 server 目录**

### 步骤 3: 配置项目
在部署配置页面：

#### 3.1 基础设置
- **Framework Preset**: `Other`
- **Root Directory**: `server` ⚠️ **重要！必须设置为 server**
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### 3.2 环境变量
点击 "Environment Variables" 添加以下变量：

| Key | Value | Environment |
|-----|-------|-------------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_W4MaJceKo7Xy@ep-muddy-poetry-aqx19dpb.apirest.c-8.us-east-1.aws.neon.tech:5432/neondb?sslmode=require` | Production, Preview, Development |
| `JWT_SECRET` | `fitmate-jwt-secret-2026-production` | Production, Preview, Development |
| `DEEPSEEK_API_KEY` | `sk-ab371294817d49b29e2d2e27cd11b5c3` | Production, Preview, Development |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` | Production, Preview, Development |
| `CORS_ORIGIN` | `https://fitmate-ashen.vercel.app` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production, Preview, Development |

#### 3.3 高级设置
- **Node.js Version**: `18.x` 或更高
- **Build & Development Settings**:
  - Override "Build Command": `npm run build`
  - Override "Output Directory": `dist`

### 步骤 4: 部署
1. 点击 "Deploy" 按钮
2. 等待构建完成（约 2-3 分钟）
3. 如果构建失败，查看 "Build Logs" 排查错误

---

## 部署后配置

### 1. 运行数据库迁移
部署成功后，需要初始化数据库：

#### 方法 A: 使用 Vercel CLI（推荐）
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 链接项目
cd C:\Users\Administrator\WorkBuddy\2026-05-24-11-43-54\server
vercel link

# 运行 Prisma 迁移
npx prisma migrate deploy --preview-feature
```

#### 方法 B: 使用 Neon Console
1. 访问 https://console.neon.tech
2. 登录并选择你的项目
3. 打开 "SQL Editor"
4. 复制 `prisma/schema.prisma` 的 SQL 并手动执行

#### 方法 C: 本地推送 schema
```bash
# 在本地设置 DATABASE_URL 为 Neon 连接串
$env:DATABASE_URL = "postgresql://neondb_owner:npg_W4MaJceKo7Xy@ep-muddy-poetry-aqx19dpb.apirest.c-8.us-east-1.aws.neon.tech:5432/neondb?sslmode=require"

# 推送 schema
cd C:\Users\Administrator\WorkBuddy\2026-05-24-11-43-54\server
npx prisma db push
```

### 2. 更新 CORS 设置
如果前端域名变更，需要更新后端环境变量：
1. 进入 Vercel 项目设置
2. 点击 "Settings" → "Environment Variables"
3. 编辑 `CORS_ORIGIN` 为前端实际域名

### 3. 测试 API
部署成功后，测试以下端点：

```bash
# 健康检查
curl https://your-backend-url.vercel.app/api/health

# 注册用户
curl -X POST https://your-backend-url.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'
```

---

## 前端部署（如果还未完成）

### Vercel 前端部署
1. 在 Vercel Dashboard 创建新项目
2. **Root Directory**: `client`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Environment Variables**:
   - `VITE_API_URL`: `https://your-backend-url.vercel.app`

---

## 故障排查

### 构建失败
- 检查 `package.json` 的 `build` 脚本是否为 `npx prisma generate && tsc`
- 确认 `vercel.json` 配置正确
- 查看 Build Logs 中的错误信息

### 数据库连接失败
- 确认 `DATABASE_URL` 格式正确（包含 `sslmode=require`）
- 检查 Neon 数据库是否处于活跃状态
- 查看 Vercel Function Logs

### CORS 错误
- 确认 `CORS_ORIGIN` 包含前端完整域名（包括 `https://`）
- 检查前端 `client/src/api/client.ts` 的 `API_BASE` 配置

---

## 快速检查清单

- [ ] 代码已推送到 GitHub
- [ ] Vercel 项目已创建（Root Directory = `server`）
- [ ] 所有环境变量已设置
- [ ] 数据库迁移已运行
- [ ] CORS 已配置
- [ ] 健康检查端点可访问
- [ ] 前端已部署并更新 `VITE_API_URL`

---

## 部署 URL

- **前端**: https://fitmate-ashen.vercel.app
- **后端**: https://your-project-name.vercel.app （部署后获得）
- **数据库**: Neon PostgreSQL (ep-muddy-poetry-aqx19dpb)

---

## 下一步

1. 完成后端部署
2. 运行数据库迁移
3. 更新前端 `.env.production` 的 `VITE_API_URL`
4. 重新部署前端
5. 测试完整功能
