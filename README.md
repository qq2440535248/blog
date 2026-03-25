# Person Blog

前后端分离个人博客项目（Vue3 + Express）。

## 技术栈

- 前端：Vue 3, Vite, Vue Router, Pinia, Element Plus, Axios, Markdown-it, Highlight.js
- 后端：Node.js, Express, Sequelize, MySQL, JWT, bcrypt
- 包管理：pnpm

## 目录结构

- `frontend`: 前端项目
- `backend`: 后端项目

## 快速开始

```bash
pnpm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
pnpm dev:frontend
pnpm dev:backend
```

## 接口文档

- docs/API.md

## 测试命令

```bash
pnpm test:backend
pnpm test:api
pnpm test:validators
pnpm test:authz
pnpm test:route-validate
```
