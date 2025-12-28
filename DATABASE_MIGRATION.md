# 数据库迁移说明

## 版本 v1.1 更新（2025-12-28）

本次更新需要修改数据库结构以支持新功能。

### 1. items 表新增字段

在 Supabase SQL Editor 中执行以下 SQL：

```sql
-- 添加子分类字段（P1-2）
ALTER TABLE items ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- 添加商品介绍 HTML 文件路径字段（P1-3）
ALTER TABLE items ADD COLUMN IF NOT EXISTS detail_html_path TEXT;
```

### 2. outfit_items 表扩展 slot 枚举值

如果 `outfit_items.slot` 字段有 CHECK 约束，需要更新约束以支持 `bottom_base`：

```sql
-- 查看当前约束
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE table_name = 'outfit_items' AND constraint_name LIKE '%slot%';

-- 删除旧约束（如果存在）
ALTER TABLE outfit_items DROP CONSTRAINT IF EXISTS outfit_items_slot_check;

-- 添加新约束（包含 bottom_base）
ALTER TABLE outfit_items ADD CONSTRAINT outfit_items_slot_check 
  CHECK (slot IN ('base', 'mid', 'outer', 'bottom', 'bottom_base', 'shoes', 'socks', 'accessory'));
```

**注意**：如果 `slot` 字段是 TEXT 类型且没有 CHECK 约束，则无需修改，代码会自动支持 `bottom_base` 值。

### 3. 验证

执行以下查询验证字段已添加：

```sql
-- 检查 items 表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'items' 
  AND column_name IN ('subcategory', 'detail_html_path');

-- 检查 outfit_items 约束
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE table_name = 'outfit_items';
```

### 4. 回滚（如果需要）

如果需要回滚这些更改：

```sql
-- 删除新增字段（注意：会丢失数据）
ALTER TABLE items DROP COLUMN IF EXISTS subcategory;
ALTER TABLE items DROP COLUMN IF EXISTS detail_html_path;

-- 恢复旧约束（根据实际情况调整）
ALTER TABLE outfit_items DROP CONSTRAINT IF EXISTS outfit_items_slot_check;
ALTER TABLE outfit_items ADD CONSTRAINT outfit_items_slot_check 
  CHECK (slot IN ('base', 'mid', 'outer', 'bottom', 'shoes', 'socks', 'accessory'));
```

