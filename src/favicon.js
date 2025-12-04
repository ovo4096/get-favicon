const axios = require('axios');
const cheerio = require('cheerio');
const { normalizeUrl, generateUrlVariants } = require('./utils');

/**
 * 从 HTML 中解析 favicon 链接
 */
function parseFaviconFromHtml(html, baseUrl) {
  const $ = cheerio.load(html);
  
  // 按优先级查找 favicon
  const selectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]',
    'link[rel="apple-touch-icon-precomposed"]'
  ];

  for (const selector of selectors) {
    const link = $(selector). attr('href');
    if (link) {
      // 处理相对路径和绝对路径
      if (link.startsWith('http')) {
        return link;
      } else if (link.startsWith('//')) {
        return 'https:' + link;
      } else if (link.startsWith('/')) {
        return baseUrl + link;
      } else {
        return baseUrl + '/' + link;
      }
    }
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
      maxRedirects: 5,
      validateStatus: (status) => status === 200
    });

    return {
      success: true,
      data: response.data,
      contentType: response.headers['content-type']
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 从网页 HTML 中查找并获取 favicon
 */
async function fetchFaviconFromHtml(url, timeout = 5000) {
  try {
    const response = await axios.get(url, {
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      maxRedirects: 5
    });

    const baseUrl = new URL(url).origin;
    const faviconUrl = parseFaviconFromHtml(response.data, baseUrl);
    
    if (faviconUrl) {
      return await tryFetchFavicon(faviconUrl, timeout);
    }
    
    return { success: false, error: 'No favicon found in HTML' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 主函数：获取指定域名的 favicon
 */
async function getFavicon(domain) {
  // 标准化域名
  const normalizedDomain = normalizeUrl(domain);
  
  // 生成所有可能的 URL 变体
  const urlVariants = generateUrlVariants(normalizedDomain);
  
  console.log(`Attempting to fetch favicon for: ${domain}`);
  console.log(`Trying variants:`, urlVariants);

  // 对每个 URL 变体进行尝试
  for (const baseUrl of urlVariants) {
    // 策略 1: 尝试 /favicon.ico
    console.log(`Trying: ${baseUrl}/favicon.ico`);
    let result = await tryFetchFavicon(`${baseUrl}/favicon.ico`);
    if (result.success) {
      console.log(`Success: ${baseUrl}/favicon.ico`);
      return result;
    }

    // 策略 2: 从 HTML 中解析 favicon
    console.log(`Trying: ${baseUrl} (parsing HTML)`);
    result = await fetchFaviconFromHtml(baseUrl);
    if (result.success) {
      console. log(`Success: Found in HTML from ${baseUrl}`);
      return result;
    }
  }

  // 所有尝试都失败
  return {
    success: false,
    error: 'Failed to fetch favicon from all variants'
  };
}

module.exports = {
  getFavicon
};