import { createClient } from '../supabase/client';

export interface Plan {
  id?: string;
  owner_id?: string;
  plan_date: string;
  outfit_id?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PlanWithOutfit extends Plan {
  outfit?: {
    id: string;
    name?: string;
    notes?: string;
  };
}

export async function getPlans(startDate: string, endDate: string): Promise<PlanWithOutfit[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('plans')
    .select(`
      *,
      outfit:outfits(id, name, notes)
    `)
    .gte('plan_date', startDate)
    .lte('plan_date', endDate)
    .order('plan_date', { ascending: true });

  if (error) {
    throw new Error(`获取计划失败: ${error.message}`);
  }

  return (data || []).map((plan: any) => ({
    ...plan,
    outfit: plan.outfit || undefined,
  }));
}

export async function getPlan(date: string): Promise<PlanWithOutfit | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('plans')
    .select(`
      *,
      outfit:outfits(id, name, notes)
    `)
    .eq('plan_date', date)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`获取计划失败: ${error.message}`);
  }

  return {
    ...data,
    outfit: data.outfit || undefined,
  };
}

export async function createOrUpdatePlan(plan: Omit<Plan, 'id' | 'owner_id' | 'created_at' | 'updated_at'>): Promise<Plan> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('未登录');
  }

  // 使用upsert，因为unique约束在(owner_id, plan_date)
  const { data, error } = await supabase
    .from('plans')
    .upsert({
      ...plan,
      owner_id: user.id,
    }, {
      onConflict: 'owner_id,plan_date',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`保存计划失败: ${error.message}`);
  }

  return data;
}

export async function deletePlan(date: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('plans')
    .delete()
    .eq('plan_date', date);

  if (error) {
    throw new Error(`删除计划失败: ${error.message}`);
  }
}

