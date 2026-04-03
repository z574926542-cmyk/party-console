// 奇妙奇遇控制台 - 轮盘页面（亮色渐变风）
// 固定三个默认轮盘：抽奖 / 惩罚 / 挑战
// 可折叠配置面板，选人并开始，周边属性自动同步

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import type { Wheel, WheelOption, WheelHistoryEntry, PlayerIdentity } from '@/types';

const DEFAULT_IDS = ['wheel-default-lottery', 'wheel-default-penalty', 'wheel-default-challenge'];

function useEnsureDefaultWheels() {
  const { state, dispatch } = useApp();
  useEffect(() => {
    const defaults: Wheel[] = [
      {
        id: 'wheel-default-lottery', name: '抽奖', isDefault: true,
        options: [
          { id: 'opt-l1', label: '一等奖', weight: 1, color: '#f59e0b', isPeripheral: true },
          { id: 'opt-l2', label: '二等奖', weight: 2, color: '#6366f1', isPeripheral: true },
          { id: 'opt-l3', label: '三等奖', weight: 3, color: '#10b981', isPeripheral: true },
          { id: 'opt-l4', label: '安慰奖', weight: 4, color: '#06b6d4', isPeripheral: false },
          { id: 'opt-l5', label: '再来一次', weight: 3, color: '#f43f5e', isPeripheral: false },
          { id: 'opt-l6', label: '谢谢参与', weight: 5, color: '#64748b', isPeripheral: false },
        ],
        history: [], createdAt: Date.now(), updatedAt: Date.now(),
      },
      {
        id: 'wheel-default-penalty', name: '惩罚', isDefault: true,
        options: [
          { id: 'opt-p1', label: '喝一杯', weight: 3, color: '#ef4444', isPeripheral: false },
          { id: 'opt-p2', label: '唱一首歌', weight: 2, color: '#f97316', isPeripheral: false },
          { id: 'opt-p3', label: '讲个笑话', weight: 3, color: '#eab308', isPeripheral: false },
          { id: 'opt-p4', label: '俯卧撑', weight: 2, color: '#ec4899', isPeripheral: false },
          { id: 'opt-p5', label: '真心话', weight: 3, color: '#8b5cf6', isPeripheral: false },
          { id: 'opt-p6', label: '大冒险', weight: 2, color: '#06b6d4', isPeripheral: false },
        ],
        history: [], createdAt: Date.now(), updatedAt: Date.now(),
      },
      {
        id: 'wheel-default-challenge', name: '挑战', isDefault: true,
        options: [
          { id: 'opt-c1', label: '才艺展示', weight: 2, color: '#6366f1', isPeripheral: false },
          { id: 'opt-c2', label: '猜谜题', weight: 3, color: '#10b981', isPeripheral: false },
          { id: 'opt-c3', label: '绕口令', weight: 3, color: '#f59e0b', isPeripheral: false },
          { id: 'opt-c4', label: '肢体挑战', weight: 2, color: '#ef4444', isPeripheral: false },
          { id: 'opt-c5', label: '即兴表演', weight: 2, color: '#ec4899', isPeripheral: false },
          { id: 'opt-c6', label: '知识问答', weight: 3, color: '#06b6d4', isPeripheral: false },
        ],
        history: [], createdAt: Date.now(), updatedAt: Date.now(),
      },
    ];
    defaults.forEach(dw => {
      if (!state.wheels.find(w => w.id === dw.id)) {
        dispatch({ type: 'ADD_WHEEL', payload: dw });
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

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
      if (opt.isPeripheral) {
        const bx = cx + Math.cos(midAngle) * r * 0.82;
        const by = cy + Math.sin(midAngle) * r * 0.82;
        ctx.beginPath(); ctx.arc(bx, by, 7, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
        ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', bx, by);
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
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(200,180,240,0.2)' }}>
      <div className="relative flex-shrink-0 w-7 h-7 rounded-lg" style={{ background: opt.color }}>
        <input type="color" value={opt.color} onChange={e => onChange({ ...opt, color: e.target.value })}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
      </div>
      <input type="text" value={opt.label} onChange={e => onChange({ ...opt, label: e.target.value })}
        className="flex-1 px-2 py-1 rounded-lg text-sm font-medium bg-transparent border-none outline-none"
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
      <button onClick={() => onChange({ ...opt, isPeripheral: !opt.isPeripheral })}
        className="px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0 transition-all"
        style={opt.isPeripheral
          ? { background: 'linear-gradient(135deg,#f59e0b,#f97316)', color: 'white', boxShadow: '0 2px 6px rgba(245,158,11,0.35)' }
          : { background: 'rgba(200,180,240,0.15)', color: 'oklch(0.55 0.04 280)' }}>
        ★周边
      </button>
      {canRemove && (
        <button onClick={onRemove} className="w-6 h-6 rounded-md flex items-center justify-center text-sm flex-shrink-0"
          style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>×</button>
      )}
    </div>
  );
}

function ResultModal({ option, playerNumbers, onClose }: { option: WheelOption; playerNumbers: number[]; onClose: () => void }) {
  return (
    <div className="tool-modal-backdrop" onClick={onClose}>
      <div className="tool-modal p-8 text-center max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="text-5xl mb-4">{option.isPeripheral ? '🎁' : '🎯'}</div>
        <div className="text-3xl font-black mb-3" style={{ color: option.color }}>{option.label}</div>
        {option.isPeripheral && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4"
            style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
            ★ 已同步至周边清单
          </div>
        )}
        {playerNumbers.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold mb-2" style={{ color: 'oklch(0.55 0.04 280)' }}>参与玩家</div>
            <div className="flex flex-wrap gap-2 justify-center">
              {playerNumbers.map(n => (
                <span key={n} className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm"
                  style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)' }}>{n}</span>
              ))}
            </div>
          </div>
        )}
        <button onClick={onClose} className="w-full py-3 rounded-2xl font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)', boxShadow: '0 4px 14px rgba(124,77,255,0.3)' }}>
          好的！
        </button>
      </div>
    </div>
  );
}

export default function WheelPage() {
  useEnsureDefaultWheels();
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
    const duration = 4000 + Math.random() * 1000;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      rotRef.current = startRot + totalDelta * eased;
      setRotation(rotRef.current);
      if (progress < 1) { animRef.current = requestAnimationFrame(animate); }
      else {
        setSpinning(false);
        setResultOption(winner);
        setResultPlayers(playerNums);
        const entry: WheelHistoryEntry = {
          id: nanoid(), optionLabel: winner.label, optionColor: winner.color,
          playerNumbers: playerNums, timestamp: Date.now(), isPeripheral: winner.isPeripheral,
        };
        dispatch({ type: 'UPDATE_WHEEL', payload: { ...activeWheel, history: [entry, ...activeWheel.history].slice(0, 50), updatedAt: Date.now() } });
        if (winner.isPeripheral && playerNums.length > 0) {
          const maxSerial = state.peripheralRecords.reduce((max, r) => Math.max(max, r.serialNumber), 0);
          playerNums.forEach((num, i) => {
            dispatch({
              type: 'ADD_PERIPHERAL_RECORD',
              payload: {
                id: nanoid(), serialNumber: maxSerial + i + 1, playerNumber: num,
                peripheralCode: `W-${String(maxSerial + i + 1).padStart(4, '0')}`,
                previewImage: winner.image, notes: `${activeWheel.name} · ${winner.label}`,
                completed: false, source: 'wheel-result',
                sourceWheelName: activeWheel.name, sourceWheelOption: winner.label, createdAt: Date.now(),
              },
            });
          });
          toast.success(`"${winner.label}" 已同步至周边清单`);
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
    dispatch({ type: 'UPDATE_WHEEL', payload: { ...activeWheel, options: [...activeWheel.options, { id: nanoid(), label: `选项 ${activeWheel.options.length + 1}`, weight: 2, color: colors[activeWheel.options.length % colors.length], isPeripheral: false }], updatedAt: Date.now() } });
  };
  const handleRemoveOption = (optId: string) => {
    if (!activeWheel || activeWheel.options.length <= 2) { toast.error('至少需要2个选项'); return; }
    dispatch({ type: 'UPDATE_WHEEL', payload: { ...activeWheel, options: activeWheel.options.filter(o => o.id !== optId), updatedAt: Date.now() } });
  };
  const handleAddWheel = () => {
    const newWheel: Wheel = {
      id: nanoid(), name: `自定义轮盘 ${customWheels.length + 1}`,
      options: [
        { id: nanoid(), label: '选项A', weight: 2, color: '#6366f1', isPeripheral: false },
        { id: nanoid(), label: '选项B', weight: 2, color: '#10b981', isPeripheral: false },
        { id: nanoid(), label: '选项C', weight: 2, color: '#f59e0b', isPeripheral: false },
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
  const handleSaveName = () => {
    if (!activeWheel || isDefaultWheel) return;
    if (nameInput.trim()) dispatch({ type: 'UPDATE_WHEEL', payload: { ...activeWheel, name: nameInput.trim(), updatedAt: Date.now() } });
    setEditingName(false);
  };

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  if (!activeWheel) return null;

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden">
      {/* 左侧轮盘列表 */}
      {showWheelList && (
        <div className="w-52 flex-shrink-0 flex flex-col overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', borderRight: '1px solid rgba(200,180,240,0.25)' }}>
          <div className="px-4 py-3 flex-shrink-0 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(200,180,240,0.2)' }}>
            <span className="text-xs font-bold" style={{ color: 'oklch(0.50 0.06 310)' }}>轮盘列表</span>
            <button onClick={handleAddWheel} className="px-2 py-1 rounded-lg text-xs font-bold"
              style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)', color: 'white' }}>+ 新建</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            <div className="text-xs font-bold px-1 mb-1" style={{ color: 'oklch(0.60 0.06 280)' }}>默认轮盘</div>
            {defaultWheels.map(w => (
              <button key={w.id} onClick={() => setActiveWheelId(w.id)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all"
                style={w.id === activeWheelId
                  ? { background: 'linear-gradient(135deg,rgba(236,64,122,0.1),rgba(124,77,255,0.1))', border: '1.5px solid rgba(124,77,255,0.3)' }
                  : { background: 'rgba(255,255,255,0.6)', border: '1.5px solid rgba(200,180,240,0.2)' }}>
                <span className="text-base">{w.id === 'wheel-default-lottery' ? '🎁' : w.id === 'wheel-default-penalty' ? '💧' : '⚡'}</span>
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
        <div className="flex-shrink-0 px-6 py-3 flex items-center gap-3"
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
                      <span className="text-xs flex-shrink-0" style={{ color: 'oklch(0.65 0.02 280)' }}>
                        {new Date(h.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 右侧配置面板 */}
          {showConfig && (
            <div className="w-72 flex-shrink-0 flex flex-col overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', borderLeft: '1px solid rgba(200,180,240,0.25)' }}>
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
                <div className="text-xs" style={{ color: 'oklch(0.60 0.04 280)' }}>
                  <span className="font-bold" style={{ color: '#f59e0b' }}>★周边</span> 标记的选项抽中后自动同步至周边清单
                </div>
              </div>
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
      {resultOption && (
        <ResultModal option={resultOption} playerNumbers={resultPlayers}
          onClose={() => { setResultOption(null); setResultPlayers([]); }} />
      )}
    </div>
  );
}
