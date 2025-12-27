# 🚀 完整部署指南

本指南将从零开始，详细说明如何将个人电子衣柜系统部署到 Vercel。即使你不熟悉 Git 和 GitHub，也可以按照本指南完成部署。

## 📚 目录

1. [前置准备](#前置准备)
2. [Git 和 GitHub 基础](#git-和-github-基础)
3. [创建 GitHub 仓库](#创建-github-仓库)
4. [上传代码到 GitHub](#上传代码到-github)
5. [部署到 Vercel](#部署到-vercel)
6. [配置 Supabase](#配置-supabase)
7. [测试部署](#测试部署)
8. [常见问题](#常见问题)

---

## 📋 前置准备

在开始之前，确保你已经完成：

- ✅ 已创建 Supabase 项目（如果还没有，参考 [Supabase 设置](#supabase-设置)）
- ✅ 已配置数据表和 RLS 策略
- ✅ 已创建 Storage Bucket
- ✅ 已安装 Node.js（用于本地开发，部署时不需要）

### Supabase 设置（如果还没有）

1. 访问 [https://supabase.com](https://supabase.com)
2. 注册/登录账号
3. 点击 "New Project"
4. 填写项目信息：
   - **Name**: wardrobe（或任意名称）
   - **Database Password**: 设置一个强密码（记住它！）
   - **Region**: 选择离你最近的区域
5. 点击 "Create new project"
6. 等待项目创建完成（约 2 分钟）

---

## 🔧 Git 和 GitHub 基础

### 什么是 Git？

Git 是一个版本控制系统，用于跟踪代码的更改。你可以把它想象成一个"代码的时光机"。

### 什么是 GitHub？

GitHub 是一个代码托管平台，可以让你把代码存储在云端，并与他人协作。

### 安装 Git（如果还没有）

1. 访问 [https://git-scm.com/downloads](https://git-scm.com/downloads)
2. 下载适合你操作系统的版本（Windows/Mac/Linux）
3. 运行安装程序，使用默认设置即可
4. 安装完成后，打开命令行工具（Windows: CMD 或 PowerShell，Mac: Terminal）

### 验证 Git 安装

打开命令行，输入：

```bash
git --version
```

如果显示版本号（如 `git version 2.40.0`），说明安装成功。

### 配置 Git（首次使用）

**这是什么？**

这个配置是告诉 Git "你是谁"，用于标识你的提交记录。**这不是链接到 GitHub**，只是设置你的身份信息。

**什么时候需要配置？**

- 如果你第一次在这台电脑上使用 Git
- 或者你想更改之前配置的信息

**如何检查是否已配置？**

在命令行中执行：

```bash
git config --global user.name
git config --global user.email
```

如果显示了名字和邮箱，说明已经配置过了，可以跳过这一步。

**如何配置？**

在命令行中执行以下命令（替换为你的信息）：

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

**名字和邮箱是什么？**

- **名字（user.name）**：
  - 可以是任意名字，比如你的真实姓名、GitHub 用户名、或者昵称
  - 这个名字会显示在你的提交记录中
  - 例如：`"Ryan"` 或 `"张三"` 或 `"ryan123"`

- **邮箱（user.email）**：
  - **建议使用你的 GitHub 账号邮箱**（这样 GitHub 可以正确关联你的提交）
  - 也可以使用其他邮箱
  - 例如：`"your-email@example.com"` 或 `"username@gmail.com"`

**示例：**

```bash
# 示例 1：使用真实姓名和 GitHub 邮箱
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"

# 示例 2：使用 GitHub 用户名和邮箱
git config --global user.name "yourusername"
git config --global user.email "your-email@example.com"

# 示例 3：使用中文名字
git config --global user.name "张三"
git config --global user.email "zhangsan@example.com"
```

**⚠️ 重要：配置编码（避免中文乱码）**

如果你使用中文提交信息，建议先配置 Git 编码，避免在 GitHub 上显示乱码：

```bash
# 设置提交信息编码为 UTF-8
git config --global i18n.commitencoding utf-8

# 设置日志输出编码为 UTF-8
git config --global i18n.logoutputencoding utf-8
```

这个配置只需要设置一次，之后所有提交都会使用 UTF-8 编码。

**重要提示：**

- ✅ 这个配置只需要设置一次，之后所有 Git 操作都会使用这个身份
- ✅ 邮箱建议使用 GitHub 账号邮箱，这样提交会正确关联到你的 GitHub 账号
- ✅ 名字可以是任意名字，不一定要和 GitHub 用户名相同
- ⚠️ 如果你已经配置过，可以跳过这一步，或者用上面的命令查看当前配置
- ⚠️ **强烈建议**：配置编码后再提交，避免中文乱码问题

---

## 📦 创建 GitHub 仓库

### 步骤 1: 注册 GitHub 账号

1. 访问 [https://github.com](https://github.com)
2. 点击右上角 "Sign up"
3. 填写信息并创建账号
4. 验证邮箱（检查你的邮箱收件箱）

### 步骤 2: 创建新仓库

1. 登录 GitHub 后，点击右上角的 **"+"** 图标
2. 选择 **"New repository"**
3. 填写仓库信息：
   - **Repository name**: `wardrobe`（或任意名称）
   - **Description**: `个人电子衣柜管理系统`（可选）
   - **Visibility**: 
     - 选择 **Public**（公开，其他人可以看到）
     - 或 **Private**（私有，只有你能看到）
   - **Add a README file**: 
     - **不要勾选**（保持 Off），因为我们已经有了 README.md 文件
   - **Add .gitignore**: 
     - **选择 "No .gitignore"**（保持默认），因为我们已经有了 .gitignore 文件
   - **Add license**: 
     - **选择 "No license"**（保持默认），因为我们已经有了 LICENSE 文件（MIT License）
     - 如果你选择添加 License，GitHub 会创建一个新的 LICENSE 文件，可能会覆盖我们已有的
4. 点击 **"Create repository"**

### 步骤 3: 记住仓库地址

创建成功后，你会看到一个页面，上面有仓库地址，类似：
```
https://github.com/yourusername/wardrobe.git
```

**复制这个地址，稍后会用到！**

---

## 📤 上传代码到 GitHub

### 方法一：使用命令行（推荐）

#### 步骤 1: 打开命令行并进入项目目录

1. 打开命令行工具（CMD 或 PowerShell）
2. 找到你的项目文件夹路径（项目所在的完整路径）

**重要**：下面的路径 `E:\AI project\wardrobe` 只是**示例**，你需要替换成你自己的项目路径！

**如何找到你的项目路径？**
- 在文件资源管理器中，找到你的项目文件夹
- 点击地址栏，复制完整路径
- 例如：`C:\Users\YourName\Documents\wardrobe` 或 `D:\Projects\wardrobe`

**在 CMD 中：**
```bash
# 先切换到项目所在的盘符（如果项目不在 C 盘）
# 例如：如果项目在 E 盘，输入 E:
E:

# 然后进入项目目录（替换成你的实际路径）
cd "你的项目路径"
# 示例：cd "E:\AI project\wardrobe"
# 示例：cd "C:\Users\YourName\wardrobe"
```

**在 PowerShell 中：**
```bash
# PowerShell 可以直接切换，不需要先切换盘符
# 替换成你的实际路径
cd "你的项目路径"
# 示例：cd "E:\AI project\wardrobe"
# 示例：cd "C:\Users\YourName\wardrobe"
```

**提示**：
- ⚠️ **必须替换成你自己的项目路径**，不要直接复制示例路径
- 如果路径包含空格，需要用引号括起来
- 如果你的项目在 C 盘，CMD 中可以直接使用 `cd` 命令，不需要先切换盘符

#### 步骤 2: 初始化 Git（如果还没有）

```bash
git init
```

#### 步骤 3: 添加所有文件

```bash
git add .
```

这个命令会添加所有文件到 Git 的暂存区。

#### 步骤 4: 提交更改

```bash
git commit -m "Initial commit: 个人电子衣柜系统"
```

`-m` 后面的内容是提交信息，描述这次提交做了什么。

**⚠️ 重要：避免中文乱码**

如果提交信息包含中文，可能会在 GitHub 上显示为乱码。解决方法：

**方法一：设置 Git 编码（推荐）**

在提交前，先设置 Git 使用 UTF-8 编码：

```bash
# 设置提交信息编码为 UTF-8
git config --global i18n.commitencoding utf-8

# 设置日志输出编码为 UTF-8
git config --global i18n.logoutputencoding utf-8
```

**方法二：使用英文提交信息（最简单）**

如果不想处理编码问题，可以使用英文提交信息：

```bash
git commit -m "Initial commit: Personal Wardrobe System"
```

**方法三：在 PowerShell 中提交（推荐 Windows 用户）**

PowerShell 对中文支持更好，建议使用 PowerShell 而不是 CMD：

```bash
# 在 PowerShell 中执行
git commit -m "Initial commit: 个人电子衣柜系统"
```

#### 步骤 5: 连接到 GitHub 仓库

```bash
git remote add origin https://github.com/yourusername/wardrobe.git
```

**重要**：将 `yourusername` 替换为你的 GitHub 用户名，`wardrobe` 替换为你的仓库名。

例如，如果你的用户名是 `ryan123`，仓库名是 `wardrobe`，命令应该是：
```bash
git remote add origin https://github.com/ryan123/wardrobe.git
```

#### 步骤 6: 推送到 GitHub

```bash
git branch -M main
git push -u origin main
```

**注意**：
- 第一次推送时，GitHub 会要求你登录
- 如果提示输入用户名和密码，用户名是你的 GitHub 用户名
- 密码不是你的 GitHub 登录密码，而是 **Personal Access Token**（见下方说明）

#### 步骤 7: 创建 Personal Access Token（如果需要）

如果 GitHub 要求输入密码：

1. 访问 [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. 点击 **"Generate new token" > "Generate new token (classic)"**
3. 填写信息：
   - **Note**: `Vercel Deployment`（任意描述）
   - **Expiration**: 选择过期时间（建议 90 天或更长）
   - **Select scopes**: 勾选 `repo`（这会自动勾选所有子选项）
4. 点击 **"Generate token"**
5. **立即复制生成的 token**（只显示一次！）
6. 在命令行输入密码时，粘贴这个 token（而不是你的 GitHub 密码）

#### 验证上传成功

1. 刷新你的 GitHub 仓库页面
2. 你应该能看到所有项目文件
3. 如果看到了文件，说明上传成功！🎉

### 方法二：使用 GitHub Desktop（图形界面，更简单）

如果你觉得命令行太复杂，可以使用 GitHub Desktop：

#### 步骤 1: 下载 GitHub Desktop

1. 访问 [https://desktop.github.com](https://desktop.github.com)
2. 下载并安装 GitHub Desktop
3. 使用你的 GitHub 账号登录

#### 步骤 2: 添加本地仓库

1. 打开 GitHub Desktop
2. 点击 **"File" > "Add Local Repository"**
3. 选择你的项目文件夹（**选择你自己的项目路径，不要使用示例路径**）
   - 示例路径：`E:\AI project\wardrobe`（这只是示例）
   - 你需要选择你自己的项目文件夹
4. 点击 **"Add repository"**

#### 步骤 3: 发布到 GitHub

1. 在 GitHub Desktop 中，点击 **"Publish repository"**
2. 填写信息：
   - **Name**: `wardrobe`
   - **Description**: `个人电子衣柜管理系统`（可选）
   - **Keep this code private**: 根据需要勾选
3. 点击 **"Publish Repository"**
4. 等待上传完成

---

## 🌐 部署到 Vercel

### 步骤 1: 注册 Vercel 账号

1. 访问 [https://vercel.com](https://vercel.com)
2. 点击 **"Sign Up"**
3. 选择 **"Continue with GitHub"**（推荐，这样可以直接连接你的 GitHub 账号）
4. 授权 Vercel 访问你的 GitHub 账号

### 步骤 2: 创建新项目

1. 登录 Vercel 后，点击 **"Add New..." > "Project"**
2. 在项目列表中，找到你的 `wardrobe` 仓库
3. 点击 **"Import"**

### 步骤 3: 配置项目

在项目配置页面：

#### Framework Preset
- 应该自动检测为 **"Next.js"**，保持默认即可

#### Root Directory
- 保持默认 **`./`**

#### Build and Output Settings
- 保持所有默认设置

### 步骤 4: 配置环境变量

这是**最重要的一步**！

1. 在 **"Environment Variables"** 部分，点击 **"Add"** 或直接输入

2. 添加第一个环境变量：
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: 你的 Supabase Project URL
     - 获取方式：Supabase Dashboard > Settings > API > Project URL
     - 格式类似：`https://xxxxx.supabase.co`
   - **Environment**: 勾选所有三个（Production、Preview、Development）

3. 点击 **"Add"** 添加

4. 添加第二个环境变量：
   - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: 你的 Supabase Anon Key
     - 获取方式：Supabase Dashboard > Settings > API > anon public
     - 格式类似：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Environment**: 勾选所有三个（Production、Preview、Development）

5. 点击 **"Add"** 添加

**重要提示**：
- ✅ 确保变量名拼写正确（注意大小写）
- ✅ 值不要包含引号
- ✅ 复制时注意不要有多余的空格
- ✅ 两个环境变量都要勾选所有环境

### 步骤 5: 部署

1. 确认环境变量已添加
2. 点击页面底部的 **"Deploy"** 按钮
3. 等待构建完成（通常需要 1-3 分钟）

你会看到一个进度条，显示构建进度：
- Installing dependencies（安装依赖）
- Building（构建项目）
- Deploying（部署）

### 步骤 6: 获取部署地址

部署完成后，你会看到：

- ✅ **Success!** 消息
- 一个 URL，例如：`https://wardrobe-xxx.vercel.app`

**复制这个 URL，稍后会用到！**

---

## ⚙️ 配置 Supabase

部署完成后，需要配置 Supabase 以允许从 Vercel 域名登录。

### 步骤 1: 打开 Supabase Dashboard

1. 访问 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 选择你的项目

### 步骤 2: 配置 Auth 回调 URL

1. 在左侧菜单中，点击 **"Authentication"**
2. 点击 **"URL Configuration"** 标签
3. 在 **"Site URL"** 中：
   - 删除默认值（如果有）
   - 填入你的 Vercel 域名：`https://your-project.vercel.app`
   - **注意**：确保包含 `https://`，不要有末尾斜杠

4. 在 **"Redirect URLs"** 中：
   - 点击 **"Add URL"** 按钮
   - 添加：`https://your-project.vercel.app/auth/callback`
   - **注意**：确保包含 `https://`，路径是 `/auth/callback`

5. 点击 **"Save"** 保存更改

### 步骤 3: 配置注册控制（可选）

如果你只想自己使用：

1. 在 **"Authentication"** 页面，点击 **"Sign In / Providers"** 标签
2. 在 **"User Signups"** 部分
3. 关闭 **"Allow new users to sign up"** 开关
4. 点击 **"Save changes"**

如果你想开放注册：
- 保持 **"Allow new users to sign up"** 开启状态

---

## ✅ 测试部署

### 步骤 1: 访问你的网站

1. 在浏览器中打开你的 Vercel 域名
2. 你应该看到登录页面

### 步骤 2: 测试注册/登录

1. 如果注册已开启：
   - 点击注册，创建新账号
   - 使用邮箱和密码注册

2. 如果注册已关闭：
   - 使用你之前在本地注册的账号登录

### 步骤 3: 测试功能

登录后，测试以下功能：

- ✅ 添加单品
- ✅ 上传图片
- ✅ 创建穿搭
- ✅ 安排周计划
- ✅ 导出数据

如果所有功能都正常，恭喜你，部署成功！🎉

---

## ❓ 常见问题

### 问题 1: Git 命令不识别

**错误**: `'git' is not recognized as an internal or external command`

**解决方案**:
1. 确认已安装 Git
2. 重启命令行工具
3. 如果还是不行，可能需要将 Git 添加到系统 PATH

### 问题 2: GitHub 推送失败

**错误**: `remote: Support for password authentication was removed`

**解决方案**:
- 使用 Personal Access Token 而不是密码
- 参考上面的"创建 Personal Access Token"步骤

### 问题 3: Vercel 构建失败

**错误**: `Build failed` 或 `Module not found`

**解决方案**:
1. 检查 `package.json` 是否已提交到 Git
2. 确保所有文件都已上传到 GitHub
3. 查看 Vercel 的构建日志，找到具体错误信息
4. 常见原因：
   - 缺少依赖包
   - 环境变量未配置
   - 代码语法错误

### 问题 4: 环境变量未生效

**错误**: 应用无法连接到 Supabase

**解决方案**:
1. 检查 Vercel Dashboard 中的环境变量是否正确配置
2. 确保变量名拼写正确（注意大小写）
3. **重要**：环境变量更改后，需要重新部署
   - 在 Vercel Dashboard 中，点击 **"Redeploy"**

### 问题 5: 登录后重定向失败

**错误**: 点击登录链接后回到登录页面

**解决方案**:
1. 检查 Supabase Auth 回调 URL 是否已配置
2. 确保回调 URL 与 Vercel 域名完全匹配
3. 检查 URL 是否包含 `https://` 协议
4. 确保没有多余的斜杠

### 问题 6: 图片无法上传

**错误**: 403 Forbidden 或上传失败

**解决方案**:
1. 检查 Supabase Storage bucket 是否已创建
   - 名称应该是 `wardrobe`
   - 类型应该是 `Private`
2. 检查 Storage Policies 是否正确配置
3. 确保上传路径格式为 `{userId}/items/{itemId}.jpg`

### 问题 7: 找不到 .env.example 文件

**解决方案**:
- `.env.example` 文件可能被 Git 忽略了
- 这是正常的，你可以手动创建：
  1. 在项目根目录创建 `.env.example` 文件
  2. 内容如下：
  ```
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
  ```

### 问题 8: 提交信息在 GitHub 上显示为乱码

**错误**: 提交信息显示为 `涓汉鑾靛琉琛f煖绯荤粺` 等乱码，而不是正常的中文

**原因**: Git 在 Windows 上默认使用的编码与 GitHub 不匹配，导致中文提交信息显示为乱码

**解决方案**:

1. **设置 Git 编码（推荐，永久解决）**：
   ```bash
   # 设置提交信息编码为 UTF-8
   git config --global i18n.commitencoding utf-8
   
   # 设置日志输出编码为 UTF-8
   git config --global i18n.logoutputencoding utf-8
   ```
   设置后，之后的提交就不会再出现乱码了。

2. **使用 PowerShell 而不是 CMD**：
   - PowerShell 对中文支持更好
   - 建议在 PowerShell 中执行 Git 命令

3. **使用英文提交信息（最简单）**：
   ```bash
   git commit -m "Initial commit: Personal Wardrobe System"
   ```
   如果不想处理编码问题，直接使用英文提交信息。

4. **修复已提交的乱码信息（可选）**：
   
   如果已经提交了乱码信息，可以修改最近的提交信息。**详细步骤**：
   
   **步骤 1：修改最近的提交信息**
   ```bash
   git commit --amend -m "Initial commit: 个人电子衣柜系统"
   ```
   这个命令会修改最近一次提交的信息。
   
   **步骤 2：强制推送到 GitHub**
   ```bash
   git push -f origin main
   ```
   或者：
   ```bash
   git push -f
   ```
   
   **⚠️ 重要警告**：
   - `git push -f` 是强制推送，会覆盖 GitHub 上的提交历史
   - 如果其他人已经克隆了你的仓库，他们的本地仓库会与远程不一致
   - **只在你确定没有其他人使用这个仓库时使用**
   - 如果是个人项目，通常可以安全使用
   
   **如果修改历史提交信息（不是最近的提交）**：
   
   如果你的乱码提交不是最近的提交，需要使用 `git rebase` 来修改历史提交：
   
   **步骤 1：查看提交历史**
   ```bash
   git log --oneline
   ```
   找到乱码的提交，记住它的位置（是第几个提交）。
   
   **步骤 2：开始交互式 rebase**
   ```bash
   # 如果要修改所有提交（包括第一个），使用：
   git rebase -i --root
   
   # 或者，如果要修改最近 N 个提交，使用：
   git rebase -i HEAD~N
   # 例如：git rebase -i HEAD~3 表示修改最近 3 个提交
   ```
   
   **步骤 3：在编辑器中修改**
   
   会打开一个编辑器（通常是 vim 或你配置的默认编辑器），显示类似：
   ```
   pick 98d3534 Initial commit: 涓汉鐢靛瓙琛f煖绯荤粺
   pick b69a356 Initial commit: 个人电子衣柜系统
   ```
   
   将需要修改的提交前的 `pick` 改为 `reword`（或简写 `r`）：
   ```
   reword 98d3534 Initial commit: 涓汉鐢靛瓙琛f煖绯荤粺
   pick b69a356 Initial commit: 个人电子衣柜系统
   ```
   
   保存并关闭编辑器（vim 中：按 `Esc`，输入 `:wq`，按回车）。
   
   **步骤 4：输入新的提交信息**
   
   Git 会再次打开编辑器，让你输入新的提交信息。删除旧信息，输入：
   ```
   Initial commit: 个人电子衣柜系统
   ```
   保存并关闭编辑器。
   
   **步骤 5：强制推送**
   ```bash
   git push -f origin main
   ```
   
   **⚠️ 注意事项**：
   - 如果使用 vim 编辑器不熟悉，可以设置 Git 使用其他编辑器：
     ```bash
     git config --global core.editor "code --wait"  # 使用 VS Code
     # 或
     git config --global core.editor "notepad"      # 使用记事本
     ```
   - 执行 `git push -f` 会覆盖 GitHub 上的历史，请谨慎使用

**预防措施**：
- ✅ 在配置 Git 时就设置好编码（见"配置 Git"部分）
- ✅ 使用 PowerShell 执行 Git 命令
- ✅ 如果担心编码问题，使用英文提交信息

---

## 🔄 更新部署

当你修改代码后，如何更新部署：

### 方法一：自动部署（推荐）

如果你使用 GitHub 推送代码：

1. 在本地修改代码
2. 提交更改：
   ```bash
   git add .
   git commit -m "更新功能"
   git push
   ```
3. Vercel 会自动检测到更改并重新部署
4. 在 Vercel Dashboard 中查看部署状态

### 方法二：手动重新部署

1. 在 Vercel Dashboard 中，进入你的项目
2. 点击 **"Deployments"** 标签
3. 找到最新的部署，点击右侧的 **"..."** 菜单
4. 选择 **"Redeploy"**

---

## 📊 查看部署状态

在 Vercel Dashboard 中，你可以：

- 查看所有部署历史
- 查看构建日志
- 查看函数日志
- 监控性能指标
- 查看错误报告

---

## 🔒 安全建议

1. **不要提交敏感信息**：
   - ✅ `.env.local` 已在 `.gitignore` 中
   - ✅ 不要在代码中硬编码 API Key

2. **定期检查**：
   - 定期检查 Supabase Dashboard 的访问日志
   - 监控异常访问

3. **使用环境变量**：
   - 所有敏感配置都使用环境变量
   - 不要在客户端代码中暴露 Service Role Key

---

## 🎉 完成！

恭喜你完成了部署！现在你的应用可以通过 Vercel 域名访问了。

### 下一步

- 分享你的应用给朋友使用
- 继续开发新功能
- 提交 Issue 或 Pull Request 到 GitHub

### 需要帮助？

如果遇到问题：
1. 查看本文档的"常见问题"部分
2. 查看 Vercel 部署日志
3. 查看 Supabase Dashboard 日志
4. 在 GitHub 仓库提交 Issue

---

## 📝 快速参考

### 重要链接

- **GitHub**: https://github.com
- **Vercel**: https://vercel.com
- **Supabase**: https://supabase.com

### 重要命令

```bash
# 初始化 Git
git init

# 添加文件
git add .

# 提交更改
git commit -m "提交信息"

# 连接到 GitHub
git remote add origin https://github.com/yourusername/wardrobe.git

# 推送到 GitHub
git push -u origin main

# 查看状态
git status
```

---

**祝你部署顺利！** 🚀
