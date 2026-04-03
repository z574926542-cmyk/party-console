// ============================================================
// 展台页面
// Design: 奇妙奇遇 v2 — 舞台感 · 品牌感 · 可展示感
// 气质：给玩家看，有氛围，规则和结算醒目，工具快速调用
// ============================================================

import React, { useState, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { BoundTool, GameListItem, PeripheralRecord } from '@/types';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import {
  ChevronLeft, ChevronRight, Zap, Trophy, XCircle,
  Tv2, ArrowRight, LayoutList, Eye, EyeOff, Package
} from 'lucide-react';
import ToolOverlay from '@/components/shared/ToolOverlay';
import QuickPick from '@/components/shared/QuickPick';

// ============================================================
// 工具标签按钮
// ============================================================
function ToolTagButton({ tool, onClick }: { tool: BoundTool; onClick: () => void }) {
  const toolConfig: Record<string, { emoji: string; color: string }> = {
    'random-number': { emoji: '🎲', color: 'oklch(0.78 0.16 52)' },
    'random-pick':   { emoji: '👤', color: 'oklch(0.65 0.18 155)' },
    'random-group':  { emoji: '👥', color: 'oklch(0.60 0.20 285)' },
    'countdown':     { emoji: '⏱',  color: 'oklch(0.75 0.18 65)' },
    'dice':          { emoji: '🎯', color: 'oklch(0.62 0.22 10)' },
    'wheel':         { emoji: '🎡', color: 'oklch(0.60 0.20 285)' },
  };

  const config = tool.type === 'wheel'
    ? toolConfig['wheel']
    : toolConfig[tool.toolType || ''] || { emoji: '⚡', color: 'oklch(0.78 0.16 52)' };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
      style={{
        background: `${config.color}14`,
        border: `1px solid ${config.color}35`,
        color: config.color,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = `${config.color}22`;
        el.style.borderColor = `${config.color}55`;
        el.style.boxShadow = `0 0 12px ${config.color}25`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = `${config.color}14`;
        el.style.borderColor = `${config.color}35`;
        el.style.boxShadow = '';
      }}
    >
      <span style={{ fontSize: '14px' }}>{config.emoji}</span>
      {tool.label}
      <Zap size={11} style={{ opacity: 0.6 }} />
    </button>
  );
}

