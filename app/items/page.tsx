'use client';

import { useEffect, useState, useRef } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';
import { getItems, createItem, updateItem, deleteItem, Item, ItemCategory, ItemStatus } from '@/lib/db/items';
import { uploadImage, getSignedUrl, deleteImage, uploadHTML } from '@/lib/storage';
import { createClient } from '@/lib/supabase/client';
import { generateYAMLText, generateJSON, generateTXT, copyToClipboard, downloadFile } from '@/lib/export';

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return [];
    return s.split(/[,，]/).map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false); // P0-3: 详情弹窗
  const [detailItem, setDetailItem] = useState<Item | null>(null); // P0-3: 详情项
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [filterCategory, setFilterCategory] = useState<ItemCategory | ''>('');
  const [filterStatus, setFilterStatus] = useState<ItemStatus | ''>('');
  const [filterSubcategory, setFilterSubcategory] = useState<string>(''); // P1-2: 子分类筛选
  const [filterCareTags, setFilterCareTags] = useState<string[]>([]); // P0-2: 标签筛选
  const [availableCareTags, setAvailableCareTags] = useState<string[]>([]); // P0-2: 可用标签列表
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]); // P1-2: 可用子分类列表
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [detailHtmlUrl, setDetailHtmlUrl] = useState<string | null>(null); // P1-3: HTML 文件 URL
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const formData = {
    category: 'top' as ItemCategory,
    layer: undefined as 'base' | 'mid' | 'outer' | undefined,
    subcategory: '', // P1-2: 子分类
    name: '',
    color_primary: '',
    color_secondary: '',
    size: '',
    status: 'clean' as ItemStatus,
    care_tags: [] as string[],
    image: null as File | null,
    detailHtml: null as File | null, // P1-3: HTML 文件
  };
  const [form, setForm] = useState(formData);

  // P0-2, P1-2: 从所有 items 中提取可用的标签和子分类
  useEffect(() => {
    const loadAllItems = async () => {
      try {
        const allItems = await getItems();
        // 提取所有 care_tags
        const tagsSet = new Set<string>();
        allItems.forEach(item => {
          const tags = toStringArray(item.care_tags);
          tags.forEach(tag => tagsSet.add(tag));
        });
        setAvailableCareTags(Array.from(tagsSet).sort());

        // 提取所有 subcategory
        const subcategoriesSet = new Set<string>();
        allItems.forEach(item => {
          if (item.subcategory) {
            subcategoriesSet.add(item.subcategory);
          }
        });
        setAvailableSubcategories(Array.from(subcategoriesSet).sort());
      } catch (error) {
        console.error('加载标签和子分类失败:', error);
      }
    };
    loadAllItems();
  }, []);

  useEffect(() => {
    loadItems();
  }, [filterCategory, filterStatus, filterSubcategory, filterCareTags]);

  // 点击外部关闭导出菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  // P1-4: 导出当前筛选结果
  const getFilteredItems = () => items; // 当前显示的 items 已经是筛选后的

  const handleExportCopy = async () => {
    try {
      const itemsToExport = getFilteredItems();
      const text = generateYAMLText(itemsToExport);
      await copyToClipboard(text);
      alert('已复制到剪贴板！');
      setShowExportMenu(false);
    } catch (error: any) {
      alert(`导出失败: ${error.message}`);
    }
  };

  const handleExportJSON = async () => {
    try {
      const itemsToExport = getFilteredItems();
      const json = generateJSON(itemsToExport);
      downloadFile(json, 'wardrobe-export.json', 'application/json');
      setShowExportMenu(false);
    } catch (error: any) {
      alert(`导出失败: ${error.message}`);
    }
  };

  const handleExportTXT = async () => {
    try {
      const itemsToExport = getFilteredItems();
      const txt = generateTXT(itemsToExport);
      downloadFile(txt, 'wardrobe-export.txt', 'text/plain');
      setShowExportMenu(false);
    } catch (error: any) {
      alert(`导出失败: ${error.message}`);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (filterCategory) filters.category = filterCategory;
      if (filterStatus) filters.status = filterStatus;
      if (filterSubcategory) filters.subcategory = filterSubcategory;
      if (filterCareTags.length > 0) filters.care_tags = filterCareTags;
      
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
      let detailHtmlPath: string | undefined = undefined;

      // 上传图片
      if (form.image) {
        const itemId = editingItem?.id || crypto.randomUUID();
        imagePath = await uploadImage(user.id, itemId, form.image);
      }

      // P1-3: 上传 HTML 文件
      if (form.detailHtml) {
        const itemId = editingItem?.id || crypto.randomUUID();
        detailHtmlPath = await uploadHTML(user.id, itemId, form.detailHtml);
      }

      if (editingItem) {
        await updateItem(editingItem.id, {
          category: form.category,
          layer: form.layer,
          subcategory: form.subcategory || undefined, // P1-2
          name: form.name || undefined,
          color_primary: form.color_primary || undefined,
          color_secondary: form.color_secondary || undefined,
          size: form.size || undefined,
          status: form.status,
          care_tags: form.care_tags && form.care_tags.length > 0 ? form.care_tags.join(', ') : undefined,
          image_path: imagePath || editingItem.image_path,
          detail_html_path: detailHtmlPath || editingItem.detail_html_path, // P1-3
        });
      } else {
        await createItem({
          category: form.category,
          layer: form.layer,
          subcategory: form.subcategory || undefined, // P1-2
          name: form.name || undefined,
          color_primary: form.color_primary || undefined,
          color_secondary: form.color_secondary || undefined,
          size: form.size || undefined,
          status: form.status,
          care_tags: form.care_tags && form.care_tags.length > 0 ? form.care_tags.join(', ') : undefined,
          image_path: imagePath,
          detail_html_path: detailHtmlPath, // P1-3
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

  // P0-3: 打开详情弹窗
  const handleCardClick = async (item: Item) => {
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

  // P0-3: 从详情弹窗进入编辑
  const handleEditFromDetail = () => {
    if (!detailItem) return;
    handleEdit(detailItem);
    setShowDetailModal(false);
  };

  // P0-3: 从详情弹窗删除
  const handleDeleteFromDetail = async () => {
    if (!detailItem) return;
    await handleDelete(detailItem);
    setShowDetailModal(false);
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setForm({
      category: item.category,
      layer: item.layer,
      subcategory: item.subcategory || '', // P1-2
      name: item.name || '',
      color_primary: item.color_primary || '',
      color_secondary: item.color_secondary || '',
      size: item.size || '',
      status: item.status,
      care_tags: toStringArray(item.care_tags),
      image: null,
      detailHtml: null, // P1-3
    });
    setShowModal(true);
  };

  const handleDelete = async (item: Item) => {
    if (!confirm('确定要删除这个单品吗？')) return;

    try {
      if (item.image_path) {
        await deleteImage(item.image_path);
      }
      // P1-3: 删除 HTML 文件
      if (item.detail_html_path) {
        try {
          await deleteImage(item.detail_html_path);
        } catch (e) {
          console.error('删除 HTML 文件失败:', e);
        }
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

  const layerLabels: Record<string, string> = {
    base: '基础层',
    mid: '中间层',
    outer: '外层',
  };

  const statusLabels: Record<ItemStatus, string> = {
    clean: '干净',
    laundry: '待洗',
    repair: '需维修',
  };

  // P0-1: 获取标签显示（最多显示 3 个，超出用 +N）
  const getDisplayTags = (item: Item, maxDisplay: number = 3): { display: string[]; remaining: number } => {
    const tags = toStringArray(item.care_tags);
    if (tags.length <= maxDisplay) {
      return { display: tags, remaining: 0 };
    }
    return {
      display: tags.slice(0, maxDisplay),
      remaining: tags.length - maxDisplay,
    };
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">单品库</h1>
            <div className="flex gap-3">
              {/* 导出按钮 */}
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  导出
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    <button
                      onClick={handleExportCopy}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md"
                    >
                      复制文本
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      下载 JSON
                    </button>
                    <button
                      onClick={handleExportTXT}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-md"
                    >
                      下载 TXT
                    </button>
                  </div>
                )}
              </div>
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
          </div>

          {/* 筛选 */}
          <div className="mb-6 flex flex-wrap gap-4">
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value as ItemCategory | '');
                setFilterSubcategory(''); // 切换品类时清空子分类
              }}
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
            {/* P1-2: 子分类筛选 */}
            {filterCategory && (
              <select
                value={filterSubcategory}
                onChange={(e) => setFilterSubcategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">全部子分类</option>
                {availableSubcategories
                  .filter(sub => {
                    // 根据当前品类筛选子分类（这里简化处理，实际可能需要更复杂的逻辑）
                    return true;
                  })
                  .map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
              </select>
            )}
            {/* P0-2: 标签筛选（多选下拉） */}
            <div className="relative">
              <select
                multiple
                value={filterCareTags}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setFilterCareTags(selected);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md min-w-[150px]"
                size={3}
              >
                {availableCareTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
              {filterCareTags.length > 0 && (
                <button
                  onClick={() => setFilterCareTags([])}
                  className="absolute top-0 right-0 mt-1 mr-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  清除
                </button>
              )}
            </div>
            {filterCareTags.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                已选标签: {filterCareTags.join(', ')}
              </div>
            )}
          </div>

          {/* 列表 */}
          {loading ? (
            <div className="text-center py-12 text-gray-600">加载中...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">暂无单品</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.map((item) => {
                const tagsInfo = getDisplayTags(item);
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleCardClick(item)} // P0-3: 点击卡片打开详情
                  >
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
                      {/* P0-1: 标题 */}
                      <h3 className="font-medium text-gray-900 mb-2">{item.name || '未命名'}</h3>
                      
                      {/* P0-1: Badge 区域 - 品类、层次、状态 */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                          {categoryLabels[item.category]}
                        </span>
                        {item.layer && (item.category === 'top' || item.category === 'bottom') && (
                          <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                            {layerLabels[item.layer]}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          item.status === 'laundry' ? 'bg-yellow-100 text-yellow-800' :
                          item.status === 'repair' ? 'bg-red-100 text-red-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {statusLabels[item.status]}
                        </span>
                      </div>

                      {/* P0-1: 标签 chips */}
                      {tagsInfo.display.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {tagsInfo.display.map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                              {tag}
                            </span>
                          ))}
                          {tagsInfo.remaining > 0 && (
                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                              +{tagsInfo.remaining}
                            </span>
                          )}
                        </div>
                      )}

                      {/* P0-4: 统一按钮布局（固定高度，flex 对齐） */}
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(item)}
                          className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 min-h-[36px] flex items-center justify-center"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 min-h-[36px] flex items-center justify-center"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* P0-3: 详情弹窗 */}
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
                {/* P1-3: HTML 附件 */}
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
                  onClick={handleEditFromDetail}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  编辑
                </button>
                <button
                  onClick={handleDeleteFromDetail}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  删除
                </button>
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

        {/* 新增/编辑模态框 */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">{editingItem ? '编辑单品' : '新增单品'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">品类 *</label>
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
                  <p className="text-xs text-gray-500 mt-1">上装/下装/外套/鞋/袜/配饰</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">穿着层</label>
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
                  <p className="text-xs text-gray-500 mt-1">穿着层（上装/下装内搭用）</p>
                </div>
                {/* P1-2: 子分类 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">子分类</label>
                  <input
                    type="text"
                    value={form.subcategory}
                    onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="例如：衬衫/卫衣/针织（上装）；风衣/棉服/夹克（外套）"
                  />
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
                    value={(form.care_tags ?? []).join(",")}
                    onChange={(e) => setForm({ ...form, care_tags: toStringArray(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="逗号分隔，例如：机洗冷水,不可烘干,带洗涤网"
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
                {/* P1-3: HTML 附件 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">商品介绍 HTML（可选）</label>
                  <input
                    type="file"
                    accept=".html,.htm"
                    onChange={(e) => setForm({ ...form, detailHtml: e.target.files?.[0] || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">上传商品介绍网页 HTML 文件</p>
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
