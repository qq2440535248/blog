# Person Blog

前后端分离的内容创作与治理平台（Vue 3 + Express）。

## 项目功能

- 用户注册、登录、刷新令牌、退出登录
- 个人资料维护（昵称、头像、简介、修改密码）
- 文章管理（新建、编辑、删除、详情、列表检索）
- 草稿管理（自动保存、草稿列表、草稿发布）
- 分类与标签管理
- Markdown 渲染与代码复制
- 点赞、收藏、评论、回复评论
- 管理员治理台（下架、恢复发布、治理日志）

## 技术栈

- 前端：Vue 3、Vite、Vue Router、Pinia、Element Plus、Axios、Markdown-it、Highlight.js
- 后端：Node.js、Express、Sequelize、MySQL、JWT、bcrypt
- 包管理：pnpm

## 项目目录

```text
person-blog/
├─ frontend/                    # 前端应用
│  ├─ src/
│  │  ├─ views/                 # 页面（登录/注册/文章/治理台等）
│  │  ├─ stores/                # Pinia 状态管理
│  │  ├─ utils/                 # 请求封装、Markdown、消息提示
│  │  ├─ router/                # 路由
│  │  └─ styles/                # 全局与模块样式
│  └─ .env.example
├─ backend/                     # 后端服务
│  ├─ src/
│  │  ├─ controllers/           # 业务控制器
│  │  ├─ models/                # Sequelize 模型与关联
│  │  ├─ routes/                # 路由注册
│  │  ├─ middlewares/           # 鉴权、管理员校验、参数校验
│  │  ├─ validators/            # 请求参数校验
│  │  └─ utils/                 # 角色判定、JWT、密码工具等
│  └─ .env.example
└─ docs/
	└─ API.md                   # 接口文档
```

## 快速开始

```bash
pnpm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
pnpm dev:frontend
pnpm dev:backend
```

默认后端地址：

- http://localhost:3000
- API 前缀：http://localhost:3000/api

## 管理员账号说明

本项目通过邮箱白名单判定管理员角色（不是单独的 role 字段持久化）。

1. 在 backend/.env 中配置管理员邮箱：

```env
ADMIN_EMAILS=huanzhang@163.com
```

2. 重启后端服务（必须重启后生效）。

3. 使用该邮箱登录后，/users/me 返回 role=admin，即拥有治理权限。

当前开发环境已配置管理员示例账号：

- 邮箱：huanzhang@163.com
- 密码：123456

说明：示例账号仅用于本地开发联调，生产环境请替换为强密码并通过安全方式管理。

## 主要接口

认证：

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout

用户：

- GET /api/users/me
- PUT /api/users/me
- PUT /api/users/me/password
- POST /api/users/me/avatar

文章：

- GET /api/articles/public
- GET /api/articles
- GET /api/articles/:id
- POST /api/articles
- PUT /api/articles/:id
- DELETE /api/articles/:id
- PATCH /api/articles/:id/takedown（管理员）
- PATCH /api/articles/:id/restore（管理员）
- GET /api/articles/moderation（管理员）
- GET /api/articles/:id/moderation-logs（管理员）

评论：

- GET /api/articles/:id/comments
- POST /api/articles/:id/comments
- POST /api/comments/:id/like
- DELETE /api/comments/:id/like

草稿：

- GET /api/drafts
- GET /api/drafts/:id
- POST /api/drafts
- PUT /api/drafts/:id
- DELETE /api/drafts/:id

分类与标签：

- GET/POST/PUT/DELETE /api/categories
- GET/POST/PUT/DELETE /api/tags

点赞与收藏：

- POST /api/articles/:id/like
- DELETE /api/articles/:id/like
- GET /api/articles/:id/is-liked
- POST /api/articles/:id/collect
- DELETE /api/articles/:id/collect
- GET /api/articles/:id/is-collected

更多字段和返回示例见 docs/API.md。

## 测试命令

```bash
pnpm test:backend
pnpm test:api
pnpm test:validators
pnpm test:authz
pnpm test:route-validate
```
