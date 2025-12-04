const axios = require('axios');
const cheerio = require('cheerio');
const { normalizeUrl, generateUrlVariants } = require('./utils');

/**
 * 生成基于首字母的 SVG 图标
 */
function generateLetterIcon(domain) {
  // 提取域名的首字母
  const letter = domain.charAt(0).toUpperCase();

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
 * 从 HTML 中解析 favicon 链接和 title
 */
function parseFaviconFromHtml(html, baseUrl) {
  const $ = cheerio.load(html);

  // 获取 title
  const title = $('title').text().trim() || '';

  // 按优先级查找 favicon
  const selectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]',
    'link[rel="apple-touch-icon-precomposed"]'
  ];

  let faviconUrl = null;
  for (const selector of selectors) {
    const link = $(selector).attr('href');
    if (link) {
      // 处理相对路径和绝对路径
      if (link.startsWith('http')) {
        faviconUrl = link;
      } else if (link.startsWith('//')) {
        faviconUrl = 'https:' + link;
      } else if (link.startsWith('/')) {
        faviconUrl = baseUrl + link;
      } else {
        faviconUrl = baseUrl + '/' + link;
      }
      break;
    }
  }

  return { faviconUrl, title };
}

/**
 * 尝试获取网页 title
 */
async function fetchTitle(url, timeout = 5000) {
  try {
    const response = await axios.get(url, {
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      maxRedirects: 0,
      validateStatus: (status) => status === 200
    });

    const $ = cheerio.load(response.data);
    return $('title').text().trim() || '';
  } catch (error) {
    return '';
  }
}

/**
 * 根据文件头魔数判断实际的 MIME 类型
 */
function detectMimeType(buffer) {
  if (!buffer || buffer.length < 4) return null;

  const header = buffer.slice(0, 4);

  // PNG: 89 50 4E 47
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
    return 'image/png';
  }

  // JPEG: FF D8 FF
  if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
    return 'image/jpeg';
  }

  // GIF: 47 49 46 38
  if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38) {
    return 'image/gif';
  }

  // ICO: 00 00 01 00
  if (header[0] === 0x00 && header[1] === 0x00 && header[2] === 0x01 && header[3] === 0x00) {
    return 'image/x-icon';
  }

  // WebP: 52 49 46 46 (RIFF)
  if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46) {
    if (buffer.length >= 12) {
      const webpSig = buffer.slice(8, 12).toString('ascii');
      if (webpSig === 'WEBP') {
        return 'image/webp';
      }
    }
  }

  // BMP: 42 4D
  if (header[0] === 0x42 && header[1] === 0x4D) {
    return 'image/bmp';
  }

  // SVG: 检查 XML/SVG 标签
  const text = buffer.slice(0, 100).toString('utf8', 0, Math.min(100, buffer.length)).trim();
  if (text.startsWith('<svg') || text.startsWith('<?xml')) {
    return 'image/svg+xml';
  }

  return null;
}

/**
 * 尝试从指定 URL 获取 favicon
 */
async function tryFetchFavicon(url, timeout = 5000) {
  try {
    const response = await axios.get(url, {
      timeout,
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      maxRedirects: 0,
      validateStatus: (status) => status === 200
    });

    const buffer = Buffer.from(response.data);

    // 根据文件头判断实际的 MIME 类型
    const actualMimeType = detectMimeType(buffer);

    if (!actualMimeType) {
      console.log(`Invalid image data from ${url}`);
      return {
        success: false,
        error: 'Not a valid image'
      };
    }

    return {
      success: true,
      data: buffer,
      contentType: actualMimeType
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 从网页 HTML 中查找并获取 favicon 和 title
 */
async function fetchFaviconFromHtml(url, timeout = 5000) {
  try {
    const response = await axios.get(url, {
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      maxRedirects: 0,
      validateStatus: (status) => status === 200
    });

    const baseUrl = new URL(url).origin;
    const { faviconUrl, title } = parseFaviconFromHtml(response.data, baseUrl);

    if (faviconUrl) {
      const result = await tryFetchFavicon(faviconUrl, timeout);
      if (result.success) {
        result.title = title;
      }
      return result;
    }

    return { success: false, error: 'No favicon found in HTML', title };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 主函数：获取指定域名的 favicon 和 title
 */
async function getFavicon(domain) {
  // 标准化域名
  const normalizedDomain = normalizeUrl(domain);

  // 生成所有可能的 URL 变体
  const urlVariants = generateUrlVariants(normalizedDomain);

  console.log(`Attempting to fetch favicon for: ${domain}`);
  console.log(`Trying variants:`, urlVariants);

  let title = '';

  // 对每个 URL 变体进行尝试
  for (const baseUrl of urlVariants) {
    // 策略 1: 尝试 /favicon.ico
    console.log(`Trying: ${baseUrl}/favicon.ico`);
    let result = await tryFetchFavicon(`${baseUrl}/favicon.ico`);
    if (result.success) {
      console.log(`Success: ${baseUrl}/favicon.ico`);
      // 获取 title
      title = await fetchTitle(baseUrl);
      return {
        success: true,
        data: result.data,
        contentType: result.contentType,
        title
      };
    }

    // 策略 2: 从 HTML 中解析 favicon
    console.log(`Trying: ${baseUrl} (parsing HTML)`);
    result = await fetchFaviconFromHtml(baseUrl);
    if (result.success) {
      console.log(`Success: Found in HTML from ${baseUrl}`);
      return {
        success: true,
        data: result.data,
        contentType: result.contentType,
        title: result.title || ''
      };
    }
    // 保存 title（即使 favicon 失败）
    if (result.title) {
      title = result.title;
    }
  }

  // 所有尝试都失败，返回生成的首字母图标
  console.log(`All attempts failed, generating letter icon for: ${domain}`);
  return {
    success: true,
    data: generateLetterIcon(domain),
    contentType: 'image/svg+xml',
    generated: true,
    title: title || domain
  };
}

module.exports = {
  getFavicon
};