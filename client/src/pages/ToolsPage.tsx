// ============================================================
// 工具箱页面
// Design: 奇妙奇遇 v2 — 工具感 · 微醺夜晚 · 清晰层级
// Tools: 随机数字 / 随机选人 / 随机分组 / 倒计时 / 骰子
// ============================================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { PlayerIdentity } from '@/types';
import { toast } from 'sonner';
import {
  Hash, Users, Shuffle, Timer, Dice5, ChevronRight,
  Play, Pause, RotateCcw, Plus, Minus, Zap, Copy, Filter
} from 'lucide-react';

// ============================================================
// 工具元数据
// ============================================================
type ToolId = 'random-number' | 'random-pick' | 'random-group' | 'countdown' | 'dice';

interface ToolMeta {
  id: ToolId;
  label: string;
  icon: React.ReactNode;
  desc: string;
  accentColor: string;
  glowColor: string;
}

const TOOLS: ToolMeta[] = [
  {
    id: 'random-number',
    label: '随机数字',
    icon: <Hash size={16} />,
    desc: '从范围内随机生成数字',
    accentColor: 'oklch(0.60 0.20 285)',
    glowColor: 'oklch(0.60 0.20 285 / 0.2)',
  },
  {
    id: 'random-pick',
    label: '随机选人',
    icon: <Users size={16} />,
    desc: '从玩家中随机抽取',
    accentColor: 'oklch(0.62 0.22 10)',
    glowColor: 'oklch(0.62 0.22 10 / 0.2)',
  },
  {
    id: 'random-group',
    label: '随机分组',
    icon: <Shuffle size={16} />,
    desc: '将玩家随机分为若干组',
    accentColor: 'oklch(0.78 0.16 52)',
    glowColor: 'oklch(0.78 0.16 52 / 0.2)',
  },
  {
    id: 'countdown',
    label: '倒计时',
    icon: <Timer size={16} />,
    desc: '可自定义的倒计时器',
    accentColor: 'oklch(0.65 0.18 155)',
    glowColor: 'oklch(0.65 0.18 155 / 0.2)',
  },
  {
    id: 'dice',
    label: '骰子',
    icon: <Dice5 size={16} />,
    desc: '模拟掷骰子',
    accentColor: 'oklch(0.68 0.18 200)',
    glowColor: 'oklch(0.68 0.18 200 / 0.2)',
  },
];

// ============================================================
// 共用样式工具函数
// ============================================================
const filterBtnStyle = (active: boolean, accentColor: string) => active
  ? { background: `${accentColor.replace(')', ' / 0.15)')}`, border: `1px solid ${accentColor.replace(')', ' / 0.4)')}`, color: accentColor }
  : { background: 'oklch(0.155 0.022 270)', border: '1px solid oklch(0.22 0.022 270)', color: 'oklch(0.50 0.015 270)' };

const numInputStyle = {
  background: 'oklch(0.19 0.022 270)',
  border: '1px solid oklch(0.28 0.022 270)',
  color: 'oklch(0.82 0.008 270)',
};

const numBtnStyle = {
  background: 'oklch(0.19 0.022 270)',
  border: '1px solid oklch(0.26 0.022 270)',
  color: 'oklch(0.55 0.02 270)',
};

