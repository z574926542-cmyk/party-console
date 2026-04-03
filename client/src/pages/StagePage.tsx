// ============================================================
// 展台页面 - 现场主持展示界面
// Design: Professional Dark Dashboard, player-facing display
// ============================================================

import React, { useState, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Game, BoundTool, PeripheralRecord } from '@/types';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Eye, EyeOff, Package, Wrench, RotateCcw, X, Check,
  ChevronRight, Trophy, AlertCircle, Play, Users,
  Hash, Timer, Shuffle, Layers, Dices, Palette, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import QuickPick from '@/components/shared/QuickPick';
import ToolOverlay from '@/components/shared/ToolOverlay';

// ---- 工具图标映射 ----
const TOOL_ICONS: Record<string, React.ReactNode> = {
  'random-number': <Hash size={12} />,
  'random-pick': <Users size={12} />,
  'random-group': <Layers size={12} />,
  'countdown': <Timer size={12} />,
  'dice': <Dices size={12} />,
  'color': <Palette size={12} />,
};

// ---- 工具浮层 ----
interface ActiveTool {
  tool: BoundTool;
  position?: { x: number; y: number };
}

export default function StagePage() {
  const { state, dispatch, getTagById, getWheelById, isPeripheralGame } = useApp();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    state.stageCurrentGameId || (state.currentGameList[0]?.id ?? null)
  );
  const [showNames, setShowNames] = useState(state.stageShowGameNames);
  const [quickPickOpen, setQuickPickOpen] = useState(false);
  const [quickPickTitle, setQuickPickTitle] = useState('请选择身份号');
  const [quickPickCallback, setQuickPickCallback] = useState<((nums: number[]) => void) | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveTool | null>(null);
  const [settlementDone, setSettlementDone] = useState<Set<string>>(new Set());

  const selectedItem = state.currentGameList.find(i => i.id === selectedItemId);
  const game = selectedItem?.gameData;

  const handleSelectGame = (itemId: string) => {
    setSelectedItemId(itemId);
    dispatch({ type: 'SET_STAGE_CURRENT_GAME', payload: itemId });
  };

  const handleToggleNames = () => {
    setShowNames(!showNames);
    dispatch({ type: 'TOGGLE_STAGE_SHOW_NAMES' });
  };

  // 结算流程
  const handleSettle = () => {
    if (!game) return;
    setQuickPickTitle('请选择获奖身份号');
    setQuickPickOpen(true);
    setQuickPickCallback(() => (playerNumbers: number[]) => {
      // 为每个获奖者生成周边记录
      playerNumbers.forEach(num => {
        const maxSerial = state.peripheralRecords.reduce((max, r) => Math.max(max, r.serialNumber), 0);
        const record: PeripheralRecord = {
          id: nanoid(),
          serialNumber: maxSerial + 1 + playerNumbers.indexOf(num),
          playerNumber: num,
          peripheralCode: `P-${String(maxSerial + 1 + playerNumbers.indexOf(num)).padStart(4, '0')}`,
          notes: '',
          completed: false,
          source: 'game-settlement',
          sourceGameName: game.name,
          createdAt: Date.now(),
        };
        dispatch({ type: 'ADD_PERIPHERAL_RECORD', payload: record });
      });
      setSettlementDone(prev => { const next = new Set(Array.from(prev)); next.add(selectedItemId!); return next; });
      toast.success(`已为 ${playerNumbers.length} 位玩家生成周边记录`, {
        description: `身份号：${playerNumbers.join('、')}`,
      });
    });
  };

  const handleToolClick = (tool: BoundTool, e: React.MouseEvent) => {
    setActiveTool({ tool });
  };

  if (state.currentGameList.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <AlertCircle size={40} className="mx-auto mb-4 opacity-20" />
          <div className="text-base font-medium">展台暂无内容</div>
          <div className="text-sm mt-1 opacity-60">请在控制台编排游戏后点击"载入展台"</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* ---- 左侧游戏列表 ---- */}
      <div className="w-52 flex-shrink-0 border-r border-border flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border flex-shrink-0">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            本场游戏
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">显示名称</span>
            <Switch checked={showNames} onCheckedChange={handleToggleNames} className="scale-75" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {state.currentGameList.map(item => {
            const isSelected = item.id === selectedItemId;
            const isPeripheral = item.gameData.tags.includes('tag-peripheral');
            const isDone = settlementDone.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => handleSelectGame(item.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all duration-150',
                  isSelected
                    ? 'border-primary/50 bg-primary/10 text-foreground'
                    : 'border-border bg-secondary/20 hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
                )}
              >
                <span className={cn('text-xs font-mono-display font-bold w-5 flex-shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground/60')}>
                  {item.order}
                </span>
                <div className="flex-1 min-w-0">
                  {showNames && (
                    <div className="text-sm font-medium truncate">{item.gameData.name}</div>
                  )}
                  <div className="flex gap-1 mt-0.5 flex-wrap">
                    {item.gameData.tags.slice(0, 2).map(tagId => {
                      const tag = getTagById(tagId);
                      if (!tag) return null;
                      return (
                        <span key={tagId} className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: tag.color + '30', color: tag.color }}>
                          {tag.name}
                        </span>
                      );
                    })}
                    {isDone && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-400">✓已结算</span>}
                  </div>
                </div>
                {isSelected && <ChevronRight size={12} className="text-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---- 右侧游戏展示区 ---- */}
      <div className="flex-1 overflow-y-auto">
        {game ? (
          <div className="p-6 max-w-3xl mx-auto space-y-6 animate-pop-in">
            {/* 游戏标题区 */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono-display font-bold text-primary/60">
                      #{selectedItem?.order}
                    </span>
                    {game.tags.map(tagId => {
                      const tag = getTagById(tagId);
                      if (!tag) return null;
                      return (
                        <span key={tagId} className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: tag.color + '25', color: tag.color, border: `1px solid ${tag.color}40` }}>
                          {tag.name}
                        </span>
                      );
                    })}
                  </div>
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">{game.name}</h1>
                </div>

                {/* 结算按钮 */}
                {isPeripheralGame(game) && (
                  <Button
                    onClick={handleSettle}
                    className="flex-shrink-0 bg-amber-600 hover:bg-amber-500 text-white gap-2 shadow-lg shadow-amber-900/30"
                    size="lg"
                  >
                    <Trophy size={16} />
                    结算
                  </Button>
                )}
              </div>

              {/* 工具标签 */}
              {game.tools.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {game.tools.map(tool => {
                    const wheel = tool.type === 'wheel' && tool.wheelId ? getWheelById(tool.wheelId) : null;
                    return (
                      <button
                        key={tool.id}
                        onClick={e => handleToolClick(tool, e)}
                        className="tool-tag"
                      >
                        {tool.type === 'wheel' ? <RotateCcw size={12} /> : TOOL_ICONS[tool.toolType || ''] || <Wrench size={12} />}
                        {tool.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 规则区 */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 rounded-full bg-primary" />
                <span className="text-sm font-bold text-foreground uppercase tracking-wide">游戏规则</span>
              </div>
              <p className="text-base text-foreground/90 leading-relaxed whitespace-pre-wrap">{game.rules}</p>
            </div>

            {/* 结算区 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-5 rounded-full bg-emerald-500" />
                  <span className="text-sm font-bold text-emerald-400 uppercase tracking-wide">胜者</span>
                </div>
                <p className="text-base text-foreground/90 leading-relaxed whitespace-pre-wrap">{game.winnerSettlement}</p>
              </div>
              <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-5 rounded-full bg-rose-500" />
                  <span className="text-sm font-bold text-rose-400 uppercase tracking-wide">败者</span>
                </div>
                <p className="text-base text-foreground/90 leading-relaxed whitespace-pre-wrap">{game.loserSettlement}</p>
              </div>
            </div>

            {/* 奖励图片 */}
            {game.settlementImages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-amber-500" />
                  <span className="text-sm font-bold text-amber-400 uppercase tracking-wide">奖励展示</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {game.settlementImages.map(img => (
                    <div key={img.id} className="text-center">
                      <img src={img.dataUrl} alt={img.name} className="w-32 h-32 object-cover rounded-xl border border-border shadow-lg" />
                      <div className="text-xs text-muted-foreground mt-1.5 font-medium">{img.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Play size={32} className="mx-auto mb-3 opacity-20" />
              <div className="text-sm">点击左侧选择游戏</div>
            </div>
          </div>
        )}
      </div>

      {/* 快捷选人弹层 */}
      <QuickPick
        open={quickPickOpen}
        title={quickPickTitle}
        confirmLabel="确认执行"
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

      {/* 工具浮层 */}
      {activeTool && (
        <ToolOverlay
          tool={activeTool.tool}
          onClose={() => setActiveTool(null)}
        />
      )}
    </div>
  );
}
