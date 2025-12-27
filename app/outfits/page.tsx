'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';
import { getOutfits, getOutfit, deleteOutfit, Outfit, OutfitWithItems } from '@/lib/db/outfits';
import { getSignedUrl } from '@/lib/storage';

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitWithItems | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const router = useRouter();

  useEffect(() => {
    loadOutfits();
  }, []);

  const loadOutfits = async () => {
    setLoading(true);
    try {
      const data = await getOutfits();
      setOutfits(data);
    } catch (error: any) {
      alert(`加载失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (outfitId: string) => {
    try {
      const detail = await getOutfit(outfitId);
      if (!detail) {
        alert('穿搭不存在');
        return;
      }

      // 加载图片
      const urls: Record<string, string> = {};
      for (const itemWithSlot of detail.items) {
        if (itemWithSlot.item.image_path) {
          try {
            const url = await getSignedUrl(itemWithSlot.item.image_path);
            urls[itemWithSlot.item.id] = url;
          } catch (e) {
            console.error(`加载图片失败:`, e);
          }
        }
      }
      setImageUrls(urls);
      setSelectedOutfit(detail);
    } catch (error: any) {
      alert(`加载详情失败: ${error.message}`);
    }
  };

  const handleDelete = async (outfitId: string) => {
    if (!confirm('确定要删除这个穿搭吗？')) return;

    try {
      await deleteOutfit(outfitId);
      if (selectedOutfit?.id === outfitId) {
        setSelectedOutfit(null);
      }
      loadOutfits();
    } catch (error: any) {
      alert(`删除失败: ${error.message}`);
    }
  };

  const slotLabels: Record<string, string> = {
    base: '基础层',
    mid: '中间层',
    outer: '外套',
    bottom: '下装',
    shoes: '鞋子',
    socks: '袜子',
    accessory: '配饰',
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">我的穿搭</h1>

          {loading ? (
            <div className="text-center py-12 text-gray-600">加载中...</div>
          ) : outfits.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">暂无穿搭</p>
              <button
                onClick={() => router.push('/builder')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                去创建穿搭
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {outfits.map((outfit) => (
                <div key={outfit.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-2">{outfit.name || '未命名穿搭'}</h3>
                    {outfit.notes && (
                      <p className="text-sm text-gray-600 mb-4">{outfit.notes}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetail(outfit.id)}
                        className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        查看详情
                      </button>
                      <button
                        onClick={() => handleDelete(outfit.id)}
                        className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 详情模态框 */}
          {selectedOutfit && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">{selectedOutfit.name || '未命名穿搭'}</h2>
                  <button
                    onClick={() => setSelectedOutfit(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {selectedOutfit.notes && (
                  <p className="text-gray-600 mb-6">{selectedOutfit.notes}</p>
                )}

                <div className="space-y-4">
                  {selectedOutfit.items.length === 0 ? (
                    <p className="text-gray-500">暂无单品</p>
                  ) : (
                    selectedOutfit.items.map((itemWithSlot) => {
                      const item = itemWithSlot.item;
                      const hasLaundry = item.status === 'laundry';

                      return (
                        <div
                          key={`${itemWithSlot.slot}-${item.id}`}
                          className={`p-4 border rounded-lg ${hasLaundry ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}`}
                        >
                          <div className="flex items-center gap-4">
                            {imageUrls[item.id] ? (
                              <img
                                src={imageUrls[item.id]}
                                alt={item.name || '单品'}
                                className="w-20 h-20 object-cover rounded"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                                无图
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-500">
                                  {slotLabels[itemWithSlot.slot]}
                                </span>
                                {hasLaundry && (
                                  <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                                    ⚠️ 待洗
                                  </span>
                                )}
                              </div>
                              <p className="font-medium">{item.name || '未命名'}</p>
                              {item.size && (
                                <p className="text-sm text-gray-600">尺码: {item.size}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

