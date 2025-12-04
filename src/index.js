const express = require('express');
const { getFavicon } = require('./favicon');

const app = express();
const PORT = process.env.PORT || 3000;

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 健康检查端点
app.get('/', (req, res) => {
  res.json({
    message: 'Favicon API Service',
    usage: '/favicon?domain=example.com'
  });
});

// Favicon 获取端点
app.get('/favicon', async (req, res) => {
  const { domain } = req.query;

  // 参数校验
  if (!domain) {
    return res.status(400).json({
      error: 'Missing domain parameter',
      usage: '/favicon?domain=example. com'
    });
  }

  try {
    const result = await getFavicon(domain);

    if (result.success) {
      // 设置正确的 Content-Type
      res.set('Content-Type', result.contentType || 'image/x-icon');
      res.set('Cache-Control', 'public, max-age=86400'); // 缓存 24 小时
      return res.send(result.data);
    } else {
      return res.status(404).json({
        error: 'Failed to fetch favicon',
        domain: domain,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Error fetching favicon:', error);
    return res.status(500).json({
      error: 'Internal server error',
      domain: domain
    });
  }
});

app.listen(PORT, () => {
  console.log(`Favicon API service running on port ${PORT}`);
  console.log(`Usage: http://localhost:${PORT}/favicon?domain=example.com`);
  console.log(`Process ID: ${process.pid}`);
}).on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
    process.exit(1);
  }
});