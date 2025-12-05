const axios = require('axios');

/**
 * 生成基于首字母的 SVG 图标
 */
function generateLetterIcon(domain) {
  // 提取主域名（去除子域名和端口）
  let mainDomain = domain;
  try {
    // 移除协议
    mainDomain = mainDomain.replace(/^https?:\/\//, '').replace(/^\/\//, '');
    // 移除端口
    mainDomain = mainDomain.split(':')[0];
    // 移除路径
    mainDomain = mainDomain.split('/')[0];

    // 分割域名部分
    const parts = mainDomain.split('.');
    // 如果有多个部分，取倒数第二个（主域名），否则取第一个
    if (parts.length >= 2) {
      mainDomain = parts[parts.length - 2];
    } else {
      mainDomain = parts[0];
    }
  } catch (e) {
    // 如果解析失败，使用原始域名
    mainDomain = domain;
  }

  // 提取主域名的首字母
  const letter = mainDomain.charAt(0).toUpperCase();

  // 根据首字母生成颜色（保持一致性）
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B500', '#52B788'
  ];
  const colorIndex = letter.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];

  // 生成 SVG
  const svg = `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" fill="${bgColor}" rx="8"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="32" font-weight="bold" 
        fill="white" text-anchor="middle" dominant-baseline="central">${letter}</text>
</svg>`;

  return Buffer.from(svg);
}

/**
 * 标准化域名
 */
function normalizeDomain(domain) {
  // 移除协议
  let normalized = domain.replace(/^https?:\/\//, '').replace(/^\/\//, '');
  // 移除路径
  normalized = normalized.split('/')[0];
  // 移除端口
  normalized = normalized.split(':')[0];

  return normalized;
}

/**
 * 使用 Google Favicon 服务获取图标
 */
async function fetchFromGoogle(domain, size = 64) {
  try {
    // Google Favicon API: https://www.google.com/s2/favicons
    // 支持参数: domain (域名), sz (尺寸)
    const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;

    console.log(`Fetching from Google: ${googleUrl}`);

    const response = await axios.get(googleUrl, {
      timeout: 10000,
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      maxRedirects: 10,
      validateStatus: (status) => status >= 200 && status < 400
    });

    const buffer = Buffer.from(response.data);

    // 检查是否返回了有效的图片数据
    if (buffer.length < 100) {
      // Google 有时会返回很小的默认图标，这种情况视为失败
      return {
        success: false,
        error: 'Received invalid or default icon from Google'
      };
    }

    // 获取 Content-Type
    let contentType = response.headers['content-type'] || 'image/png';

    return {
      success: true,
      data: buffer,
      contentType: contentType
    };
  } catch (error) {
    console.log(`Google fetch failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 主函数：获取指定域名的 favicon
 */
async function getFavicon(domain) {
  // 标准化域名
  const normalizedDomain = normalizeDomain(domain);

  console.log(`Attempting to fetch favicon for: ${domain} (normalized: ${normalizedDomain})`);

  // 尝试从 Google 获取
  const result = await fetchFromGoogle(normalizedDomain);

  if (result.success) {
    console.log(`Success: Got favicon from Google for ${normalizedDomain}`);
    return result;
  }

  // Google 失败，返回生成的首字母图标
  console.log(`Google fetch failed, generating letter icon for: ${domain}`);
  return {
    success: true,
    data: generateLetterIcon(domain),
    contentType: 'image/svg+xml',
    generated: true
  };
}

module.exports = {
  getFavicon
};