-- 修复 outfit_items 表的 owner_id 问题
-- 这个文件用于修复 "null value in column owner_id" 错误

-- 方案 1：如果表已经有 owner_id 字段，添加触发器自动填充
-- 检查表是否有 owner_id 字段，如果有则创建触发器

-- 首先检查表是否有 owner_id 字段
DO $check$
BEGIN
  -- 如果 outfit_items 表有 owner_id 字段，添加触发器
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'outfit_items' 
    AND column_name = 'owner_id'
  ) THEN
    RAISE NOTICE '检测到 owner_id 字段，将创建触发器';
  ELSE
    RAISE NOTICE 'outfit_items 表没有 owner_id 字段，无需处理';
  END IF;
END $check$;

-- 创建函数：从 outfits 表获取 owner_id
-- 注意：如果表没有 owner_id 字段，这个函数创建会失败，但不会影响其他操作
CREATE OR REPLACE FUNCTION set_outfit_items_owner_id()
RETURNS TRIGGER AS $function$
BEGIN
  SELECT owner_id INTO NEW.owner_id
  FROM outfits
  WHERE id = NEW.outfit_id;
  RETURN NEW;
END;
$function$ LANGUAGE plpgsql;

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS trigger_set_outfit_items_owner_id ON outfit_items;

-- 创建新触发器（只有在表有 owner_id 字段时才会成功）
CREATE TRIGGER trigger_set_outfit_items_owner_id
BEFORE INSERT ON outfit_items
FOR EACH ROW
WHEN (NEW.owner_id IS NULL)
EXECUTE FUNCTION set_outfit_items_owner_id();

-- 方案 2：如果表没有 owner_id 字段，但错误提示需要，则添加字段
-- 注意：这个方案会修改表结构，请谨慎使用
-- 如果需要，取消下面的注释：

/*
ALTER TABLE outfit_items ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 为现有数据填充 owner_id
UPDATE outfit_items oi
SET owner_id = o.owner_id
FROM outfits o
WHERE oi.outfit_id = o.id;

-- 设置 owner_id 为 NOT NULL（在填充完数据后）
ALTER TABLE outfit_items ALTER COLUMN owner_id SET NOT NULL;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_outfit_items_owner_id ON outfit_items(owner_id);
*/

