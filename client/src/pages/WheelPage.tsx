// ============================================================
// 轮盘页面
// Design: 奇妙奇遇 v2 — 舞台感 · 微醺夜晚 · 轮盘仪式感
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Wheel, WheelOption } from '@/types';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import {
  Plus, Trash2, Edit3, X, Check, RotateCcw,
  Download, Upload, Layers, Info, History
} from 'lucide-react';

// ============================================================
// 颜色预设 — 偏向微醺夜晚调色板
// ============================================================
const OPTION_COLORS = [
  '#c084fc', '#f472b6', '#fb923c', '#facc15', '#4ade80',
  '#22d3ee', '#818cf8', '#f87171', '#a3e635', '#34d399',
  '#60a5fa', '#e879f9', '#fbbf24', '#2dd4bf', '#94a3b8'
];

// ============================================================
// 轮盘画布
// ============================================================
interface WheelCanvasProps {
  wheel: Wheel;
  rotation: number;
  spinning: boolean;
  size?: number;
}

function WheelCanvas({ wheel, rotation, spinning, size = 340 }: WheelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawWheel();
  }, [wheel, rotation]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cx = size / 2, cy = size / 2, r = size / 2 - 8;
    ctx.clearRect(0, 0, size, size);

    // 外圈发光
    ctx.save();
    ctx.shadowColor = 'rgba(192, 132, 252, 0.4)';
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    if (wheel.options.length === 0) {
      ctx.fillStyle = 'oklch(0.155 0.022 270)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = `14px 'Noto Sans SC', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('请添加选项', cx, cy);
      return;
    }

    const total = wheel.options.reduce((s, o) => s + (parseFloat(o.weight.toString()) || 1), 0);
    let startAngle = (rotation * Math.PI) / 180;

    wheel.options.forEach((opt) => {
      const sweep = ((parseFloat(opt.weight.toString()) || 1) / total) * 2 * Math.PI;

      // 扇形
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, startAngle + sweep);
      ctx.closePath();
      ctx.fillStyle = opt.color + 'dd';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 文字
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + sweep / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = `bold ${Math.min(13, Math.max(9, size / 28))}px 'Noto Sans SC', sans-serif`;
      const label = opt.label.length > 8 ? opt.label.slice(0, 8) + '…' : opt.label;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(label, r - 12, 4);
      ctx.restore();

      startAngle += sweep;
    });

    // 中心圆
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, 2 * Math.PI);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 24);
    grad.addColorStop(0, '#2a1f3d');
    grad.addColorStop(1, '#1a1525');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 中心点
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(192, 132, 252, 0.8)';
    ctx.fill();
  };

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-full"
      style={{
        filter: spinning
          ? 'drop-shadow(0 0 20px rgba(192,132,252,0.5)) drop-shadow(0 0 40px rgba(192,132,252,0.25))'
          : 'drop-shadow(0 0 10px rgba(192,132,252,0.2))',
        transition: 'filter 0.3s ease',
      }}
    />
  );
}

