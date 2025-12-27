import { Item } from './db/items';

export interface ExportItem {
  item_id: string;
  name?: string;
  category: string;
  layer?: string;
  subcategory?: string;
  color?: string;
  color_secondary?: string;
  size?: string;
  season?: string;
  warmth_level?: string;
  care?: string[];
  occasion_tags?: string[];
  status: string;
  notes?: string;
}

// 排序函数：category → layer → name
function sortItems(items: ExportItem[]): ExportItem[] {
  const categoryOrder: Record<string, number> = {
    top: 1,
    bottom: 2,
    outer: 3,
    shoes: 4,
    socks: 5,
    accessory: 6,
  };

  const layerOrder: Record<string, number> = {
    base: 1,
    mid: 2,
    outer: 3,
  };

  return [...items].sort((a, b) => {
    // 先按 category 排序
    const categoryDiff = (categoryOrder[a.category] || 999) - (categoryOrder[b.category] || 999);
    if (categoryDiff !== 0) return categoryDiff;

    // 再按 layer 排序
    const layerA = a.layer || '';
    const layerB = b.layer || '';
    const layerDiff = (layerOrder[layerA] || 999) - (layerOrder[layerB] || 999);
    if (layerDiff !== 0) return layerDiff;

    // 最后按 name 排序
    const nameA = a.name || '';
    const nameB = b.name || '';
    return nameA.localeCompare(nameB, 'zh-CN');
  });
}

// 转换 Item 为 ExportItem
function convertToExportItem(item: Item): ExportItem {
  // 处理 care_tags：如果是字符串，转换为数组；如果是数组，保持原样
  let careTags: string[] = [];
  if (item.care_tags) {
    if (typeof item.care_tags === 'string') {
      // 如果是逗号分隔的字符串，分割成数组
      // 注意：getItems 返回的 care_tags 已经是逗号分隔的字符串（从数组转换而来）
      careTags = item.care_tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    } else if (Array.isArray(item.care_tags)) {
      careTags = item.care_tags.filter(tag => tag);
    }
  }

  return {
    item_id: item.id,
    name: item.name || undefined,
    category: item.category,
    layer: item.layer || undefined,
    subcategory: undefined, // 如果数据库中有这个字段，需要从 item 中获取
    color: item.color_primary || undefined,
    color_secondary: item.color_secondary || undefined,
    size: item.size || undefined,
    season: undefined, // 如果数据库中有这个字段，需要从 item 中获取
    warmth_level: undefined, // 如果数据库中有这个字段，需要从 item 中获取
    care: careTags.length > 0 ? careTags : undefined,
    occasion_tags: undefined, // 如果数据库中有这个字段，需要从 item 中获取
    status: item.status,
    notes: undefined, // 如果数据库中有这个字段，需要从 item 中获取
  };
}

// 生成 YAML-like 文本格式
export function generateYAMLText(items: Item[]): string {
  const exportItems = sortItems(items.map(convertToExportItem));
  
  let text = '# Wardrobe Export v1\n';
  
  exportItems.forEach((item, index) => {
    if (index > 0) text += '\n';
    text += `- item_id: ${item.item_id}\n`;
    
    if (item.name) text += `  name: ${item.name}\n`;
    text += `  category: ${item.category}\n`;
    if (item.layer) text += `  layer: ${item.layer}\n`;
    if (item.subcategory) text += `  subcategory: ${item.subcategory}\n`;
    if (item.color) text += `  color: ${item.color}\n`;
    if (item.color_secondary) text += `  color_secondary: ${item.color_secondary}\n`;
    if (item.size) text += `  size: ${item.size}\n`;
    if (item.season) text += `  season: ${item.season}\n`;
    if (item.warmth_level) text += `  warmth_level: ${item.warmth_level}\n`;
    if (item.care && item.care.length > 0) {
      text += `  care: [${item.care.map(c => `"${c}"`).join(',')}]\n`;
    }
    if (item.occasion_tags && item.occasion_tags.length > 0) {
      text += `  occasion_tags: [${item.occasion_tags.map(t => `"${t}"`).join(',')}]\n`;
    }
    text += `  status: ${item.status}\n`;
    if (item.notes) text += `  notes: ${item.notes}\n`;
  });
  
  return text;
}

// 生成 JSON 格式
export function generateJSON(items: Item[]): string {
  const exportItems = sortItems(items.map(convertToExportItem));
  
  // 清理空值：移除 undefined 字段
  const cleanedItems = exportItems.map(item => {
    const cleaned: any = {};
    Object.keys(item).forEach(key => {
      const value = (item as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length === 0) {
          // 跳过空数组
        } else {
          cleaned[key] = value;
        }
      }
    });
    return cleaned;
  });
  
  return JSON.stringify(cleanedItems, null, 2);
}

// 生成 TXT 格式（简化版，便于阅读）
export function generateTXT(items: Item[]): string {
  const exportItems = sortItems(items.map(convertToExportItem));
  
  let text = '个人电子衣柜导出\n';
  text += '='.repeat(50) + '\n\n';
  
  exportItems.forEach((item, index) => {
    text += `[${index + 1}] ${item.name || '未命名'}\n`;
    text += `ID: ${item.item_id}\n`;
    text += `分类: ${item.category}`;
    if (item.layer) text += ` / ${item.layer}`;
    text += '\n';
    if (item.color) text += `颜色: ${item.color}`;
    if (item.color_secondary) text += ` / ${item.color_secondary}`;
    if (item.color || item.color_secondary) text += '\n';
    if (item.size) text += `尺码: ${item.size}\n`;
    if (item.care && item.care.length > 0) {
      text += `洗涤: ${item.care.join(', ')}\n`;
    }
    text += `状态: ${item.status}\n`;
    if (item.notes) text += `备注: ${item.notes}\n`;
    text += '\n';
  });
  
  return text;
}

// 复制到剪贴板
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    throw new Error('复制失败，请手动复制');
  }
}

// 下载文件
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

