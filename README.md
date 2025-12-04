# Get Favicon API Service

一个基于 Node.js 的网站 favicon 获取服务，通过 API 接口获取任意网站的图标。

## 功能特性

- ✅ 支持通过域名获取 favicon
- ✅ 自动尝试 HTTP 和 HTTPS 协议
- ✅ 自动尝试带/不带 www 前缀的域名
- ✅ 智能解析 HTML 中的 favicon 链接
- ✅ 支持多种 favicon 格式（ico, png, svg 等）
- ✅ 完善的错误处理和超时控制

## 安装

```bash
# 克隆仓库
git clone https://github.com/ovo4096/get-favicon.git
cd get-favicon

# 安装依赖
npm install
```

## 使用

### 启动服务

```bash
# 生产环境
npm start

# 开发环境（自动重启）
npm run dev
```

服务默认运行在 `http://localhost:3000`

### API 调用

**请求格式:**

```
GET /favicon?domain=<域名>
```

**示例:**

```bash
# 获取 GitHub 的 favicon
curl http://localhost:3000/favicon?domain=github.com

# 获取 X (Twitter) 的 favicon
curl http://localhost:3000/favicon?domain=x.com

# 保存到文件
curl http://localhost:3000/favicon? domain=google.com -o google-favicon.ico
```

**在浏览器中使用:**

```html
<img src="http://localhost:3000/favicon? domain=github.com" alt="GitHub Icon">
```

## 工作原理

服务会按以下优先级尝试获取 favicon：

1. `https://example.com/favicon.ico`
2. `https://example.com` (解析 HTML 中的 favicon 链接)
3. `http://example.com/favicon.ico`
4. `http://example.com` (解析 HTML)
5. `https://www. example.com/favicon.ico`
6. `https://www. example.com` (解析 HTML)
7. `http://www.example.com/favicon. ico`
8. `http://www.example.com` (解析 HTML)

## 响应格式

### 成功响应

- **状态码:** 200
- **Content-Type:** `image/x-icon`, `image/png`, `image/svg+xml` 等
- **响应体:** 图片二进制数据

### 失败响应

- **状态码:** 404 或 500
- **Content-Type:** `application/json`
- **响应体:**
  ```json
  {
    "error": "Failed to fetch favicon",
    "domain": "example.com",
    "message": "详细错误信息"
  }
  ```

## 配置

可以通过环境变量配置服务：

```bash
# 设置端口
PORT=8080 npm start
```

## 项目结构

```
get-favicon/
├── src/
│   ├── index.js       # 主入口，Express 服务
│   ├── favicon.js     # Favicon 获取核心逻辑
│   └── utils.js       # URL 处理工具函数
├── package.json
├── .gitignore
└── README.md
```

## 依赖

- **express** - Web 框架
- **axios** - HTTP 客户端
- **cheerio** - HTML 解析

## License

MIT