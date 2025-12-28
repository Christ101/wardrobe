# 数据库迁移说明

## 版本 v1.1 更新（2025-12-28）

本次更新需要修改数据库结构以支持新功能。

## 📋 操作步骤（详细版）

### 第一步：打开 Supabase Dashboard

1. 访问 [https://supabase.com](https://supabase.com)
2. 点击右上角 **"Sign In"** 登录你的账号
3. 登录后，在项目列表中找到你的项目（项目 URL 是 `ngcjmokjjstsnqgtfknp.supabase.co`）
4. 点击项目进入 Dashboard

### 第二步：打开 SQL Editor

1. 在左侧菜单栏中，找到 **"SQL Editor"** 图标（通常是一个代码符号 `</>` 或者显示为 "SQL Editor"）
2. 点击进入 SQL Editor 页面
3. 你会看到一个代码编辑区域，可以在这里输入和执行 SQL 语句

### 第三步：执行数据库迁移 SQL

#### 步骤 3.1：添加 items 表的新字段

1. 在 SQL Editor 的代码编辑区域，**复制并粘贴**以下 SQL 代码：

```sql
-- 添加子分类字段（P1-2）
ALTER TABLE items ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- 添加商品介绍 HTML 文件路径字段（P1-3）
ALTER TABLE items ADD COLUMN IF NOT EXISTS detail_html_path TEXT;
```

2. 点击编辑器右下角的 **"Run"** 按钮（或者按快捷键 `Ctrl + Enter` / `Cmd + Enter`）
3. 等待执行完成，如果成功，你会看到类似 "Success. No rows returned" 的提示

#### 步骤 3.2：检查并更新 outfit_items 表的约束（可选）

**先检查是否有约束：**

1. 在 SQL Editor 中，**先执行**以下查询来检查是否有约束：

```sql
-- 查看当前约束
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE table_name = 'outfit_items' AND constraint_name LIKE '%slot%';
```

2. 如果查询结果**为空**（没有返回任何行），说明没有约束，**可以跳过步骤 3.2 的后续操作**，代码会自动支持 `bottom_base` 值。

3. 如果查询结果**有数据**（返回了约束信息），则需要执行以下 SQL：

```sql
-- 删除旧约束（如果存在）
ALTER TABLE outfit_items DROP CONSTRAINT IF EXISTS outfit_items_slot_check;

-- 添加新约束（包含 bottom_base）
ALTER TABLE outfit_items ADD CONSTRAINT outfit_items_slot_check 
  CHECK (slot IN ('base', 'mid', 'outer', 'bottom', 'bottom_base', 'shoes', 'socks', 'accessory'));
```

### 第四步：验证迁移是否成功

执行以下 SQL 来验证字段是否已添加：

```sql
-- 检查 items 表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'items' 
  AND column_name IN ('subcategory', 'detail_html_path');
```

**预期结果：** 应该返回 2 行数据，显示 `subcategory` 和 `detail_html_path` 两个字段。

如果看到这两个字段，说明迁移成功！✅

---

## 📝 SQL 代码汇总

### 1. items 表新增字段

```sql
-- 添加子分类字段（P1-2）
ALTER TABLE items ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- 添加商品介绍 HTML 文件路径字段（P1-3）
ALTER TABLE items ADD COLUMN IF NOT EXISTS detail_html_path TEXT;
```

### 2. outfit_items 表扩展 slot 枚举值（可选）

**重要提示：** 如果你的 `outfit_items.slot` 字段是 TEXT 类型且没有 CHECK 约束，**可以跳过这一步**，代码会自动支持 `bottom_base` 值。

如果需要检查并更新约束，执行以下 SQL：

```sql
-- 步骤 1：查看当前约束
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE table_name = 'outfit_items' AND constraint_name LIKE '%slot%';

-- 步骤 2：如果上面查询有结果，执行以下删除和添加约束的 SQL
-- 删除旧约束（如果存在）
ALTER TABLE outfit_items DROP CONSTRAINT IF EXISTS outfit_items_slot_check;

-- 添加新约束（包含 bottom_base）
ALTER TABLE outfit_items ADD CONSTRAINT outfit_items_slot_check 
  CHECK (slot IN ('base', 'mid', 'outer', 'bottom', 'bottom_base', 'shoes', 'socks', 'accessory'));
```

### 3. 验证迁移结果

执行以下查询验证字段已添加：

```sql
-- 检查 items 表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'items' 
  AND column_name IN ('subcategory', 'detail_html_path');
```

**预期结果：** 应该返回 2 行，显示：
- `subcategory` | `text` | `YES`
- `detail_html_path` | `text` | `YES`

如果看到这两个字段，说明迁移成功！✅

## ⚠️ 常见问题

### Q1: 执行 SQL 时报错 "permission denied" 或 "access denied"

**解决方案：** 确保你使用的是项目的 **Owner** 账号，或者有管理员权限。如果只是普通用户，需要联系项目管理员。

### Q2: 执行 SQL 时报错 "relation 'items' does not exist"

**解决方案：** 检查表名是否正确。在 Supabase 中，表名是区分大小写的。确保表名是 `items`（小写）。

### Q3: 执行 SQL 时报错 "column already exists"

**解决方案：** 这说明字段已经存在了，这是正常的。`IF NOT EXISTS` 会避免重复添加，你可以继续下一步。

### Q4: 如何确认 SQL 执行成功？

**解决方案：** 
- 执行后查看编辑器下方的结果区域
- 如果显示 "Success. No rows returned" 或类似提示，说明执行成功
- 如果有错误信息，会显示具体的错误原因

## 🔄 回滚（如果需要撤销更改）

**⚠️ 警告：** 回滚会删除新增的字段，如果字段中有数据，数据会丢失！

如果需要回滚这些更改，执行以下 SQL：

```sql
-- 删除新增字段（注意：会丢失数据）
ALTER TABLE items DROP COLUMN IF EXISTS subcategory;
ALTER TABLE items DROP COLUMN IF EXISTS detail_html_path;

-- 恢复旧约束（根据实际情况调整）
ALTER TABLE outfit_items DROP CONSTRAINT IF EXISTS outfit_items_slot_check;
ALTER TABLE outfit_items ADD CONSTRAINT outfit_items_slot_check 
  CHECK (slot IN ('base', 'mid', 'outer', 'bottom', 'shoes', 'socks', 'accessory'));
```

## 📸 操作截图说明（文字版）

1. **登录 Supabase** → 访问 supabase.com，点击 Sign In
2. **选择项目** → 在项目列表中找到你的项目并点击
3. **打开 SQL Editor** → 左侧菜单找到 "SQL Editor" 并点击
4. **输入 SQL** → 在代码编辑区域粘贴 SQL 代码
5. **执行 SQL** → 点击右下角 "Run" 按钮或按 `Ctrl + Enter`
6. **查看结果** → 在下方结果区域查看执行结果

## ✅ 完成检查清单

- [ ] 已登录 Supabase Dashboard
- [ ] 已打开 SQL Editor
- [ ] 已执行 items 表新增字段的 SQL
- [ ] 已检查 outfit_items 约束（可选）
- [ ] 已执行验证 SQL 确认字段已添加
- [ ] 验证结果显示了 `subcategory` 和 `detail_html_path` 两个字段

完成以上步骤后，数据库迁移就完成了！🎉

