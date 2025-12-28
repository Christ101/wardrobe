-- 修复 outfit_items 表的 RLS 策略
-- 这个文件包含修复穿搭保存失败问题的 SQL

-- 1. 确保 outfit_items 表已启用 RLS
ALTER TABLE outfit_items ENABLE ROW LEVEL SECURITY;

-- 2. 删除可能存在的旧策略（如果存在）
DROP POLICY IF EXISTS "Users can view own outfit_items" ON outfit_items;
DROP POLICY IF EXISTS "Users can insert own outfit_items" ON outfit_items;
DROP POLICY IF EXISTS "Users can update own outfit_items" ON outfit_items;
DROP POLICY IF EXISTS "Users can delete own outfit_items" ON outfit_items;

-- 3. 创建新的 RLS 策略
-- 查看：用户只能查看自己穿搭中的单品关联
CREATE POLICY "Users can view own outfit_items" ON outfit_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM outfits
      WHERE outfits.id = outfit_items.outfit_id
      AND outfits.owner_id = auth.uid()
    )
  );

-- 插入：用户只能为自己的穿搭添加单品关联
CREATE POLICY "Users can insert own outfit_items" ON outfit_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM outfits
      WHERE outfits.id = outfit_items.outfit_id
      AND outfits.owner_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM items
      WHERE items.id = outfit_items.item_id
      AND items.owner_id = auth.uid()
    )
  );

-- 更新：用户只能更新自己穿搭中的单品关联
CREATE POLICY "Users can update own outfit_items" ON outfit_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM outfits
      WHERE outfits.id = outfit_items.outfit_id
      AND outfits.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM outfits
      WHERE outfits.id = outfit_items.outfit_id
      AND outfits.owner_id = auth.uid()
    )
  );

-- 删除：用户只能删除自己穿搭中的单品关联
CREATE POLICY "Users can delete own outfit_items" ON outfit_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM outfits
      WHERE outfits.id = outfit_items.outfit_id
      AND outfits.owner_id = auth.uid()
    )
  );

-- 4. 确保 outfits 表也有完整的 RLS 策略（如果还没有）
-- 检查并创建 outfits 表的策略（如果不存在）

-- 查看：用户只能查看自己的穿搭
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'outfits' 
    AND policyname = 'Users can view own outfits'
  ) THEN
    CREATE POLICY "Users can view own outfits" ON outfits
      FOR SELECT
      USING (auth.uid() = owner_id);
  END IF;
END $$;

-- 插入：用户只能创建自己的穿搭
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'outfits' 
    AND policyname = 'Users can insert own outfits'
  ) THEN
    CREATE POLICY "Users can insert own outfits" ON outfits
      FOR INSERT
      WITH CHECK (auth.uid() = owner_id);
  END IF;
END $$;

-- 更新：用户只能更新自己的穿搭
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'outfits' 
    AND policyname = 'Users can update own outfits'
  ) THEN
    CREATE POLICY "Users can update own outfits" ON outfits
      FOR UPDATE
      USING (auth.uid() = owner_id)
      WITH CHECK (auth.uid() = owner_id);
  END IF;
END $$;

-- 删除：用户只能删除自己的穿搭
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'outfits' 
    AND policyname = 'Users can delete own outfits'
  ) THEN
    CREATE POLICY "Users can delete own outfits" ON outfits
      FOR DELETE
      USING (auth.uid() = owner_id);
  END IF;
END $$;