// ============================================================
// 主页面
// ============================================================
export default function StagePage() {
  const { state, dispatch, getTagById, getWheelById, isPeripheralGame } = useApp();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    state.stageCurrentGameId || (state.currentGameList[0]?.id ?? null)
  );
  const [showNames, setShowNames] = useState(state.stageShowGameNames);
  const [activeTool, setActiveTool] = useState<BoundTool | null>(null);
  const [quickPickOpen, setQuickPickOpen] = useState(false);
  const [quickPickCallback, setQuickPickCallback] = useState<((nums: number[]) => void) | null>(null);
  const [settlementDone, setSettlementDone] = useState<Set<string>>(new Set());

  const list = state.currentGameList;
  const currentIndex = list.findIndex(item => item.id === selectedItemId);
  const currentItem = currentIndex >= 0 ? list[currentIndex] : null;
  const game = currentItem?.gameData;

  const goTo = useCallback((id: string) => {
    setSelectedItemId(id);
    dispatch({ type: 'SET_STAGE_CURRENT_GAME', payload: id });
  }, [dispatch]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) goTo(list[currentIndex - 1].id);
  }, [currentIndex, list, goTo]);

  const goNext = useCallback(() => {
    if (currentIndex < list.length - 1) goTo(list[currentIndex + 1].id);
  }, [currentIndex, list, goTo]);

  const toggleShowNames = () => {
    const next = !showNames;
    setShowNames(next);
    dispatch({ type: 'TOGGLE_STAGE_SHOW_NAMES' });
  };

  const handleSettle = () => {
    if (!game || !currentItem) return;
    setQuickPickOpen(true);
    setQuickPickCallback(() => (playerNumbers: number[]) => {
      playerNumbers.forEach((num, i) => {
        const maxSerial = state.peripheralRecords.reduce((max, r) => Math.max(max, r.serialNumber), 0);
        const record: PeripheralRecord = {
          id: nanoid(),
          serialNumber: maxSerial + 1 + i,
          playerNumber: num,
          peripheralCode: `P-${String(maxSerial + 1 + i).padStart(4, '0')}`,
          notes: '',
          completed: false,
          source: 'game-settlement',
          sourceGameName: game.name,
          createdAt: Date.now(),
        };
        dispatch({ type: 'ADD_PERIPHERAL_RECORD', payload: record });
      });
      setSettlementDone(prev => { const next = new Set(Array.from(prev)); next.add(currentItem.id); return next; });
      toast.success(`已为 ${playerNumbers.length} 位玩家生成周边记录`);
    });
  };

  // 空状态
  if (list.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-5">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{
            background: 'oklch(0.65 0.18 155 / 0.08)',
            border: '1px solid oklch(0.65 0.18 155 / 0.2)',
          }}
        >
          <Tv2 size={32} style={{ color: 'oklch(0.55 0.15 155)' }} />
        </div>
        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: 'oklch(0.65 0.02 270)' }}>展台尚未载入游戏</div>
          <div className="text-sm mt-1.5" style={{ color: 'oklch(0.45 0.015 270)' }}>
            请在控制台编辑游戏后，点击"展台"按钮载入
          </div>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
          style={{ background: 'oklch(0.165 0.025 270)', border: '1px solid oklch(0.26 0.025 270)', color: 'oklch(0.55 0.02 270)' }}
        >
          <ArrowRight size={14} />
          前往控制台 → 编辑游戏 → 点击"展台"
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden">

      {/* ============================================================
          左侧：游戏导航列表
          ============================================================ */}
      <div
        className="w-52 flex-shrink-0 flex flex-col overflow-hidden"
        style={{
          background: 'oklch(0.115 0.022 270)',
          borderRight: '1px solid oklch(0.20 0.022 270)',
        }}
      >
        {/* 顶部标题 */}
        <div
          className="px-4 py-3.5 flex-shrink-0"
          style={{ borderBottom: '1px solid oklch(0.18 0.02 270)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tv2 size={13} style={{ color: 'oklch(0.65 0.18 155)' }} />
              <span className="text-sm font-semibold" style={{ color: 'oklch(0.82 0.008 270)' }}>展台</span>
            </div>
            <button
              onClick={toggleShowNames}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: showNames ? 'oklch(0.65 0.18 155)' : 'oklch(0.45 0.015 270)' }}
              title={showNames ? '隐藏游戏名' : '显示游戏名'}
            >
              {showNames ? <Eye size={13} /> : <EyeOff size={13} />}
            </button>
          </div>
        </div>

        {/* 游戏列表 */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1">
          {list.map((item) => {
            const isActive = item.id === selectedItemId;
            const isDone = settlementDone.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => goTo(item.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-150"
                style={
                  isActive
                    ? {
                        background: 'oklch(0.65 0.18 155 / 0.12)',
                        border: '1px solid oklch(0.65 0.18 155 / 0.3)',
                      }
                    : {
                        background: 'oklch(0.155 0.022 270)',
                        border: '1px solid oklch(0.22 0.022 270)',
                      }
                }
                onMouseEnter={e => {
                  if (!isActive) {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = 'oklch(0.185 0.025 270)';
                    el.style.borderColor = 'oklch(0.28 0.025 270)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = 'oklch(0.155 0.022 270)';
                    el.style.borderColor = 'oklch(0.22 0.022 270)';
                  }
                }}
              >
                <span
                  className="font-mono-display text-xs font-bold w-5 text-center flex-shrink-0"
                  style={{ color: isActive ? 'oklch(0.68 0.18 155)' : 'oklch(0.45 0.015 270)' }}
                >
                  {item.order}
                </span>
                <span
                  className="flex-1 text-sm font-medium truncate"
                  style={{ color: isActive ? 'oklch(0.88 0.008 270)' : 'oklch(0.65 0.02 270)' }}
                >
                  {showNames ? item.gameData.name : `游戏 ${item.order}`}
                </span>
                {isDone && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                    style={{ background: 'oklch(0.65 0.18 155 / 0.15)', color: 'oklch(0.65 0.18 155)' }}>
                    ✓
                  </span>
                )}
                {isActive && (
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: 'oklch(0.65 0.18 155)', boxShadow: '0 0 6px oklch(0.65 0.18 155)' }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* 底部导航控制 */}
        <div
          className="px-3 py-3 flex-shrink-0 flex items-center justify-between gap-2"
          style={{ borderTop: '1px solid oklch(0.18 0.02 270)' }}
        >
          <button
            onClick={goPrev}
            disabled={currentIndex <= 0}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: 'oklch(0.19 0.022 270)',
              border: '1px solid oklch(0.26 0.022 270)',
              color: 'oklch(0.65 0.02 270)',
            }}
          >
            <ChevronLeft size={13} />上一个
          </button>
          <button
            onClick={goNext}
            disabled={currentIndex >= list.length - 1}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: 'oklch(0.19 0.022 270)',
              border: '1px solid oklch(0.26 0.022 270)',
              color: 'oklch(0.65 0.02 270)',
            }}
          >
            下一个<ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* ============================================================
          右侧：主展示区
          ============================================================ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* 工具快捷栏 */}
        {game && game.tools.length > 0 && (
          <div
            className="flex-shrink-0 px-6 py-3 flex items-center gap-3 overflow-x-auto"
            style={{ borderBottom: '1px solid oklch(0.20 0.022 270)' }}
          >
            <span
              className="text-xs font-bold tracking-widest uppercase flex-shrink-0"
              style={{ color: 'oklch(0.45 0.015 270)', letterSpacing: '0.12em' }}
            >
              快捷工具
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {game.tools.map(tool => (
                <ToolTagButton
                  key={tool.id}
                  tool={tool}
                  onClick={() => setActiveTool(tool)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 游戏内容 */}
        <div className="flex-1 overflow-y-auto">
          {game && currentItem ? (
            <div className="p-8 max-w-3xl mx-auto space-y-5">

              {/* 游戏标题 */}
              {showNames && (
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-mono-display font-bold text-lg mt-0.5"
                    style={{
                      background: 'oklch(0.78 0.16 52 / 0.15)',
                      border: '1px solid oklch(0.78 0.16 52 / 0.3)',
                      color: 'oklch(0.78 0.16 52)',
                    }}
                  >
                    {currentItem.order}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1
                      className="text-3xl font-bold tracking-tight"
                      style={{ color: 'oklch(0.93 0.008 270)', fontFamily: "'Noto Serif SC', serif" }}
                    >
                      {game.name}
                    </h1>
                    {/* 标签 */}
                    {game.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {game.tags.map(tagId => {
                          const tag = getTagById(tagId);
                          if (!tag) return null;
                          return (
                            <span
                              key={tagId}
                              className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                              style={{ background: tag.color + '25', color: tag.color, border: `1px solid ${tag.color}40` }}
                            >
                              {tag.name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 结算按钮 */}
                  {isPeripheralGame(game) && (
                    <button
                      onClick={handleSettle}
                      className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
                      style={{
                        background: 'oklch(0.78 0.16 52 / 0.15)',
                        border: '1px solid oklch(0.78 0.16 52 / 0.35)',
                        color: 'oklch(0.78 0.16 52)',
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = 'oklch(0.78 0.16 52 / 0.25)';
                        el.style.boxShadow = '0 0 16px oklch(0.78 0.16 52 / 0.2)';
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = 'oklch(0.78 0.16 52 / 0.15)';
                        el.style.boxShadow = '';
                      }}
                    >
                      <Package size={14} />
                      结算周边
                    </button>
                  )}
                </div>
              )}

              {/* 游戏规则 */}
              {game.rules && (
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: 'oklch(0.155 0.025 270)',
                    border: '1px solid oklch(0.25 0.025 270)',
                  }}
                >
                  <div
                    className="flex items-center gap-2 mb-3"
                    style={{ color: 'oklch(0.78 0.16 52)' }}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center"
                      style={{ background: 'oklch(0.78 0.16 52 / 0.2)' }}
                    >
                      <LayoutList size={11} />
                    </div>
                    <span className="text-xs font-bold tracking-widest uppercase" style={{ letterSpacing: '0.12em' }}>游戏规则</span>
                  </div>
                  <p
                    className="text-base leading-relaxed whitespace-pre-wrap"
                    style={{ color: 'oklch(0.85 0.008 270)' }}
                  >
                    {game.rules}
                  </p>
                </div>
              )}

              {/* 结算区 */}
              {(game.winnerSettlement || game.loserSettlement) && (
                <div className="grid grid-cols-2 gap-4">
                  {game.winnerSettlement && (
                    <div
                      className="rounded-2xl p-5"
                      style={{
                        background: 'oklch(0.65 0.18 155 / 0.06)',
                        border: '1px solid oklch(0.65 0.18 155 / 0.22)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3" style={{ color: 'oklch(0.65 0.18 155)' }}>
                        <Trophy size={14} />
                        <span className="text-xs font-bold tracking-widest uppercase" style={{ letterSpacing: '0.1em' }}>胜者</span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'oklch(0.80 0.008 270)' }}>
                        {game.winnerSettlement}
                      </p>
                    </div>
                  )}
                  {game.loserSettlement && (
                    <div
                      className="rounded-2xl p-5"
                      style={{
                        background: 'oklch(0.62 0.22 10 / 0.06)',
                        border: '1px solid oklch(0.62 0.22 10 / 0.22)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3" style={{ color: 'oklch(0.68 0.20 10)' }}>
                        <XCircle size={14} />
                        <span className="text-xs font-bold tracking-widest uppercase" style={{ letterSpacing: '0.1em' }}>败者</span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'oklch(0.80 0.008 270)' }}>
                        {game.loserSettlement}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 结算图片 */}
              {game.settlementImages.length > 0 && (
                <div>
                  <div
                    className="text-xs font-bold tracking-widest uppercase mb-2.5"
                    style={{ color: 'oklch(0.45 0.015 270)', letterSpacing: '0.12em' }}
                  >
                    结算图片
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {game.settlementImages.map(img => (
                      <div
                        key={img.id}
                        className="w-24 h-24 rounded-xl overflow-hidden"
                        style={{ border: '1px solid oklch(0.28 0.022 270)' }}
                      >
                        <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 主持人备注 */}
              {game.notes && (
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: 'oklch(0.78 0.16 52 / 0.05)',
                    border: '1px solid oklch(0.78 0.16 52 / 0.15)',
                  }}
                >
                  <div
                    className="text-xs font-bold tracking-widest uppercase mb-1.5"
                    style={{ color: 'oklch(0.65 0.14 52)', letterSpacing: '0.12em' }}
                  >
                    主持人备注
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'oklch(0.72 0.015 270)' }}>{game.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'oklch(0.65 0.18 155 / 0.08)', border: '1px solid oklch(0.65 0.18 155 / 0.2)' }}
              >
                <Tv2 size={28} style={{ color: 'oklch(0.55 0.15 155)' }} />
              </div>
              <div className="text-sm font-semibold" style={{ color: 'oklch(0.55 0.02 270)' }}>
                点击左侧游戏开始展示
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 工具弹层 */}
      {activeTool && (
        <ToolOverlay tool={activeTool} onClose={() => setActiveTool(null)} />
      )}

      {/* 快捷选人弹层 */}
      <QuickPick
        open={quickPickOpen}
        title="请选择获奖身份号"
        confirmLabel="确认结算"
        multiSelect={true}
        onConfirm={nums => {
          setQuickPickOpen(false);
          if (quickPickCallback) quickPickCallback(nums);
          setQuickPickCallback(null);
        }}
        onCancel={() => {
          setQuickPickOpen(false);
          setQuickPickCallback(null);
        }}
      />
    </div>
  );
}
