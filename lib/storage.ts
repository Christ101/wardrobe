import { createClient } from './supabase/client';

export async function uploadImage(userId: string, itemId: string, file: File): Promise<string> {
  const supabase = createClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${itemId}.${fileExt}`;
  const filePath = `${userId}/items/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('wardrobe')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`上传失败: ${uploadError.message}`);
  }

  return filePath;
}

export async function getSignedUrl(filePath: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from('wardrobe')
    .createSignedUrl(filePath, 3600);

  if (error || !data) {
    throw new Error(`获取图片链接失败: ${error?.message || '未知错误'}`);
  }

  return data.signedUrl;
}

export async function deleteImage(filePath: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from('wardrobe')
    .remove([filePath]);

  if (error) {
    throw new Error(`删除图片失败: ${error.message}`);
  }
}

// P1-3: 上传 HTML 文件（商品介绍）
export async function uploadHTML(userId: string, itemId: string, file: File): Promise<string> {
  const supabase = createClient();
  const filePath = `${userId}/items/${itemId}/detail.html`;

  const { error: uploadError } = await supabase.storage
    .from('wardrobe')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'text/html',
    });

  if (uploadError) {
    throw new Error(`上传 HTML 失败: ${uploadError.message}`);
  }

  return filePath;
}

