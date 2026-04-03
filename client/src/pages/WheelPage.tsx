// ============================================================
// 轮盘页面 - 专业轮盘工具
// Design: Professional Dark Dashboard
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Wheel, WheelOption } from '@/types';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Plus, Trash2, Edit3, Save, RotateCcw, X, Check,
  ChevronRight, Package, Shuffle, Settings, Layers,
  RefreshCw, Copy, Download, Upload, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const OPTION_COLORS = [
  '#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4',
  '#8b5cf6', '#ec4899', '#64748b', '#ef4444', '#22c55e',
  '#3b82f6', '#f97316', '#a855f7', '#14b8a6', '#eab308'
];

// ---- 轮盘画布 ----
interface WheelCanvasProps {
  wheel: Wheel;
  spinning: boolean;
  rotation: number;
  size?: number;
}

function WheelCanvas({ wheel, spinning, rotation, size = 320 }: WheelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawWheel();
  }, [wheel, rotation]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cx = size / 2, cy = size / 2, r = size / 2 - 6;
    ctx.clearRect(0, 0, size, size);

    // 外圈阴影
    ctx.save();
    ctx.shadowColor = 'rgba(99, 102, 241, 0.3)';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    if (wheel.options.length === 0) {
      ctx.fillStyle = '#2a2d3e';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.font = '14px Sora, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('请添加选项', cx, cy);
      return;
    }

    const total = wheel.options.reduce((s, o) => s + (parseFloat(o.weight.toString()) || 1), 0);
    let startAngle = (rotation * Math.PI) / 180;

    wheel.options.forEach((opt, idx) => {
      const sweep = ((parseFloat(opt.weight.toString()) || 1) / total) * 2 * Math.PI;

      // 扇形
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, startAngle + sweep);
      ctx.closePath();
      ctx.fillStyle = opt.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 文字
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + sweep / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = `bold ${Math.min(13, Math.max(9, size / 28))}px Sora, sans-serif`;
      const label = opt.label.length > 8 ? opt.label.slice(0, 8) + '…' : opt.label;
      ctx.fillText(label, r - 10, 4);
      ctx.restore();

      startAngle += sweep;
    });

    // 中心圆
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
    grad.addColorStop(0, '#2a2d3e');
    grad.addColorStop(1, '#1a1d2e');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-full"
      style={{
        transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
        filter: spinning ? 'drop-shadow(0 0 12px rgba(99,102,241,0.5))' : 'none',
      }}
    />
  );
}

// ---- 轮盘选项编辑器 ----
interface OptionEditorProps {
  option: WheelOption;
  onChange: (opt: WheelOption) => void;
  onDelete: () => void;
}