// ============================================================
// 选项编辑器行
// ============================================================
function OptionEditor({ option, onChange, onDelete }: { option: WheelOption; onChange: (o: WheelOption) => void; onDelete: () => void }) {
  return (
    <div
      className="flex items-center gap-2 group px-3 py-2 rounded-xl transition-all"
      style={{ background: 'oklch(0.155 0.022 270)', border: '1px solid oklch(0.22 0.022 270)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.30 0.025 270)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.22 0.022 270)'; }}
    >
      {/* 颜色 */}
      <input
        type="color"
        value={option.color}
        onChange={e => onChange({ ...option, color: e.target.value })}
        className="w-6 h-6 rounded-md cursor-pointer border-0 bg-transparent flex-shrink-0"
        style={{ backgroundColor: option.color }}
      />

      {/* 标签 */}
      <input
        value={option.label}
        onChange={e => onChange({ ...option, label: e.target.value })}
        placeholder="选项名称"
        className="flex-1 h-7 text-xs bg-transparent border-0 outline-none min-w-0"
        style={{ color: 'oklch(0.82 0.008 270)' }}
      />

      {/* 权重 */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-[10px]" style={{ color: 'oklch(0.45 0.015 270)' }}>×</span>
        <input
          type="number"
          value={option.weight}
          min={0.1}
          step={0.1}
          onChange={e => onChange({ ...option, weight: parseFloat(e.target.value) || 1 })}
          className="w-10 h-6 text-center text-xs rounded-lg border-0 outline-none"
          style={{
            background: 'oklch(0.19 0.022 270)',
            color: 'oklch(0.72 0.015 270)',
            border: '1px solid oklch(0.28 0.022 270)',
          }}
        />
      </div>

      {/* 周边标记 */}
      <button
        onClick={() => onChange({ ...option, isPeripheral: !option.isPeripheral })}
        className="text-xs px-1.5 py-0.5 rounded-lg transition-all flex-shrink-0"
        style={
          option.isPeripheral
            ? { background: 'oklch(0.78 0.16 52 / 0.2)', color: 'oklch(0.78 0.16 52)', border: '1px solid oklch(0.78 0.16 52 / 0.4)' }
            : { background: 'oklch(0.19 0.022 270)', color: 'oklch(0.40 0.015 270)', border: '1px solid oklch(0.26 0.022 270)' }
        }
        title="标记为周边奖励"
      >
        🎁
      </button>

      {/* 删除 */}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
        style={{ color: 'oklch(0.62 0.22 10)' }}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

// ============================================================
// 快速选人（内联）
// ============================================================
function QuickPickInline({ open, title, onConfirm, onCancel }: { open: boolean; title: string; onConfirm: (nums: number[]) => void; onCancel: () => void }) {
  const { state } = useApp();
  const [selected, setSelected] = useState<number[]>([]);

  if (!open) return null;

  const toggle = (n: number) => setSelected(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onCancel}>
      <div
        className="rounded-2xl p-5 max-w-sm w-full mx-4"
        style={{
          background: 'oklch(0.135 0.025 270)',
          border: '1px solid oklch(0.26 0.025 270)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-sm" style={{ color: 'oklch(0.88 0.008 270)' }}>{title}</span>
          <button onClick={onCancel} style={{ color: 'oklch(0.50 0.015 270)' }}><X size={16} /></button>
        </div>
        <div className="grid gap-1.5 mb-4" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
          {state.players.map(p => (
            <button
              key={p.number}
              onClick={() => toggle(p.number)}
              className="aspect-square rounded-xl flex items-center justify-center font-mono-display text-sm font-bold transition-all"
              style={
                selected.includes(p.number)
                  ? { background: 'oklch(0.60 0.20 285 / 0.25)', border: '1.5px solid oklch(0.60 0.20 285)', color: 'oklch(0.78 0.18 285)' }
                  : { background: 'oklch(0.19 0.022 270)', border: '1px solid oklch(0.26 0.022 270)', color: 'oklch(0.65 0.02 270)' }
              }
            >
              {p.number}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'oklch(0.19 0.022 270)', border: '1px solid oklch(0.28 0.022 270)', color: 'oklch(0.60 0.02 270)' }}
          >
            取消
          </button>
          <button
            onClick={() => { onConfirm(selected); setSelected([]); }}
            className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: selected.length > 0 ? 'oklch(0.60 0.20 285 / 0.2)' : 'oklch(0.19 0.022 270)',
              border: `1px solid ${selected.length > 0 ? 'oklch(0.60 0.20 285 / 0.5)' : 'oklch(0.28 0.022 270)'}`,
              color: selected.length > 0 ? 'oklch(0.78 0.18 285)' : 'oklch(0.45 0.015 270)',
            }}
          >
            {selected.length > 0 ? `开始旋转 (${selected.length}人)` : '跳过选人'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 主页面
// ============================================================
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleUpdateOption = (idx: number, opt: WheelOption) => {
    if (!selectedWheel) return;
    const newOptions = [...selectedWheel.options];
    newOptions[idx] = opt;
    dispatch({ type: 'UPDATE_WHEEL', payload: { ...selectedWheel, options: newOptions, updatedAt: Date.now() } });
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
    dispatch({ type: 'UPDATE_WHEEL', payload: { ...selectedWheel, options: [...selectedWheel.options, newOpt], updatedAt: Date.now() } });
  };

  const handleDeleteOption = (idx: number) => {
    if (!selectedWheel) return;
    dispatch({ type: 'UPDATE_WHEEL', payload: { ...selectedWheel, options: selectedWheel.options.filter((_, i) => i !== idx), updatedAt: Date.now() } });
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
        if (winDeg >= cur && winDeg < cur + sweep) { winner = opt; break; }
        cur += sweep;
      }
      if (!winner) winner = selectedWheel.options[0];
      setResult(winner);

      const historyEntry = {
        id: nanoid(),
        optionLabel: winner.label,
        optionColor: winner.color,
        playerNumbers: playerNums,
        timestamp: Date.now(),
        isPeripheral: winner.isPeripheral,
      };
      dispatch({ type: 'UPDATE_WHEEL', payload: { ...selectedWheel, history: [historyEntry, ...(selectedWheel.history || [])], updatedAt: Date.now() } });

      if (winner.isPeripheral) {
        playerNums.forEach((num, idx) => {
          const maxSerial = state.peripheralRecords.reduce((max, r) => Math.max(max, r.serialNumber), 0);
          dispatch({
            type: 'ADD_PERIPHERAL_RECORD',
            payload: {
              id: nanoid(),
              serialNumber: maxSerial + 1 + idx,
              playerNumber: num,
              peripheralCode: `P-${String(maxSerial + 1 + idx).padStart(4, '0')}`,
              notes: '',
              completed: false,
              source: 'wheel-result',
              sourceWheelName: selectedWheel.name,
              sourceWheelOption: winner!.label,
              createdAt: Date.now(),
            }
          });
        });
        toast.success(`🎁 已为 ${playerNums.length} 位玩家生成周边记录`);
      }
    }, 4200);
  };

  const handleRenameWheel = () => {
    if (!selectedWheel || !nameInput.trim()) return;
    dispatch({ type: 'UPDATE_WHEEL', payload: { ...selectedWheel, name: nameInput.trim(), updatedAt: Date.now() } });
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

  return (
    <div className="h-full flex overflow-hidden">

      {/* ============================================================
          左侧：轮盘列表
          ============================================================ */}
      <div
        className="w-44 flex-shrink-0 flex flex-col overflow-hidden"
        style={{
          background: 'oklch(0.115 0.022 270)',
          borderRight: '1px solid oklch(0.20 0.022 270)',
        }}
      >
        <div
          className="px-3 py-3 flex-shrink-0 flex items-center justify-between"
          style={{ borderBottom: '1px solid oklch(0.18 0.02 270)' }}
        >
          <div className="flex items-center gap-2">
            <RotateCcw size={13} style={{ color: 'oklch(0.60 0.20 285)' }} />
            <span className="text-sm font-semibold" style={{ color: 'oklch(0.82 0.008 270)' }}>轮盘</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleExport} className="p-1 rounded-lg transition-all" style={{ color: 'oklch(0.50 0.015 270)' }} title="导出">
              <Download size={12} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-1 rounded-lg transition-all" style={{ color: 'oklch(0.50 0.015 270)' }} title="导入">
              <Upload size={12} />
            </button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            <button
              onClick={handleCreateWheel}
              className="p-1 rounded-lg transition-all"
              style={{ color: 'oklch(0.60 0.20 285)' }}
              title="新建轮盘"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1">
          {state.wheels.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'oklch(0.40 0.015 270)' }}>
              <RotateCcw size={20} className="mx-auto mb-2 opacity-30" />
              <div className="text-xs">点击 + 创建轮盘</div>
            </div>
          ) : (
            state.wheels.map(wheel => {
              const isActive = selectedWheelId === wheel.id;
              return (
                <div
                  key={wheel.id}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all group"
                  style={
                    isActive
                      ? { background: 'oklch(0.60 0.20 285 / 0.12)', border: '1px solid oklch(0.60 0.20 285 / 0.3)' }
                      : { background: 'oklch(0.155 0.022 270)', border: '1px solid oklch(0.22 0.022 270)' }
                  }
                  onClick={() => setSelectedWheelId(wheel.id)}
                  onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'oklch(0.185 0.025 270)'; } }}
                  onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'oklch(0.155 0.022 270)'; } }}
                >
                  <span
                    className="flex-1 text-xs font-medium truncate"
                    style={{ color: isActive ? 'oklch(0.88 0.008 270)' : 'oklch(0.65 0.02 270)' }}
                  >
                    {wheel.name}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteWheel(wheel.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                    style={{ color: 'oklch(0.62 0.22 10)' }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ============================================================
          中间：轮盘展示区
          ============================================================ */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        {selectedWheel ? (
          <div className="flex flex-col items-center gap-5 w-full max-w-md">

            {/* 轮盘名称 */}
            <div className="flex items-center gap-2">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    className="h-8 px-3 rounded-xl text-sm bg-transparent border outline-none"
                    style={{ border: '1px solid oklch(0.60 0.20 285 / 0.5)', color: 'oklch(0.88 0.008 270)' }}
                    onKeyDown={e => e.key === 'Enter' && handleRenameWheel()}
                    autoFocus
                  />
                  <button onClick={handleRenameWheel} className="p-1.5 rounded-lg" style={{ background: 'oklch(0.60 0.20 285 / 0.2)', color: 'oklch(0.78 0.18 285)' }}>
                    <Check size={13} />
                  </button>
                  <button onClick={() => setEditingName(false)} className="p-1.5 rounded-lg" style={{ color: 'oklch(0.50 0.015 270)' }}>
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setNameInput(selectedWheel.name); setEditingName(true); }}
                  className="flex items-center gap-2 text-lg font-bold transition-all"
                  style={{ color: 'oklch(0.88 0.008 270)', fontFamily: "'Noto Serif SC', serif" }}
                >
                  {selectedWheel.name}
                  <Edit3 size={13} style={{ color: 'oklch(0.45 0.015 270)', opacity: 0.6 }} />
                </button>
              )}
            </div>

            {/* 轮盘 + 指针 */}
            <div className="relative">
              {/* 指针 */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-10">
                <div
                  className="w-0 h-0"
                  style={{
                    borderLeft: '10px solid transparent',
                    borderRight: '10px solid transparent',
                    borderTop: '28px solid oklch(0.62 0.22 10)',
                    filter: 'drop-shadow(0 2px 6px rgba(239,68,68,0.6))',
                  }}
                />
              </div>

              {/* 轮盘旋转容器 */}
              <div
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? 'transform 4.2s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                }}
              >
                <WheelCanvas wheel={selectedWheel} spinning={spinning} rotation={0} size={340} />
              </div>
            </div>

            {/* 结果展示 */}
            {result && (
              <div
                className="w-full text-center px-6 py-4 rounded-2xl"
                style={{
                  background: `${result.color}18`,
                  border: `2px solid ${result.color}50`,
                  boxShadow: `0 0 24px ${result.color}20`,
                }}
              >
                <div className="text-2xl font-bold" style={{ color: result.color, fontFamily: "'Noto Serif SC', serif" }}>
                  {result.label}
                </div>
                {result.isPeripheral && (
                  <div className="text-xs mt-1.5 font-semibold" style={{ color: 'oklch(0.78 0.16 52)' }}>
                    🎁 周边奖励已记录到清单
                  </div>
                )}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowPickPlayers(true)}
                disabled={spinning || selectedWheel.options.length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: spinning ? 'oklch(0.60 0.20 285 / 0.1)' : 'oklch(0.60 0.20 285 / 0.2)',
                  border: '1px solid oklch(0.60 0.20 285 / 0.5)',
                  color: 'oklch(0.78 0.18 285)',
                  boxShadow: spinning ? 'none' : '0 0 16px oklch(0.60 0.20 285 / 0.15)',
                }}
                onMouseEnter={e => {
                  if (!spinning) {
                    (e.currentTarget as HTMLElement).style.background = 'oklch(0.60 0.20 285 / 0.3)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 24px oklch(0.60 0.20 285 / 0.25)';
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'oklch(0.60 0.20 285 / 0.2)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 16px oklch(0.60 0.20 285 / 0.15)';
                }}
              >
                <RotateCcw size={16} className={spinning ? 'animate-spin' : ''} />
                {spinning ? '旋转中...' : '选人并开始'}
              </button>

              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all"
                style={
                  showHistory
                    ? { background: 'oklch(0.78 0.16 52 / 0.15)', border: '1px solid oklch(0.78 0.16 52 / 0.4)', color: 'oklch(0.78 0.16 52)' }
                    : { background: 'oklch(0.19 0.022 270)', border: '1px solid oklch(0.26 0.022 270)', color: 'oklch(0.55 0.02 270)' }
                }
              >
                <History size={14} />
                历史
              </button>
            </div>

            {/* 历史记录 */}
            {showHistory && selectedWheel.history && selectedWheel.history.length > 0 && (
              <div className="w-full space-y-1.5 max-h-48 overflow-y-auto">
                <div
                  className="text-xs font-bold tracking-widest uppercase mb-2"
                  style={{ color: 'oklch(0.45 0.015 270)', letterSpacing: '0.12em' }}
                >
                  历史记录
                </div>
                {selectedWheel.history.slice(0, 20).map(h => (
                  <div
                    key={h.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs"
                    style={{ background: 'oklch(0.155 0.022 270)', border: '1px solid oklch(0.22 0.022 270)' }}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: h.optionColor }} />
                    <span className="font-semibold" style={{ color: 'oklch(0.82 0.008 270)' }}>{h.optionLabel}</span>
                    {h.playerNumbers.length > 0 && (
                      <span style={{ color: 'oklch(0.50 0.015 270)' }}>→ #{h.playerNumbers.join(' #')}</span>
                    )}
                    {h.isPeripheral && <span>🎁</span>}
                    <span className="ml-auto" style={{ color: 'oklch(0.40 0.015 270)' }}>
                      {new Date(h.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center" style={{ color: 'oklch(0.40 0.015 270)' }}>
            <RotateCcw size={48} className="mx-auto mb-4 opacity-20" />
            <div className="text-base">请选择或创建轮盘</div>
          </div>
        )}
      </div>

      {/* ============================================================
          右侧：选项编辑
          ============================================================ */}
      {selectedWheel && (
        <div
          className="w-72 flex-shrink-0 flex flex-col overflow-hidden"
          style={{
            background: 'oklch(0.115 0.022 270)',
            borderLeft: '1px solid oklch(0.20 0.022 270)',
          }}
        >
          <div
            className="px-4 py-3 flex-shrink-0 flex items-center justify-between"
            style={{ borderBottom: '1px solid oklch(0.18 0.02 270)' }}
          >
            <div className="flex items-center gap-2">
              <Layers size={13} style={{ color: 'oklch(0.60 0.20 285)' }} />
              <span className="text-sm font-semibold" style={{ color: 'oklch(0.82 0.008 270)' }}>
                选项配置
                <span className="ml-1.5 text-xs font-normal" style={{ color: 'oklch(0.45 0.015 270)' }}>
                  ({selectedWheel.options.length})
                </span>
              </span>
            </div>
            <button
              onClick={handleAddOption}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: 'oklch(0.60 0.20 285)' }}
              title="添加选项"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
            {selectedWheel.options.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'oklch(0.40 0.015 270)' }}>
                <Layers size={20} className="mx-auto mb-2 opacity-30" />
                <div className="text-xs">点击 + 添加选项</div>
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

          <div
            className="px-4 py-2.5 flex-shrink-0"
            style={{ borderTop: '1px solid oklch(0.18 0.02 270)' }}
          >
            <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'oklch(0.40 0.015 270)' }}>
              <Info size={10} />
              🎁 标记的选项会自动记录到周边清单
            </div>
          </div>
        </div>
      )}

      {/* 快速选人弹层 */}
      <QuickPickInline
        open={showPickPlayers}
        title="请选择参与者"
        onConfirm={nums => { setShowPickPlayers(false); doSpin(nums); }}
        onCancel={() => setShowPickPlayers(false)}
      />
    </div>
  );
}
