import { createClient } from '../supabase/client';

export type ItemCategory = 'top' | 'bottom' | 'outer' | 'shoes' | 'socks' | 'accessory';
export type ItemLayer = 'base' | 'mid' | 'outer';
export type ItemStatus = 'clean' | 'laundry' | 'repair';

export interface Item {
  id: string;
  owner_id: string;
  category: ItemCategory;
  layer?: ItemLayer;
  subcategory?: string; // 子分类（P1-2）
  name?: string;
  color_primary?: string;
  color_secondary?: string;
  size?: string;
  status: ItemStatus;
  care_tags?: string | string[]; // 支持字符串或数组
  image_path?: string;
  detail_html_path?: string; // 商品介绍 HTML 文件路径（P1-3）
  created_at?: string;
  updated_at?: string;
}

export async function getItems(filters?: {
  category?: ItemCategory;
  status?: ItemStatus;
  subcategory?: string; // P1-2: 子分类筛选
  care_tags?: string[]; // P0-2: 标签筛选（OR 逻辑）
}): Promise<Item[]> {
  const supabase = createClient();
  let query = supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.subcategory) {
    query = query.eq('subcategory', filters.subcategory);
  }
  // P0-2: care_tags 筛选（OR 逻辑：任一标签匹配即可）
  if (filters?.care_tags && filters.care_tags.length > 0) {
    // Supabase 数组字段筛选：使用 .overlaps() 或 .contains()
    // 这里使用 .overlaps() 实现 OR 逻辑
    query = query.overlaps('care_tags', filters.care_tags);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`获取单品失败: ${error.message}`);
  }

  // 处理 care_tags：如果是数组，转换为字符串（用逗号分隔）
  const processedData = (data || []).map((item: any) => ({
    ...item,
    care_tags: Array.isArray(item.care_tags) 
      ? item.care_tags.join(', ') 
      : item.care_tags,
  }));

  return processedData;
}

export async function getItem(id: string): Promise<Item | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`获取单品失败: ${error.message}`);
  }

  // 处理 care_tags：如果是数组，转换为字符串（用逗号分隔）
  if (data) {
    data.care_tags = Array.isArray(data.care_tags) 
      ? data.care_tags.join(', ') 
      : data.care_tags;
  }

  return data;
}

export async function createItem(item: Omit<Item, 'id' | 'owner_id' | 'created_at' | 'updated_at'>): Promise<Item> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('未登录');
  }

  // 处理 care_tags：如果是字符串，转换为数组；如果是数组，保持原样
  const careTags = item.care_tags 
    ? (typeof item.care_tags === 'string' ? [item.care_tags] : item.care_tags)
    : undefined;

  const { data, error } = await supabase
    .from('items')
    .insert({
      ...item,
      care_tags: careTags,
      owner_id: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`创建单品失败: ${error.message}`);
  }

  return data;
}

export async function updateItem(id: string, updates: Partial<Item>): Promise<Item> {
  const supabase = createClient();
  
  // 处理 care_tags：如果是字符串，转换为数组；如果是数组，保持原样
  const processedUpdates = { ...updates };
  if (processedUpdates.care_tags !== undefined) {
    processedUpdates.care_tags = typeof processedUpdates.care_tags === 'string' 
      ? [processedUpdates.care_tags] 
      : processedUpdates.care_tags;
  }

  const { data, error } = await supabase
    .from('items')
    .update(processedUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`更新单品失败: ${error.message}`);
  }

  return data;
}

export async function deleteItem(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`删除单品失败: ${error.message}`);
  }
}

