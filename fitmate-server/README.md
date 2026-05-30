# FitMate Server - Cloudflare Workers 版

边缘部署的 FitMate 后端服务（从 Express + Prisma 迁移到 Hono + Drizzle + D1）

## 🚀 快速开始

### 1. 安装依赖
```bash
cd fitmate-server
npm install
```

### 2. 创建 D1 数据库
```bash
# 创建数据库
npx wrangler d1 create fitmate-db

# 复制输出的 database_id，粘贴到 wrangler.toml 的 `database_id` 字段
```

### 3. 运行数据库迁移
```bash
# 本地环境
npm run d1:migrate -- --local

# 生产环境
npm run d1:migrate -- --remote
```

### 4. 配置环境变量
```bash
# 本地开发：编辑 .env 文件
# 生产环境：使用 wrangler secret 设置
npx wrangler secret put JWT_SECRET
npx wrangler secret put DEEPSEEK_API_KEY
```

### 5. 启动开发服务器
```bash
npm run dev
# 访问 http://localhost:8787/api/health 测试
```

### 6. 部署到 Cloudflare Workers
```bash
npm run deploy
```

---

## 📂 项目结构

```
fitmate-server/
├── wrangler.toml          # Workers 配置（D1 绑定、环境变量）
├── package.json             # 依赖声明
├── tsconfig.json           # TypeScript 配置
├── .env                    # 本地环境变量（不提交）
├── d1/
│   ├── schema.ts          # Drizzle schema 定义
│   └── migrations/        # D1 迁移文件（11 个）
├── src/
│   ├── index.ts           # Workers 入口（fetch handler）
│   ├── app.ts            # Hono 应用配置（CORS、中间件、路由）
│   ├── db/
│   │   └── index.ts     # Drizzle 实例初始化
│   ├── middleware/
│   │   ├── auth.ts       # JWT 认证中间件
│   │   ├── optionalAuth.ts   # 可选认证中间件
│   │   ├── errorHandler.ts   # 全局错误处理
│   │   └── cors.ts      # CORS 配置
│   ├── routes/
│   │   ├── auth.ts      # /api/auth/* 路由
│   │   ├── exercises.ts  # /api/exercises/* 路由
│   │   ├── workoutPlans.ts  # /api/workout-plans/* 路由
│   │   ├── workoutLogs.ts   # /api/workout-logs/* 路由
│   │   ├── diet.ts      # /api/diet/* 路由
│   │   └── chat.ts      # /api/chat/* 路由（含 SSE）
│   ├── services/
│   │   ├── authService.ts   # 认证业务逻辑
│   │   ├── exerciseService.ts # 动作库业务逻辑
│   │   ├── workoutService.ts  # 训练计划/日志业务逻辑
│   │   ├── dietService.ts    # 饮食记录业务逻辑
│   │   └── aiService.ts     # AI 调用 + Function Calling
│   ├── utils/
│   │   ├── jwt.ts       # JWT 工具（jose 实现）
│   │   ├── response.ts  # 统一响应格式
│   │   └── validator.ts # Zod → Hono 校验中间件
│   └── types/
│       └── index.ts     # 类型定义
└── docs/
    ├── system_design.md            # 架构设计文档
    ├── sequence-diagram.mermaid   # 请求处理流程时序图
    ├── ai-service-sequence.mermaid  # AI 服务调用时序图
    └── class-diagram.mermaid      # 数据库 ER 类图
```

---

## 🗄️ 数据库管理

### D1 数据库操作

