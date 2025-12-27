# 个人电子衣柜系统

基于 Next.js + Supabase + PWA 的个人电子衣柜管理系统。

## 功能特性

- ✅ 邮箱 Magic Link 登录（Supabase Auth）
- ✅ 单品库管理（新增/编辑/删除，支持图片上传）
- ✅ 分层搭配器（按 base/mid/outer/bottom/shoes/socks/accessory 选择单品）
- ✅ 穿搭管理（保存、查看、删除）
- ✅ 周计划（7天视图，为每天安排穿搭）
- ✅ 待洗提示（laundry 状态单品会在搭配器和周计划中显示提示）

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **后端**: Supabase (PostgreSQL + Storage + Auth)
- **部署**: Vercel

## 环境要求

- Node.js 18+ 
- npm 或 yarn

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`，并填入你的 Supabase 配置：

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 部署到 Vercel

### 1. 准备代码仓库

确保代码已提交到 Git 仓库（GitHub/GitLab/Bitbucket）。

### 2. 在 Vercel 部署

1. 访问 [Vercel](https://vercel.com)
2. 点击 "New Project"
3. 导入你的 Git 仓库
4. 配置环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. 点击 "Deploy"

### 3. 配置 Supabase Auth 回调 URL

在 Supabase Dashboard 的 Authentication > URL Configuration 中，添加：
- Redirect URLs: `https://your-vercel-domain.vercel.app/auth/callback`

## 项目结构

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
│   └── storage.ts         # Storage 操作
└── package.json
```

## 数据表结构

### items (单品)
- `id`, `owner_id`
- `category`: top/bottom/outer/shoes/socks/accessory
- `layer`: base/mid/outer (可空)
- `name`, `color_primary`, `color_secondary`, `size` (可空)
- `status`: clean/laundry/repair
- `care_tags`, `image_path` (可空)

### outfits (穿搭)
- `id`, `owner_id`
- `name`, `notes`, `cover_image_path` (可空)

### outfit_items (穿搭单品关联)
- `outfit_id`, `item_id`, `slot`: base/mid/outer/bottom/shoes/socks/accessory

### plans (周计划)
- `id`, `owner_id`
- `plan_date` (date)
- `outfit_id`, `notes` (可空)
- unique(owner_id, plan_date)

## 权限与安全

- 所有数据表已启用 RLS (Row Level Security)
- 所有操作必须通过 `owner_id = auth.uid()` 过滤
- Storage bucket 为 Private，路径必须以 `{userId}/` 开头

## 常见问题

### 1. 登录后无法访问页面

检查 Supabase Auth 回调 URL 是否已正确配置。

### 2. 图片上传失败 (403)

确保上传路径格式为 `{userId}/items/{itemId}.jpg`，且 Storage bucket policy 已正确配置。

### 3. 数据查询失败

检查 RLS 策略是否正确，确保所有查询都包含 `owner_id` 过滤。

### 4. 测试 Storage

访问 `/test-storage` 页面可以测试图片上传和预览功能。

## 后续扩展建议

- [ ] PWA 支持（离线访问）
- [ ] AI 自动推荐穿搭
- [ ] 天气接口联动
- [ ] 衣物识别/自动标签
- [ ] 多用户/团队协作

## 许可证

个人使用项目。

