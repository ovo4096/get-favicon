/**
 * 标准化 URL，移除协议和尾部斜杠
 */
function normalizeUrl(domain) {
  let normalized = domain.trim(). toLowerCase();
  
  // 移除协议
  normalized = normalized.replace(/^https? :\/\//, '');
  
  // 移除尾部斜杠和路径
  normalized = normalized.split('/')[0];
  
  // 移除端口号（如果有）
  normalized = normalized.split(':')[0];
  
  return normalized;
}

/**
 * 生成 URL 的所有变体
 * 按优先级返回：https -> http, 原域名 -> www 前缀
 */
function generateUrlVariants(domain) {
  const variants = [];
  const hasWww = domain.startsWith('www.');
  const domainWithoutWww = hasWww ? domain.substring(4) : domain;
  const domainWithWww = hasWww ? domain : `www.${domain}`;

  // 优先级顺序
  // 1. https://domain
  variants.push(`https://${domainWithoutWww}`);
  
  // 2. http://domain
  variants.push(`http://${domainWithoutWww}`);
  
  // 3. https://www.domain (如果原域名没有 www)
  if (! hasWww) {
    variants.push(`https://${domainWithWww}`);
  }
  
  // 4. http://www.domain (如果原域名没有 www)
  if (! hasWww) {
    variants.push(`http://${domainWithWww}`);
  }

  return variants;
}

module.exports = {
  normalizeUrl,
  generateUrlVariants
};