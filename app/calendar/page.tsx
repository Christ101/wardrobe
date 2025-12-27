'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';
import { getPlans, createOrUpdatePlan, deletePlan, PlanWithOutfit } from '@/lib/db/plans';
import { getOutfits, Outfit } from '@/lib/db/outfits';
import { getOutfit, OutfitWithItems } from '@/lib/db/outfits';
import { getSignedUrl } from '@/lib/storage';

export default function CalendarPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [plans, setPlans] = useState<PlanWithOutfit[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedOutfitId, setSelectedOutfitId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [detailOutfit, setDetailOutfit] = useState<OutfitWithItems | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, [currentWeek]);

  const getWeekDates = (date: Date): Date[] => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // 周一
    const monday = new Date(date.setDate(diff));
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      week.push(d);
    }
    return week;
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatDateDisplay = (date: Date): string => {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    return `${month}/${day} ${weekday}`;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const weekDates = getWeekDates(new Date(currentWeek));
      const startDate = formatDate(weekDates[0]);
      const endDate = formatDate(weekDates[6]);

      const [plansData, outfitsData] = await Promise.all([
        getPlans(startDate, endDate),
        getOutfits(),
      ]);

      setPlans(plansData);
      setOutfits(outfitsData);
    } catch (error: any) {
      alert(`加载失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getPlanForDate = (date: Date): PlanWithOutfit | undefined => {
    const dateStr = formatDate(date);
    return plans.find(p => p.plan_date === dateStr);
  };

  const handleDateClick = (date: Date) => {
    const dateStr = formatDate(date);
    const plan = getPlanForDate(date);
    setSelectedDate(dateStr);
    setSelectedOutfitId(plan?.outfit_id || '');
    setNotes(plan?.notes || '');
    setShowModal(true);
  };

  const handleSavePlan = async () => {
    if (!selectedDate) return;

    try {
      await createOrUpdatePlan({
        plan_date: selectedDate,
        outfit_id: selectedOutfitId || undefined,
        notes: notes || undefined,
      });
      setShowModal(false);
      loadData();
    } catch (error: any) {
      alert(`保存失败: ${error.message}`);
    }
  };

  const handleDeletePlan = async (date: Date) => {
    if (!confirm('确定要删除这天的计划吗？')) return;

    try {
      await deletePlan(formatDate(date));
      loadData();
    } catch (error: any) {
      alert(`删除失败: ${error.message}`);
    }
  };

  const handleViewOutfit = async (outfitId: string) => {
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
      setDetailOutfit(detail);
    } catch (error: any) {
      alert(`加载详情失败: ${error.message}`);
    }
  };

  const hasLaundryInPlan = (plan: PlanWithOutfit): boolean => {
    // 这里需要检查outfit中的items是否有laundry状态
    // 由于PlanWithOutfit中的outfit只包含基本信息，我们需要在显示时检查
    // 为了简化，这里先返回false，实际应该从详情中获取
    return false;
  };

  const weekDates = getWeekDates(new Date(currentWeek));
  const prevWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeek(newDate);
  };
  const nextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeek(newDate);
  };
  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">周计划</h1>
            <div className="flex gap-2">
              <button
                onClick={prevWeek}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                上一周
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                今天
              </button>
              <button
                onClick={nextWeek}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                下一周
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-600">加载中...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {weekDates.map((date, index) => {
                const plan = getPlanForDate(date);
                const isToday = formatDate(date) === formatDate(new Date());

                return (
                  <div
                    key={index}
                    className={`bg-white rounded-lg shadow p-4 ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-gray-900">
                        {formatDateDisplay(date)}
                      </h3>
                      {plan && (
                        <button
                          onClick={() => handleDeletePlan(date)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          删除
                        </button>
                      )}
                    </div>

                    {plan?.outfit ? (
                      <div className="space-y-2">
                        <div
                          className="p-3 bg-blue-50 rounded-md cursor-pointer hover:bg-blue-100"
                          onClick={() => handleViewOutfit(plan.outfit!.id)}
                        >
                          <p className="font-medium text-sm">{plan.outfit.name || '未命名穿搭'}</p>
                          {plan.notes && (
                            <p className="text-xs text-gray-600 mt-1">{plan.notes}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDateClick(date)}
                        className="w-full py-8 text-gray-400 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-500 hover:text-blue-500"
                      >
                        点击安排
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 安排计划模态框 */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-bold mb-4">
                  安排 {selectedDate && formatDateDisplay(new Date(selectedDate))}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">选择穿搭</label>
                    <select
                      value={selectedOutfitId}
                      onChange={(e) => setSelectedOutfitId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">不安排</option>
                      {outfits.map((outfit) => (
                        <option key={outfit.id} value={outfit.id}>
                          {outfit.name || '未命名穿搭'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={3}
                      placeholder="添加备注..."
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSavePlan}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 穿搭详情模态框 */}
          {detailOutfit && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">{detailOutfit.name || '未命名穿搭'}</h2>
                  <button
                    onClick={() => setDetailOutfit(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {detailOutfit.notes && (
                  <p className="text-gray-600 mb-6">{detailOutfit.notes}</p>
                )}

                <div className="space-y-4">
                  {detailOutfit.items.length === 0 ? (
                    <p className="text-gray-500">暂无单品</p>
                  ) : (
                    detailOutfit.items.map((itemWithSlot) => {
                      const item = itemWithSlot.item;
                      const hasLaundry = item.status === 'laundry';
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

