// 奇妙奇遇控制台 - 轮盘页面（亮色渐变风）
// 固定三个默认轮盘：抽奖 / 惩罚 / 挑战
// 可折叠配置面板，选人并开始，周边/惩罚属性自动同步结算清单

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { exportSingleWheel, parseSingleWheelJSON } from '@/store';
import type { Wheel, WheelOption, WheelHistoryEntry, PlayerIdentity } from '@/types';

// 三个默认轮盘 ID（与 store/index.ts 保持一致）
const DEFAULT_IDS = ['wheel-default-lottery', 'wheel-default-punishment', 'wheel-default-challenge'];

function WheelCanvas({ options, rotation }: { options: WheelOption[]; rotation: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = 380;
    const cx = size / 2, cy = size / 2, r = size / 2 - 8;
    ctx.clearRect(0, 0, size, size);
    if (options.length === 0) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(200,180,240,0.15)'; ctx.fill();
      return;
    }
    const totalWeight = options.reduce((s, o) => s + o.weight, 0);
    let startAngle = rotation;
    options.forEach(opt => {
      const slice = (opt.weight / totalWeight) * 2 * Math.PI;
      const endAngle = startAngle + slice;
      const midAngle = startAngle + slice / 2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, startAngle, endAngle); ctx.closePath();
      ctx.fillStyle = opt.color; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.stroke();
      // 周边奖励标记（★）
      if (opt.isPeripheral) {
        const bx = cx + Math.cos(midAngle) * r * 0.82;
        const by = cy + Math.sin(midAngle) * r * 0.82;
        ctx.beginPath(); ctx.arc(bx, by, 7, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
        ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', bx, by);
      }
      // 惩罚标记（⚡）
      if (opt.isPenalty) {
        const px = cx + Math.cos(midAngle) * r * 0.68;
        const py = cy + Math.sin(midAngle) * r * 0.68;
        ctx.beginPath(); ctx.arc(px, py, 7, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
        ctx.fillStyle = '#ef4444'; ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', px, py);
      }
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(midAngle);
      ctx.translate(r * 0.58, 0);
      ctx.fillStyle = 'white';
      ctx.font = `bold ${Math.max(10, Math.min(14, 200 / options.length))}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 3;
      const lbl = opt.label.length > 6 ? opt.label.slice(0, 6) + '…' : opt.label;
      ctx.fillText(lbl, 0, 0); ctx.restore();
      startAngle = endAngle;
    });
    ctx.beginPath(); ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
    ctx.fillStyle = 'white'; ctx.fill();
    ctx.strokeStyle = 'rgba(200,180,240,0.5)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
    g.addColorStop(0, '#ec407a'); g.addColorStop(1, '#7c4dff');
    ctx.fillStyle = g; ctx.fill();
  }, [options, rotation]);

  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
        <div style={{ width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '22px solid #ec407a', filter: 'drop-shadow(0 2px 4px rgba(236,64,122,0.5))' }} />
      </div>
      <canvas ref={canvasRef} width={380} height={380} className="rounded-full"
        style={{ boxShadow: '0 8px 32px rgba(100,80,180,0.18), 0 2px 8px rgba(0,0,0,0.08)' }} />
    </div>
  );
}

function PickPlayerModal({ players, onConfirm, onClose }: { players: PlayerIdentity[]; onConfirm: (nums: number[]) => void; onClose: () => void }) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const toggle = (n: number) => setSelected(prev => {
    const next = new Set(Array.from(prev));
    if (next.has(n)) next.delete(n); else next.add(n);
    return next;
  });
  return (
    <div className="tool-modal-backdrop" onClick={onClose}>
      <div className="tool-modal w-[520px] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black" style={{ color: 'oklch(0.22 0.02 280)' }}>选人并开始</h3>
            <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.04 280)' }}>选择参与本次抽奖的玩家（已选 {selected.size} 人）</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg"
            style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>×</button>
        </div>
        <div className="grid gap-2 mb-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))' }}>
          {players.map(p => {
            const isSel = selected.has(p.number);
            return (
              <button key={p.id} onClick={() => toggle(p.number)}
                className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all font-bold text-sm"
                style={isSel
                  ? { background: 'linear-gradient(135deg,#ec407a,#7c4dff)', color: 'white', boxShadow: '0 2px 8px rgba(124,77,255,0.35)' }
                  : { background: 'rgba(255,255,255,0.7)', color: 'oklch(0.30 0.04 280)', border: '1.5px solid rgba(200,180,240,0.3)' }}>
                {p.number}
              </button>
            );
          })}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setSelected(new Set(players.map(p => p.number)))}
            className="px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>全选</button>
          <button onClick={() => setSelected(new Set())}
            className="px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>清空</button>
          <button onClick={() => {
            if (selected.size === 0) { toast.error('请至少选择一位玩家'); return; }
            onConfirm(Array.from(selected).sort((a, b) => a - b)); onClose();
          }} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)', boxShadow: '0 4px 14px rgba(124,77,255,0.3)' }}>
            确认并开始（{selected.size}人）
          </button>
        </div>
      </div>
    </div>
  );
}

function OptionRow({ opt, onChange, onRemove, canRemove }: { opt: WheelOption; onChange: (u: WheelOption) => void; onRemove: () => void; canRemove: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error('图片不能超过 3MB'); return; }
    // 自动用图片文件名（去掉扩展名）替换选项标签
    const nameWithoutExt = file.name.replace(/\.[^.]+$/, '');
    const reader = new FileReader();
    // 存入 imageDataUrl（运行时缓存），不持久化到 localStorage
    reader.onload = ev => onChange({ ...opt, imageDataUrl: ev.target?.result as string, label: nameWithoutExt });
    reader.readAsDataURL(file);
  };
  return (
    <div className="flex flex-col gap-1.5 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(200,180,240,0.2)' }}>
      {/* 第一行：颜色 + 名称 + 权重 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-shrink-0 w-7 h-7 rounded-lg" style={{ background: opt.color }}>
          <input type="color" value={opt.color} onChange={e => onChange({ ...opt, color: e.target.value })}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
        </div>
        <input type="text" value={opt.label} onChange={e => onChange({ ...opt, label: e.target.value })}
          className="flex-1 min-w-0 px-2 py-1 rounded-lg text-sm font-medium bg-transparent border-none outline-none"
          style={{ color: 'oklch(0.22 0.02 280)' }} placeholder="选项名称" />
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onChange({ ...opt, weight: Math.max(1, opt.weight - 1) })}
            className="w-5 h-5 rounded-md text-xs font-bold flex items-center justify-center"
            style={{ background: 'rgba(200,180,240,0.3)', color: 'oklch(0.45 0.06 280)' }}>-</button>
          <span className="w-5 text-center text-xs font-bold" style={{ color: 'oklch(0.35 0.04 280)' }}>{opt.weight}</span>
          <button onClick={() => onChange({ ...opt, weight: opt.weight + 1 })}
            className="w-5 h-5 rounded-md text-xs font-bold flex items-center justify-center"
            style={{ background: 'rgba(200,180,240,0.3)', color: 'oklch(0.45 0.06 280)' }}>+</button>
        </div>
      </div>
      {/* 第二行：周边/惩罚标签 + 删除 */}
      <div className="flex items-center gap-2 pl-9">
        {/* 周边奖励标签 */}
        <button onClick={() => onChange({ ...opt, isPeripheral: !opt.isPeripheral, isPenalty: opt.isPeripheral ? opt.isPenalty : false })}
          className="px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0 transition-all"
          style={opt.isPeripheral
            ? { background: 'linear-gradient(135deg,#f59e0b,#f97316)', color: 'white', boxShadow: '0 2px 6px rgba(245,158,11,0.35)' }
            : { background: 'rgba(200,180,240,0.15)', color: 'oklch(0.55 0.04 280)', border: '1px solid rgba(200,180,240,0.3)' }}>
          ★ 周边
        </button>
        {/* 惩罚标签 */}
        <button onClick={() => onChange({ ...opt, isPenalty: !opt.isPenalty, isPeripheral: opt.isPenalty ? opt.isPeripheral : false })}
          className="px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0 transition-all"
          style={opt.isPenalty
            ? { background: 'linear-gradient(135deg,#ef4444,#f97316)', color: 'white', boxShadow: '0 2px 6px rgba(239,68,68,0.35)' }
            : { background: 'rgba(200,180,240,0.15)', color: 'oklch(0.55 0.04 280)', border: '1px solid rgba(200,180,240,0.3)' }}>
          ⚡ 惩罚
        </button>
        <div className="flex-1" />
        {canRemove && (
          <button onClick={onRemove} className="w-6 h-6 rounded-md flex items-center justify-center text-sm flex-shrink-0"
            style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>×</button>
        )}
      </div>
      {/* 图片上传（运行时预览，不持久化） */}
      <div className="flex items-center gap-2 pl-9">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        {opt.imageDataUrl ? (
          <div className="flex items-center gap-2">
            <img
              src={opt.imageDataUrl} alt="选项图片"
              className="w-8 h-8 rounded-lg object-cover cursor-pointer transition-transform hover:scale-110"
              style={{ border: '1px solid rgba(200,180,240,0.3)' }}
              onClick={() => setPreviewOpen(true)}
              title="点击放大预览" />
            <button onClick={() => onChange({ ...opt, imageDataUrl: undefined })}
              className="text-xs px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>移除图片</button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all"
            style={{ background: 'rgba(200,180,240,0.15)', color: 'oklch(0.55 0.04 280)', border: '1px dashed rgba(200,180,240,0.4)' }}>
            📷 添加图片（抽中时展示，仅本次有效）
          </button>
        )}
      </div>
      {/* 图片灯箱预览 */}
      {previewOpen && opt.imageDataUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setPreviewOpen(false)}>
          <div className="relative max-w-[80vw] max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <img
              src={opt.imageDataUrl}
              alt={opt.label}
              className="max-w-full max-h-[80vh] rounded-2xl object-contain"
              style={{ boxShadow: `0 16px 48px ${opt.color}66` }} />
            <div className="absolute bottom-0 left-0 right-0 text-center py-3 text-white font-bold text-lg"
              style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', borderRadius: '0 0 1rem 1rem' }}>
              {opt.label}
            </div>
            <button
              onClick={() => setPreviewOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg"
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(4px)' }}>×</button>
          </div>
        </div>
      )}
    </div>
  );
}


export default function WheelPage() {
  const { state, dispatch } = useApp();

  const defaultWheels = DEFAULT_IDS.map(id => state.wheels.find(w => w.id === id)).filter(Boolean) as Wheel[];
  const customWheels = state.wheels.filter(w => !DEFAULT_IDS.includes(w.id));
  const allWheels = [...defaultWheels, ...customWheels];

  const [activeWheelId, setActiveWheelId] = useState<string>(DEFAULT_IDS[0]);
  const [showWheelList, setShowWheelList] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [resultOption, setResultOption] = useState<WheelOption | null>(null);
  const [resultPlayers, setResultPlayers] = useState<number[]>([]);
  const [showPickModal, setShowPickModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const animRef = useRef<number | null>(null);
  const rotRef = useRef(0);

  const activeWheel = allWheels.find(w => w.id === activeWheelId) || allWheels[0];
  const isDefaultWheel = activeWheel ? DEFAULT_IDS.includes(activeWheel.id) : false;

  const pickWinner = useCallback((opts: WheelOption[]): WheelOption => {
    const total = opts.reduce((s, o) => s + o.weight, 0);
    let rand = Math.random() * total;
    for (const opt of opts) { rand -= opt.weight; if (rand <= 0) return opt; }
    return opts[opts.length - 1];
  }, []);

  const doSpin = useCallback((playerNums: number[]) => {
    if (!activeWheel || spinning || activeWheel.options.length === 0) return;
    setSpinning(true);
    setResultOption(null);
    const winner = pickWinner(activeWheel.options);
    const totalWeight = activeWheel.options.reduce((s, o) => s + o.weight, 0);
    let winnerStartAngle = 0;
    for (const opt of activeWheel.options) {
      if (opt.id === winner.id) break;
      winnerStartAngle += (opt.weight / totalWeight) * 2 * Math.PI;
    }
    const winnerMidAngle = winnerStartAngle + (winner.weight / totalWeight) * Math.PI;
    const spins = 5 + Math.floor(Math.random() * 3);
    const targetRotation = -Math.PI / 2 - winnerMidAngle + 2 * Math.PI * spins;
    const startRot = rotRef.current;
    const totalDelta = targetRotation - (startRot % (2 * Math.PI)) + 2 * Math.PI * spins;
    const duration = 2000 + Math.random() * 400;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      rotRef.current = startRot + totalDelta * eased;
      setRotation(rotRef.current);
      if (progress < 1) { animRef.current = requestAnimationFrame(animate); }
      else {
        setSpinning(false);
        setResultOption(winner);
        setResultPlayers(playerNums);
        // 更新历史记录
        const entry: WheelHistoryEntry = {
          id: nanoid(), optionLabel: winner.label, optionColor: winner.color,
          playerNumbers: playerNums, timestamp: Date.now(),
          isPeripheral: winner.isPeripheral,
          isPenalty: winner.isPenalty,
        };
        dispatch({ type: 'UPDATE_WHEEL', payload: { ...activeWheel, history: [entry, ...activeWheel.history].slice(0, 50), updatedAt: Date.now() } });
        // 周边奖励 → 同步到结算清单（reward 分类）
        if (winner.isPeripheral) {
          const targets = playerNums.length > 0 ? playerNums : [0];
          const maxSerial = state.peripheralRecords.reduce((max, r) => Math.max(max, r.serialNumber), 0);
          targets.forEach((num, i) => {
            dispatch({
              type: 'ADD_PERIPHERAL_RECORD',
              payload: {
                id: nanoid(), serialNumber: maxSerial + i + 1, playerNumber: num,
                category: 'reward' as const,
                title: winner.label,
                previewImage: winner.imageDataUrl,
                notes: `${activeWheel.name} · ${winner.label}`,
                completed: false, source: 'wheel-result' as const,
                sourceWheelName: activeWheel.name, sourceWheelOption: winner.label, createdAt: Date.now(),
              },
            });
          });
          toast.success(`"${winner.label}" 已同步至结算清单（周边奖励）`);
        }
        // 惩罚 → 同步到结算清单（penalty 分类）
        if (winner.isPenalty) {
          const targets = playerNums.length > 0 ? playerNums : [0];
          const maxSerial = state.peripheralRecords.reduce((max, r) => Math.max(max, r.serialNumber), 0);
          targets.forEach((num, i) => {
            dispatch({
              type: 'ADD_PERIPHERAL_RECORD',
              payload: {
                id: nanoid(), serialNumber: maxSerial + i + 1, playerNumber: num,
                category: 'penalty' as const,
                title: winner.label,
                previewImage: winner.imageDataUrl,
                notes: `${activeWheel.name} · ${winner.label}`,
                completed: false, source: 'wheel-result' as const,
                sourceWheelName: activeWheel.name, sourceWheelOption: winner.label, createdAt: Date.now(),
              },
            });
          });
          toast.success(`"${winner.label}" 已同步至结算清单（惩罚）`);
        }
      }
    };
    animRef.current = requestAnimationFrame(animate);
  }, [activeWheel, spinning, pickWinner, dispatch, state.peripheralRecords]);

  const handleUpdateOption = (optId: string, updated: WheelOption) => {
    if (!activeWheel) return;
    dispatch({ type: 'UPDATE_WHEEL', payload: { ...activeWheel, options: activeWheel.options.map(o => o.id === optId ? updated : o), updatedAt: Date.now() } });
  };
  const handleAddOption = () => {
    if (!activeWheel) return;
    const colors = ['#f59e0b', '#6366f1', '#10b981', '#ef4444', '#06b6d4', '#ec4899', '#f97316', '#8b5cf6'];
    dispatch({
      type: 'UPDATE_WHEEL',
      payload: {
        ...activeWheel,
        options: [...activeWheel.options, {
          id: nanoid(), label: `选项 ${activeWheel.options.length + 1}`,
          weight: 2, color: colors[activeWheel.options.length % colors.length],
          isPeripheral: false, isPenalty: false,
        }],
        updatedAt: Date.now(),
      },
    });
  };
  const handleRemoveOption = (optId: string) => {
    if (!activeWheel || activeWheel.options.length <= 2) { toast.error('至少需要2个选项'); return; }
    dispatch({ type: 'UPDATE_WHEEL', payload: { ...activeWheel, options: activeWheel.options.filter(o => o.id !== optId), updatedAt: Date.now() } });
  };
  const handleAddWheel = () => {
    const newWheel: Wheel = {
      id: nanoid(), name: `自定义轮盘 ${customWheels.length + 1}`,
      options: [
        { id: nanoid(), label: '选项A', weight: 2, color: '#6366f1', isPeripheral: false, isPenalty: false },
        { id: nanoid(), label: '选项B', weight: 2, color: '#10b981', isPeripheral: false, isPenalty: false },
        { id: nanoid(), label: '选项C', weight: 2, color: '#f59e0b', isPeripheral: false, isPenalty: false },
      ],
      history: [], isDefault: false, createdAt: Date.now(), updatedAt: Date.now(),
    };
    dispatch({ type: 'ADD_WHEEL', payload: newWheel });
    setActiveWheelId(newWheel.id);
    setShowConfig(true);
  };
  const handleDeleteWheel = () => {
    if (!activeWheel || isDefaultWheel) return;
    dispatch({ type: 'REMOVE_WHEEL', payload: activeWheel.id });
    setActiveWheelId(DEFAULT_IDS[0]);
  };

  // 导出当前轮盘为 JSON（异步，嵌入图片 base64）
  const handleExportWheel = async (wheel: Wheel) => {
    try {
      const json = await exportSingleWheel(wheel);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${wheel.name.replace(/[/\\?%*:|"<>]/g, '_')}.wheel.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`「${wheel.name}」已导出为JSON模板（含图片数据）`);
    } catch {
      toast.error('导出失败，请重试');
    }
  };

  // 上传 JSON 导入轮盘（异步，将图片写入 IndexedDB）
  const wheelImportRef = useRef<HTMLInputElement>(null);
  const handleImportWheelFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const json = ev.target?.result as string;
      const wheel = await parseSingleWheelJSON(json);
      if (!wheel) { toast.error('文件格式不正确，无法解析轮盘数据'); return; }
      dispatch({ type: 'ADD_WHEEL', payload: wheel });
      setActiveWheelId(wheel.id);
      const imgCount = wheel.options.filter(o => o.imageDataUrl).length;
      toast.success(`「${wheel.name}」已导入${imgCount > 0 ? `（含 ${imgCount} 张图片）` : ''}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  const handleSaveName = () => {
    if (!activeWheel || isDefaultWheel) return;
    if (nameInput.trim()) dispatch({ type: 'UPDATE_WHEEL', payload: { ...activeWheel, name: nameInput.trim(), updatedAt: Date.now() } });
    setEditingName(false);
  };

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  if (!activeWheel) return (
    <div className="h-[calc(100vh-64px)] flex items-center justify-center">
      <div className="text-center" style={{ color: 'oklch(0.55 0.04 280)' }}>
        <div className="text-4xl mb-3">🎡</div>
        <div className="text-sm font-semibold">正在加载轮盘…</div>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden">
      {/* 左侧轮盘列表 */}
      {showWheelList && (
        <div className="w-52 flex-shrink-0 flex flex-col overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', borderRight: '1px solid rgba(200,180,240,0.25)' }}>
          <div className="px-4 py-3 flex-shrink-0 flex flex-col gap-2" style={{ borderBottom: '1px solid rgba(200,180,240,0.2)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold" style={{ color: 'oklch(0.50 0.06 310)' }}>轮盘列表</span>
              <button onClick={handleAddWheel} className="px-2 py-1 rounded-lg text-xs font-bold"
                style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)', color: 'white' }}>+ 新建</button>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => activeWheel && handleExportWheel(activeWheel)}
                className="flex-1 py-1 rounded-lg text-xs font-bold transition-all"
                style={{ background: 'rgba(100,116,139,0.1)', color: 'oklch(0.45 0.04 280)', border: '1px solid rgba(200,180,240,0.25)' }}
                title="导出当前轮盘为JSON">
                ↓ 导出
              </button>
              <button onClick={() => wheelImportRef.current?.click()}
                className="flex-1 py-1 rounded-lg text-xs font-bold transition-all"
                style={{ background: 'rgba(100,116,139,0.1)', color: 'oklch(0.45 0.04 280)', border: '1px solid rgba(200,180,240,0.25)' }}
                title="上传JSON导入轮盘">
                ↑ 导入
              </button>
              <input ref={wheelImportRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImportWheelFile} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            <div className="text-xs font-bold px-1 mb-1" style={{ color: 'oklch(0.60 0.06 280)' }}>默认轮盘</div>
            {defaultWheels.map(w => (
              <button key={w.id} onClick={() => setActiveWheelId(w.id)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all"
                style={w.id === activeWheelId
                  ? { background: 'linear-gradient(135deg,rgba(236,64,122,0.1),rgba(124,77,255,0.1))', border: '1.5px solid rgba(124,77,255,0.3)' }
                  : { background: 'rgba(255,255,255,0.6)', border: '1.5px solid rgba(200,180,240,0.2)' }}>
                <span className="text-base">{w.id === 'wheel-default-lottery' ? '🎁' : w.id === 'wheel-default-punishment' ? '⚡' : '🎯'}</span>
                <span className="text-sm font-semibold" style={{ color: w.id === activeWheelId ? 'oklch(0.22 0.02 280)' : 'oklch(0.45 0.04 280)' }}>{w.name}</span>
              </button>
            ))}
            {customWheels.length > 0 && (
              <>
                <div className="text-xs font-bold px-1 mt-3 mb-1" style={{ color: 'oklch(0.60 0.06 280)' }}>自定义</div>
                {customWheels.map(w => (
                  <button key={w.id} onClick={() => setActiveWheelId(w.id)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all"
                    style={w.id === activeWheelId
                      ? { background: 'linear-gradient(135deg,rgba(236,64,122,0.1),rgba(124,77,255,0.1))', border: '1.5px solid rgba(124,77,255,0.3)' }
                      : { background: 'rgba(255,255,255,0.6)', border: '1.5px solid rgba(200,180,240,0.2)' }}>
                    <span className="text-base">🎡</span>
                    <span className="text-sm font-semibold truncate" style={{ color: w.id === activeWheelId ? 'oklch(0.22 0.02 280)' : 'oklch(0.45 0.04 280)' }}>{w.name}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* 主区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部工具栏 */}
        <div className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(200,180,240,0.2)', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)' }}>
          <button onClick={() => setShowWheelList(!showWheelList)} className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={showWheelList ? { background: 'linear-gradient(135deg,#7c4dff,#42a5f5)', color: 'white' } : { background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>
            {showWheelList ? '收起列表' : '展开列表'}
          </button>
          <div className="flex items-center gap-2 flex-1">
            {editingName && !isDefaultWheel ? (
              <div className="flex items-center gap-2">
                <input type="text" value={nameInput} onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                  className="input-glass text-sm font-bold px-3 py-1.5 w-40" autoFocus />
                <button onClick={handleSaveName} className="px-2 py-1.5 rounded-lg text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#66bb6a,#26c6da)' }}>保存</button>
                <button onClick={() => setEditingName(false)} className="px-2 py-1.5 rounded-lg text-xs font-bold"
                  style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>取消</button>
              </div>
            ) : (
              <button onClick={() => { if (!isDefaultWheel) { setNameInput(activeWheel.name); setEditingName(true); } }}
                className="text-base font-black flex items-center gap-1.5"
                style={{ color: 'oklch(0.22 0.02 280)', cursor: isDefaultWheel ? 'default' : 'pointer' }}>
                {activeWheel.name}
                {!isDefaultWheel && <span className="text-xs font-normal" style={{ color: 'oklch(0.60 0.04 280)' }}>✏️</span>}
                {isDefaultWheel && <span className="text-xs font-normal px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.55 0.04 280)' }}>默认</span>}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowConfig(!showConfig)} className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={showConfig ? { background: 'linear-gradient(135deg,#ec407a,#f48fb1)', color: 'white' } : { background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>
              {showConfig ? '收起配置' : '展开配置'}
            </button>
            {!isDefaultWheel && (
              <button onClick={handleDeleteWheel} className="px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>删除</button>
            )}
          </div>
        </div>

        {/* 轮盘 + 配置 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 轮盘区 */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
            {activeWheel.options.length > 0 ? (
              <WheelCanvas options={activeWheel.options} rotation={rotation} />
            ) : (
              <div className="w-96 h-96 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(200,180,240,0.1)', border: '2px dashed rgba(200,180,240,0.4)' }}>
                <div className="text-center" style={{ color: 'oklch(0.55 0.04 280)' }}>
                  <div className="text-3xl mb-2">🎡</div>
                  <div className="text-sm font-semibold">请添加选项</div>
                </div>
              </div>
            )}
            <div className="flex gap-4">
              <button onClick={() => doSpin([])} disabled={spinning || activeWheel.options.length === 0}
                className="px-8 py-3.5 rounded-2xl font-black text-white text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)', boxShadow: spinning ? 'none' : '0 6px 20px rgba(124,77,255,0.4)' }}>
                {spinning ? '旋转中…' : '开始'}
              </button>
              <button onClick={() => setShowPickModal(true)} disabled={spinning || activeWheel.options.length === 0}
                className="px-8 py-3.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'rgba(255,255,255,0.8)', color: 'oklch(0.30 0.04 280)', border: '1.5px solid rgba(200,180,240,0.4)', boxShadow: '0 4px 12px rgba(100,80,180,0.1)' }}>
                选人并开始
              </button>
            </div>
            {activeWheel.history.length > 0 && (
              <div className="w-full max-w-md">
                <div className="text-xs font-bold mb-2 px-1" style={{ color: 'oklch(0.55 0.04 280)' }}>最近记录</div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {activeWheel.history.slice(0, 5).map(h => (
                    <div key={h.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(200,180,240,0.2)' }}>
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: h.optionColor }} />
                      <span className="text-sm font-semibold flex-1" style={{ color: 'oklch(0.30 0.04 280)' }}>{h.optionLabel}</span>
                      {h.playerNumbers.length > 0 && <span className="text-xs" style={{ color: 'oklch(0.55 0.04 280)' }}>{h.playerNumbers.slice(0, 3).join(', ')}{h.playerNumbers.length > 3 ? '…' : ''}</span>}
                      {h.isPeripheral && <span className="text-xs" style={{ color: '#f59e0b' }}>★</span>}
                      {h.isPenalty && <span className="text-xs" style={{ color: '#ef4444' }}>⚡</span>}
                      <span className="text-xs flex-shrink-0" style={{ color: 'oklch(0.65 0.02 280)' }}>
                        {new Date(h.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 右侧面板：结果 或 配置 */}
          {(resultOption || showConfig) && (
            <div className="w-96 flex-shrink-0 flex flex-col overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', borderLeft: '1px solid rgba(200,180,240,0.25)' }}>
              {/* 结果展示（优先） */}
              {resultOption ? (
                <div className="flex flex-col items-center justify-center flex-1 p-6 gap-4">
                  <div className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: 'linear-gradient(135deg,rgba(236,64,122,0.1),rgba(124,77,255,0.1))', color: '#ec407a' }}>
                    🎯 抽中结果
                  </div>
                  {resultOption.imageDataUrl && (
                    <img src={resultOption.imageDataUrl} alt={resultOption.label}
                      className="w-36 h-36 rounded-2xl object-cover"
                      style={{ border: `3px solid ${resultOption.color}`, boxShadow: `0 8px 24px ${resultOption.color}44` }} />
                  )}
                  <div className="text-4xl font-black text-center leading-tight" style={{ color: resultOption.color }}>
                    {resultOption.label}
                  </div>
                  {resultOption.isPeripheral && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
                      style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                      ★ 已同步至结算清单（周边奖励）
                    </div>
                  )}
                  {resultOption.isPenalty && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
                      style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                      ⚡ 已同步至结算清单（惩罚）
                    </div>
                  )}
                  {resultPlayers.length > 0 && (
                    <div className="w-full">
                      <div className="text-xs font-semibold mb-2 text-center" style={{ color: 'oklch(0.55 0.04 280)' }}>参与玩家</div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {resultPlayers.map(n => (
                          <span key={n} className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm"
                            style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)' }}>{n}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={() => { setResultOption(null); setResultPlayers([]); }}
                    className="w-full py-2.5 rounded-xl font-bold text-sm"
                    style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>
                    关闭结果
                  </button>
                </div>
              ) : showConfig ? (
                <>
                  <div className="px-4 py-3 flex-shrink-0 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(200,180,240,0.2)' }}>
                    <span className="text-xs font-bold" style={{ color: 'oklch(0.50 0.06 310)' }}>选项配置 · {activeWheel.options.length}项</span>
                    <button onClick={handleAddOption} className="px-2 py-1 rounded-lg text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg,#66bb6a,#26c6da)', color: 'white' }}>+ 添加</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {activeWheel.options.map(opt => (
                      <OptionRow key={opt.id} opt={opt}
                        onChange={updated => handleUpdateOption(opt.id, updated)}
                        onRemove={() => handleRemoveOption(opt.id)}
                        canRemove={activeWheel.options.length > 2} />
                    ))}
                  </div>
                  <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(200,180,240,0.2)' }}>
                    <div className="text-xs space-y-1" style={{ color: 'oklch(0.60 0.04 280)' }}>
                      <div><span className="font-bold" style={{ color: '#f59e0b' }}>★周边</span> 抽中后自动同步至结算清单（周边奖励）</div>
                      <div><span className="font-bold" style={{ color: '#ef4444' }}>⚡惩罚</span> 抽中后自动同步至结算清单（惩罚）</div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* 弹窗 */}
      {showPickModal && (
        <PickPlayerModal players={state.players}
          onConfirm={nums => { setShowPickModal(false); doSpin(nums); }}
          onClose={() => setShowPickModal(false)} />
      )}

    </div>
  );
}
