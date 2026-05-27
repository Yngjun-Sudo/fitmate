# 🚀 FitMate 后端一键部署指南

## ✅ 已完成的准备工作

1. ✅ 代码已准备好（87个文件，37个API接口）
2. ✅ 后端已适配 Vercel serverless 格式
3. ✅ 数据库 schema 已配置（PostgreSQL + Prisma）
4. ✅ 代码已推送到 GitHub: https://github.com/Yngjun-Sudo/fitmate

---

## 🎯 你需要在 Vercel Dashboard 完成 3 个步骤

### 步骤 1️⃣: 部署后端（5分钟）

#### 1.1 访问 Vercel
1. 打开 https://vercel.com
2. 点击 "Login" → 选择 "Continue with GitHub"
3. 授权登录

#### 1.2 导入项目
1. 点击 "Add New..." → "Project"
2. 选择 "Import Git Repository"
3. 找到 `Yngjun-Sudo/fitmate` 仓库
4. 点击 "Import"

#### 1.3 关键配置（⚠️ 重要！）
在配置页面设置：

| 配置项 | 值 |
|--------|-----|
| **Root Directory** | `server` ⚠️ 必须改成 server！ |
| **Framework Preset** | `Other` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

#### 1.4 设置环境变量
点击 "Environment Variables" 按钮，添加以下 6 个变量：

| Key | Value | 说明 |
|-----|-------|------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_W4MaJceKo7Xy@ep-muddy-poetry-aqx19dpb.apirest.c-8.us-east-1.aws.neon.tech:5432/neondb?sslmode=require` | Neon 数据库连接串 |
| `JWT_SECRET` | `fitmate-jwt-secret-2026-production` | JWT 签名密钥 |
| `DEEPSEEK_API_KEY` | `sk-ab371294817d49b29e2d2e27cd11b5c3` | DeepSeek API 密钥 |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` | DeepSeek API 地址 |
| `CORS_ORIGIN` | `https://fitmate-ashen.vercel.app` | 前端域名（已部署） |
| `NODE_ENV` | `production` | 生产环境标识 |

**⚠️ 重要**：每个变量都要选择环境（Production、Preview、Development），建议三个都选。

#### 1.5 开始部署
1. 确认所有配置正确
2. 点击蓝色的 "Deploy" 按钮
3. 等待 2-3 分钟构建
4. 看到 "Congratulations!" 表示部署成功！

#### 1.6 记录后端 URL
部署成功后会显示类似这样的 URL：
```
https://fitmate-server.vercel.app
```

**⚠️ 复制并保存这个 URL！后面要用到。**

---

### 步骤 2️⃣: 初始化数据库（3分钟）

#### 方法 A：使用 Neon Console（最简单）

1. 打开 https://console.neon.tech
2. 登录并选择你的项目
3. 点击左侧 "SQL Editor"
4. 复制下面的 SQL 并粘贴到编辑器：

```sql
-- 创建用户表
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  name TEXT NOT NULL,
  heightCm REAL,
  weightKg REAL,
  birthDate TIMESTAMP,
  gender TEXT,
  goal TEXT,
  activityLevel TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建运动项目表
CREATE TABLE IF NOT EXISTS "Exercise" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL,
  muscleGroup TEXT NOT NULL,
  equipment TEXT DEFAULT '',
  difficulty TEXT DEFAULT 'beginner',
  instructions TEXT DEFAULT '',
  imageUrl TEXT DEFAULT '',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建其他表的 SQL...
-- （完整 SQL 见下方链接）
```

**💡 提示**：完整的建表 SQL 我已经准备好，如果需要我可以生成完整的 SQL 脚本。

或者更简单的方法：

#### 方法 B：使用 Prisma CLI（推荐）

在你的本地电脑执行：

```bash
# 1. 进入 server 目录
cd C:\Users\Administrator\WorkBuddy\2026-05-24-11-43-54\server

# 2. 设置环境变量（Windows PowerShell）
$env:DATABASE_URL = "postgresql://neondb_owner:npg_W4MaJceKo7Xy@ep-muddy-poetry-aqx19dpb.apirest.c-8.us-east-1.aws.neon.tech:5432/neondb?sslmode=require"

# 3. 推送 schema
npx prisma db push

# 4.  seed 预设数据（71个运动项目）
npx prisma db seed
```

---

### 步骤 3️⃣: 更新前端配置（2分钟）

#### 3.1 部署前端到 Vercel
1. 在 Vercel Dashboard 再次点击 "Add New..." → "Project"
2. 选择同一个仓库 `Yngjun-Sudo/fitmate`
3. 配置：
   - **Root Directory**: `client` ⚠️ 改成 client
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables** 添加：
   - `VITE_API_URL`: `https://你的后端URL.vercel.app`
5. 点击 "Deploy"

#### 3.2 更新后端 CORS（如果前端域名变了）
1. 进入后端项目的 Vercel Dashboard
2. 点击 "Settings" → "Environment Variables"
3. 编辑 `CORS_ORIGIN`，改为前端实际域名
4. 点击 "Save" 并重新部署

---

## ✅ 部署完成检查清单

- [ ] 后端已部署到 Vercel（Root Directory = `server`）
- [ ] 6 个环境变量已设置
- [ ] 数据库表已创建（Neon Console 或 Prisma push）
- [ ] 前端已部署（Root Directory = `client`）
- [ ] 前端 `.env.production` 的 `VITE_API_URL` 已设置
- [ ] 后端 `CORS_ORIGIN` 已设置为前端域名
- [ ] 访问 `https://你的后端.vercel.app/api/health` 返回 `{"status":"ok"}`
- [ ] 前端可以正常注册、登录、使用 AI 助手

---

## 🧪 测试部署是否成功

### 测试后端健康检查
在浏览器访问：
```
https://你的后端URL.vercel.app/api/health
```

应该看到：
```json
{"status":"ok"}
```

### 测试用户注册
```bash
curl -X POST https://你的后端URL.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"测试用户"}'
```

### 测试前端
访问 `https://fitmate-ashen.vercel.app/`，应该能看到登录页面。

---

## 🆘 常见问题

### Q1: 部署失败，Build Logs 显示 "prisma: command not found"
**A**: 确认 `package.json` 的 `build` 脚本是：
```json
"build": "npx prisma generate && tsc"
```

### Q2: 数据库连接失败
**A**: 检查 `DATABASE_URL` 是否包含 `sslmode=require`，以及密码是否正确。

### Q3: CORS 错误
**A**: 确认 `CORS_ORIGIN` 的值是前端完整域名（包含 `https://`），不要有斜杠结尾。

### Q4: 前端无法调用 API
**A**: 检查前端 `.env.production` 的 `VITE_API_URL` 是否设置为后端 URL。

---

## 📊 部署架构图

```
用户浏览器
    ↓
[前端 - Vercel]  https://fitmate-ashen.vercel.app
    ↓ API 请求
[后端 - Vercel]  https://fitmate-server.vercel.app
    ↓ 数据库查询
[Neon PostgreSQL] 云端数据库
```

---

## 🎉 完成后

部署完成后，你就可以：
1. 在任何设备的浏览器访问 `https://fitmate-ashen.vercel.app`
2. 注册账号并登录
3. 制定健身计划、记录饮食
4. 与 AI 助手对话获取建议

---

**需要帮助？**
- 如果遇到错误，复制 Build Logs 或 Function Logs 发给我
- 我会帮你排查问题
