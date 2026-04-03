// 奇妙奇遇控制台 - 游戏库管理页面
// 风格：亮色渐变 · 磨砂白卡片
// 功能：持久化游戏库 · 加载到游戏列表 · 单游戏JSON导出 · 单游戏JSON导入 · 重复名称覆盖确认

import React, { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '@/contexts/AppContext';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { exportSingleGame, parseSingleGameJSON } from '@/store';
import type { Game } from '@/types';

// ---- 覆盖确认对话框 ----
function OverwriteDialog({
  gameName,
  onConfirm,
  onCancel,
}: {
  gameName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
      onClick={onCancel}>
      <div className="w-[380px] rounded-3xl p-7 flex flex-col gap-5"
        style={{ background: 'rgba(255,255,255,0.95)', boxShadow: '0 20px 60px rgba(100,80,180,0.18)', border: '1px solid rgba(200,180,240,0.3)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>⚠️</div>
          <div>
            <div className="font-black text-base" style={{ color: 'oklch(0.18 0.02 280)' }}>库中已有同名游戏</div>
            <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.04 280)' }}>是否覆盖「{gameName}」？</div>
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'oklch(0.40 0.04 280)' }}>
          库中已存在名为 <strong>「{gameName}」</strong> 的游戏，覆盖后原有数据将被替换，此操作不可撤销。
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>
            取消
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', boxShadow: '0 4px 14px rgba(239,68,68,0.3)' }}>
            确认覆盖
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- 游戏卡片 ----
function GameCard({
  game,
  onLoad,
  onExport,
  onDelete,
}: {
  game: Game;
  onLoad: () => void;
  onExport: () => void;
  onDelete: () => void;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const hasImages = game.settlementImages && game.settlementImages.length > 0;

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3 transition-all hover:shadow-lg"
      style={{
        background: 'rgba(255,255,255,0.72)',
        border: '1px solid rgba(200,180,240,0.25)',
        boxShadow: '0 2px 12px rgba(100,80,180,0.06)',
      }}>
      {/* 顶部：名称 + 标签 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-black text-base leading-tight truncate" style={{ color: 'oklch(0.18 0.02 280)' }}>
            {game.name}
          </div>
          <div className="text-xs mt-1 flex items-center gap-2 flex-wrap">
            {game.winnerSettlement && (
              <span className="px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(102,187,106,0.12)', color: '#2e7d32' }}>
                🏆 {game.winnerSettlement.length > 12 ? game.winnerSettlement.slice(0, 12) + '…' : game.winnerSettlement}
              </span>
            )}
            {game.loserSettlement && (
              <span className="px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(244,143,177,0.15)', color: '#b71c1c' }}>
                💧 {game.loserSettlement.length > 12 ? game.loserSettlement.slice(0, 12) + '…' : game.loserSettlement}
              </span>
            )}
          </div>
        </div>
        {/* 周边图片缩略 */}
        {hasImages && (
          <div className="flex -space-x-2 flex-shrink-0">
            {game.settlementImages.slice(0, 3).map(img => (
              img.dataUrl ? (
                <img key={img.id} src={img.dataUrl} alt={img.name}
                  className="w-9 h-9 rounded-xl object-cover border-2 border-white"
                  style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }} />
              ) : (
                <div key={img.id} className="w-9 h-9 rounded-xl border-2 border-white flex items-center justify-center text-xs"
                  style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.55 0.04 280)' }}>
                  🖼
                </div>
              )
            ))}
            {game.settlementImages.length > 3 && (
              <div className="w-9 h-9 rounded-xl border-2 border-white flex items-center justify-center text-xs font-bold"
                style={{ background: 'rgba(124,77,255,0.15)', color: '#7c4dff' }}>
                +{game.settlementImages.length - 3}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 规则摘要 */}
      {game.rules && game.rules !== '请在此处添加游戏规则' && (
        <div className="text-xs leading-relaxed line-clamp-2"
          style={{ color: 'oklch(0.50 0.04 280)' }}>
          {game.rules}
        </div>
      )}

      {/* 底部操作 */}
      <div className="flex items-center gap-2 pt-1">
        <button onClick={onLoad}
          className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)', boxShadow: '0 2px 8px rgba(124,77,255,0.25)' }}>
          ＋ 加入游戏列表
        </button>
        <button onClick={onExport}
          className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
          style={{ background: 'rgba(100,116,139,0.1)', color: 'oklch(0.45 0.04 280)', border: '1px solid rgba(200,180,240,0.25)' }}
          title="导出为JSON模板">
          ↓ 导出
        </button>
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}
            title="从库中删除">
            删除
          </button>
        ) : (
          <div className="flex gap-1">
            <button onClick={() => setShowDeleteConfirm(false)}
              className="px-2 py-2 rounded-xl text-xs font-bold"
              style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>
              取消
            </button>
            <button onClick={onDelete}
              className="px-2 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#ef4444,#b91c1c)' }}>
              确认删除
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- 主页面 ----
export default function LibraryPage() {
  const { state, dispatch } = useApp();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState('');
  const [overwritePending, setOverwritePending] = useState<Game | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const library = state.gameLibrary ?? [];

  const filtered = library.filter(g => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      (g.rules || '').toLowerCase().includes(q) ||
      (g.winnerSettlement || '').toLowerCase().includes(q) ||
      (g.loserSettlement || '').toLowerCase().includes(q)
    );
  });

  // 加载游戏到当前游戏列表
  const handleLoad = (game: Game) => {
    dispatch({ type: 'ADD_GAME_TO_LIST', payload: game });
    toast.success(`「${game.name}」已加入游戏列表`);
  };

  // 导出单个游戏为 JSON
  const handleExport = (game: Game) => {
    const json = exportSingleGame(game);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${game.name.replace(/[/\\?%*:|"<>]/g, '_')}.game.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`「${game.name}」已导出为JSON模板`);
  };

  // 从库中删除
  const handleDelete = (gameId: string) => {
    dispatch({ type: 'REMOVE_GAME_FROM_LIBRARY', payload: gameId });
    toast.success('已从库中删除');
  };

  // 上传 JSON 文件导入游戏
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const json = ev.target?.result as string;
      const game = parseSingleGameJSON(json);
      if (!game) {
        toast.error('文件格式不正确，无法解析游戏数据');
        return;
      }
      // 检查是否有同名游戏
      const duplicate = library.find(g => g.name === game.name);
      if (duplicate) {
        setOverwritePending(game);
      } else {
        dispatch({ type: 'ADD_GAME_TO_LIBRARY', payload: game });
        toast.success(`「${game.name}」已导入到库`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 确认覆盖
  const handleOverwriteConfirm = () => {
    if (!overwritePending) return;
    dispatch({ type: 'ADD_GAME_TO_LIBRARY_FORCE', payload: overwritePending });
    toast.success(`「${overwritePending.name}」已覆盖更新到库`);
    setOverwritePending(null);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(232,234,246,0.5) 0%, rgba(252,228,236,0.3) 50%, rgba(224,247,250,0.4) 100%)' }}>

      {/* 顶部操作栏 */}
      <div className="flex-shrink-0 px-6 py-4"
        style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(200,180,240,0.2)' }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-all"
              style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}
              title="返回控制台">
              ←
            </button>
            <h1 className="text-xl font-black" style={{ color: 'oklch(0.18 0.02 280)' }}>游戏库</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
              style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)', color: 'white' }}>
              {library.length} 个游戏
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="搜索游戏…"
              className="px-3 py-1.5 rounded-xl text-sm outline-none w-44"
              style={{ background: 'rgba(255,255,255,0.8)', border: '1.5px solid rgba(200,180,240,0.3)' }} />
            {/* 上传JSON */}
            <button onClick={() => importRef.current?.click()}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{ background: 'rgba(100,116,139,0.1)', color: 'oklch(0.40 0.04 280)', border: '1.5px solid rgba(200,180,240,0.3)' }}>
              ↑ 导入JSON
            </button>
            <input ref={importRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImportFile} />
          </div>
        </div>
      </div>

      {/* 游戏卡片网格 */}
      <div className="flex-1 overflow-auto px-6 py-5">
        {library.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4" style={{ color: 'oklch(0.60 0.04 280)' }}>
            <div className="text-6xl">📚</div>
            <div className="text-lg font-black" style={{ color: 'oklch(0.30 0.04 280)' }}>游戏库为空</div>
            <div className="text-sm text-center leading-relaxed max-w-xs" style={{ color: 'oklch(0.55 0.04 280)' }}>
              在控制台编辑游戏后点击「入库」将其保存到这里，或点击「导入JSON」上传本地模板文件。
            </div>
            <button onClick={() => importRef.current?.click()}
              className="px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)', boxShadow: '0 4px 14px rgba(124,77,255,0.3)' }}>
              ↑ 导入JSON模板
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'oklch(0.60 0.04 280)' }}>
            <div className="text-4xl">🔍</div>
            <div className="text-base font-semibold">没有找到匹配的游戏</div>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {filtered.map(game => (
              <GameCard
                key={game.id}
                game={game}
                onLoad={() => handleLoad(game)}
                onExport={() => handleExport(game)}
                onDelete={() => handleDelete(game.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 覆盖确认弹窗 */}
      {overwritePending && (
        <OverwriteDialog
          gameName={overwritePending.name}
          onConfirm={handleOverwriteConfirm}
          onCancel={() => setOverwritePending(null)}
        />
      )}
    </div>
  );
}
