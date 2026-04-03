// ============================================================
// 奇妙奇遇控制台 - 展台页面（亮色渐变风重构）
// 风格：亮色渐变 · 磨砂卡片 · 舞台感
// ============================================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '@/contexts/AppContext';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import type { BoundTool, PlayerIdentity } from '@/types';

// ============================================================
// 工具弹窗 - 结算选人
// ============================================================
function SettlePickModal({
  players,
  title,
  onConfirm,
  onClose,
}: {
  players: PlayerIdentity[];
  title: string;
  onConfirm: (nums: number[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (n: number) => {
    setSelected(prev => {
      const next = new Set(Array.from(prev));
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  const handleConfirm = () => {
    if (selected.size === 0) { toast.error('请至少选择一位玩家'); return; }
    onConfirm(Array.from(selected).sort((a, b) => a - b));
    onClose();
  };

  return (
    <div className="tool-modal-backdrop" onClick={onClose}>
      <div className="tool-modal w-[520px] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black" style={{ color: 'oklch(0.22 0.02 280)' }}>{title}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.04 280)' }}>已选 {selected.size} 人</p>
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
                {p.gender !== 'unknown' && (
                  <div className="w-1.5 h-1.5 rounded-full"
                    style={{ background: isSel ? 'rgba(255,255,255,0.7)' : p.gender === 'male' ? '#42a5f5' : '#f48fb1' }} />
                )}
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
          <button onClick={handleConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)', boxShadow: '0 4px 14px rgba(124,77,255,0.3)' }}>
            确认（{selected.size}人）
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 工具弹窗 - 快速选人随机
// ============================================================
function RandomPickModal({ players, onClose }: { players: PlayerIdentity[]; onClose: () => void }) {
  const [count, setCount] = useState(1);
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');
  const [filterSocial, setFilterSocial] = useState<'all' | 'extrovert' | 'introvert'>('all');
  const [results, setResults] = useState<number[]>([]);

  const eligible = players.filter(p => {
    if (filterGender !== 'all' && p.gender !== filterGender) return false;
    if (filterSocial !== 'all' && p.socialType !== filterSocial) return false;
    return true;
  });

  const handlePick = () => {
    if (eligible.length === 0) { toast.error('没有符合条件的玩家'); return; }
    const shuffled = [...eligible].sort(() => Math.random() - 0.5);
    setResults(shuffled.slice(0, Math.min(count, shuffled.length)).map(p => p.number));
  };

  const FBtn = ({ active, onClick, children, grad }: { active: boolean; onClick: () => void; children: React.ReactNode; grad: string }) => (
    <button onClick={onClick} className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
      style={active ? { background: grad, color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' } : { background: 'rgba(200,180,240,0.15)', color: 'oklch(0.45 0.06 280)' }}>
      {children}
    </button>
  );

  return (
    <div className="tool-modal-backdrop" onClick={onClose}>
      <div className="tool-modal w-96 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-black" style={{ color: 'oklch(0.22 0.02 280)' }}>快速选人</h3>
            <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.04 280)' }}>符合条件 {eligible.length} 人</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg"
            style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>×</button>
        </div>
        <div className="mb-4">
          <div className="section-label">选几人</div>
          <div className="flex items-center gap-3">
            <button onClick={() => setCount(Math.max(1, count - 1))} className="w-9 h-9 rounded-xl font-bold text-lg flex items-center justify-center" style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>-</button>
            <span className="text-2xl font-black w-8 text-center" style={{ color: 'oklch(0.22 0.02 280)' }}>{count}</span>
            <button onClick={() => setCount(Math.min(eligible.length || 30, count + 1))} className="w-9 h-9 rounded-xl font-bold text-lg flex items-center justify-center" style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>+</button>
          </div>
        </div>
        <div className="mb-3">
          <div className="section-label">性别</div>
          <div className="flex gap-2">
            <FBtn active={filterGender === 'all'} onClick={() => setFilterGender('all')} grad="linear-gradient(135deg,#9e9e9e,#757575)">全部</FBtn>
            <FBtn active={filterGender === 'male'} onClick={() => setFilterGender('male')} grad="linear-gradient(135deg,#42a5f5,#1976d2)">男生</FBtn>
            <FBtn active={filterGender === 'female'} onClick={() => setFilterGender('female')} grad="linear-gradient(135deg,#f48fb1,#e91e63)">女生</FBtn>
          </div>
        </div>
        <div className="mb-5">
          <div className="section-label">社交属性</div>
          <div className="flex gap-2">
            <FBtn active={filterSocial === 'all'} onClick={() => setFilterSocial('all')} grad="linear-gradient(135deg,#9e9e9e,#757575)">全部</FBtn>
            <FBtn active={filterSocial === 'extrovert'} onClick={() => setFilterSocial('extrovert')} grad="linear-gradient(135deg,#ffca28,#ff8a65)">社牛</FBtn>
            <FBtn active={filterSocial === 'introvert'} onClick={() => setFilterSocial('introvert')} grad="linear-gradient(135deg,#9fa8da,#7c4dff)">社恐</FBtn>
          </div>
        </div>
        {results.length > 0 && (
          <div className="mb-5 p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(232,234,246,0.8), rgba(252,228,236,0.8))' }}>
            <div className="section-label mb-2">选中号码</div>
            <div className="flex flex-wrap gap-2">
              {results.map(n => (
                <span key={n} className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm"
                  style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)' }}>{n}</span>
              ))}
            </div>
          </div>
        )}
        <button onClick={handlePick} className="w-full py-3 rounded-2xl font-bold text-white text-sm"
          style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)', boxShadow: '0 4px 16px rgba(124,77,255,0.3)' }}>
          {results.length > 0 ? '再次随机' : '开始随机'}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 工具弹窗 - 快速分组
// ============================================================
// 分组结果全屏展示
// ============================================================
function GroupResultFullscreen({ results, players, onRegroup, onClose }: {
  results: number[][];
  players: PlayerIdentity[];
  onRegroup: () => void;
  onClose: () => void;
}) {
  const grads = [
    { bg: 'linear-gradient(135deg,#ec407a,#7c4dff)', solid: '#7c4dff', light: 'rgba(124,77,255,0.12)' },
    { bg: 'linear-gradient(135deg,#42a5f5,#26c6da)', solid: '#26c6da', light: 'rgba(38,198,218,0.12)' },
    { bg: 'linear-gradient(135deg,#ff8a65,#ffca28)', solid: '#ff8a65', light: 'rgba(255,138,101,0.12)' },
    { bg: 'linear-gradient(135deg,#66bb6a,#26c6da)', solid: '#66bb6a', light: 'rgba(102,187,106,0.12)' },
    { bg: 'linear-gradient(135deg,#ce93d8,#f48fb1)', solid: '#ce93d8', light: 'rgba(206,147,216,0.12)' },
    { bg: 'linear-gradient(135deg,#ffcc02,#ff8a65)', solid: '#ffca28', light: 'rgba(255,204,2,0.12)' },
  ];

  // 根据组数决定每行显示几组
  const cols = results.length <= 2 ? results.length : results.length <= 4 ? 2 : results.length <= 6 ? 3 : 4;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: 'linear-gradient(135deg, oklch(0.14 0.03 280) 0%, oklch(0.10 0.04 290) 100%)' }}
    >
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between px-8 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-white">分组结果</span>
          <span className="text-sm px-3 py-1 rounded-full font-medium" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
            共 {players.length} 位玩家 · {results.length} 组
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRegroup}
            className="px-5 py-2 rounded-xl font-bold text-sm"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            重新分组
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-bold text-sm text-white"
            style={{ background: 'linear-gradient(135deg,#42a5f5,#7c4dff)' }}
          >
            关闭
          </button>
        </div>
      </div>

      {/* 分组卡片区域 */}
      <div
        className="flex-1 overflow-auto p-6"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1.25rem', alignContent: 'start' }}
      >
        {results.map((group, gi) => {
          const g = grads[gi % grads.length];
          return (
            <div
              key={gi}
              className="rounded-3xl flex flex-col"
              style={{ background: g.light, border: `2px solid ${g.solid}40`, minHeight: 0 }}
            >
              {/* 组标题 */}
              <div
                className="px-5 py-3 rounded-t-3xl shrink-0 flex items-center justify-between"
                style={{ background: g.bg }}
              >
                <span className="text-white font-black text-xl tracking-wide">第 {gi + 1} 组</span>
                <span className="text-white/80 font-semibold text-sm">{group.length} 人</span>
              </div>
              {/* 号码列表 */}
              <div className="p-4 flex flex-wrap gap-3 content-start">
                {group.map(n => (
                  <div
                    key={n}
                    className="flex items-center justify-center font-black rounded-2xl"
                    style={{
                      background: g.bg,
                      color: '#fff',
                      fontFamily: '"DIN Alternate", "Bebas Neue", "Barlow", monospace',
                      fontSize: group.length <= 6 ? '2.8rem' : group.length <= 12 ? '2.2rem' : group.length <= 20 ? '1.8rem' : '1.4rem',
                      width: group.length <= 6 ? '5rem' : group.length <= 12 ? '4rem' : group.length <= 20 ? '3.2rem' : '2.8rem',
                      height: group.length <= 6 ? '5rem' : group.length <= 12 ? '4rem' : group.length <= 20 ? '3.2rem' : '2.8rem',
                      boxShadow: `0 4px 16px ${g.solid}40`,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
function GroupModal({ players, onClose }: { players: PlayerIdentity[]; onClose: () => void }) {
  const [groupCount, setGroupCount] = useState(2);
  const [balanceGender, setBalanceGender] = useState(false);
  const [balanceSocial, setBalanceSocial] = useState(false);
  const [results, setResults] = useState<number[][]>([]);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const doGroup = () => {
    if (players.length === 0) { toast.error('没有玩家'); return; }
    let pool = [...players];
    if (balanceGender) {
      const males = pool.filter(p => p.gender === 'male').sort(() => Math.random() - 0.5);
      const females = pool.filter(p => p.gender === 'female').sort(() => Math.random() - 0.5);
      const others = pool.filter(p => p.gender === 'unknown').sort(() => Math.random() - 0.5);
      pool = [];
      const maxLen = Math.max(males.length, females.length, others.length);
      for (let i = 0; i < maxLen; i++) {
        if (males[i]) pool.push(males[i]);
        if (females[i]) pool.push(females[i]);
        if (others[i]) pool.push(others[i]);
      }
    } else if (balanceSocial) {
      const ext = pool.filter(p => p.socialType === 'extrovert').sort(() => Math.random() - 0.5);
      const intr = pool.filter(p => p.socialType === 'introvert').sort(() => Math.random() - 0.5);
      const oth = pool.filter(p => p.socialType === 'unknown').sort(() => Math.random() - 0.5);
      pool = [];
      const maxLen = Math.max(ext.length, intr.length, oth.length);
      for (let i = 0; i < maxLen; i++) {
        if (ext[i]) pool.push(ext[i]);
        if (intr[i]) pool.push(intr[i]);
        if (oth[i]) pool.push(oth[i]);
      }
    } else {
      pool = [...players].sort(() => Math.random() - 0.5);
    }
    const groups: number[][] = Array.from({ length: groupCount }, () => []);
    pool.forEach((p, i) => groups[i % groupCount].push(p.number));
    return groups;
  };

  const handleGroup = () => {
    const groups = doGroup();
    if (!groups) return;
    setResults(groups);
    setShowFullscreen(true);
  };

  const CheckBox = ({ active, onToggle, label }: { active: boolean; onToggle: () => void; label: string }) => (
    <label className="flex items-center gap-2 cursor-pointer" onClick={onToggle}>
      <div className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
        style={active ? { background: 'linear-gradient(135deg,#ec407a,#7c4dff)', boxShadow: '0 2px 8px rgba(124,77,255,0.3)' } : { background: 'rgba(200,180,240,0.2)', border: '2px solid rgba(180,160,220,0.3)' }}>
        {active && <span className="text-white text-xs font-bold leading-none">✓</span>}
      </div>
      <span className="text-sm font-medium" style={{ color: 'oklch(0.35 0.04 280)' }}>{label}</span>
    </label>
  );

  return (
    <>
      {showFullscreen && results.length > 0 && (
        <GroupResultFullscreen
          results={results}
          players={players}
          onRegroup={() => {
            const groups = doGroup();
            if (groups) setResults(groups);
          }}
          onClose={() => { setShowFullscreen(false); onClose(); }}
        />
      )}
      <div className="tool-modal-backdrop" onClick={onClose}>
        <div className="tool-modal w-[480px] p-6" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-black" style={{ color: 'oklch(0.22 0.02 280)' }}>快速分组</h3>
              <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.04 280)' }}>共 {players.length} 位玩家</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg"
              style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>×</button>
          </div>
          <div className="mb-4">
            <div className="section-label">分几组</div>
            <div className="flex items-center gap-3">
              <button onClick={() => setGroupCount(Math.max(2, groupCount - 1))} className="w-9 h-9 rounded-xl font-bold text-lg flex items-center justify-center" style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>-</button>
              <span className="text-2xl font-black w-8 text-center" style={{ color: 'oklch(0.22 0.02 280)' }}>{groupCount}</span>
              <button onClick={() => setGroupCount(Math.min(10, groupCount + 1))} className="w-9 h-9 rounded-xl font-bold text-lg flex items-center justify-center" style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>+</button>
              <span className="text-xs ml-2" style={{ color: 'oklch(0.55 0.04 280)' }}>每组约 {Math.ceil(players.length / groupCount)} 人</span>
            </div>
          </div>
          <div className="mb-5 flex gap-4">
            <CheckBox active={balanceGender} onToggle={() => { setBalanceGender(!balanceGender); setBalanceSocial(false); }} label="男女平衡" />
            <CheckBox active={balanceSocial} onToggle={() => { setBalanceSocial(!balanceSocial); setBalanceGender(false); }} label="社牛社恐平衡" />
          </div>
          <button onClick={handleGroup} className="w-full py-3 rounded-2xl font-bold text-white text-sm"
            style={{ background: 'linear-gradient(135deg,#42a5f5,#7c4dff)', boxShadow: '0 4px 16px rgba(66,165,245,0.3)' }}>
            开始分组
          </button>
        </div>
      </div>
    </>
  );
}

// ============================================================
// 工具弹窗 - 倒计时
// ============================================================
function CountdownModal({ onClose }: { onClose: () => void }) {
  const PRESETS = [30, 60, 90, 120, 180, 300];
  const [total, setTotal] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);
  const [customMin, setCustomMin] = useState('');
  const [customSec, setCustomSec] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) { clearInterval(intervalRef.current!); setRunning(false); toast.success('时间到！'); return 0; }
          return r - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const setTime = (secs: number) => { setTotal(secs); setRemaining(secs); setRunning(false); };
  const applyCustom = () => {
    const m = parseInt(customMin) || 0;
    const s = parseInt(customSec) || 0;
    const t = m * 60 + s;
    if (t > 0) setTime(t);
  };

  const progress = total > 0 ? remaining / total : 0;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const circumference = 2 * Math.PI * 80;
  const strokeDash = circumference * (1 - progress);
  const isWarning = progress < 0.25 && progress > 0;
  const isDone = remaining === 0;

  return (
    <div className="tool-modal-backdrop" onClick={onClose}>
      <div className="tool-modal w-96 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-black" style={{ color: 'oklch(0.22 0.02 280)' }}>倒计时</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg"
            style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>×</button>
        </div>
        <div className="flex justify-center mb-5">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg width="192" height="192" className="absolute inset-0 -rotate-90">
              <circle cx="96" cy="96" r="80" fill="none" stroke="rgba(200,180,240,0.25)" strokeWidth="10" />
              <circle cx="96" cy="96" r="80" fill="none"
                stroke={isDone ? '#66bb6a' : isWarning ? '#ff8a65' : '#7c4dff'}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={strokeDash}
                style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }} />
            </svg>
            <div className="text-center z-10">
              <div className="font-black tabular-nums" style={{ fontSize: '2.8rem', lineHeight: 1, color: isDone ? '#66bb6a' : isWarning ? '#ff8a65' : 'oklch(0.22 0.02 280)' }}>
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </div>
              {isDone && <div className="text-sm font-bold mt-1" style={{ color: '#66bb6a' }}>时间到！</div>}
            </div>
          </div>
        </div>
        <div className="mb-4">
          <div className="section-label">快捷时段</div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(s => (
              <button key={s} onClick={() => setTime(s)} className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={total === s ? { background: 'linear-gradient(135deg,#7c4dff,#42a5f5)', color: 'white', boxShadow: '0 2px 8px rgba(124,77,255,0.3)' } : { background: 'rgba(200,180,240,0.15)', color: 'oklch(0.45 0.06 280)' }}>
                {s >= 60 ? `${s / 60}分` : `${s}秒`}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-5">
          <div className="section-label">自定义时间</div>
          <div className="flex items-center gap-2">
            <input type="number" min="0" max="99" placeholder="分" value={customMin} onChange={e => setCustomMin(e.target.value)} className="input-glass text-center w-16 py-2" />
            <span className="font-bold" style={{ color: 'oklch(0.45 0.06 280)' }}>:</span>
            <input type="number" min="0" max="59" placeholder="秒" value={customSec} onChange={e => setCustomSec(e.target.value)} className="input-glass text-center w-16 py-2" />
            <button onClick={applyCustom} className="px-3 py-2 rounded-xl text-xs font-bold" style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>设定</button>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setRunning(!running)} className="flex-1 py-3 rounded-2xl font-bold text-white text-sm"
            style={{ background: running ? 'linear-gradient(135deg,#ff8a65,#ffca28)' : 'linear-gradient(135deg,#66bb6a,#26c6da)', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
            {running ? '暂停' : (remaining < total && remaining > 0 ? '继续' : '开始')}
          </button>
          <button onClick={() => { setRunning(false); setRemaining(total); }} className="px-4 py-3 rounded-2xl font-bold text-sm"
            style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>重置</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 主页面
// ============================================================
type ModalType = null | 'pick' | 'group' | 'countdown' | { type: 'settle'; settlement: 'winner' | 'loser' } | { type: 'lightbox'; src: string; name: string };

export default function StagePage() {
  const { state, dispatch } = useApp();
  const [, navigate] = useLocation();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [showNames, setShowNames] = useState(state.stageShowGameNames);
  const [settledItems, setSettledItems] = useState<Set<string>>(new Set());

  const openLightbox = (src: string, name: string) => setActiveModal({ type: 'lightbox', src, name });

  const gameList = state.currentGameList;
  const currentItem = gameList.find(item => item.id === state.stageCurrentGameId) || gameList[0] || null;
  const currentGame = currentItem?.gameData;
  const currentIndex = gameList.findIndex(item => item.id === currentItem?.id);

  const selectGame = useCallback((itemId: string) => {
    dispatch({ type: 'SET_STAGE_CURRENT_GAME', payload: itemId });
  }, [dispatch]);

  const goPrev = () => { if (currentIndex > 0) selectGame(gameList[currentIndex - 1].id); };
  const goNext = () => { if (currentIndex < gameList.length - 1) selectGame(gameList[currentIndex + 1].id); };

  const handleSettle = (settlement: 'winner' | 'loser', playerNums: number[]) => {
    if (!currentGame || !currentItem) return;
    let serial = state.peripheralRecords.reduce((max, r) => Math.max(max, r.serialNumber), 0);
    const source = settlement === 'winner' ? ('game-winner' as const) : ('game-loser' as const);
    const category = settlement === 'winner' ? ('reward' as const) : ('penalty' as const);

    if (settlement === 'winner' && currentGame.settlementImages && currentGame.settlementImages.length > 0) {
      // 胜者有周边奖励图片：每个玩家×每个周边各创建一条记录，标题为周边名称
      playerNums.forEach(num => {
        currentGame.settlementImages.forEach(img => {
          serial += 1;
          dispatch({
            type: 'ADD_PERIPHERAL_RECORD',
            payload: {
              id: nanoid(),
              serialNumber: serial,
              playerNumber: num,
              category,
              title: img.name || '周边奖励',
              previewImage: img.dataUrl,
              notes: currentGame.winnerSettlement || '',
              completed: false,
              source,
              sourceGameName: currentGame.name,
              createdAt: Date.now(),
            },
          });
        });
      });
    } else {
      // 无周边图片：每个玩家创建一条记录，标题为结算方式文本
      playerNums.forEach(num => {
        serial += 1;
        dispatch({
          type: 'ADD_PERIPHERAL_RECORD',
          payload: {
            id: nanoid(),
            serialNumber: serial,
            playerNumber: num,
            category,
            title: settlement === 'winner'
              ? (currentGame.winnerSettlement || '周边奖励')
              : (currentGame.loserSettlement || '惩罚'),
            notes: settlement === 'winner' ? '胜者结算' : '败者结算',
            completed: false,
            source,
            sourceGameName: currentGame.name,
            createdAt: Date.now(),
          },
        });
      });
    }

    setSettledItems(prev => { const next = new Set(Array.from(prev)); next.add(`${currentItem.id}-${settlement}`); return next; });
    toast.success(`已记录 ${playerNums.length} 位玩家的结算`);
    setActiveModal(null);
  };

  const openToolModal = (tool: BoundTool) => {
    if (tool.type === 'tool') {
      if (tool.toolType === 'random-pick') setActiveModal('pick');
      else if (tool.toolType === 'random-group') setActiveModal('group');
      else if (tool.toolType === 'countdown') setActiveModal('countdown');
    } else if (tool.type === 'wheel') {
      navigate('/wheel');
    }
  };

  const toolGrads: Record<string, string> = {
    'random-pick': 'linear-gradient(135deg,#ec407a,#f48fb1)',
    'random-group': 'linear-gradient(135deg,#42a5f5,#26c6da)',
    'countdown': 'linear-gradient(135deg,#66bb6a,#26c6da)',
    'wheel': 'linear-gradient(135deg,#ff8a65,#ffca28)',
  };

  const toolEmoji: Record<string, string> = {
    'random-pick': '👤',
    'random-group': '👥',
    'countdown': '⏱',
    'wheel': '🎯',
  };

  if (gameList.length === 0) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center" style={{ color: 'oklch(0.55 0.04 280)' }}>
        <div className="text-6xl mb-4">🎭</div>
        <div className="text-xl font-bold mb-2" style={{ color: 'oklch(0.30 0.04 280)' }}>展台暂无内容</div>
        <div className="text-sm mb-6">请先在控制台编排游戏，然后点击"载入展台"</div>
        <button onClick={() => navigate('/')} className="px-6 py-3 rounded-2xl font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)', boxShadow: '0 4px 14px rgba(124,77,255,0.3)' }}>
          前往控制台
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden">
      {/* ---- 左侧游戏导航 ---- */}
      <div className="w-60 flex-shrink-0 flex flex-col overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', borderRight: '1px solid rgba(200,180,240,0.25)' }}>
        {/* 顶部控制 */}
        <div className="px-4 py-3 flex-shrink-0 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(200,180,240,0.2)' }}>
          <span className="text-xs font-bold" style={{ color: 'oklch(0.50 0.06 310)' }}>游戏列表 · {gameList.length}个</span>
          <button onClick={() => { setShowNames(!showNames); dispatch({ type: 'TOGGLE_STAGE_SHOW_NAMES' }); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all"
            style={showNames ? { background: 'linear-gradient(135deg,#7c4dff,#42a5f5)', color: 'white' } : { background: 'rgba(200,180,240,0.2)', color: 'oklch(0.55 0.04 280)' }}
            title={showNames ? '隐藏游戏名' : '显示游戏名'}>
            {showNames ? '👁' : '🙈'}
          </button>
        </div>

        {/* 游戏列表 */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {gameList.map((item, idx) => {
            const isActive = item.id === currentItem?.id;
            const isSettled = settledItems.has(`${item.id}-winner`) || settledItems.has(`${item.id}-loser`);
            return (
              <button key={item.id} onClick={() => selectGame(item.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
                style={isActive
                  ? { background: 'linear-gradient(135deg, rgba(236,64,122,0.1), rgba(124,77,255,0.1))', border: '1.5px solid rgba(124,77,255,0.3)' }
                  : { background: 'rgba(255,255,255,0.6)', border: '1.5px solid rgba(200,180,240,0.2)' }}>
                <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                  style={{ background: isActive ? 'linear-gradient(135deg,#ec407a,#7c4dff)' : 'rgba(200,180,240,0.5)' }}>
                  {idx + 1}
                </span>
                <span className="flex-1 text-sm font-semibold truncate" style={{ color: isActive ? 'oklch(0.22 0.02 280)' : 'oklch(0.45 0.04 280)' }}>
                  {showNames ? item.gameData.name : `游戏 ${idx + 1}`}
                </span>
                {isSettled && <span className="text-xs" style={{ color: '#66bb6a' }}>✓</span>}
              </button>
            );
          })}
        </div>

        {/* 上下翻页 */}
        <div className="p-3 flex gap-2 flex-shrink-0" style={{ borderTop: '1px solid rgba(200,180,240,0.2)' }}>
          <button onClick={goPrev} disabled={currentIndex <= 0}
            className="flex-1 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-30"
            style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>
            上一个
          </button>
          <button onClick={goNext} disabled={currentIndex >= gameList.length - 1}
            className="flex-1 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-30"
            style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>
            下一个
          </button>
        </div>
      </div>

      {/* ---- 右侧游戏展示区 ---- */}
      <div className="flex-1 overflow-y-auto p-6">
        {currentGame ? (
          <div className="max-w-3xl mx-auto space-y-5">
            {/* 游戏标题 */}
            <div className="text-center py-4">
              <div className="text-6xl font-black mb-3" style={{ color: 'oklch(0.15 0.02 280)', letterSpacing: '-0.03em', lineHeight: '1.1' }}>
                {showNames ? currentGame.name : `游戏 ${currentIndex + 1}`}
              </div>
              {currentGame.tags.length > 0 && (
                <div className="flex justify-center gap-2 flex-wrap mt-2">
                  {currentGame.tags.map(tagId => {
                    const tag = state.tags.find(t => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <span key={tagId} className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: tag.color + '22', color: tag.color, border: `1.5px solid ${tag.color}44` }}>
                        {tag.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 游戏规则 */}
            {currentGame.rules && (
              <div className="glass-card p-5">
                <div className="text-base font-black uppercase tracking-widest mb-5" style={{ color: 'oklch(0.55 0.06 280)', letterSpacing: '0.15em' }}>游戏规则</div>
                <p className="text-3xl leading-relaxed whitespace-pre-wrap font-bold" style={{ color: 'oklch(0.15 0.02 280)', letterSpacing: '0.01em' }}>
                  {currentGame.rules}
                </p>
              </div>
            )}

            {/* 结算区域 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 胜者结算 */}
              <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(102,187,106,0.12), rgba(38,198,218,0.08))', border: '2px solid rgba(102,187,106,0.35)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black" style={{ color: '#2e7d32' }}>🏆 胜者 · 周边奖励</span>
                  </div>
                  <button
                    onClick={() => setActiveModal({ type: 'settle', settlement: 'winner' })}
                    className="px-3 py-1 rounded-xl text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#66bb6a,#26c6da)', boxShadow: '0 2px 8px rgba(102,187,106,0.3)' }}>
                    结算
                  </button>
                </div>
                {currentGame.winnerSettlement && (
                  <p className="text-2xl font-black mt-2 leading-snug" style={{ color: 'oklch(0.20 0.08 155)' }}>{currentGame.winnerSettlement}</p>
                )}
              </div>

              {/* 败者结算 */}
              <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, rgba(244,143,177,0.12), rgba(206,147,216,0.08))', border: '2px solid rgba(244,143,177,0.35)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black" style={{ color: '#b71c1c' }}>💧 败者 · 惩罚</span>
                  </div>
                  <button
                    onClick={() => setActiveModal({ type: 'settle', settlement: 'loser' })}
                    className="px-3 py-1 rounded-xl text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#f48fb1,#ce93d8)', boxShadow: '0 2px 8px rgba(244,143,177,0.3)' }}>
                    结算
                  </button>
                </div>
                {currentGame.loserSettlement && (
                  <p className="text-2xl font-black mt-2 leading-snug" style={{ color: 'oklch(0.25 0.10 340)' }}>{currentGame.loserSettlement}</p>
                )}
              </div>
            </div>

            {/* 周边奖励图片 */}
            {currentGame.settlementImages && currentGame.settlementImages.length > 0 && (
              <div className="glass-card p-5">
                <div className="section-label mb-3">周边奖励</div>
                <div className="flex gap-4 flex-wrap">
                  {currentGame.settlementImages.map(img => (
                    <div key={img.id} className="flex flex-col items-center gap-2 cursor-pointer group"
                      onClick={() => img.dataUrl && openLightbox(img.dataUrl, img.name)}
                      title="点击放大预览">
                      <div className="relative">
                        <img src={img.dataUrl} alt={img.name} className="w-24 h-24 rounded-2xl object-cover transition-transform group-hover:scale-105"
                          style={{ boxShadow: '0 4px 16px rgba(100,80,180,0.15)' }} />
                        <div className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: 'rgba(0,0,0,0.35)' }}>
                          <span className="text-white text-xl">&#128269;</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: 'oklch(0.40 0.04 280)' }}>{img.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 绑定工具快速调用 */}
            {currentGame.tools && currentGame.tools.length > 0 && (
              <div className="glass-card p-5">
                <div className="section-label mb-3">快速工具</div>
                <div className="flex flex-wrap gap-2">
                  {currentGame.tools.map(tool => {
                    const key = tool.type === 'wheel' ? 'wheel' : (tool.toolType || '');
                    const grad = toolGrads[key] || 'linear-gradient(135deg,#9e9e9e,#757575)';
                    const emoji = toolEmoji[key] || '⚡';
                    return (
                      <button key={tool.id} onClick={() => openToolModal(tool)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
                        style={{ background: grad, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                        {emoji} {tool.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 主持人备注 */}
            {currentGame.notes && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.4)', border: '1.5px dashed rgba(200,180,240,0.35)' }}>
                <div className="section-label mb-1">主持人备注</div>
                <p className="text-sm" style={{ color: 'oklch(0.45 0.04 280)' }}>{currentGame.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center" style={{ color: 'oklch(0.55 0.04 280)' }}>
            <div className="text-center">
              <div className="text-4xl mb-3">🎭</div>
              <div className="text-base font-semibold">请从左侧选择一个游戏</div>
            </div>
          </div>
        )}
      </div>

      {/* ---- 弹窗 ---- */}
      {activeModal === 'pick' && <RandomPickModal players={state.players} onClose={() => setActiveModal(null)} />}
      {activeModal === 'group' && <GroupModal players={state.players} onClose={() => setActiveModal(null)} />}
      {activeModal === 'countdown' && <CountdownModal onClose={() => setActiveModal(null)} />}
      {activeModal !== null && typeof activeModal === 'object' && activeModal.type === 'settle' && (
        <SettlePickModal
          players={state.players}
          title={activeModal.settlement === 'winner' ? '选择胜者（记录周边）' : '选择败者（记录周边）'}
          onConfirm={(nums) => handleSettle(activeModal.settlement, nums)}
          onClose={() => setActiveModal(null)}
        />
      )}
      {/* 周边奖励图片灯箱放大预览 */}
      {activeModal !== null && typeof activeModal === 'object' && activeModal.type === 'lightbox' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
          onClick={() => setActiveModal(null)}>
          <div className="relative flex flex-col items-center gap-4 max-w-[90vw] max-h-[90vh]"
            onClick={e => e.stopPropagation()}>
            {/* 关闭按鈕 */}
            <button
              onClick={() => setActiveModal(null)}
              className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg shadow-lg"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1.5px solid rgba(255,255,255,0.25)' }}>
              ×
            </button>
            {/* 大图 */}
            <img
              src={activeModal.src}
              alt={activeModal.name}
              className="rounded-3xl object-contain"
              style={{
                maxWidth: '80vw',
                maxHeight: '78vh',
                boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
                border: '2px solid rgba(255,255,255,0.12)',
              }}
            />
            {/* 周边名称 */}
            {activeModal.name && (
              <div className="px-5 py-2 rounded-2xl text-base font-black text-white"
                style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)' }}>
                {activeModal.name}
              </div>
            )}
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>点击任意处关闭</div>
          </div>
        </div>
      )}
    </div>
  );
}
