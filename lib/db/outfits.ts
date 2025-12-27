import { createClient } from '../supabase/client';
import { Item } from './items';

export type OutfitSlot = 'base' | 'mid' | 'outer' | 'bottom' | 'shoes' | 'socks' | 'accessory';

export interface Outfit {
  id: string;
  owner_id: string;
  name?: string;
  notes?: string;
  cover_image_path?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OutfitItem {
  outfit_id: string;
  item_id: string;
  slot: OutfitSlot;
}

export interface OutfitWithItems extends Outfit {
  items: Array<{
    slot: OutfitSlot;
    item: Item;
  }>;
}

export async function getOutfits(): Promise<Outfit[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('outfits')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`获取穿搭失败: ${error.message}`);
  }

  return data || [];
}

export async function getOutfit(id: string): Promise<OutfitWithItems | null> {
  const supabase = createClient();
  
  // 获取outfit基本信息
  const { data: outfit, error: outfitError } = await supabase
    .from('outfits')
    .select('*')
    .eq('id', id)
    .single();

  if (outfitError) {
    if (outfitError.code === 'PGRST116') {
      return null;
    }
    throw new Error(`获取穿搭失败: ${outfitError.message}`);
  }

  // 获取outfit关联的items
  const { data: outfitItems, error: itemsError } = await supabase
    .from('outfit_items')
    .select('slot, item_id')
    .eq('outfit_id', id);

  if (itemsError) {
    throw new Error(`获取穿搭单品失败: ${itemsError.message}`);
  }

  // 获取每个item的详细信息
  const itemIds = outfitItems?.map(oi => oi.item_id) || [];
  const items: Item[] = [];
  
  if (itemIds.length > 0) {
    const { data: itemsData, error: itemsDataError } = await supabase
      .from('items')
      .select('*')
      .in('id', itemIds);

    if (itemsDataError) {
      throw new Error(`获取单品详情失败: ${itemsDataError.message}`);
    }

    items.push(...(itemsData || []));
  }

  // 组合数据
  const itemsWithSlot = outfitItems?.map(oi => ({
    slot: oi.slot as OutfitSlot,
    item: items.find(i => i.id === oi.item_id)!,
  })).filter(oi => oi.item) || [];

  return {
    ...outfit,
    items: itemsWithSlot,
  };
}

export async function createOutfit(
  outfit: Omit<Outfit, 'id' | 'owner_id' | 'created_at' | 'updated_at'>,
  items: Array<{ item_id: string; slot: OutfitSlot }>
): Promise<Outfit> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('未登录');
  }

  // 创建outfit
  const { data: newOutfit, error: outfitError } = await supabase
    .from('outfits')
    .insert({
      ...outfit,
      owner_id: user.id,
    })
    .select()
    .single();

  if (outfitError) {
    throw new Error(`创建穿搭失败: ${outfitError.message}`);
  }

  // 创建outfit_items
  if (items.length > 0) {
    const outfitItems = items.map(item => ({
      outfit_id: newOutfit.id,
      item_id: item.item_id,
      slot: item.slot,
    }));

    const { error: itemsError } = await supabase
      .from('outfit_items')
      .insert(outfitItems);

    if (itemsError) {
      // 如果插入items失败，删除已创建的outfit
      await supabase.from('outfits').delete().eq('id', newOutfit.id);
      throw new Error(`创建穿搭单品关联失败: ${itemsError.message}`);
    }
  }

  return newOutfit;
}

export async function updateOutfit(
  id: string,
  updates: Partial<Outfit>,
  items?: Array<{ item_id: string; slot: OutfitSlot }>
): Promise<Outfit> {
  const supabase = createClient();

  // 更新outfit基本信息
  if (Object.keys(updates).length > 0) {
    const { data, error } = await supabase
      .from('outfits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`更新穿搭失败: ${error.message}`);
    }
  }

  // 如果提供了items，先删除旧的关联，再插入新的
  if (items !== undefined) {
    const { error: deleteError } = await supabase
      .from('outfit_items')
      .delete()
      .eq('outfit_id', id);

    if (deleteError) {
      throw new Error(`删除旧关联失败: ${deleteError.message}`);
    }

    if (items.length > 0) {
      const outfitItems = items.map(item => ({
        outfit_id: id,
        item_id: item.item_id,
        slot: item.slot,
      }));

      const { error: insertError } = await supabase
        .from('outfit_items')
        .insert(outfitItems);

      if (insertError) {
        throw new Error(`更新穿搭单品关联失败: ${insertError.message}`);
      }
    }
  }

  const result = await getOutfit(id);
  if (!result) {
    throw new Error('更新后无法获取穿搭');
  }

  return result;
}

export async function deleteOutfit(id: string): Promise<void> {
  const supabase = createClient();

  // 先删除outfit_items
  const { error: itemsError } = await supabase
    .from('outfit_items')
    .delete()
    .eq('outfit_id', id);

  if (itemsError) {
    throw new Error(`删除穿搭单品关联失败: ${itemsError.message}`);
  }

  // 再删除outfit
  const { error } = await supabase
    .from('outfits')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`删除穿搭失败: ${error.message}`);
  }
}

