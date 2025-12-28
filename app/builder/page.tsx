'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';
import { getItems, Item, ItemCategory } from '@/lib/db/items';
import { createOutfit, OutfitSlot } from '@/lib/db/outfits';
import { getSignedUrl } from '@/lib/storage';
import { createClient } from '@/lib/supabase/client';

const slots: Array<{ key: OutfitSlot; label: string; category?: ItemCategory }> = [
  { key: 'base', label: '基础层', category: 'top' },
  { key: 'mid', label: '中间层', category: 'top' },
  { key: 'outer', label: '外套', category: 'outer' },
  { key: 'bottom', label: '下装（外层）', category: 'bottom' },
  { key: 'bottom_base', label: '下装-基础层（可选）', category: 'bottom' }, // P0-5: 新增下装基础层
  { key: 'shoes', label: '鞋子', category: 'shoes' },
  { key: 'socks', label: '袜子', category: 'socks' },
  { key: 'accessory', label: '配饰', category: 'accessory' },
];

export default function BuilderPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<OutfitSlot, string | null>>({
    base: null,
    mid: null,
    outer: null,
    bottom: null,
    bottom_base: null, // P0-5: 新增下装基础层
    shoes: null,
    socks: null,
    accessory: null,
  });
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [outfitName, setOutfitName] = useState('');
  const [outfitNotes, setOutfitNotes] = useState('');

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

  const handleSelectItem = (slot: OutfitSlot, itemId: string | null) => {
    setSelectedItems({ ...selectedItems, [slot]: itemId });
  };

  const handleSave = async () => {
    const selectedCount = Object.values(selectedItems).filter(id => id !== null).length;
    if (selectedCount === 0) {
      alert('请至少选择一个单品');
      return;
    }

    setShowNameModal(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    try {
      const outfitItems = Object.entries(selectedItems)
        .filter(([_, itemId]) => itemId !== null)
        .map(([slot, itemId]) => ({
          item_id: itemId!,
          slot: slot as OutfitSlot,
        }));

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
        bottom_base: null, // P0-5: 新增下装基础层
        shoes: null,
        socks: null,
        accessory: null,
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

  const getSelectedItem = (slot: OutfitSlot): Item | null => {
    const itemId = selectedItems[slot];
    if (!itemId) return null;
    return items.find(item => item.id === itemId) || null;
  };

  const hasLaundryItems = () => {
    return Object.values(selectedItems).some(itemId => {
      if (!itemId) return false;
      const item = items.find(i => i.id === itemId);
      return item?.status === 'laundry';
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
              const selectedItem = getSelectedItem(slot.key);

              return (
                <div key={slot.key} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">{slot.label}</h3>
                  
                  {selectedItem && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                      <div className="flex items-center gap-3">
                        {imageUrls[selectedItem.id] ? (
                          <img
                            src={imageUrls[selectedItem.id]}
                            alt={selectedItem.name || '单品'}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                            无图
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{selectedItem.name || '未命名'}</p>
                          {selectedItem.status === 'laundry' && (
                            <span className="text-xs text-yellow-600">⚠️ 待洗</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleSelectItem(slot.key, null)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          移除
                        </button>
                      </div>
                    </div>
                  )}

                  <select
                    value={selectedItems[slot.key] || ''}
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
                </div>
              );
            })}
          </div>
        </div>

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

