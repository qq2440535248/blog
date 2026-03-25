# API 接口文档（基础版）

Base URL: http://localhost:3000/api

## 统一约定

- 成功响应

```json
{
  "code": 0,
  "message": "OK",
  "data": {}
}
```

- 失败响应

```json
{
  "code": "BAD_REQUEST",
  "message": "参数错误",
  "details": null
}
```

- 鉴权头

```http
Authorization: Bearer <access_token>
```

## 认证模块

### POST /auth/register
- 请求

```json
{
  "username": "tom",
  "email": "tom@example.com",
  "password": "123456"
}
```

- 响应 data

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": 1,
    "username": "tom",
    "email": "tom@example.com",
    "nickname": "tom",
    "avatarUrl": null,
    "bio": null
  }
}
```

### POST /auth/login
### POST /auth/refresh
### POST /auth/logout

## 用户模块

### GET /users/me
### PUT /users/me
### PUT /users/me/password

## 文章模块

### GET /articles
- query: q, categoryId, tag, page, pageSize

### GET /articles/:id
### POST /articles
### PUT /articles/:id
### DELETE /articles/:id

## 分类模块

### GET /categories
### POST /categories
### PUT /categories/:id
### DELETE /categories/:id

## 标签模块

### GET /tags
### POST /tags
### PUT /tags/:id
### DELETE /tags/:id

## 点赞模块

### POST /articles/:id/like
### DELETE /articles/:id/like
### GET /articles/:id/is-liked

## 草稿模块

### GET /drafts
### GET /drafts/:id
### POST /drafts
### PUT /drafts/:id
### DELETE /drafts/:id
### POST /drafts/:id/publish

## 错误码

- BAD_REQUEST
- UNAUTHORIZED
- FORBIDDEN
- NOT_FOUND
- CONFLICT
- TOO_MANY_REQUESTS
- INTERNAL_SERVER_ERROR
