'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';
import { getItems, createItem, updateItem, deleteItem, Item, ItemCategory, ItemStatus } from '@/lib/db/items';
import { uploadImage, getSignedUrl, deleteImage } from '@/lib/storage';
import { createClient } from '@/lib/supabase/client';

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [filterCategory, setFilterCategory] = useState<ItemCategory | ''>('');
  const [filterStatus, setFilterStatus] = useState<ItemStatus | ''>('');
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  const formData = {
    category: 'top' as ItemCategory,
    layer: undefined as 'base' | 'mid' | 'outer' | undefined,
    name: '',
    color_primary: '',
    color_secondary: '',
    size: '',
    status: 'clean' as ItemStatus,
    care_tags: '',
    image: null as File | null,
  };
  const [form, setForm] = useState(formData);

  useEffect(() => {
    loadItems();
  }, [filterCategory, filterStatus]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (filterCategory) filters.category = filterCategory;
      if (filterStatus) filters.status = filterStatus;
      
      const data = await getItems(filters);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('未登录');

      let imagePath: string | undefined = undefined;

      // 上传图片
      if (form.image) {
        const itemId = editingItem?.id || crypto.randomUUID();
        imagePath = await uploadImage(user.id, itemId, form.image);
      }

      if (editingItem) {
        await updateItem(editingItem.id, {
          category: form.category,
          layer: form.layer,
          name: form.name || undefined,
          color_primary: form.color_primary || undefined,
          color_secondary: form.color_secondary || undefined,
          size: form.size || undefined,
          status: form.status,
          care_tags: form.care_tags || undefined,
          image_path: imagePath || editingItem.image_path,
        });
      } else {
        const newItem = await createItem({
          category: form.category,
          layer: form.layer,
          name: form.name || undefined,
          color_primary: form.color_primary || undefined,
          color_secondary: form.color_secondary || undefined,
          size: form.size || undefined,
          status: form.status,
          care_tags: form.care_tags || undefined,
          image_path: imagePath,
        });
      }

      setShowModal(false);
      setEditingItem(null);
      setForm(formData);
      loadItems();
    } catch (error: any) {
      alert(`保存失败: ${error.message}`);
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setForm({
      category: item.category,
      layer: item.layer,
      name: item.name || '',
      color_primary: item.color_primary || '',
      color_secondary: item.color_secondary || '',
      size: item.size || '',
      status: item.status,
      care_tags: item.care_tags || '',
      image: null,
    });
    setShowModal(true);
  };

  const handleDelete = async (item: Item) => {
    if (!confirm('确定要删除这个单品吗？')) return;

    try {
      if (item.image_path) {
        await deleteImage(item.image_path);
      }
      await deleteItem(item.id);
      loadItems();
    } catch (error: any) {
      alert(`删除失败: ${error.message}`);
    }
  };

  const categoryLabels: Record<ItemCategory, string> = {
    top: '上装',
    bottom: '下装',
    outer: '外套',
    shoes: '鞋子',
    socks: '袜子',
    accessory: '配饰',
  };

  const statusLabels: Record<ItemStatus, string> = {
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
            <h1 className="text-2xl font-bold text-gray-900">单品库</h1>
            <button
              onClick={() => {
                setEditingItem(null);
                setForm(formData);
                setShowModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              新增单品
            </button>
          </div>

          {/* 筛选 */}
          <div className="mb-6 flex gap-4">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as ItemCategory | '')}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">全部分类</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ItemStatus | '')}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">全部状态</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* 列表 */}
          {loading ? (
            <div className="text-center py-12 text-gray-600">加载中...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">暂无单品</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
                  {imageUrls[item.id] ? (
                    <img
                      src={imageUrls[item.id]}
                      alt={item.name || '单品'}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">
                      无图片
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{item.name || '未命名'}</h3>
                      <span className={`px-2 py-1 text-xs rounded ${
                        item.status === 'laundry' ? 'bg-yellow-100 text-yellow-800' :
                        item.status === 'repair' ? 'bg-red-100 text-red-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {statusLabels[item.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {categoryLabels[item.category]}
                      {item.size && ` · ${item.size}`}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleEdit(item)}
                        className="flex-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="flex-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 新增/编辑模态框 */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">{editingItem ? '编辑单品' : '新增单品'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类 *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as ItemCategory })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">层次</label>
                  <select
                    value={form.layer || ''}
                    onChange={(e) => setForm({ ...form, layer: e.target.value as 'base' | 'mid' | 'outer' | undefined || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">无</option>
                    <option value="base">基础层</option>
                    <option value="mid">中间层</option>
                    <option value="outer">外层</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">主色</label>
                  <input
                    type="text"
                    value={form.color_primary}
                    onChange={(e) => setForm({ ...form, color_primary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">次色</label>
                  <input
                    type="text"
                    value={form.color_secondary}
                    onChange={(e) => setForm({ ...form, color_secondary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">尺码</label>
                  <input
                    type="text"
                    value={form.size}
                    onChange={(e) => setForm({ ...form, size: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态 *</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as ItemStatus })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">洗涤标签</label>
                  <input
                    type="text"
                    value={form.care_tags}
                    onChange={(e) => setForm({ ...form, care_tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">图片</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingItem(null);
                      setForm(formData);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

