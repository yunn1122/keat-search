import fetch from 'node-fetch';

// 这是 Vercel Serverless Function 的标准导出格式
export default async function handler(request, response) {
  // 1. 从请求的查询参数中获取原始图片URL
  // 例如: /api/image-proxy?url=thumbnails/xxxx.jpg
  const { url } = request.query;

  // 2. 安全检查：确保 URL 参数存在，防止滥用
  if (!url) {
    return response.status(400).json({ error: 'Image URL is required' });
  }

  // 3. 构建完整的目标图片URL
  const targetUrl = `http://46.101.49.168/${url}`;

  try {
    // 4. Vercel 服务器代替浏览器，向不安全的 HTTP 服务器发起请求
    const imageResponse = await fetch(targetUrl);

    // 5. 检查从图片服务器返回的响应是否成功
    if (!imageResponse.ok) {
      // 如果失败 (例如图片不存在 404)，则将错误信息返回给前端
      return response.status(imageResponse.status).json({ error: 'Failed to fetch image' });
    }

    // 6. 获取图片的二进制数据 (Buffer)
    const imageBuffer = await imageResponse.buffer();
    
    // 7. 获取原始图片的 Content-Type (例如 'image/jpeg')
    const contentType = imageResponse.headers.get('content-type');

    // 8. 设置响应头，告诉浏览器我们正在发送的是一张图片
    response.setHeader('Content-Type', contentType);
    // (可选) 设置缓存策略，让浏览器缓存图片，提高性能
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    // 9. 将图片的二进制数据发送回前端浏览器
    response.status(200).send(imageBuffer);

  } catch (error) {
    console.error('Proxy Error:', error);
    response.status(500).json({ error: 'Internal Server Error' });
  }
}