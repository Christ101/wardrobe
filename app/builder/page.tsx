'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';
import { getItems, Item, ItemCategory } from '@/lib/db/items';
import { createOutfit, OutfitSlot } from '@/lib/db/outfits';
import { getSignedUrl } from '@/lib/storage';
import { createClient } from '@/lib/supabase/client';

const slots: Array<{ key: OutfitSlot; label: string; category?: ItemCategory; allowMultiple?: boolean }> = [
  { key: 'base', label: '基础层', category: 'top' },
  { key: 'mid', label: '中间层', category: 'top' },
  { key: 'outer', label: '外套', category: 'outer' },
  { key: 'bottom', label: '下装（外层）', category: 'bottom' },
  { key: 'bottom_base', label: '下装-基础层（可选）', category: 'bottom' }, // P0-5: 新增下装基础层
  { key: 'shoes', label: '鞋子', category: 'shoes' },
  { key: 'socks', label: '袜子', category: 'socks' },
  { key: 'accessory', label: '配饰', category: 'accessory', allowMultiple: true }, // 支持多选
];

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return [];
    return s.split(/[,，]/).map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

export default function BuilderPage() {
  const [items, setItems] = useState<Item[]>([]);
  // 修改：accessory 改为数组，其他保持单个值
  const [selectedItems, setSelectedItems] = useState<Record<OutfitSlot, string | string[] | null>>({
    base: null,
    mid: null,
    outer: null,
    bottom: null,
    bottom_base: null,
    shoes: null,
    socks: null,
    accessory: [], // 改为数组支持多选
  });
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [outfitName, setOutfitName] = useState('');
  const [outfitNotes, setOutfitNotes] = useState('');
  // 详情弹窗状态
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailItem, setDetailItem] = useState<Item | null>(null);
  const [detailHtmlUrl, setDetailHtmlUrl] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await getItems();
      setItems(data);

      // 加载图片
      const urls: Record<string, string> = {};
      for (const item of data) {
        if (item.image_path) {
          try {
            const url = await getSignedUrl(item.image_path);
            urls[item.id] = url;
          } catch (e) {
            console.error(`加载图片失败 ${item.id}:`, e);
          }
        }
      }
      setImageUrls(urls);
    } catch (error: any) {
      alert(`加载失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 修改：支持单个和多个选择
  const handleSelectItem = (slot: OutfitSlot, itemId: string | string[] | null) => {
    setSelectedItems({ ...selectedItems, [slot]: itemId });
  };

  // 新增：处理配饰多选
  const handleToggleAccessory = (itemId: string) => {
    const current = selectedItems.accessory;
    const currentArray = Array.isArray(current) ? current : (current ? [current] : []);
    
    if (currentArray.includes(itemId)) {
      // 移除
      const newArray = currentArray.filter(id => id !== itemId);
      setSelectedItems({ ...selectedItems, accessory: newArray.length > 0 ? newArray : [] });
    } else {
      // 添加
      setSelectedItems({ ...selectedItems, accessory: [...currentArray, itemId] });
    }
  };

  // 新增：打开详情弹窗
  const handleShowDetail = async (item: Item) => {
    setDetailItem(item);
    setDetailHtmlUrl(null);
    
    // 如果有 HTML 文件，加载其 URL
    if (item.detail_html_path) {
      try {
        const url = await getSignedUrl(item.detail_html_path);
        setDetailHtmlUrl(url);
      } catch (e) {
        console.error('加载 HTML 文件失败:', e);
      }
    }
    
    setShowDetailModal(true);
  };

  const handleSave = async () => {
    // 计算所有选中的单品数量（包括配饰多选）
    let selectedCount = 0;
    Object.entries(selectedItems).forEach(([slot, value]) => {
      if (slot === 'accessory') {
        const arr = Array.isArray(value) ? value : (value ? [value] : []);
        selectedCount += arr.length;
      } else if (value !== null) {
        selectedCount += 1;
      }
    });

    if (selectedCount === 0) {
      alert('请至少选择一个单品');
      return;
    }

    setShowNameModal(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    try {
      // 构建 outfitItems 数组，支持配饰多选
      const outfitItems: Array<{ item_id: string; slot: OutfitSlot }> = [];
      
      Object.entries(selectedItems).forEach(([slot, value]) => {
        if (slot === 'accessory') {
          // 配饰多选：每个配饰创建一个记录
          const accessoryArray = Array.isArray(value) ? value : (value ? [value] : []);
          accessoryArray.forEach(itemId => {
            outfitItems.push({
              item_id: itemId,
              slot: slot as OutfitSlot,
            });
          });
        } else if (value !== null && typeof value === 'string') {
          // 其他 slot：单个值
          outfitItems.push({
            item_id: value,
            slot: slot as OutfitSlot,
          });
        }
      });

      await createOutfit(
        {
          name: outfitName || undefined,
          notes: outfitNotes || undefined,
        },
        outfitItems
      );

      alert('保存成功！');
      setSelectedItems({
        base: null,
        mid: null,
        outer: null,
        bottom: null,
        bottom_base: null,
        shoes: null,
        socks: null,
        accessory: [],
      });
      setOutfitName('');
      setOutfitNotes('');
      setShowNameModal(false);
    } catch (error: any) {
      alert(`保存失败: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getItemsForSlot = (slot: OutfitSlot): Item[] => {
    const slotConfig = slots.find(s => s.key === slot);
    if (!slotConfig?.category) return items;

    return items.filter(item => {
      if (slotConfig.category && item.category !== slotConfig.category) return false;
      if (slot === 'base' || slot === 'mid' || slot === 'outer') {
        return item.layer === slot || item.category === 'top' || item.category === 'outer';
      }
      // P0-5: bottom_base 筛选逻辑（下装且为基础层，或下装无层次）
      if (slot === 'bottom_base') {
        return item.category === 'bottom' && (item.layer === 'base' || !item.layer);
      }
      return true;
    });
  };

  // 修改：支持单个和数组
  const getSelectedItems = (slot: OutfitSlot): Item[] => {
    const value = selectedItems[slot];
    if (!value) return [];
    
    if (slot === 'accessory') {
      // 配饰：返回数组
      const itemIds = Array.isArray(value) ? value : (value ? [value] : []);
      return itemIds.map(id => items.find(item => item.id === id)).filter(Boolean) as Item[];
    } else {
      // 其他：返回单个（包装成数组）
      const itemId = typeof value === 'string' ? value : null;
      const item = itemId ? items.find(item => item.id === itemId) : null;
      return item ? [item] : [];
    }
  };

  const hasLaundryItems = () => {
    return Object.entries(selectedItems).some(([slot, value]) => {
      if (slot === 'accessory') {
        const itemIds = Array.isArray(value) ? value : (value ? [value] : []);
        return itemIds.some(itemId => {
          const item = items.find(i => i.id === itemId);
          return item?.status === 'laundry';
        });
      } else if (value !== null && typeof value === 'string') {
        const item = items.find(i => i.id === value);
        return item?.status === 'laundry';
      }
      return false;
    });
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12 text-gray-600">加载中...</div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const categoryLabels: Record<ItemCategory, string> = {
    top: '上装',
    bottom: '下装',
    outer: '外套',
    shoes: '鞋子',
    socks: '袜子',
    accessory: '配饰',
  };

  const layerLabels: Record<string, string> = {
    base: '基础层',
    mid: '中间层',
    outer: '外层',
  };

  const statusLabels: Record<string, string> = {
    clean: '干净',
    laundry: '待洗',
    repair: '需维修',
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">分层搭配器</h1>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              保存穿搭
            </button>
          </div>

          {hasLaundryItems() && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800">⚠️ 当前搭配中包含待洗单品，请注意！</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {slots.map((slot) => {
              const slotItems = getItemsForSlot(slot.key);
              const selected = getSelectedItems(slot.key);
              const isMultiple = slot.allowMultiple;

              return (
                <div key={slot.key} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {slot.label}
                    {isMultiple && <span className="text-sm text-gray-500 ml-2">(可多选)</span>}
                  </h3>
                  
                  {/* 显示已选中的单品 */}
                  {selected.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {selected.map((selectedItem) => (
                        <div key={selectedItem.id} className="p-3 bg-blue-50 rounded-md border border-blue-200">
                          <div className="flex items-center gap-3">
                            {imageUrls[selectedItem.id] ? (
                              <img
                                src={imageUrls[selectedItem.id]}
                                alt={selectedItem.name || '单品'}
                                className="w-16 h-16 object-cover rounded cursor-pointer"
                                onClick={() => handleShowDetail(selectedItem)}
                              />
                            ) : (
                              <div 
                                className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs cursor-pointer"
                                onClick={() => handleShowDetail(selectedItem)}
                              >
                                无图
                              </div>
                            )}
                            <div className="flex-1 cursor-pointer" onClick={() => handleShowDetail(selectedItem)}>
                              <p className="font-medium">{selectedItem.name || '未命名'}</p>
                              {selectedItem.status === 'laundry' && (
                                <span className="text-xs text-yellow-600">⚠️ 待洗</span>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                if (isMultiple) {
                                  handleToggleAccessory(selectedItem.id);
                                } else {
                                  handleSelectItem(slot.key, null);
                                }
                              }}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              移除
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 选择器：配饰使用多选，其他使用单选 */}
                  {isMultiple ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
                      {slotItems.map((item) => {
                        const isSelected = Array.isArray(selectedItems.accessory) 
                          ? selectedItems.accessory.includes(item.id)
                          : false;
                        return (
                          <label
                            key={item.id}
                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleAccessory(item.id)}
                              className="rounded"
                            />
                            <span className="flex-1 text-sm">
                              {item.name || '未命名'} {item.status === 'laundry' ? '(待洗)' : ''}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <select
                      value={(() => {
                        const val = selectedItems[slot.key];
                        return typeof val === 'string' ? val : '';
                      })()}
                      onChange={(e) => handleSelectItem(slot.key, e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">选择单品...</option>
                      {slotItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name || '未命名'} {item.status === 'laundry' ? '(待洗)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 详情弹窗 */}
        {showDetailModal && detailItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDetailModal(false)}>
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-4">{detailItem.name || '未命名'}</h2>
              
              {/* 大图 */}
              {imageUrls[detailItem.id] && (
                <div className="mb-4">
                  <img
                    src={imageUrls[detailItem.id]}
                    alt={detailItem.name || '单品'}
                    className="w-full max-h-96 object-contain rounded"
                  />
                </div>
              )}

              {/* 详细信息 */}
              <div className="space-y-3 text-base">
                <div>
                  <span className="font-semibold text-gray-700">品类：</span>
                  <span className="text-gray-900">{categoryLabels[detailItem.category]}</span>
                </div>
                {detailItem.layer && (
                  <div>
                    <span className="font-semibold text-gray-700">穿着层：</span>
                    <span className="text-gray-900">{layerLabels[detailItem.layer]}</span>
                  </div>
                )}
                {detailItem.subcategory && (
                  <div>
                    <span className="font-semibold text-gray-700">子分类：</span>
                    <span className="text-gray-900">{detailItem.subcategory}</span>
                  </div>
                )}
                <div>
                  <span className="font-semibold text-gray-700">状态：</span>
                  <span className={`px-2 py-1 text-sm rounded ${
                    detailItem.status === 'laundry' ? 'bg-yellow-100 text-yellow-800' :
                    detailItem.status === 'repair' ? 'bg-red-100 text-red-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {statusLabels[detailItem.status]}
                  </span>
                </div>
                {detailItem.size && (
                  <div>
                    <span className="font-semibold text-gray-700">尺码：</span>
                    <span className="text-gray-900">{detailItem.size}</span>
                  </div>
                )}
                {detailItem.color_primary && (
                  <div>
                    <span className="font-semibold text-gray-700">主色：</span>
                    <span className="text-gray-900">{detailItem.color_primary}</span>
                  </div>
                )}
                {detailItem.color_secondary && (
                  <div>
                    <span className="font-semibold text-gray-700">次色：</span>
                    <span className="text-gray-900">{detailItem.color_secondary}</span>
                  </div>
                )}
                {detailItem.care_tags && toStringArray(detailItem.care_tags).length > 0 && (
                  <div>
                    <span className="font-semibold text-gray-700">洗涤标签：</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {toStringArray(detailItem.care_tags).map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* HTML 附件 */}
                {detailHtmlUrl && (
                  <div>
                    <span className="font-semibold text-gray-700">商品介绍：</span>
                    <a
                      href={detailHtmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:text-blue-800 underline"
                    >
                      打开商品页（新标签页）
                    </a>
                  </div>
                )}
              </div>

              {/* 按钮 */}
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 保存模态框 */}
        {showNameModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">保存穿搭</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">名称（可选）</label>
                  <input
                    type="text"
                    value={outfitName}
                    onChange={(e) => setOutfitName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="例如：工作日穿搭"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">备注（可选）</label>
                  <textarea
                    value={outfitNotes}
                    onChange={(e) => setOutfitNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="添加备注..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={confirmSave}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? '保存中...' : '确认保存'}
                  </button>
                  <button
                    onClick={() => setShowNameModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