```bash
# 创建数据库
npx wrangler d1 create fitmate-db

# 查看数据库列表
npx wrangler d1 list

# 执行迁移（本地）
npm run d1:migrate

# 执行迁移（生产）
npm run d1:migrate -- --remote

# 执行 SQL 文件（本地）
npx wrangler d1 execute fitmate-db --local --file=./d1/seed.sql

# 打开 D1 控制台（本地）
npx wrangler d1 execx fitmate-db --local

# 查看表结构
npx wrangler d1 execute fitmate-db --local --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### 从 Prisma 迁移到 Drizzle

原有 Prisma schema 已转换为：
- **11 个 D1 迁移文件**：`d1/migrations/*.sql`
- **Drizzle schema 定义**：`d1/schema.ts`

主要变化：
1. **Boolean → INTEGER**：SQLite 无 Boolean 类型，用 `0/1` 表示
2. **DateTime → INTEGER**：使用 Unix timestamp（秒），D1 原生支持 `unixepoch()`
3. **关系约束**：保留 `FOREIGN KEY`，需要在连接时开启

---

## 🔧 开发指南

### 添加新路由

1. 创建 `src/routes/xxx.ts`：
```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { SomeSchema } from '../types';

const router = new Hono<{ Bindings: Env }>();

router.get('/', async (c) => {
  const db = getDatabase(c.env.DB);
  const data = await db.select().from(someTable);
  return c.json({ code: 0, data });
});

router.post('/', zValidator('json', SomeSchema), async (c) => {
  const data = c.req.valid('json');
  // ...
});

export default router;
```

2. 在 `src/app.ts` 中挂载：
```typescript
import xxxRoutes from './routes/xxx';
app.route('/api/xxx', xxxRoutes);
```

### 添加新 Service

创建 `src/services/xxxService.ts`：
```typescript
import { getDatabase } from '../db';
import { someTable } from '../../d1/schema';
import { eq } from 'drizzle-orm';

export async function getData(userId: string) {
  const db = getDatabase(env.DB); // env 从 c.env 传入
  return db.select().from(someTable).where(eq(someTable.userId, userId));
}
```

### 数据库事务

```typescript
import { getDatabase } from '../db';

await db.transaction(async (tx) => {
  await tx.insert(users).values({ ... });
  await tx.insert(workoutPlans).values({ ... });
});
```

---

## 🔐 认证

### JWT 使用

```typescript
import { generateToken, verifyToken } from '../utils/jwt';

// 生成 Token（在 authService.ts 中）
const token = await generateToken(
  { userId: user.id, email: user.email },
  c.env.JWT_SECRET,
  '7d'
);

// 验证 Token（在 middleware/auth.ts 中）
const payload = await verifyToken(token, c.env.JWT_SECRET);
if (payload) {
  c.set('user', payload);
}
```

### 中间件使用

```typescript
// 强制认证（需要登录）
router.get('/me', authMiddleware, async (c) => {
  const user = c.get('user'); // { userId, email }
  // ...
});

// 可选认证（未登录也能访问，但登录后有更好体验）
router.use('/', optionalAuth);
```

---

## 🌐 CORS 配置

在 `wrangler.toml` 中配置允许的域名：
```toml
[vars]
CORS_ORIGIN = "http://localhost:5173,https://fitmate.pages.dev"
```

或在 Cloudflare Dashboard → Workers & Pages → Settings → Variables 中设置。

---

## 📦 部署

### 本地开发
```bash
npm run dev
# 访问 http://localhost:8787
```

### 部署到生产环境
```bash
# 1. 构建
npm run build

# 2. 部署
npm run deploy

# 或使用一条命令
npm run deploy
```

### 设置生产环境变量
```bash
# 敏感信息（通过 wrangler secret）
npx wrangler secret put JWT_SECRET
npx wrangler secret put DEEPSEEK_API_KEY

# 非敏感信息（在 wrangler.toml 中）
[vars]
DEEPSEEK_BASE_URL = "https://api.deepseek.com"
CORS_ORIGIN = "https://fitmate.pages.dev"
```

---

## 🐛 调试

### 查看 Workers 日志
```bash
# 实时日志
npx wrangler tail

# 或访问 Cloudflare Dashboard → Workers & Pages → Logs
```

### 本地调试
```bash
# 使用 console.log() 输出日志
console.log('[DEBUG] 查询用户:', userId);
console.error('[ERROR] 数据库查询失败:', err);

# 日志会自动显示在 wrangler dev 控制台
```

---

## 📄 API 文档

### 认证路由（`/api/auth`）
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `PUT /api/auth/profile` - 更新个人信息

### 动作库路由（`/api/exercises`）
- `GET /api/exercises` - 获取动作列表
- `GET /api/exercises/:id` - 获取动作详情
- `POST /api/exercises` - 创建自定义动作（管理员）
- `PUT /api/exercises/:id` - 更新动作（管理员）
- `DELETE /api/exercises/:id` - 删除动作（管理员）

### 训练计划路由（`/api/workout-plans`）
- `GET /api/workout-plans` - 获取训练计划列表
- `GET /api/workout-plans/:id` - 获取计划详情
- `POST /api/workout-plans` - 创建训练计划
- `PUT /api/workout-plans/:id` - 更新训练计划
- `DELETE /api/workout-plans/:id` - 删除训练计划

### 训练日志路由（`/api/workout-logs`）
- `GET /api/workout-logs` - 获取训练日志列表
- `GET /api/workout-logs/:id` - 获取日志详情
- `POST /api/workout-logs` - 创建训练日志
- `PUT /api/workout-logs/:id` - 更新训练日志
- `DELETE /api/workout-logs/:id` - 删除训练日志

### 饮食记录路由（`/api/diet`）
- `GET /api/diet/food-items` - 获取食物列表
- `POST /api/diet/food-items` - 创建自定义食物
- `GET /api/diet/meal-records` - 获取饮食记录
- `POST /api/diet/meal-records` - 创建饮食记录
- `DELETE /api/diet/meal-records/:id` - 删除饮食记录

### 聊天路由（`/api/chat`）
- `GET /api/chat/sessions` - 获取对话列表
- `POST /api/chat/sessions` - 创建新对话
- `GET /api/chat/sessions/:id` - 获取对话消息
- `POST /api/chat` - 发送消息（SSE 流式返回）

---

## 🚨 常见问题

### 1. SSE 流式响应超时
**问题**：Workers 免费计划有 10ms CPU 时间限制，SSE 长连接会超时。

**解决方案**：
- 推荐：升级到 Workers Paid Plan（$5/月）解除限制
- 备选：使用 `waitUntil()` 延长后台执行
- 备选 2：改为轮询模式（牺牲实时性）

### 2. D1 数据库外键约束不生效
**问题**：SQLite 外键默认关闭。

**解决方案**：在 Drizzle 查询时手动开启：
```typescript
await db.run(sql`PRAGMA foreign_keys = ON`);
```

### 3. JWT 验证失败
**问题**：使用 `jsonwebtoken` 库报错（依赖 Node.js `crypto`）。

**解决方案**：已替换为 `jose` 库（Web Crypto API 兼容）。

### 4. 环境变量读取不到
**问题**：使用 `process.env.XXX` 读取环境变量。

**解决方案**：Workers 无 `process` 对象，需从 `c.env.XXX` 读取。

---

## 📚 参考资料

- **Hono 文档**：https://hono.dev/
- **Drizzle ORM 文档**：https://orm.drizzle.team/
- **Cloudflare D1 文档**：https://developers.cloudflare.com/d1/
- **Cloudflare Workers 文档**：https://developers.cloudflare.com/workers/
- **jose 文档**：https://github.com/panva/jose

---

## 📝 许可证

MIT License

---

**架构设计**：software-architect
**迁移日期**：2024-05
**原技术栈**：Express + Prisma + PostgreSQL
**新技术栈**：Hono + Drizzle ORM + Cloudflare D1
