// 奇妙奇遇控制台 - 图片管理页
// 查看所有已存储图片、清理孤立图片（已删除游戏/轮盘遗留的图片）

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';
import { loadAllImages, deleteImage } from '@/lib/imageStore';

interface ImageEntry {
  id: string;
  dataUrl: string;
  source: string; // 来源描述
  isOrphan: boolean; // 是否孤立（没有对应的游戏/轮盘）
}

export default function ImageManagerPage() {
  const { state } = useApp();
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(null);

  const buildImageEntries = useCallback(async () => {
    setLoading(true);
    try {
      const allImgs = await loadAllImages();

      // 收集所有有效的 imageId → 来源描述
      const validIds = new Map<string, string>();

      // 游戏库中的周边奖励图片
      state.gameLibrary.forEach(g => {
        g.settlementImages.forEach(img => {
          if (img.imageId) validIds.set(img.imageId, `游戏库 · ${g.name} · ${img.name}`);
        });
      });

      // 当前游戏列表中的周边奖励图片
      state.currentGameList.forEach(item => {
        item.gameData.settlementImages.forEach(img => {
          if (img.imageId) validIds.set(img.imageId, `游戏列表 · ${item.gameData.name} · ${img.name}`);
        });
      });

      // 轮盘选项图片
      state.wheels.forEach(w => {
        w.options.forEach(o => {
          if ((o as any).imageId) validIds.set((o as any).imageId, `轮盘 · ${w.name} · ${o.label}`);
        });
      });

      const entries: ImageEntry[] = Object.entries(allImgs).map(([id, dataUrl]) => ({
        id,
        dataUrl,
        source: validIds.get(id) || '未知来源',
        isOrphan: !validIds.has(id),
      }));

      // 按来源排序：有效的在前，孤立的在后
      entries.sort((a, b) => {
        if (a.isOrphan !== b.isOrphan) return a.isOrphan ? 1 : -1;
        return a.source.localeCompare(b.source);
      });

      setImages(entries);
    } catch {
      toast.error('加载图片失败');
    } finally {
      setLoading(false);
    }
  }, [state.gameLibrary, state.currentGameList, state.wheels]);

  useEffect(() => {
    buildImageEntries();
  }, [buildImageEntries]);

  const handleDeleteImage = async (id: string) => {
    setDeleting(prev => new Set(Array.from(prev).concat(id)));
    try {
      await deleteImage(id);
      setImages(prev => prev.filter(img => img.id !== id));
      toast.success('图片已删除');
    } catch {
      toast.error('删除失败');
    } finally {
      setDeleting(prev => { const next = new Set(Array.from(prev)); next.delete(id); return next; });
    }
  };

  const handleCleanOrphans = async () => {
    const orphans = images.filter(img => img.isOrphan);
    if (orphans.length === 0) { toast.info('没有孤立图片需要清理'); return; }
    setDeleting(new Set(orphans.map(o => o.id)));
    let count = 0;
    for (const img of orphans) {
      try {
        await deleteImage(img.id);
        count++;
      } catch { /* ignore */ }
    }
    setImages(prev => prev.filter(img => !img.isOrphan));
    setDeleting(new Set());
    toast.success(`已清理 ${count} 张孤立图片`);
  };

  const orphanCount = images.filter(img => img.isOrphan).length;
  const validCount = images.filter(img => !img.isOrphan).length;
  const previewImg = images.find(img => img.id === previewId);

  return (
    <div className="min-h-full p-6" style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* 页头 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-black" style={{ color: 'oklch(0.22 0.02 280)' }}>🖼️ 图片管理</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={buildImageEntries}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}
            >
              刷新
            </button>
            {orphanCount > 0 && (
              <button
                onClick={handleCleanOrphans}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)', boxShadow: '0 4px 14px rgba(239,68,68,0.3)' }}
              >
                清理 {orphanCount} 张孤立图片
              </button>
            )}
          </div>
        </div>
        <p className="text-sm" style={{ color: 'oklch(0.55 0.04 280)' }}>
          管理所有已存储的图片，清理孤立图片可释放存储空间
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: '全部图片', value: images.length, color: '#7c4dff', bg: 'rgba(124,77,255,0.08)' },
          { label: '有效图片', value: validCount, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
          { label: '孤立图片', value: orphanCount, color: orphanCount > 0 ? '#ef4444' : '#94a3b8', bg: orphanCount > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(148,163,184,0.08)' },
        ].map(card => (
          <div key={card.label} className="rounded-2xl p-4 flex flex-col gap-1"
            style={{ background: card.bg, border: `1.5px solid ${card.color}22` }}>
            <div className="text-3xl font-black" style={{ color: card.color }}>{card.value}</div>
            <div className="text-xs font-semibold" style={{ color: 'oklch(0.55 0.04 280)' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* 图片列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm" style={{ color: 'oklch(0.55 0.04 280)' }}>加载中...</div>
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="text-5xl">🖼️</div>
          <div className="text-base font-semibold" style={{ color: 'oklch(0.55 0.04 280)' }}>暂无存储的图片</div>
          <div className="text-sm" style={{ color: 'oklch(0.65 0.02 280)' }}>上传周边奖励图片或轮盘选项图片后会显示在这里</div>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {images.map(img => (
            <div
              key={img.id}
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: 'rgba(255,255,255,0.7)',
                border: img.isOrphan ? '1.5px solid rgba(239,68,68,0.35)' : '1.5px solid rgba(200,180,240,0.25)',
                boxShadow: '0 2px 12px rgba(100,80,180,0.06)',
              }}
            >
              {/* 图片预览 */}
              <div
                className="relative cursor-pointer overflow-hidden"
                style={{ paddingBottom: '75%' }}
                onClick={() => setPreviewId(img.id)}
              >
                <img
                  src={img.dataUrl}
                  alt={img.source}
                  className="absolute inset-0 w-full h-full object-cover transition-transform hover:scale-105"
                />
                {img.isOrphan && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: 'rgba(239,68,68,0.9)', color: 'white' }}>
                    孤立
                  </div>
                )}
              </div>
              {/* 信息 */}
              <div className="p-3 flex flex-col gap-2">
                <div className="text-xs font-semibold leading-snug" style={{ color: img.isOrphan ? '#ef4444' : 'oklch(0.35 0.04 280)' }}>
                  {img.source}
                </div>
                <div className="text-[10px]" style={{ color: 'oklch(0.65 0.02 280)', fontFamily: 'monospace' }}>
                  {img.id.slice(0, 12)}...
                </div>
                <button
                  onClick={() => handleDeleteImage(img.id)}
                  disabled={deleting.has(img.id)}
                  className="w-full py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: deleting.has(img.id) ? 'rgba(200,180,240,0.1)' : 'rgba(239,68,68,0.08)',
                    color: deleting.has(img.id) ? 'oklch(0.65 0.02 280)' : '#ef4444',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                >
                  {deleting.has(img.id) ? '删除中...' : '删除'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 全屏预览 */}
      {previewImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
          onClick={() => setPreviewId(null)}
        >
          <div className="flex flex-col items-center gap-4 p-6" onClick={e => e.stopPropagation()}>
            <img
              src={previewImg.dataUrl}
              alt={previewImg.source}
              className="max-w-[80vw] max-h-[70vh] rounded-2xl object-contain"
              style={{ boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}
            />
            <div className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>{previewImg.source}</div>
            <button
              onClick={() => setPreviewId(null)}
              className="px-6 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', border: '1.5px solid rgba(255,255,255,0.2)' }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
