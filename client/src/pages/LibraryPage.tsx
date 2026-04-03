// 奇妙奇遇控制台 - 游戏库管理页面
// 功能：游戏库 + 游戏列表组管理
// 风格：亮色渐变 · 磨砂白卡片

import React, { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '@/contexts/AppContext';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { exportSingleGame, parseSingleGameJSON, exportSingleGroup, parseGroupJSON } from '@/store';
import type { Game, GameGroup } from '@/types';

// ============================================================
// 重名冲突对话框（改名 / 覆盖 / 取消）
// ============================================================
function DuplicateDialog({
  title,
  description,
  gameName,
  newNamePlaceholder,
  onRename,
  onOverwrite,
  onCancel,
}: {
  title: string;
  description: string;
  gameName: string;
  newNamePlaceholder?: string;
  onRename: (newName: string) => void;
  onOverwrite: () => void;
  onCancel: () => void;
}) {
  const [newName, setNewName] = React.useState(gameName + ' (副本)');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
      onClick={onCancel}>
      <div className="w-[420px] rounded-3xl p-7 flex flex-col gap-5"
        style={{ background: 'rgba(255,255,255,0.97)', boxShadow: '0 20px 60px rgba(100,80,180,0.18)', border: '1px solid rgba(200,180,240,0.3)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>⚠️</div>
          <div>
            <div className="font-black text-base" style={{ color: 'oklch(0.18 0.02 280)' }}>{title}</div>
            <div className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.04 280)' }}>「{gameName}」</div>
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'oklch(0.40 0.04 280)' }}>{description}</p>
        <div>
          <div className="text-xs font-bold mb-1.5" style={{ color: 'oklch(0.45 0.06 280)' }}>改名后加入（输入新名称）</div>
          <input
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(200,180,240,0.15)', border: '1.5px solid rgba(200,180,240,0.4)', color: 'oklch(0.22 0.02 280)' }}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder={newNamePlaceholder || '输入新名称...'}
            onKeyDown={e => { if (e.key === 'Enter' && newName.trim()) onRename(newName.trim()); }}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>
            取消
          </button>
          <button onClick={onOverwrite}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', boxShadow: '0 4px 14px rgba(239,68,68,0.3)' }}>
            覆盖保留一个
          </button>
          <button onClick={() => { if (newName.trim()) onRename(newName.trim()); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg,#42a5f5,#26c6da)', boxShadow: '0 4px 14px rgba(66,165,245,0.3)' }}>
            改名加入
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 游戏卡片（库管理标签页）
// ============================================================
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
        {hasImages && (
          <div className="flex -space-x-2 flex-shrink-0">
            {game.settlementImages.slice(0, 3).map(img => (
              img.dataUrl ? (
                <img key={img.id} src={img.dataUrl} alt={img.name}
                  className="w-9 h-9 rounded-xl object-cover border-2 border-white"
                  style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }} />
              ) : (
                <div key={img.id} className="w-9 h-9 rounded-xl border-2 border-white flex items-center justify-center text-xs"
                  style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.55 0.04 280)' }}>🖼</div>
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
      {game.rules && game.rules !== '请在此处添加游戏规则' && (
        <div className="text-xs leading-relaxed line-clamp-2" style={{ color: 'oklch(0.50 0.04 280)' }}>
          {game.rules}
        </div>
      )}
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
            style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}>
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

// ============================================================
// 分组编辑器弹窗
// ============================================================
function GroupEditor({
  group,
  library,
  onSave,
  onCancel,
}: {
  group: Partial<GameGroup>;
  library: Game[];
  onSave: (g: GameGroup) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(group.name || '');
  const [notes, setNotes] = useState(group.notes || '');
  const [selected, setSelected] = useState<string[]>(group.gameNames || []);

  const toggle = (gameName: string) => {
    setSelected(prev =>
      prev.includes(gameName) ? prev.filter(n => n !== gameName) : [...prev, gameName]
    );
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const arr = [...selected];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    setSelected(arr);
  };

  const moveDown = (idx: number) => {
    if (idx === selected.length - 1) return;
    const arr = [...selected];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    setSelected(arr);
  };

  const handleSave = () => {
    if (!name.trim()) { toast.error('请输入分组名称'); return; }
    if (selected.length === 0) { toast.error('请至少选择一个游戏'); return; }
    onSave({
      id: group.id || nanoid(),
      name: name.trim(),
      gameNames: selected,
      notes: notes.trim(),
      createdAt: group.createdAt || Date.now(),
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
      onClick={onCancel}>
      <div className="w-[560px] max-h-[80vh] rounded-3xl flex flex-col overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.97)', boxShadow: '0 20px 60px rgba(100,80,180,0.2)', border: '1px solid rgba(200,180,240,0.3)' }}
        onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="px-6 py-5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(200,180,240,0.2)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)' }}>📋</div>
            <div className="font-black text-lg" style={{ color: 'oklch(0.18 0.02 280)' }}>
              {group.id ? '编辑分组' : '新建分组'}
            </div>
          </div>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="分组名称（如：周末活动场次）"
            className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold outline-none mb-2"
            style={{ background: 'rgba(200,180,240,0.12)', border: '1.5px solid rgba(200,180,240,0.3)', color: 'oklch(0.18 0.02 280)' }}
          />
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="备注（可选）"
            className="w-full px-4 py-2 rounded-xl text-xs outline-none"
            style={{ background: 'rgba(200,180,240,0.08)', border: '1px solid rgba(200,180,240,0.2)', color: 'oklch(0.40 0.04 280)' }}
          />
        </div>

        {/* 内容区：左选游戏 + 右排序 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 左：库中游戏选择 */}
          <div className="flex-1 flex flex-col overflow-hidden" style={{ borderRight: '1px solid rgba(200,180,240,0.2)' }}>
            <div className="px-4 py-2 flex-shrink-0 text-xs font-bold" style={{ color: 'oklch(0.50 0.06 280)', background: 'rgba(200,180,240,0.06)' }}>
              从库中选择游戏（{selected.length} 已选）
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {library.length === 0 ? (
                <div className="text-center py-8 text-xs" style={{ color: 'oklch(0.60 0.04 280)' }}>库中暂无游戏</div>
              ) : library.map(game => {
                const isSelected = selected.includes(game.name);
                return (
                  <button key={game.id} onClick={() => toggle(game.name)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
                    style={isSelected
                      ? { background: 'linear-gradient(135deg,rgba(236,64,122,0.08),rgba(124,77,255,0.08))', border: '1.5px solid rgba(124,77,255,0.3)' }
                      : { background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(200,180,240,0.2)' }}>
                    <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-xs"
                      style={isSelected
                        ? { background: 'linear-gradient(135deg,#ec407a,#7c4dff)', color: 'white' }
                        : { background: 'rgba(200,180,240,0.2)', color: 'transparent' }}>
                      ✓
                    </div>
                    <span className="text-sm font-semibold truncate" style={{ color: isSelected ? 'oklch(0.22 0.02 280)' : 'oklch(0.45 0.04 280)' }}>
                      {game.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 右：已选顺序 */}
          <div className="w-52 flex flex-col overflow-hidden">
            <div className="px-4 py-2 flex-shrink-0 text-xs font-bold" style={{ color: 'oklch(0.50 0.06 280)', background: 'rgba(200,180,240,0.06)' }}>
              游戏顺序（可调整）
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {selected.length === 0 ? (
                <div className="text-center py-8 text-xs" style={{ color: 'oklch(0.65 0.04 280)' }}>从左侧选择游戏</div>
              ) : selected.map((gameName, idx) => (
                <div key={gameName} className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(200,180,240,0.2)' }}>
                  <span className="text-xs font-black w-4 text-center flex-shrink-0" style={{ color: 'oklch(0.60 0.06 280)' }}>{idx + 1}</span>
                  <span className="flex-1 text-xs font-semibold truncate" style={{ color: 'oklch(0.28 0.02 280)' }}>{gameName}</span>
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveUp(idx)}
                      className="w-5 h-4 rounded text-xs flex items-center justify-center"
                      style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.50 0.06 280)', lineHeight: 1 }}
                      disabled={idx === 0}>↑</button>
                    <button onClick={() => moveDown(idx)}
                      className="w-5 h-4 rounded text-xs flex items-center justify-center"
                      style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.50 0.06 280)', lineHeight: 1 }}
                      disabled={idx === selected.length - 1}>↓</button>
                  </div>
                  <button onClick={() => toggle(gameName)}
                    className="w-5 h-5 rounded-md flex items-center justify-center text-xs flex-shrink-0"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 flex gap-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(200,180,240,0.2)' }}>
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>
            取消
          </button>
          <button onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)', boxShadow: '0 4px 14px rgba(124,77,255,0.3)' }}>
            保存分组
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 分组卡片
// ============================================================
function GroupCard({
  group,
  library,
  onLoad,
  onEdit,
  onExport,
  onDelete,
}: {
  group: GameGroup;
  library: Game[];
  onLoad: () => void;
  onEdit: () => void;
  onExport: () => void;
  onDelete: () => void;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // 计算库中实际存在的游戏数量
  const existingCount = group.gameNames.filter(n => library.some(g => g.name === n)).length;
  const missingCount = group.gameNames.length - existingCount;

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3 transition-all hover:shadow-lg"
      style={{
        background: 'rgba(255,255,255,0.72)',
        border: '1px solid rgba(200,180,240,0.25)',
        boxShadow: '0 2px 12px rgba(100,80,180,0.06)',
      }}>
      {/* 头部 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <span className="font-black text-base truncate" style={{ color: 'oklch(0.18 0.02 280)' }}>{group.name}</span>
          </div>
          {group.notes && (
            <div className="text-xs mt-1 truncate" style={{ color: 'oklch(0.55 0.04 280)' }}>{group.notes}</div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
            style={{ background: 'linear-gradient(135deg,rgba(236,64,122,0.1),rgba(124,77,255,0.1))', color: '#7c4dff' }}>
            {group.gameNames.length} 个游戏
          </span>
          {missingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
              {missingCount} 个已从库删除
            </span>
          )}
        </div>
      </div>

      {/* 游戏名称列表预览 */}
      <div className="flex flex-wrap gap-1.5">
        {group.gameNames.slice(0, 6).map((name, idx) => {
          const exists = library.some(g => g.name === name);
          return (
            <span key={idx} className="px-2 py-0.5 rounded-lg text-xs font-semibold"
              style={exists
                ? { background: 'rgba(200,180,240,0.15)', color: 'oklch(0.40 0.06 280)' }
                : { background: 'rgba(239,68,68,0.06)', color: '#ef4444', textDecoration: 'line-through' }}>
              {name}
            </span>
          );
        })}
        {group.gameNames.length > 6 && (
          <span className="px-2 py-0.5 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(200,180,240,0.1)', color: 'oklch(0.55 0.06 280)' }}>
            +{group.gameNames.length - 6} 个
          </span>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-2 pt-1">
        <button onClick={onLoad}
          className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)', boxShadow: '0 2px 8px rgba(124,77,255,0.25)' }}>
          ▶ 一键载入列表
        </button>
        <button onClick={onEdit}
          className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
          style={{ background: 'rgba(124,77,255,0.1)', color: '#7c4dff', border: '1px solid rgba(124,77,255,0.2)' }}>
          编辑
        </button>
        <button onClick={onExport}
          className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
          style={{ background: 'rgba(100,116,139,0.1)', color: 'oklch(0.45 0.04 280)', border: '1px solid rgba(200,180,240,0.25)' }}
          title="导出为JSON">
          ↓
        </button>
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}>
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
              确认
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 主页面
// ============================================================
type PageTab = 'library' | 'groups';

export default function LibraryPage() {
  const { state, dispatch } = useApp();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<PageTab>('library');
  const [search, setSearch] = useState('');
  const [overwritePending, setOverwritePending] = useState<Game | null>(null); // 库中重名（导入JSON）
  const [listDupPending, setListDupPending] = useState<Game | null>(null); // 列表中重名（从库加载）
  const [editingGroup, setEditingGroup] = useState<Partial<GameGroup> | null>(null);
  const gameImportRef = useRef<HTMLInputElement>(null);
  const groupImportRef = useRef<HTMLInputElement>(null);

  const library = state.gameLibrary ?? [];
  const groups = state.gameGroups ?? [];

  const filteredLibrary = library.filter(g => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      (g.rules || '').toLowerCase().includes(q) ||
      (g.winnerSettlement || '').toLowerCase().includes(q)
    );
  });

  const filteredGroups = groups.filter(g => {
    if (!search) return true;
    const q = search.toLowerCase();
    return g.name.toLowerCase().includes(q) || (g.notes || '').toLowerCase().includes(q);
  });

  // ---- 游戏库操作 ----
  const handleLoad = (game: Game) => {
    const listNames = state.currentGameList.map(item => item.gameData.name);
    if (listNames.includes(game.name)) {
      setListDupPending(game);
      return;
    }
    dispatch({ type: 'ADD_GAME_TO_LIST', payload: game });
    toast.success(`「${game.name}」已加入游戏列表`);
  };

  const handleExportGame = async (game: Game) => {
    try {
      const json = await exportSingleGame(game);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${game.name.replace(/[/\\?%*:|"<>]/g, '_')}.game.json`;
      a.click();
      URL.revokeObjectURL(url);
      const imgCount = (game.settlementImages || []).length;
      toast.success(`「${game.name}」已导出为JSON模板${imgCount > 0 ? `（含 ${imgCount} 张周边图片）` : ''}`);
    } catch {
      toast.error('导出失败，请重试');
    }
  };

  const handleDeleteGame = (gameId: string) => {
    dispatch({ type: 'REMOVE_GAME_FROM_LIBRARY', payload: gameId });
    toast.success('已从库中删除');
  };

  const handleImportGameFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const json = ev.target?.result as string;
      const game = await parseSingleGameJSON(json);
      if (!game) { toast.error('文件格式不正确，无法解析游戏数据'); return; }
      const duplicate = library.find(g => g.name === game.name);
      if (duplicate) {
        setOverwritePending(game);
      } else {
        dispatch({ type: 'ADD_GAME_TO_LIBRARY', payload: game });
        const imgCount = (game.settlementImages || []).filter(img => img.dataUrl).length;
        toast.success(`「${game.name}」已导入到库${imgCount > 0 ? `（含 ${imgCount} 张周边图片）` : ''}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleOverwriteConfirm = () => {
    if (!overwritePending) return;
    dispatch({ type: 'ADD_GAME_TO_LIBRARY_FORCE', payload: overwritePending });
    toast.success(`「${overwritePending.name}」已覆盖更新到库`);
    setOverwritePending(null);
  };

  const handleOverwriteRename = (newName: string) => {
    if (!overwritePending) return;
    dispatch({ type: 'ADD_GAME_TO_LIBRARY', payload: { ...overwritePending, name: newName } });
    toast.success(`已以「${newName}」入库`);
    setOverwritePending(null);
  };

  const handleListDupOverwrite = () => {
    if (!listDupPending) return;
    // 覆盖：删除列表中同名的，再加入
    const existing = state.currentGameList.find(item => item.gameData.name === listDupPending.name);
    if (existing) dispatch({ type: 'REMOVE_GAME_FROM_LIST', payload: existing.id });
    dispatch({ type: 'ADD_GAME_TO_LIST', payload: listDupPending });
    toast.success(`「${listDupPending.name}」已覆盖加入列表`);
    setListDupPending(null);
  };

  const handleListDupRename = (newName: string) => {
    if (!listDupPending) return;
    dispatch({ type: 'ADD_GAME_TO_LIST', payload: { ...listDupPending, name: newName } });
    toast.success(`已以「${newName}」加入列表`);
    setListDupPending(null);
  };

  // ---- 分组操作 ----
  const handleLoadGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    dispatch({ type: 'LOAD_GROUP_TO_LIST', payload: groupId });
    const existingCount = group.gameNames.filter(n => library.some(g => g.name === n)).length;
    const missingCount = group.gameNames.length - existingCount;
    if (missingCount > 0) {
      toast.success(`已载入 ${existingCount} 个游戏（${missingCount} 个已从库删除，已忽略）`);
    } else {
      toast.success(`「${group.name}」已载入 ${existingCount} 个游戏到列表`);
    }
    navigate('/');
  };

  const handleSaveGroup = (group: GameGroup) => {
    const existing = groups.find(g => g.id === group.id);
    if (existing) {
      dispatch({ type: 'UPDATE_GAME_GROUP', payload: group });
      toast.success(`分组「${group.name}」已更新`);
    } else {
      dispatch({ type: 'ADD_GAME_GROUP', payload: group });
      toast.success(`分组「${group.name}」已创建`);
    }
    setEditingGroup(null);
  };

  const handleDeleteGroup = (groupId: string) => {
    dispatch({ type: 'REMOVE_GAME_GROUP', payload: groupId });
    toast.success('分组已删除');
  };

  const handleExportGroup = (group: GameGroup) => {
    const json = exportSingleGroup(group);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${group.name.replace(/[/\\?%*:|"<>]/g, '_')}.group.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`「${group.name}」已导出为JSON`);
  };

  const handleImportGroupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const json = ev.target?.result as string;
      const parsed = parseGroupJSON(json);
      if (!parsed || parsed.length === 0) { toast.error('文件格式不正确，无法解析分组数据'); return; }
      parsed.forEach(g => dispatch({ type: 'ADD_GAME_GROUP', payload: g }));
      toast.success(`已导入 ${parsed.length} 个分组`);
    };
    reader.readAsText(file);
    e.target.value = '';
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
            {/* 标签切换 */}
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1.5px solid rgba(200,180,240,0.3)' }}>
              <button onClick={() => setActiveTab('library')}
                className="px-3 py-1.5 text-xs font-bold transition-all"
                style={activeTab === 'library'
                  ? { background: 'linear-gradient(135deg,#ec407a,#7c4dff)', color: 'white' }
                  : { background: 'transparent', color: 'oklch(0.50 0.06 280)' }}>
                📚 游戏库 ({library.length})
              </button>
              <button onClick={() => setActiveTab('groups')}
                className="px-3 py-1.5 text-xs font-bold transition-all"
                style={activeTab === 'groups'
                  ? { background: 'linear-gradient(135deg,#ec407a,#7c4dff)', color: 'white' }
                  : { background: 'transparent', color: 'oklch(0.50 0.06 280)' }}>
                📋 列表组 ({groups.length})
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={activeTab === 'library' ? '搜索游戏…' : '搜索分组…'}
              className="px-3 py-1.5 rounded-xl text-sm outline-none w-40"
              style={{ background: 'rgba(255,255,255,0.8)', border: '1.5px solid rgba(200,180,240,0.3)' }} />
            {activeTab === 'library' ? (
              <>
                <button onClick={() => gameImportRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{ background: 'rgba(100,116,139,0.1)', color: 'oklch(0.40 0.04 280)', border: '1.5px solid rgba(200,180,240,0.3)' }}>
                  ↑ 导入JSON
                </button>
                <input ref={gameImportRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImportGameFile} />
              </>
            ) : (
              <>
                <button onClick={() => setEditingGroup({})}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)', boxShadow: '0 2px 8px rgba(124,77,255,0.25)' }}>
                  + 新建分组
                </button>
                <button onClick={() => groupImportRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{ background: 'rgba(100,116,139,0.1)', color: 'oklch(0.40 0.04 280)', border: '1.5px solid rgba(200,180,240,0.3)' }}>
                  ↑ 导入JSON
                </button>
                <input ref={groupImportRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImportGroupFile} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-auto px-6 py-5">
        {/* 游戏库标签页 */}
        {activeTab === 'library' && (
          library.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4" style={{ color: 'oklch(0.60 0.04 280)' }}>
              <div className="text-6xl">📚</div>
              <div className="text-lg font-black" style={{ color: 'oklch(0.30 0.04 280)' }}>游戏库为空</div>
              <div className="text-sm text-center leading-relaxed max-w-xs" style={{ color: 'oklch(0.55 0.04 280)' }}>
                在控制台编辑游戏后点击「入库」将其保存到这里，或点击「导入JSON」上传本地模板文件。
              </div>
              <button onClick={() => gameImportRef.current?.click()}
                className="px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)', boxShadow: '0 4px 14px rgba(124,77,255,0.3)' }}>
                ↑ 导入JSON模板
              </button>
            </div>
          ) : filteredLibrary.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'oklch(0.60 0.04 280)' }}>
              <div className="text-4xl">🔍</div>
              <div className="text-base font-semibold">没有找到匹配的游戏</div>
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {filteredLibrary.map(game => (
                <GameCard
                  key={game.id}
                  game={game}
                  onLoad={() => handleLoad(game)}
                  onExport={() => handleExportGame(game)}
                  onDelete={() => handleDeleteGame(game.id)}
                />
              ))}
            </div>
          )
        )}

        {/* 列表组标签页 */}
        {activeTab === 'groups' && (
          groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4" style={{ color: 'oklch(0.60 0.04 280)' }}>
              <div className="text-6xl">📋</div>
              <div className="text-lg font-black" style={{ color: 'oklch(0.30 0.04 280)' }}>暂无游戏列表组</div>
              <div className="text-sm text-center leading-relaxed max-w-xs" style={{ color: 'oklch(0.55 0.04 280)' }}>
                创建分组后，可以将库中的游戏编排成有序列表，一键载入到当天的游戏列表中。
              </div>
              <button onClick={() => setEditingGroup({})}
                className="px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)', boxShadow: '0 4px 14px rgba(124,77,255,0.3)' }}>
                + 新建第一个分组
              </button>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'oklch(0.60 0.04 280)' }}>
              <div className="text-4xl">🔍</div>
              <div className="text-base font-semibold">没有找到匹配的分组</div>
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
              {filteredGroups.map(group => (
                <GroupCard
                  key={group.id}
                  group={group}
                  library={library}
                  onLoad={() => handleLoadGroup(group.id)}
                  onEdit={() => setEditingGroup(group)}
                  onExport={() => handleExportGroup(group)}
                  onDelete={() => handleDeleteGroup(group.id)}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* 库中重名弹窗（导入JSON） */}
      {overwritePending && (
        <DuplicateDialog
          title="库中已有同名游戏"
          description={`库中已存在名为「${overwritePending.name}」的游戏。可以覆盖（保留一个），也可以改名后另存。`}
          gameName={overwritePending.name}
          onRename={handleOverwriteRename}
          onOverwrite={handleOverwriteConfirm}
          onCancel={() => setOverwritePending(null)}
        />
      )}

      {/* 列表中重名弹窗（从库加载） */}
      {listDupPending && (
        <DuplicateDialog
          title="列表中已有同名游戏"
          description={`游戏列表中已存在名为「${listDupPending.name}」的游戏。可以覆盖（保留一个），也可以改名后另存。`}
          gameName={listDupPending.name}
          onRename={handleListDupRename}
          onOverwrite={handleListDupOverwrite}
          onCancel={() => setListDupPending(null)}
        />
      )}

      {/* 分组编辑器弹窗 */}
      {editingGroup !== null && (
        <GroupEditor
          group={editingGroup}
          library={library}
          onSave={handleSaveGroup}
          onCancel={() => setEditingGroup(null)}
        />
      )}
    </div>
  );
}
