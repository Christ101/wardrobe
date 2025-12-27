# 个人电子衣柜系统

一个基于 Next.js + Supabase 的现代化个人电子衣柜管理系统，帮助你管理衣物、搭配穿搭、规划一周穿搭计划。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

## 📖 文档导航

- **🚀 [完整部署指南](./DEPLOY.md)** - 从零开始的详细部署教程（包含 Git/GitHub 基础操作）
- **📝 [README.md](./README.md)** - 项目介绍和快速开始（本文档）
- **📄 [LICENSE](./LICENSE)** - MIT 许可证

> 💡 **新手提示**：如果你不熟悉 Git 和 GitHub，请先查看 [完整部署指南](./DEPLOY.md)，里面有详细的步骤说明。

## ✨ 功能特性

- 🔐 **多种登录方式**：支持邮箱密码登录和 Magic Link 登录
- 👕 **单品库管理**：新增/编辑/删除衣物，支持图片上传和预览
- 🎨 **分层搭配器**：按 base/mid/outer/bottom/shoes/socks/accessory 选择单品组成穿搭
- 📋 **穿搭管理**：保存、查看、删除穿搭组合
- 📅 **周计划**：7天视图，为每天安排穿搭，支持备注
- 🧺 **待洗提示**：laundry 状态单品会在搭配器和周计划中显示提示
- 📤 **数据导出**：支持导出为 YAML、JSON、TXT 格式，便于备份和分享
- 🔍 **筛选功能**：按分类、状态筛选单品

## 🛠 技术栈

- **前端框架**: Next.js 14 (App Router)
- **开发语言**: TypeScript
- **样式方案**: Tailwind CSS
- **后端服务**: Supabase (PostgreSQL + Storage + Auth)
- **部署平台**: Vercel

## 📋 环境要求

- Node.js 18+ 
- npm 或 yarn
- Supabase 账户（免费版即可）

## 🚀 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/yourusername/wardrobe.git
cd wardrobe
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env.local`，并填入你的 Supabase 配置：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 设置 Supabase

#### 4.1 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并创建新项目
2. 获取 Project URL 和 Anon Key（在 Settings > API）

#### 4.2 创建数据表

在 Supabase SQL Editor 中执行以下 SQL：

```sql
-- items 表
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('top', 'bottom', 'outer', 'shoes', 'socks', 'accessory')),
  layer TEXT CHECK (layer IN ('base', 'mid', 'outer')),
  name TEXT,
  color_primary TEXT,
  color_secondary TEXT,
  size TEXT,
  status TEXT NOT NULL DEFAULT 'clean' CHECK (status IN ('clean', 'laundry', 'repair')),
  care_tags TEXT[],
  image_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- outfits 表
CREATE TABLE outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  notes TEXT,
  cover_image_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- outfit_items 表
CREATE TABLE outfit_items (
  outfit_id UUID REFERENCES outfits(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  slot TEXT NOT NULL CHECK (slot IN ('base', 'mid', 'outer', 'bottom', 'shoes', 'socks', 'accessory')),
  PRIMARY KEY (outfit_id, item_id, slot)
);

-- plans 表
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  outfit_id UUID REFERENCES outfits(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, plan_date)
);

-- 启用 RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- RLS 策略（示例，需要根据实际需求调整）
CREATE POLICY "Users can view own items" ON items FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own items" ON items FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own items" ON items FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own items" ON items FOR DELETE USING (auth.uid() = owner_id);

-- 为其他表创建类似的策略...
```

#### 4.3 创建 Storage Bucket

1. 在 Supabase Dashboard 中进入 Storage
2. 创建名为 `wardrobe` 的 bucket（设置为 Private）
3. 配置 Storage Policies，确保用户只能访问自己的文件

### 5. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 🌐 部署到 Vercel

> 📚 **详细部署指南**：请查看 [DEPLOY.md](./DEPLOY.md)，里面有从零开始的完整步骤，包括 Git/GitHub 基础操作。

### 快速部署步骤

1. **准备代码仓库**：将代码推送到 GitHub（详见 [DEPLOY.md](./DEPLOY.md#上传代码到-github)）
2. **在 Vercel 部署**：导入仓库并配置环境变量（详见 [DEPLOY.md](./DEPLOY.md#部署到-vercel)）
3. **配置 Supabase**：设置 Auth 回调 URL（详见 [DEPLOY.md](./DEPLOY.md#配置-supabase)）

### 环境变量配置

在 Vercel 中需要配置以下环境变量：

- `NEXT_PUBLIC_SUPABASE_URL` - 你的 Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 你的 Supabase Anon Key

详细说明请查看 [DEPLOY.md](./DEPLOY.md#步骤-4-配置环境变量)。

## 📁 项目结构

```
├── app/                    # Next.js App Router 页面
│   ├── login/             # 登录页面
│   ├── items/             # 单品库
│   ├── builder/           # 分层搭配器
│   ├── outfits/            # 穿搭列表
│   ├── calendar/          # 周计划
│   ├── test-storage/      # Storage 测试页面
│   └── auth/callback/     # Auth 回调路由
├── components/            # React 组件
│   ├── AuthGuard.tsx      # 认证守卫
│   └── Navbar.tsx         # 导航栏
├── lib/                   # 工具库
│   ├── supabase/          # Supabase 客户端
│   ├── db/                # 数据库操作
│   │   ├── items.ts       # 单品 CRUD
│   │   ├── outfits.ts     # 穿搭 CRUD
│   │   └── plans.ts       # 计划 CRUD
│   ├── storage.ts         # Storage 操作
│   └── export.ts          # 数据导出功能
└── package.json
```

## 🔒 权限与安全

- ✅ 所有数据表已启用 RLS (Row Level Security)
- ✅ 所有操作必须通过 `owner_id = auth.uid()` 过滤
- ✅ Storage bucket 为 Private，路径必须以 `{userId}/` 开头
- ✅ 使用 Supabase Auth 进行身份验证

## ❓ 常见问题

### 1. 登录后无法访问页面

检查 Supabase Auth 回调 URL 是否已正确配置。

### 2. 图片上传失败 (403)

确保上传路径格式为 `{userId}/items/{itemId}.jpg`，且 Storage bucket policy 已正确配置。

### 3. 数据查询失败

检查 RLS 策略是否正确，确保所有查询都包含 `owner_id` 过滤。

### 4. 测试 Storage

访问 `/test-storage` 页面可以测试图片上传和预览功能。

## 🎯 后续扩展建议

- [ ] PWA 支持（离线访问）
- [ ] AI 自动推荐穿搭
- [ ] 天气接口联动
- [ ] 衣物识别/自动标签
- [ ] 多用户/团队协作
- [ ] 移动端优化

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Supabase](https://supabase.com/) - 后端服务
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架

---

⭐ 如果这个项目对你有帮助，请给个 Star！