function OptionEditor({ option, onChange, onDelete }: OptionEditorProps) {
  return (
    <div className="flex items-center gap-2 group">
      {/* 颜色选择 */}
      <div className="relative">
        <input
          type="color"
          value={option.color}
          onChange={e => onChange({ ...option, color: e.target.value })}
          className="w-7 h-7 rounded-md border border-border cursor-pointer bg-transparent"
          style={{ backgroundColor: option.color }}
        />
      </div>

      {/* 标签 */}
      <Input
        value={option.label}
        onChange={e => onChange({ ...option, label: e.target.value })}
        placeholder="选项名称"
        className="flex-1 h-7 text-xs bg-secondary/50 border-border"
      />

      {/* 权重 */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-muted-foreground">权重</span>
        <input
          type="number"
          value={option.weight}
          min={0.1}
          step={0.1}
          onChange={e => onChange({ ...option, weight: parseFloat(e.target.value) || 1 })}
          className="w-12 h-7 text-center text-xs bg-secondary/50 border border-border rounded-md text-foreground focus:outline-none focus:border-primary"
        />
      </div>

      {/* 周边标记 */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onChange({ ...option, isPeripheral: !option.isPeripheral })}
            className={cn('text-xs px-1.5 py-0.5 rounded border transition-all flex-shrink-0', option.isPeripheral ? 'border-amber-500/50 bg-amber-500/15 text-amber-400' : 'border-border text-muted-foreground/50 hover:text-amber-400')}
          >
            🎁
          </button>
        </TooltipTrigger>
        <TooltipContent>标记为周边奖励</TooltipContent>
      </Tooltip>

      {/* 删除 */}
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all flex-shrink-0">
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ---- 快速选人内联 ----
function QuickPickInline({ open, title, onConfirm, onCancel }: { open: boolean; title: string; onConfirm: (nums: number[]) => void; onCancel: () => void }) {
  const { state } = useApp();
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const PAGE_SIZE = 30;
  const totalPages = Math.ceil(state.players.length / PAGE_SIZE);
  const currentPlayers = state.players.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="bg-card border border-border rounded-xl p-5 max-w-sm w-full mx-4 animate-pop-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-sm">{title}</span>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <div className="grid gap-1.5 mb-4" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {currentPlayers.map(p => (
            <button key={p.number} onClick={() => setSelected(prev => prev.includes(p.number) ? prev.filter(n => n !== p.number) : [...prev, p.number])}
              className={cn('aspect-square rounded-lg border-2 flex items-center justify-center font-mono-display text-base font-bold transition-all', selected.includes(p.number) ? 'border-primary bg-primary/20 text-primary' : 'border-border bg-secondary/50 text-foreground hover:border-primary/50')}>
              {p.number}
            </button>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mb-3">
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="h-7 px-2">‹</Button>
            <span className="text-xs text-muted-foreground self-center">{page + 1}/{totalPages}</span>
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} className="h-7 px-2">›</Button>
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onCancel}>取消</Button>
          <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90" onClick={() => { onConfirm(selected); setSelected([]); }} disabled={selected.length === 0}>
            确认 {selected.length > 0 && `(${selected.length})`}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- 主轮盘页面 ----
export default function WheelPage() {
  const { state, dispatch } = useApp();
  const [selectedWheelId, setSelectedWheelId] = useState<string | null>(state.wheels[0]?.id ?? null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<WheelOption | null>(null);
  const [showPickPlayers, setShowPickPlayers] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const selectedWheel = state.wheels.find(w => w.id === selectedWheelId);

  const handleCreateWheel = () => {
    const wheel: Wheel = {
      id: nanoid(),
      name: `轮盘 ${state.wheels.length + 1}`,
      options: [
        { id: nanoid(), label: '选项 1', color: OPTION_COLORS[0], weight: 1, isPeripheral: false },
        { id: nanoid(), label: '选项 2', color: OPTION_COLORS[1], weight: 1, isPeripheral: false },
        { id: nanoid(), label: '选项 3', color: OPTION_COLORS[2], weight: 1, isPeripheral: false },
      ],
      history: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    dispatch({ type: 'ADD_WHEEL', payload: wheel });
    setSelectedWheelId(wheel.id);
    toast.success('已创建新轮盘');
  };

  const handleDeleteWheel = (wheelId: string) => {
    dispatch({ type: 'REMOVE_WHEEL', payload: wheelId });
    if (selectedWheelId === wheelId) {
      setSelectedWheelId(state.wheels.find(w => w.id !== wheelId)?.id ?? null);
    }
    toast.success('已删除轮盘');
  };

  const handleUpdateOption = (optIdx: number, opt: WheelOption) => {
    if (!selectedWheel) return;
    const newOptions = [...selectedWheel.options];
    newOptions[optIdx] = opt;
    dispatch({ type: 'UPDATE_WHEEL', payload: { ...selectedWheel, options: newOptions } });
  };

  const handleAddOption = () => {
    if (!selectedWheel) return;
    const newOpt: WheelOption = {
      id: nanoid(),
      label: `选项 ${selectedWheel.options.length + 1}`,
      color: OPTION_COLORS[selectedWheel.options.length % OPTION_COLORS.length],
      weight: 1,
      isPeripheral: false,
    };
    dispatch({ type: 'UPDATE_WHEEL', payload: { ...selectedWheel, options: [...selectedWheel.options, newOpt] } });
  };

  const handleDeleteOption = (optIdx: number) => {
    if (!selectedWheel) return;
    dispatch({ type: 'UPDATE_WHEEL', payload: { ...selectedWheel, options: selectedWheel.options.filter((_, i) => i !== optIdx) } });
  };

  const handleSpin = () => {
    if (!selectedWheel || selectedWheel.options.length === 0) {
      toast.error('请先添加轮盘选项');
      return;
    }
    setShowPickPlayers(true);
  };

  const doSpin = (playerNums: number[]) => {
    if (!selectedWheel) return;
    setSpinning(true);
    setResult(null);
    const rounds = 7 + Math.floor(Math.random() * 5);
    const extraDeg = Math.floor(Math.random() * 360);
    const newRotation = rotation + rounds * 360 + extraDeg;
    setRotation(newRotation);

    setTimeout(() => {
      setSpinning(false);
      const total = selectedWheel.options.reduce((s, o) => s + (parseFloat(o.weight.toString()) || 1), 0);
      const winDeg = (360 - (newRotation % 360)) % 360;
      let cur = 0;
      let winner: WheelOption | null = null;
      for (const opt of selectedWheel.options) {
        const sweep = ((parseFloat(opt.weight.toString()) || 1) / total) * 360;
        if (winDeg >= cur && winDeg < cur + sweep) {
          winner = opt;
          break;
        }
        cur += sweep;
      }
      if (!winner) winner = selectedWheel.options[0];
      setResult(winner);

      // 记录历史
      const historyEntry = {
        id: nanoid(),
        optionLabel: winner.label,
        optionColor: winner.color,
        playerNumbers: playerNums,
        timestamp: Date.now(),
        isPeripheral: winner.isPeripheral,
      };
      dispatch({ type: 'UPDATE_WHEEL', payload: { ...selectedWheel, history: [historyEntry, ...(selectedWheel.history || [])] } });

      // 如果是周边，写入周边清单
      if (winner.isPeripheral) {
        playerNums.forEach((num, idx) => {
          const maxSerial = state.peripheralRecords.reduce((max, r) => Math.max(max, r.serialNumber), 0);
          const record = {
            id: nanoid(),
            serialNumber: maxSerial + 1 + idx,
            playerNumber: num,
            peripheralCode: `P-${String(maxSerial + 1 + idx).padStart(4, '0')}`,
            notes: '',
            completed: false,
            source: 'wheel-result' as const,
            sourceWheelName: selectedWheel.name,
            sourceWheelOption: winner.label,
            createdAt: Date.now(),
          };
          dispatch({ type: 'ADD_PERIPHERAL_RECORD', payload: record });
        });
        toast.success(`🎁 已为 ${playerNums.length} 位玩家生成周边记录`);
      }
    }, 4200);
  };

  const handleRenameWheel = () => {
    if (!selectedWheel || !nameInput.trim()) return;
    dispatch({ type: 'UPDATE_WHEEL', payload: { ...selectedWheel, name: nameInput.trim() } });
    setEditingName(false);
    toast.success('已重命名');
  };

  const handleExport = () => {
    const json = JSON.stringify({ wheels: state.wheels }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `wheels-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success('轮盘配置已导出');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.wheels && Array.isArray(data.wheels)) {
          data.wheels.forEach((w: Wheel) => dispatch({ type: 'ADD_WHEEL', payload: w }));
          toast.success(`已导入 ${data.wheels.length} 个轮盘`);
        }
      } catch { toast.error('导入失败'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="h-full flex overflow-hidden">
      {/* ---- 左侧轮盘列表 ---- */}
      <div className="w-44 flex-shrink-0 border-r border-border flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border flex-shrink-0">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">轮盘</span>
          <div className="flex gap-1">
            <button onClick={handleExport} className="text-muted-foreground hover:text-foreground transition-colors"><Download size={13} /></button>
            <button onClick={() => fileInputRef.current?.click()} className="text-muted-foreground hover:text-foreground transition-colors"><Upload size={13} /></button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            <button onClick={handleCreateWheel} className="text-muted-foreground hover:text-primary transition-colors"><Plus size={14} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {state.wheels.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-xs">
              <RotateCcw size={20} className="mx-auto mb-2 opacity-30" />
              点击 + 创建轮盘
            </div>
          ) : (
            state.wheels.map(wheel => (
              <div key={wheel.id} className={cn('flex items-center gap-1 px-2 py-2 rounded-lg border cursor-pointer transition-all group', selectedWheelId === wheel.id ? 'border-primary/50 bg-primary/10 text-foreground' : 'border-border bg-secondary/20 hover:bg-secondary/50 text-muted-foreground hover:text-foreground')}
                onClick={() => setSelectedWheelId(wheel.id)}>
                <span className="flex-1 text-xs font-medium truncate">{wheel.name}</span>
                <button onClick={e => { e.stopPropagation(); handleDeleteWheel(wheel.id); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all flex-shrink-0">
                  <Trash2 size={11} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ---- 中间：轮盘展示 ---- */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        {selectedWheel ? (
          <div className="flex flex-col items-center gap-6 w-full max-w-sm">
            {/* 轮盘名称 */}
            <div className="flex items-center gap-2">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input value={nameInput} onChange={e => setNameInput(e.target.value)} className="h-8 text-sm bg-secondary/50" onKeyDown={e => e.key === 'Enter' && handleRenameWheel()} autoFocus />
                  <Button size="sm" onClick={handleRenameWheel} className="h-8 px-2"><Check size={13} /></Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingName(false)} className="h-8 px-2"><X size={13} /></Button>
                </div>
              ) : (
                <button onClick={() => { setNameInput(selectedWheel.name); setEditingName(true); }} className="flex items-center gap-1.5 text-lg font-bold text-foreground hover:text-primary transition-colors">
                  {selectedWheel.name}
                  <Edit3 size={14} className="opacity-40" />
                </button>
              )}
            </div>

            {/* 轮盘 + 指针 */}
            <div className="relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
                <div className="w-0 h-0" style={{ borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '24px solid #f43f5e', filter: 'drop-shadow(0 2px 4px rgba(244,63,94,0.5))' }} />
              </div>
              <div
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? 'transform 4.2s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                }}
              >
                <WheelCanvas wheel={selectedWheel} spinning={spinning} rotation={0} size={320} />
              </div>
            </div>

            {/* 结果 */}
            {result && (
              <div className="w-full text-center p-4 rounded-xl border-2 animate-pop-in" style={{ borderColor: result.color, backgroundColor: result.color + '20' }}>
                <div className="text-xl font-bold" style={{ color: result.color }}>{result.label}</div>
                {result.isPeripheral && <div className="text-xs text-amber-400 mt-1">🎁 周边奖励已记录</div>}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3 w-full">
              <Button
                onClick={handleSpin}
                disabled={spinning || selectedWheel.options.length === 0}
                className="flex-1 bg-primary hover:bg-primary/90 gap-2 h-11 text-base font-semibold"
                size="lg"
              >
                <RotateCcw size={16} className={spinning ? 'animate-spin' : ''} />
                {spinning ? '转动中...' : '选人并开始'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowHistory(!showHistory)}
                className={cn('h-11 px-4', showHistory && 'border-primary/50 bg-primary/10 text-primary')}
              >
                历史
              </Button>
            </div>

            {/* 历史记录 */}
            {showHistory && selectedWheel.history && selectedWheel.history.length > 0 && (
              <div className="w-full space-y-1.5 max-h-48 overflow-y-auto">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">历史记录</div>
                {selectedWheel.history.slice(0, 20).map(h => (
                  <div key={h.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 border border-border text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: h.optionColor }} />
                    <span className="font-medium text-foreground">{h.optionLabel}</span>
                    {h.playerNumbers.length > 0 && (
                      <span className="text-muted-foreground">→ #{h.playerNumbers.join(' #')}</span>
                    )}
                    {h.isPeripheral && <span className="text-amber-400">🎁</span>}
                    <span className="ml-auto text-muted-foreground/60">{new Date(h.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <RotateCcw size={48} className="mx-auto mb-4 opacity-20" />
            <div className="text-base">请选择或创建轮盘</div>
          </div>
        )}
      </div>

      {/* ---- 右侧：选项编辑 ---- */}
      {selectedWheel && (
        <div className="w-72 flex-shrink-0 border-l border-border flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border flex-shrink-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              选项配置 ({selectedWheel.options.length})
            </span>
            <button onClick={handleAddOption} className="text-muted-foreground hover:text-primary transition-colors">
              <Plus size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {selectedWheel.options.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-xs">
                <Layers size={20} className="mx-auto mb-2 opacity-30" />
                点击 + 添加选项
              </div>
            ) : (
              selectedWheel.options.map((opt, idx) => (
                <OptionEditor
                  key={opt.id}
                  option={opt}
                  onChange={newOpt => handleUpdateOption(idx, newOpt)}
                  onDelete={() => handleDeleteOption(idx)}
                />
              ))
            )}
          </div>

          {/* 底部统计 */}
          <div className="px-3 py-2 border-t border-border flex-shrink-0">
            <div className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
              <Info size={10} />
              🎁 标记的选项会自动记录到周边清单
            </div>
          </div>
        </div>
      )}

      {/* 快速选人 */}
      <QuickPickInline
        open={showPickPlayers}
        title="请选择参与者"
        onConfirm={nums => { setShowPickPlayers(false); doSpin(nums); }}
        onCancel={() => setShowPickPlayers(false)}
      />
    </div>
  );
}
