/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 允许从 Supabase Storage 加载图片
    // 注意：这里使用环境变量，实际域名在运行时从 NEXT_PUBLIC_SUPABASE_URL 获取
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
};

module.exports = nextConfig;

