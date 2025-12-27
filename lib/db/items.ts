import { createClient } from '../supabase/client';

export type ItemCategory = 'top' | 'bottom' | 'outer' | 'shoes' | 'socks' | 'accessory';
export type ItemLayer = 'base' | 'mid' | 'outer';
export type ItemStatus = 'clean' | 'laundry' | 'repair';

export interface Item {
  id: string;
  owner_id: string;
  category: ItemCategory;
  layer?: ItemLayer;
  name?: string;
  color_primary?: string;
  color_secondary?: string;
  size?: string;
  status: ItemStatus;
  care_tags?: string;
  image_path?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getItems(filters?: {
  category?: ItemCategory;
  status?: ItemStatus;
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

  const { data, error } = await query;

  if (error) {
    throw new Error(`获取单品失败: ${error.message}`);
  }

  return data || [];
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

  return data;
}

export async function createItem(item: Omit<Item, 'id' | 'owner_id' | 'created_at' | 'updated_at'>): Promise<Item> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('未登录');
  }

  const { data, error } = await supabase
    .from('items')
    .insert({
      ...item,
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
  const { data, error } = await supabase
    .from('items')
    .update(updates)
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