// ============================================================
// 随机数字生成器
// ============================================================
function RandomNumberTool() {
  const { state } = useApp();
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(state.players.length || 30);
  const [count, setCount] = useState(1);
  const [excludeUsed, setExcludeUsed] = useState(false);
  const [usedNumbers, setUsedNumbers] = useState<number[]>([]);
  const [results, setResults] = useState<number[]>([]);
  const [animating, setAnimating] = useState(false);
  const [displayNums, setDisplayNums] = useState<number[]>([]);
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');
  const [filterSocial, setFilterSocial] = useState<'all' | 'introvert' | 'extrovert'>('all');
  const [usePlayerFilter, setUsePlayerFilter] = useState(false);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const accent = 'oklch(0.60 0.20 285)';

  const availablePool = useMemo(() => {
    if (!usePlayerFilter) {
      const pool: number[] = [];
      for (let i = min; i <= max; i++) pool.push(i);
      return excludeUsed ? pool.filter(n => !usedNumbers.includes(n)) : pool;
    }
    let players = state.players;
    if (filterGender !== 'all') players = players.filter(p => p.gender === filterGender);
    if (filterSocial !== 'all') players = players.filter(p => p.socialType === filterSocial);
    const pool = players.map(p => p.number);
    return excludeUsed ? pool.filter(n => !usedNumbers.includes(n)) : pool;
  }, [usePlayerFilter, min, max, excludeUsed, usedNumbers, state.players, filterGender, filterSocial]);

  const handleGenerate = () => {
    if (availablePool.length === 0) { toast.error('没有可用的号码'); return; }
    const actualCount = Math.min(count, availablePool.length);
    setAnimating(true);
    let ticks = 0;
    if (animRef.current) clearInterval(animRef.current);
    animRef.current = setInterval(() => {
      ticks++;
      setDisplayNums(Array.from({ length: actualCount }, () => availablePool[Math.floor(Math.random() * availablePool.length)]));
      if (ticks >= 18) {
        clearInterval(animRef.current!);
        const final = [...availablePool].sort(() => Math.random() - 0.5).slice(0, actualCount);
        setResults(final);
        setDisplayNums(final);
        if (excludeUsed) setUsedNumbers(prev => [...prev, ...final]);
        setAnimating(false);
      }
    }, 60);
  };

  const handleReset = () => {
    setMin(1); setMax(state.players.length || 30); setCount(1);
    setExcludeUsed(false); setUsedNumbers([]); setResults([]); setDisplayNums([]);
    setFilterGender('all'); setFilterSocial('all'); setUsePlayerFilter(false);
    toast.success('已复原默认设置');
  };

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* 结果展示区 */}
      <div
        className="flex flex-col items-center justify-center min-h-[140px] rounded-2xl relative overflow-hidden"
        style={{
          background: 'oklch(0.60 0.20 285 / 0.06)',
          border: '1px solid oklch(0.60 0.20 285 / 0.2)',
          boxShadow: displayNums.length > 0 ? '0 0 32px oklch(0.60 0.20 285 / 0.08)' : 'none',
        }}
      >
        {displayNums.length > 0 ? (
          <div className="flex flex-wrap gap-4 justify-center p-4">
            {displayNums.map((n, i) => (
              <div
                key={i}
                className="font-mono-display tabular-nums transition-all"
                style={{
                  fontSize: displayNums.length > 3 ? '2.5rem' : '3.5rem',
                  fontWeight: 900,
                  color: accent,
                  filter: animating ? 'blur(1.5px)' : 'none',
                  textShadow: animating ? 'none' : `0 0 20px ${accent}60`,
                }}
              >
                {String(n).padStart(2, '0')}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm" style={{ color: 'oklch(0.35 0.015 270)' }}>点击生成按钮</div>
        )}
      </div>

      {/* 过滤模式切换 */}
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer"
        style={{ background: 'oklch(0.155 0.022 270)', border: '1px solid oklch(0.22 0.022 270)' }}
        onClick={() => setUsePlayerFilter(v => !v)}
      >
        <div className="flex items-center gap-2">
          <Filter size={13} style={{ color: usePlayerFilter ? accent : 'oklch(0.50 0.015 270)' }} />
          <span className="text-sm font-semibold" style={{ color: 'oklch(0.82 0.008 270)' }}>按玩家身份过滤</span>
        </div>
        <div
          className="w-9 h-5 rounded-full transition-all relative"
          style={{ background: usePlayerFilter ? 'oklch(0.60 0.20 285 / 0.4)' : 'oklch(0.22 0.022 270)', border: `1px solid ${usePlayerFilter ? accent : 'oklch(0.28 0.022 270)'}` }}
        >
          <div
            className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
            style={{ background: usePlayerFilter ? accent : 'oklch(0.40 0.015 270)', left: usePlayerFilter ? '18px' : '2px' }}
          />
        </div>
      </div>

      {usePlayerFilter ? (
        <div className="space-y-2 px-3 py-3 rounded-xl" style={{ background: 'oklch(0.155 0.022 270)', border: '1px solid oklch(0.22 0.022 270)' }}>
          <div className="flex gap-1.5">
            {(['all', 'male', 'female'] as const).map(g => (
              <button key={g} onClick={() => setFilterGender(g)} className="flex-1 text-xs py-1.5 rounded-xl font-semibold transition-all" style={filterBtnStyle(filterGender === g, accent)}>
                {g === 'all' ? '不限' : g === 'male' ? '♂ 男' : '♀ 女'}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {(['all', 'introvert', 'extrovert'] as const).map(s => (
              <button key={s} onClick={() => setFilterSocial(s)} className="flex-1 text-xs py-1.5 rounded-xl font-semibold transition-all" style={filterBtnStyle(filterSocial === s, accent)}>
                {s === 'all' ? '不限' : s === 'introvert' ? '🌙 社恐' : '☀️ 社牛'}
              </button>
            ))}
          </div>
          <div className="text-xs text-center" style={{ color: 'oklch(0.45 0.015 270)' }}>可用号码池：{availablePool.length} 个</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {[{ label: '最小值', val: min, setVal: setMin, onDec: () => setMin(m => Math.max(0, m - 1)), onInc: () => setMin(m => Math.min(m + 1, max)) },
            { label: '最大值', val: max, setVal: setMax, onDec: () => setMax(m => Math.max(min, m - 1)), onInc: () => setMax(m => m + 1) }
          ].map(({ label, val, setVal, onDec, onInc }) => (
            <div key={label} className="space-y-1.5">
              <label className="text-xs font-bold tracking-widest uppercase" style={{ color: 'oklch(0.40 0.015 270)', letterSpacing: '0.1em' }}>{label}</label>
              <div className="flex items-center gap-1">
                <button onClick={onDec} className="w-7 h-8 rounded-xl flex items-center justify-center transition-all" style={numBtnStyle}><Minus size={12} /></button>
                <input type="number" value={val} onChange={e => setVal(parseInt(e.target.value) || 0)} className="flex-1 h-8 text-center text-sm rounded-xl outline-none" style={numInputStyle} />
                <button onClick={onInc} className="w-7 h-8 rounded-xl flex items-center justify-center transition-all" style={numBtnStyle}><Plus size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-bold tracking-widest uppercase" style={{ color: 'oklch(0.40 0.015 270)', letterSpacing: '0.1em' }}>生成数量</label>
        <div className="flex items-center gap-1">
          <button onClick={() => setCount(c => Math.max(1, c - 1))} className="w-7 h-8 rounded-xl flex items-center justify-center" style={numBtnStyle}><Minus size={12} /></button>
          <input type="number" value={count} min={1} onChange={e => setCount(Math.max(1, parseInt(e.target.value) || 1))} className="flex-1 h-8 text-center text-sm rounded-xl outline-none" style={numInputStyle} />
          <button onClick={() => setCount(c => c + 1)} className="w-7 h-8 rounded-xl flex items-center justify-center" style={numBtnStyle}><Plus size={12} /></button>
        </div>
      </div>

      {/* 排除已用 */}
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer"
        style={{ background: 'oklch(0.155 0.022 270)', border: '1px solid oklch(0.22 0.022 270)' }}
        onClick={() => setExcludeUsed(v => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: 'oklch(0.82 0.008 270)' }}>排除已用号码</span>
          {usedNumbers.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-mono font-bold" style={{ background: 'oklch(0.78 0.16 52 / 0.15)', color: 'oklch(0.78 0.16 52)' }}>{usedNumbers.length}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {usedNumbers.length > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setUsedNumbers([]); toast.success('已清除'); }}
              className="text-xs"
              style={{ color: 'oklch(0.50 0.015 270)' }}
            >
              清除
            </button>
          )}
          <div
            className="w-9 h-5 rounded-full transition-all relative"
            style={{ background: excludeUsed ? 'oklch(0.60 0.20 285 / 0.4)' : 'oklch(0.22 0.022 270)', border: `1px solid ${excludeUsed ? accent : 'oklch(0.28 0.022 270)'}` }}
          >
            <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all" style={{ background: excludeUsed ? accent : 'oklch(0.40 0.015 270)', left: excludeUsed ? '18px' : '2px' }} />
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={animating}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
          style={{
            background: 'oklch(0.60 0.20 285 / 0.2)',
            border: '1px solid oklch(0.60 0.20 285 / 0.5)',
            color: accent,
            boxShadow: '0 0 16px oklch(0.60 0.20 285 / 0.12)',
          }}
        >
          <Zap size={15} className={animating ? 'animate-pulse' : ''} />
          {animating ? '生成中...' : '生成'}
        </button>
        {results.length > 0 && (
          <button
            onClick={() => { navigator.clipboard.writeText(results.join(', ')); toast.success('已复制'); }}
            className="px-4 py-3 rounded-xl transition-all"
            style={{ background: 'oklch(0.155 0.022 270)', border: '1px solid oklch(0.22 0.022 270)', color: 'oklch(0.55 0.02 270)' }}
          >
            <Copy size={14} />
          </button>
        )}
        <button
          onClick={handleReset}
          className="px-4 py-3 rounded-xl transition-all"
          style={{ background: 'oklch(0.155 0.022 270)', border: '1px solid oklch(0.22 0.022 270)', color: 'oklch(0.55 0.02 270)' }}
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* 已用号码 */}
      {usedNumbers.length > 0 && (
        <div className="px-3 py-2.5 rounded-xl" style={{ background: 'oklch(0.155 0.022 270)', border: '1px solid oklch(0.22 0.022 270)' }}>
          <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'oklch(0.40 0.015 270)', letterSpacing: '0.1em' }}>已用号码</div>
          <div className="flex flex-wrap gap-1">
            {usedNumbers.map((n, i) => (
              <span key={i} className="text-xs px-1.5 py-0.5 rounded-lg font-mono" style={{ background: 'oklch(0.19 0.022 270)', color: 'oklch(0.50 0.015 270)' }}>{n}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 随机选人
// ============================================================
function RandomPickTool() {
  const { state } = useApp();
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');
  const [filterSocial, setFilterSocial] = useState<'all' | 'introvert' | 'extrovert'>('all');
  const [pickCount, setPickCount] = useState(1);
  const [excludePicked, setExcludePicked] = useState(true);
  const [pickedHistory, setPickedHistory] = useState<number[]>([]);
  const [results, setResults] = useState<PlayerIdentity[]>([]);
  const [animating, setAnimating] = useState(false);
  const [displayPlayers, setDisplayPlayers] = useState<PlayerIdentity[]>([]);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const accent = 'oklch(0.62 0.22 10)';

  const pool = useMemo(() => {
    let players = [...state.players];
    if (filterGender !== 'all') players = players.filter(p => p.gender === filterGender);
    if (filterSocial !== 'all') players = players.filter(p => p.socialType === filterSocial);
    if (excludePicked) players = players.filter(p => !pickedHistory.includes(p.number));
    return players;
  }, [state.players, filterGender, filterSocial, excludePicked, pickedHistory]);

  const handlePick = () => {
    if (pool.length === 0) { toast.error('没有可选的玩家'); return; }
    const actualCount = Math.min(pickCount, pool.length);
    setAnimating(true);
    let ticks = 0;
    if (animRef.current) clearInterval(animRef.current);
    animRef.current = setInterval(() => {
      ticks++;
      setDisplayPlayers(Array.from({ length: actualCount }, () => pool[Math.floor(Math.random() * pool.length)]));
      if (ticks >= 16) {
        clearInterval(animRef.current!);
        const final = [...pool].sort(() => Math.random() - 0.5).slice(0, actualCount);
        setResults(final);
        setDisplayPlayers(final);
        if (excludePicked) setPickedHistory(prev => [...prev, ...final.map(p => p.number)]);
        setAnimating(false);
      }
    }, 60);
  };

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* 结果展示 */}
      <div
        className="flex flex-col items-center justify-center min-h-[140px] rounded-2xl relative overflow-hidden"
        style={{
          background: 'oklch(0.62 0.22 10 / 0.06)',
          border: '1px solid oklch(0.62 0.22 10 / 0.2)',
          boxShadow: displayPlayers.length > 0 ? '0 0 32px oklch(0.62 0.22 10 / 0.08)' : 'none',
        }}
      >
        {displayPlayers.length > 0 ? (
          <div className="flex flex-wrap gap-4 justify-center p-4">
            {displayPlayers.map((p, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 transition-all" style={{ filter: animating ? 'blur(1.5px)' : 'none' }}>
                <div
                  className="font-mono-display tabular-nums"
                  style={{
                    fontSize: displayPlayers.length > 3 ? '2.5rem' : '3.5rem',
                    fontWeight: 900,
                    color: accent,
                    textShadow: animating ? 'none' : `0 0 20px ${accent}60`,
                  }}
                >
                  {String(p.number).padStart(2, '0')}
                </div>
                <div className="flex gap-1">
                  {p.gender !== 'unknown' && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'oklch(0.19 0.022 270)', color: 'oklch(0.60 0.02 270)' }}>
                      {p.gender === 'male' ? '♂' : '♀'}
                    </span>
                  )}
                  {p.socialType !== 'unknown' && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'oklch(0.19 0.022 270)', color: 'oklch(0.60 0.02 270)' }}>
                      {p.socialType === 'introvert' ? '🌙' : '☀️'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm" style={{ color: 'oklch(0.35 0.015 270)' }}>点击选人按钮</div>
        )}
      </div>

      {/* 过滤 */}
      <div className="space-y-2">
        <div className="flex gap-1.5">
          {(['all', 'male', 'female'] as const).map(g => (
            <button key={g} onClick={() => setFilterGender(g)} className="flex-1 text-xs py-1.5 rounded-xl font-semibold transition-all" style={filterBtnStyle(filterGender === g, accent)}>
              {g === 'all' ? '不限' : g === 'male' ? '♂ 男' : '♀ 女'}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(['all', 'introvert', 'extrovert'] as const).map(s => (
            <button key={s} onClick={() => setFilterSocial(s)} className="flex-1 text-xs py-1.5 rounded-xl font-semibold transition-all" style={filterBtnStyle(filterSocial === s, accent)}>
              {s === 'all' ? '不限' : s === 'introvert' ? '🌙 社恐' : '☀️ 社牛'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold tracking-widest uppercase" style={{ color: 'oklch(0.40 0.015 270)', letterSpacing: '0.1em' }}>选取数量</label>
        <div className="flex items-center gap-1">
          <button onClick={() => setPickCount(c => Math.max(1, c - 1))} className="w-7 h-8 rounded-xl flex items-center justify-center" style={numBtnStyle}><Minus size={12} /></button>
          <input type="number" value={pickCount} min={1} onChange={e => setPickCount(Math.max(1, parseInt(e.target.value) || 1))} className="flex-1 h-8 text-center text-sm rounded-xl outline-none" style={numInputStyle} />
          <button onClick={() => setPickCount(c => c + 1)} className="w-7 h-8 rounded-xl flex items-center justify-center" style={numBtnStyle}><Plus size={12} /></button>
        </div>
      </div>

      {/* 排除已选 */}
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer"
        style={{ background: 'oklch(0.155 0.022 270)', border: '1px solid oklch(0.22 0.022 270)' }}
        onClick={() => setExcludePicked(v => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: 'oklch(0.82 0.008 270)' }}>排除已选玩家</span>
          {pickedHistory.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-mono font-bold" style={{ background: 'oklch(0.78 0.16 52 / 0.15)', color: 'oklch(0.78 0.16 52)' }}>{pickedHistory.length}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {pickedHistory.length > 0 && (
            <button onClick={e => { e.stopPropagation(); setPickedHistory([]); }} className="text-xs" style={{ color: 'oklch(0.50 0.015 270)' }}>清除</button>
          )}
          <div className="w-9 h-5 rounded-full transition-all relative" style={{ background: excludePicked ? 'oklch(0.62 0.22 10 / 0.4)' : 'oklch(0.22 0.022 270)', border: `1px solid ${excludePicked ? accent : 'oklch(0.28 0.022 270)'}` }}>
            <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all" style={{ background: excludePicked ? accent : 'oklch(0.40 0.015 270)', left: excludePicked ? '18px' : '2px' }} />
          </div>
        </div>
      </div>

      <div className="text-xs text-center" style={{ color: 'oklch(0.40 0.015 270)' }}>可选玩家：{pool.length} 人</div>

      <button
        onClick={handlePick}
        disabled={animating || pool.length === 0}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
        style={{ background: 'oklch(0.62 0.22 10 / 0.2)', border: '1px solid oklch(0.62 0.22 10 / 0.5)', color: accent, boxShadow: '0 0 16px oklch(0.62 0.22 10 / 0.1)' }}
      >
        <Users size={15} className={animating ? 'animate-pulse' : ''} />
        {animating ? '选取中...' : '随机选人'}
      </button>
    </div>
  );
}

// ============================================================
// 随机分组
// ============================================================
function RandomGroupTool() {
  const { state } = useApp();
  const [groupCount, setGroupCount] = useState(2);
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');
  const [filterSocial, setFilterSocial] = useState<'all' | 'introvert' | 'extrovert'>('all');
  const [balanceGender, setBalanceGender] = useState(false);
  const [groups, setGroups] = useState<PlayerIdentity[][]>([]);
  const [animating, setAnimating] = useState(false);
  const accent = 'oklch(0.78 0.16 52)';

  const pool = useMemo(() => {
    let players = [...state.players];
    if (filterGender !== 'all') players = players.filter(p => p.gender === filterGender);
    if (filterSocial !== 'all') players = players.filter(p => p.socialType === filterSocial);
    return players;
  }, [state.players, filterGender, filterSocial]);

  const GROUP_ACCENT_COLORS = [
    'oklch(0.60 0.20 285)', 'oklch(0.62 0.22 10)', 'oklch(0.78 0.16 52)',
    'oklch(0.65 0.18 155)', 'oklch(0.68 0.18 200)', 'oklch(0.65 0.18 320)',
    'oklch(0.72 0.18 60)', 'oklch(0.60 0.18 240)',
  ];

  const handleGroup = () => {
    if (pool.length === 0) { toast.error('没有可用的玩家'); return; }
    if (groupCount < 2) { toast.error('至少需要分成 2 组'); return; }
    setAnimating(true);
    setTimeout(() => {
      let players = [...pool];
      if (balanceGender) {
        const males = players.filter(p => p.gender === 'male').sort(() => Math.random() - 0.5);
        const females = players.filter(p => p.gender === 'female').sort(() => Math.random() - 0.5);
        const others = players.filter(p => p.gender === 'unknown').sort(() => Math.random() - 0.5);
        players = [];
        const maxLen = Math.max(males.length, females.length, others.length);
        for (let i = 0; i < maxLen; i++) {
          if (i < males.length) players.push(males[i]);
          if (i < females.length) players.push(females[i]);
          if (i < others.length) players.push(others[i]);
        }
      } else {
        players = players.sort(() => Math.random() - 0.5);
      }
      const result: PlayerIdentity[][] = Array.from({ length: groupCount }, () => []);
      players.forEach((p, i) => result[i % groupCount].push(p));
      setGroups(result);
      setAnimating(false);
    }, 600);
  };

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      <div className="space-y-2">
        <div className="flex gap-1.5">
          {(['all', 'male', 'female'] as const).map(g => (
            <button key={g} onClick={() => setFilterGender(g)} className="flex-1 text-xs py-1.5 rounded-xl font-semibold transition-all" style={filterBtnStyle(filterGender === g, accent)}>
              {g === 'all' ? '不限' : g === 'male' ? '♂ 男' : '♀ 女'}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(['all', 'introvert', 'extrovert'] as const).map(s => (
            <button key={s} onClick={() => setFilterSocial(s)} className="flex-1 text-xs py-1.5 rounded-xl font-semibold transition-all" style={filterBtnStyle(filterSocial === s, accent)}>
              {s === 'all' ? '不限' : s === 'introvert' ? '🌙 社恐' : '☀️ 社牛'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold tracking-widest uppercase" style={{ color: 'oklch(0.40 0.015 270)', letterSpacing: '0.1em' }}>分组数量</label>
        <div className="flex items-center gap-1">
          <button onClick={() => setGroupCount(c => Math.max(2, c - 1))} className="w-7 h-8 rounded-xl flex items-center justify-center" style={numBtnStyle}><Minus size={12} /></button>
          <input type="number" value={groupCount} min={2} onChange={e => setGroupCount(Math.max(2, parseInt(e.target.value) || 2))} className="flex-1 h-8 text-center text-sm rounded-xl outline-none" style={numInputStyle} />
          <button onClick={() => setGroupCount(c => c + 1)} className="w-7 h-8 rounded-xl flex items-center justify-center" style={numBtnStyle}><Plus size={12} /></button>
        </div>
      </div>

      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer"
        style={{ background: 'oklch(0.155 0.022 270)', border: '1px solid oklch(0.22 0.022 270)' }}
        onClick={() => setBalanceGender(v => !v)}
      >
        <span className="text-sm font-semibold" style={{ color: 'oklch(0.82 0.008 270)' }}>性别均衡分组</span>
        <div className="w-9 h-5 rounded-full transition-all relative" style={{ background: balanceGender ? 'oklch(0.78 0.16 52 / 0.4)' : 'oklch(0.22 0.022 270)', border: `1px solid ${balanceGender ? accent : 'oklch(0.28 0.022 270)'}` }}>
          <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all" style={{ background: balanceGender ? accent : 'oklch(0.40 0.015 270)', left: balanceGender ? '18px' : '2px' }} />
        </div>
      </div>

      <div className="text-xs text-center" style={{ color: 'oklch(0.40 0.015 270)' }}>
        参与玩家：{pool.length} 人 → 每组约 {Math.ceil(pool.length / groupCount)} 人
      </div>

      <button
        onClick={handleGroup}
        disabled={animating || pool.length === 0}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
        style={{ background: 'oklch(0.78 0.16 52 / 0.15)', border: '1px solid oklch(0.78 0.16 52 / 0.4)', color: accent }}
      >
        <Shuffle size={15} className={animating ? 'animate-spin' : ''} />
        {animating ? '分组中...' : '随机分组'}
      </button>

      {groups.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold tracking-widest uppercase" style={{ color: 'oklch(0.40 0.015 270)', letterSpacing: '0.1em' }}>分组结果</div>
          {groups.map((group, gi) => {
            const color = GROUP_ACCENT_COLORS[gi % GROUP_ACCENT_COLORS.length];
            return (
              <div key={gi} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${color.replace(')', ' / 0.3)')}` }}>
                <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold" style={{ background: `${color.replace(')', ' / 0.12)')}`, color }}>
                  <span>第 {gi + 1} 组</span>
                  <span className="ml-auto" style={{ opacity: 0.7 }}>{group.length} 人</span>
                </div>
                <div className="flex flex-wrap gap-1.5 px-3 py-2" style={{ background: 'oklch(0.155 0.022 270)' }}>
                  {group.map(p => (
                    <span key={p.id} className="inline-flex items-center gap-0.5 font-mono-display text-sm font-bold px-2 py-0.5 rounded-lg" style={{ background: 'oklch(0.19 0.022 270)', color: 'oklch(0.82 0.008 270)', border: '1px solid oklch(0.26 0.022 270)' }}>
                      #{p.number}
                      {p.gender !== 'unknown' && <span className="ml-0.5 text-xs" style={{ color: p.gender === 'male' ? '#64b5f6' : '#f48fb1' }}>{p.gender === 'male' ? '♂' : '♀'}</span>}
                      {p.socialType !== 'unknown' && <span className="text-xs">{p.socialType === 'extrovert' ? '☀️' : '🌙'}</span>}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 倒计时
// ============================================================
function CountdownTool() {
  const [totalSeconds, setTotalSeconds] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [presets] = useState([15, 30, 60, 90, 120, 180, 300]);
  const [customInput, setCustomInput] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            setFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handleSetTime = (secs: number) => {
    setTotalSeconds(secs); setRemaining(secs); setRunning(false); setFinished(false);
  };

  const handleReset = () => { setRunning(false); setFinished(false); setRemaining(totalSeconds); };
  const handleToggle = () => { if (finished) { handleReset(); return; } setRunning(r => !r); };

  const handleCustomSet = () => {
    const secs = parseInt(customInput);
    if (!secs || secs <= 0) { toast.error('请输入有效秒数'); return; }
    handleSetTime(secs); setCustomInput('');
  };

  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  const getAccent = () => {
    if (finished) return 'oklch(0.62 0.22 10)';
    if (progress > 0.5) return 'oklch(0.65 0.18 155)';
    if (progress > 0.25) return 'oklch(0.78 0.16 52)';
    return 'oklch(0.62 0.22 10)';
  };

  const circumference = 2 * Math.PI * 90;
  const accent = getAccent();

  return (
    <div className="flex flex-col items-center gap-5 h-full overflow-y-auto">
      {/* 圆形进度 */}
      <div className="relative flex items-center justify-center">
        <svg width="220" height="220" className="-rotate-90">
          <circle cx="110" cy="110" r="90" fill="none" stroke="oklch(0.20 0.022 270)" strokeWidth="10" />
          <circle
            cx="110" cy="110" r="90"
            fill="none"
            stroke={accent}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease', filter: `drop-shadow(0 0 10px ${accent}80)` }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <div
            className="font-mono-display tabular-nums transition-colors"
            style={{
              fontSize: '3rem',
              fontWeight: 900,
              color: accent,
              textShadow: `0 0 24px ${accent}60`,
              animation: finished ? 'pulse 1s infinite' : 'none',
            }}
          >
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
          {finished && (
            <div className="text-sm font-bold mt-1" style={{ color: 'oklch(0.62 0.22 10)', animation: 'bounce 1s infinite' }}>
              时间到！
            </div>
          )}
        </div>
      </div>

      {/* 预设时间 */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {presets.map(p => (
          <button
            key={p}
            onClick={() => handleSetTime(p)}
            className="text-xs px-2.5 py-1 rounded-xl font-semibold transition-all"
            style={filterBtnStyle(totalSeconds === p && !running, 'oklch(0.65 0.18 155)')}
          >
            {p >= 60 ? `${p / 60}分` : `${p}秒`}
          </button>
        ))}
      </div>

      {/* 自定义 */}
      <div className="flex gap-2 w-full">
        <input
          type="number"
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          placeholder="自定义秒数..."
          className="flex-1 h-8 px-3 text-sm rounded-xl outline-none"
          style={numInputStyle}
          onKeyDown={e => e.key === 'Enter' && handleCustomSet()}
        />
        <button
          onClick={handleCustomSet}
          className="px-3 h-8 rounded-xl text-sm font-semibold"
          style={{ background: 'oklch(0.155 0.022 270)', border: '1px solid oklch(0.22 0.022 270)', color: 'oklch(0.60 0.02 270)' }}
        >
          设置
        </button>
      </div>

      {/* 控制按钮 */}
      <div className="flex gap-3 w-full">
        <button
          onClick={handleToggle}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
          style={
            finished
              ? { background: 'oklch(0.62 0.22 10 / 0.2)', border: '1px solid oklch(0.62 0.22 10 / 0.5)', color: 'oklch(0.72 0.20 10)' }
              : running
              ? { background: 'oklch(0.78 0.16 52 / 0.2)', border: '1px solid oklch(0.78 0.16 52 / 0.5)', color: 'oklch(0.78 0.16 52)' }
              : { background: 'oklch(0.65 0.18 155 / 0.2)', border: '1px solid oklch(0.65 0.18 155 / 0.5)', color: 'oklch(0.65 0.18 155)' }
          }
        >
          {finished ? <><RotateCcw size={15} />重置</> : running ? <><Pause size={15} />暂停</> : <><Play size={15} />开始</>}
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-3 rounded-xl transition-all"
          style={{ background: 'oklch(0.155 0.022 270)', border: '1px solid oklch(0.22 0.022 270)', color: 'oklch(0.55 0.02 270)' }}
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 骰子
// ============================================================
const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

function DiceTool() {
  const [diceCount, setDiceCount] = useState(1);
  const [results, setResults] = useState<number[]>([]);
  const [rolling, setRolling] = useState(false);
  const [displayFaces, setDisplayFaces] = useState<number[]>([]);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const accent = 'oklch(0.68 0.18 200)';

  const handleRoll = () => {
    setRolling(true);
    let ticks = 0;
    if (animRef.current) clearInterval(animRef.current);
    animRef.current = setInterval(() => {
      ticks++;
      setDisplayFaces(Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1));
      if (ticks >= 15) {
        clearInterval(animRef.current!);
        const final = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
        setResults(final);
        setDisplayFaces(final);
        setRolling(false);
      }
    }, 60);
  };

  const total = results.reduce((s, n) => s + n, 0);

  return (
    <div className="flex flex-col items-center gap-5 h-full overflow-y-auto">
      {/* 骰子展示 */}
      <div
        className="flex flex-col items-center justify-center min-h-[180px] w-full rounded-2xl relative overflow-hidden"
        style={{
          background: 'oklch(0.68 0.18 200 / 0.06)',
          border: '1px solid oklch(0.68 0.18 200 / 0.2)',
          boxShadow: displayFaces.length > 0 ? '0 0 32px oklch(0.68 0.18 200 / 0.08)' : 'none',
        }}
      >
        {displayFaces.length > 0 ? (
          <div className="flex flex-wrap gap-4 justify-center p-4">
            {displayFaces.map((face, i) => (
              <div
                key={i}
                className="text-7xl select-none transition-all"
                style={{
                  animation: rolling ? `bounce 0.5s ${i * 0.1}s infinite` : 'none',
                  filter: rolling ? 'none' : `drop-shadow(0 0 8px ${accent}60)`,
                }}
              >
                {DICE_FACES[face - 1]}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-6xl opacity-20">🎲</div>
        )}
        {results.length > 1 && !rolling && (
          <div className="text-sm font-bold" style={{ color: accent }}>总点数：{total}</div>
        )}
      </div>

      {/* 骰子数量 */}
      <div className="space-y-1.5 w-full">
        <label className="text-xs font-bold tracking-widest uppercase" style={{ color: 'oklch(0.40 0.015 270)', letterSpacing: '0.1em' }}>骰子数量</label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <button
              key={n}
              onClick={() => setDiceCount(n)}
              className="flex-1 h-9 rounded-xl text-sm font-bold transition-all"
              style={filterBtnStyle(diceCount === n, accent)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleRoll}
        disabled={rolling}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
        style={{ background: 'oklch(0.68 0.18 200 / 0.15)', border: '1px solid oklch(0.68 0.18 200 / 0.4)', color: accent }}
      >
        <Dice5 size={15} className={rolling ? 'animate-spin' : ''} />
        {rolling ? '掷骰中...' : '掷骰子'}
      </button>

      {results.length > 0 && !rolling && (
        <div className="w-full px-4 py-3 rounded-xl text-center" style={{ background: 'oklch(0.155 0.022 270)', border: '1px solid oklch(0.22 0.022 270)' }}>
          <div className="text-xs mb-1" style={{ color: 'oklch(0.40 0.015 270)' }}>结果</div>
          <div className="font-mono-display text-2xl font-bold" style={{ color: accent }}>
            {results.join(' + ')}{results.length > 1 && ` = ${total}`}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 主工具页面
// ============================================================
export default function ToolsPage() {
  const [activeTool, setActiveTool] = useState<ToolId>('random-number');
  const activeMeta = TOOLS.find(t => t.id === activeTool)!;

  const renderTool = () => {
    switch (activeTool) {
      case 'random-number': return <RandomNumberTool />;
      case 'random-pick': return <RandomPickTool />;
      case 'random-group': return <RandomGroupTool />;
      case 'countdown': return <CountdownTool />;
      case 'dice': return <DiceTool />;
    }
  };

  return (
    <div className="h-full flex overflow-hidden">

      {/* ============================================================
          左侧工具导航
          ============================================================ */}
      <div
        className="w-48 flex-shrink-0 flex flex-col overflow-hidden"
        style={{ background: 'oklch(0.115 0.022 270)', borderRight: '1px solid oklch(0.20 0.022 270)' }}
      >
        <div
          className="px-4 py-3 flex-shrink-0 flex items-center gap-2"
          style={{ borderBottom: '1px solid oklch(0.18 0.02 270)' }}
        >
          <div className="w-1.5 h-4 rounded-full" style={{ background: 'oklch(0.60 0.20 285)' }} />
          <span className="text-sm font-bold" style={{ color: 'oklch(0.82 0.008 270)' }}>工具箱</span>
        </div>
        <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1">
          {TOOLS.map(tool => {
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                style={
                  isActive
                    ? {
                        background: `${tool.accentColor.replace(')', ' / 0.12)')}`,
                        border: `1px solid ${tool.accentColor.replace(')', ' / 0.3)')}`,
                      }
                    : {
                        background: 'oklch(0.155 0.022 270)',
                        border: '1px solid oklch(0.22 0.022 270)',
                      }
                }
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'oklch(0.185 0.025 270)'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'oklch(0.155 0.022 270)'; }}
              >
                <span style={{ color: isActive ? tool.accentColor : 'oklch(0.50 0.015 270)' }}>{tool.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: isActive ? tool.accentColor : 'oklch(0.72 0.015 270)' }}>
                    {tool.label}
                  </div>
                  <div className="text-[10px] truncate" style={{ color: 'oklch(0.40 0.015 270)' }}>{tool.desc}</div>
                </div>
                {isActive && <ChevronRight size={12} style={{ color: tool.accentColor, flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================
          右侧工具内容
          ============================================================ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 工具标题栏 */}
        <div
          className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid oklch(0.20 0.022 270)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `${activeMeta.accentColor.replace(')', ' / 0.15)')}`,
              border: `1px solid ${activeMeta.accentColor.replace(')', ' / 0.3)')}`,
              color: activeMeta.accentColor,
            }}
          >
            {activeMeta.icon}
          </div>
          <div>
            <div className="font-bold" style={{ color: 'oklch(0.88 0.008 270)', fontFamily: "'Noto Serif SC', serif" }}>
              {activeMeta.label}
            </div>
            <div className="text-xs" style={{ color: 'oklch(0.45 0.015 270)' }}>{activeMeta.desc}</div>
          </div>
        </div>

        {/* 工具内容 */}
        <div className="flex-1 overflow-hidden p-5">
          {renderTool()}
        </div>
      </div>
    </div>
  );
}
