// ============================================================
// 工具页面 - 派对游戏辅助工具集
// Design: Professional Dark Dashboard
// Tools: 随机数字生成器 / 随机选人 / 随机分组 / 倒计时 / 骰子
// ============================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { PlayerIdentity } from '@/types';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Hash, Users, Shuffle, Timer, Dice5, ChevronRight,
  Play, Pause, RotateCcw, Plus, Minus, X, Check,
  Settings, Zap, RefreshCw, Copy, ChevronDown, ChevronUp,
  Filter, ArrowRight, SkipForward
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

// ============================================================
// 工具导航
// ============================================================
type ToolId = 'random-number' | 'random-pick' | 'random-group' | 'countdown' | 'dice';

interface ToolMeta {
  id: ToolId;
  label: string;
  icon: React.ReactNode;
  desc: string;
  color: string;
}

const TOOLS: ToolMeta[] = [
  { id: 'random-number', label: '随机数字', icon: <Hash size={18} />, desc: '从范围内随机生成数字', color: '#6366f1' },
  { id: 'random-pick', label: '随机选人', icon: <Users size={18} />, desc: '从玩家中随机抽取', color: '#f43f5e' },
  { id: 'random-group', label: '随机分组', icon: <Shuffle size={18} />, desc: '将玩家随机分为若干组', color: '#f59e0b' },
  { id: 'countdown', label: '倒计时', icon: <Timer size={18} />, desc: '可自定义的倒计时器', color: '#10b981' },
  { id: 'dice', label: '骰子', icon: <Dice5 size={18} />, desc: '模拟掷骰子', color: '#06b6d4' },
];

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

  // 根据过滤条件获取可用号码池
  const availablePool = useMemo(() => {
    if (!usePlayerFilter) {
      const pool: number[] = [];
      for (let i = min; i <= max; i++) pool.push(i);
      return excludeUsed ? pool.filter(n => !usedNumbers.includes(n)) : pool;
    }
    // 从玩家身份信息过滤
    let players = state.players;
    if (filterGender !== 'all') players = players.filter(p => p.gender === filterGender);
    if (filterSocial !== 'all') players = players.filter(p => p.socialType === filterSocial);
    const pool = players.map(p => p.number);
    return excludeUsed ? pool.filter(n => !usedNumbers.includes(n)) : pool;
  }, [usePlayerFilter, min, max, excludeUsed, usedNumbers, state.players, filterGender, filterSocial]);

  const handleGenerate = () => {
    if (availablePool.length === 0) {
      toast.error('没有可用的号码');
      return;
    }
    const actualCount = Math.min(count, availablePool.length);
    setAnimating(true);

    // 滚动动画
    let ticks = 0;
    const maxTicks = 18;
    if (animRef.current) clearInterval(animRef.current);
    animRef.current = setInterval(() => {
      ticks++;
      const tempResults: number[] = [];
      for (let i = 0; i < actualCount; i++) {
        tempResults.push(availablePool[Math.floor(Math.random() * availablePool.length)]);
      }
      setDisplayNums(tempResults);
      if (ticks >= maxTicks) {
        clearInterval(animRef.current!);
        // 最终结果
        const shuffled = [...availablePool].sort(() => Math.random() - 0.5);
        const finalResults = shuffled.slice(0, actualCount);
        setResults(finalResults);
        setDisplayNums(finalResults);
        if (excludeUsed) setUsedNumbers(prev => [...prev, ...finalResults]);
        setAnimating(false);
      }
    }, 60);
  };

  const handleReset = () => {
    setMin(1);
    setMax(state.players.length || 30);
    setCount(1);
    setExcludeUsed(false);
    setUsedNumbers([]);
    setResults([]);
    setDisplayNums([]);
    setFilterGender('all');
    setFilterSocial('all');
    setUsePlayerFilter(false);
    toast.success('已复原默认设置');
  };

  const handleClearUsed = () => {
    setUsedNumbers([]);
    toast.success('已清除已用号码');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(results.join(', '));
    toast.success('已复制结果');
  };

  const genderLabel = { all: '不限性别', male: '男', female: '女' };
  const socialLabel = { all: '不限社交', introvert: '社恐', extrovert: '社牛' };

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto p-1">
      {/* 结果展示 */}
      <div className="flex flex-col items-center justify-center min-h-[160px] rounded-2xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.08),transparent_70%)]" />
        {displayNums.length > 0 ? (
          <div className="flex flex-wrap gap-3 justify-center p-4 relative z-10">
            {displayNums.map((n, i) => (
              <div key={i} className={cn('font-mono-display text-5xl font-black text-indigo-300 tabular-nums transition-all', animating && 'blur-[1px]')}>
                {String(n).padStart(2, '0')}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground/40 text-sm relative z-10">点击生成按钮</div>
        )}
      </div>

      {/* 设置区 */}
      <div className="space-y-3">
        {/* 玩家过滤开关 */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-secondary/30 border border-border">
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-muted-foreground" />
            <span className="text-sm font-medium">按玩家身份过滤</span>
          </div>
          <Switch checked={usePlayerFilter} onCheckedChange={setUsePlayerFilter} />
        </div>

        {usePlayerFilter ? (
          <div className="space-y-2 px-3 py-2 rounded-xl bg-secondary/20 border border-border">
            <div className="flex gap-1.5">
              {(['all', 'male', 'female'] as const).map(g => (
                <button key={g} onClick={() => setFilterGender(g)}
                  className={cn('flex-1 text-xs py-1.5 rounded-lg border transition-all', filterGender === g ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-300' : 'border-border text-muted-foreground hover:text-foreground')}>
                  {genderLabel[g]}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {(['all', 'introvert', 'extrovert'] as const).map(s => (
                <button key={s} onClick={() => setFilterSocial(s)}
                  className={cn('flex-1 text-xs py-1.5 rounded-lg border transition-all', filterSocial === s ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-300' : 'border-border text-muted-foreground hover:text-foreground')}>
                  {socialLabel[s]}
                </button>
              ))}
            </div>
            <div className="text-xs text-muted-foreground/60 text-center">
              可用号码池：{availablePool.length} 个
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">最小值</label>
              <div className="flex items-center gap-1">
                <button onClick={() => setMin(m => Math.max(0, m - 1))} className="w-7 h-8 rounded-lg border border-border bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"><Minus size={12} /></button>
                <Input type="number" value={min} onChange={e => setMin(parseInt(e.target.value) || 0)} className="flex-1 h-8 text-center text-sm bg-secondary/50 border-border" />
                <button onClick={() => setMin(m => Math.min(m + 1, max))} className="w-7 h-8 rounded-lg border border-border bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"><Plus size={12} /></button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">最大值</label>
              <div className="flex items-center gap-1">
                <button onClick={() => setMax(m => Math.max(min, m - 1))} className="w-7 h-8 rounded-lg border border-border bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"><Minus size={12} /></button>
                <Input type="number" value={max} onChange={e => setMax(parseInt(e.target.value) || 1)} className="flex-1 h-8 text-center text-sm bg-secondary/50 border-border" />
                <button onClick={() => setMax(m => m + 1)} className="w-7 h-8 rounded-lg border border-border bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"><Plus size={12} /></button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">生成数量</label>
          <div className="flex items-center gap-1">
            <button onClick={() => setCount(c => Math.max(1, c - 1))} className="w-7 h-8 rounded-lg border border-border bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"><Minus size={12} /></button>
            <Input type="number" value={count} min={1} onChange={e => setCount(Math.max(1, parseInt(e.target.value) || 1))} className="flex-1 h-8 text-center text-sm bg-secondary/50 border-border" />
            <button onClick={() => setCount(c => c + 1)} className="w-7 h-8 rounded-lg border border-border bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"><Plus size={12} /></button>
          </div>
        </div>

        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-secondary/30 border border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">排除已用号码</span>
            {usedNumbers.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono">{usedNumbers.length}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {usedNumbers.length > 0 && (
              <button onClick={handleClearUsed} className="text-xs text-muted-foreground hover:text-foreground transition-colors">清除</button>
            )}
            <Switch checked={excludeUsed} onCheckedChange={setExcludeUsed} />
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <Button onClick={handleGenerate} disabled={animating} className="flex-1 bg-indigo-600 hover:bg-indigo-500 h-11 text-base font-bold gap-2">
          <Zap size={16} className={animating ? 'animate-pulse' : ''} />
          {animating ? '生成中...' : '生成'}
        </Button>
        {results.length > 0 && (
          <Button variant="outline" onClick={handleCopy} className="h-11 px-4">
            <Copy size={14} />
          </Button>
        )}
        <Button variant="outline" onClick={handleReset} className="h-11 px-4">
          <RotateCcw size={14} />
        </Button>
      </div>

      {/* 已用号码展示 */}
      {usedNumbers.length > 0 && (
        <div className="px-3 py-2 rounded-xl bg-secondary/20 border border-border">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">已用号码</div>
          <div className="flex flex-wrap gap-1">
            {usedNumbers.map((n, i) => (
              <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono">{n}</span>
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

  const pool = useMemo(() => {
    let players = [...state.players];
    if (filterGender !== 'all') players = players.filter(p => p.gender === filterGender);
    if (filterSocial !== 'all') players = players.filter(p => p.socialType === filterSocial);
    if (excludePicked) players = players.filter(p => !pickedHistory.includes(p.number));
    return players;
  }, [state.players, filterGender, filterSocial, excludePicked, pickedHistory]);

  const handlePick = () => {
    if (pool.length === 0) {
      toast.error('没有可选的玩家');
      return;
    }
    const actualCount = Math.min(pickCount, pool.length);
    setAnimating(true);

    let ticks = 0;
    const maxTicks = 16;
    if (animRef.current) clearInterval(animRef.current);
    animRef.current = setInterval(() => {
      ticks++;
      const temp: PlayerIdentity[] = [];
      for (let i = 0; i < actualCount; i++) {
        temp.push(pool[Math.floor(Math.random() * pool.length)]);
      }
      setDisplayPlayers(temp);
      if (ticks >= maxTicks) {
        clearInterval(animRef.current!);
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        const final = shuffled.slice(0, actualCount);
        setResults(final);
        setDisplayPlayers(final);
        if (excludePicked) setPickedHistory(prev => [...prev, ...final.map(p => p.number)]);
        setAnimating(false);
      }
    }, 60);
  };

  const genderIcon = { male: '♂', female: '♀', unknown: '?' };
  const socialIcon = { introvert: '🌙', extrovert: '☀️', unknown: '—' };

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto p-1">
      {/* 结果展示 */}
      <div className="flex flex-col items-center justify-center min-h-[160px] rounded-2xl bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(244,63,94,0.08),transparent_70%)]" />
        {displayPlayers.length > 0 ? (
          <div className="flex flex-wrap gap-3 justify-center p-4 relative z-10">
            {displayPlayers.map((p, i) => (
              <div key={i} className={cn('flex flex-col items-center gap-1 transition-all', animating && 'blur-[1px]')}>
                <div className="font-mono-display text-5xl font-black text-rose-300 tabular-nums">
                  {String(p.number).padStart(2, '0')}
                </div>
                <div className="flex gap-1">
                  {p.gender !== 'unknown' && <span className="text-xs px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{genderIcon[p.gender]}</span>}
                  {p.socialType !== 'unknown' && <span className="text-xs px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{socialIcon[p.socialType]}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground/40 text-sm relative z-10">点击选人按钮</div>
        )}
      </div>

      {/* 过滤设置 */}
      <div className="space-y-2">
        <div className="flex gap-1.5">
          {(['all', 'male', 'female'] as const).map(g => (
            <button key={g} onClick={() => setFilterGender(g)}
              className={cn('flex-1 text-xs py-1.5 rounded-lg border transition-all', filterGender === g ? 'border-rose-500/50 bg-rose-500/15 text-rose-300' : 'border-border text-muted-foreground hover:text-foreground')}>
              {g === 'all' ? '不限' : g === 'male' ? '♂ 男' : '♀ 女'}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(['all', 'introvert', 'extrovert'] as const).map(s => (
            <button key={s} onClick={() => setFilterSocial(s)}
              className={cn('flex-1 text-xs py-1.5 rounded-lg border transition-all', filterSocial === s ? 'border-rose-500/50 bg-rose-500/15 text-rose-300' : 'border-border text-muted-foreground hover:text-foreground')}>
              {s === 'all' ? '不限' : s === 'introvert' ? '🌙 社恐' : '☀️ 社牛'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">选取数量</label>
        <div className="flex items-center gap-1">
          <button onClick={() => setPickCount(c => Math.max(1, c - 1))} className="w-7 h-8 rounded-lg border border-border bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"><Minus size={12} /></button>
          <Input type="number" value={pickCount} min={1} onChange={e => setPickCount(Math.max(1, parseInt(e.target.value) || 1))} className="flex-1 h-8 text-center text-sm bg-secondary/50 border-border" />
          <button onClick={() => setPickCount(c => c + 1)} className="w-7 h-8 rounded-lg border border-border bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"><Plus size={12} /></button>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-secondary/30 border border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">排除已选玩家</span>
          {pickedHistory.length > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono">{pickedHistory.length}</span>}
        </div>
        <div className="flex items-center gap-2">
          {pickedHistory.length > 0 && <button onClick={() => setPickedHistory([])} className="text-xs text-muted-foreground hover:text-foreground transition-colors">清除</button>}
          <Switch checked={excludePicked} onCheckedChange={setExcludePicked} />
        </div>
      </div>

      <div className="text-xs text-muted-foreground/60 text-center">可选玩家：{pool.length} 人</div>

      <Button onClick={handlePick} disabled={animating || pool.length === 0} className="h-11 text-base font-bold gap-2 bg-rose-600 hover:bg-rose-500">
        <Users size={16} className={animating ? 'animate-pulse' : ''} />
        {animating ? '选取中...' : '随机选人'}
      </Button>
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

  const pool = useMemo(() => {
    let players = [...state.players];
    if (filterGender !== 'all') players = players.filter(p => p.gender === filterGender);
    if (filterSocial !== 'all') players = players.filter(p => p.socialType === filterSocial);
    return players;
  }, [state.players, filterGender, filterSocial]);

  const handleGroup = () => {
    if (pool.length === 0) { toast.error('没有可用的玩家'); return; }
    if (groupCount < 2) { toast.error('至少需要分成 2 组'); return; }
    setAnimating(true);

    setTimeout(() => {
      let players = [...pool];

      if (balanceGender) {
        // 性别均衡分组：交替分配男女
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

  const GROUP_COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#64748b'];

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto p-1">
      {/* 设置 */}
      <div className="space-y-3">
        <div className="flex gap-1.5">
          {(['all', 'male', 'female'] as const).map(g => (
            <button key={g} onClick={() => setFilterGender(g)}
              className={cn('flex-1 text-xs py-1.5 rounded-lg border transition-all', filterGender === g ? 'border-amber-500/50 bg-amber-500/15 text-amber-300' : 'border-border text-muted-foreground hover:text-foreground')}>
              {g === 'all' ? '不限' : g === 'male' ? '♂ 男' : '♀ 女'}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(['all', 'introvert', 'extrovert'] as const).map(s => (
            <button key={s} onClick={() => setFilterSocial(s)}
              className={cn('flex-1 text-xs py-1.5 rounded-lg border transition-all', filterSocial === s ? 'border-amber-500/50 bg-amber-500/15 text-amber-300' : 'border-border text-muted-foreground hover:text-foreground')}>
              {s === 'all' ? '不限' : s === 'introvert' ? '🌙 社恐' : '☀️ 社牛'}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">分组数量</label>
          <div className="flex items-center gap-1">
            <button onClick={() => setGroupCount(c => Math.max(2, c - 1))} className="w-7 h-8 rounded-lg border border-border bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"><Minus size={12} /></button>
            <Input type="number" value={groupCount} min={2} onChange={e => setGroupCount(Math.max(2, parseInt(e.target.value) || 2))} className="flex-1 h-8 text-center text-sm bg-secondary/50 border-border" />
            <button onClick={() => setGroupCount(c => c + 1)} className="w-7 h-8 rounded-lg border border-border bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"><Plus size={12} /></button>
          </div>
        </div>

        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-secondary/30 border border-border">
          <span className="text-sm font-medium">性别均衡分组</span>
          <Switch checked={balanceGender} onCheckedChange={setBalanceGender} />
        </div>

        <div className="text-xs text-muted-foreground/60 text-center">参与玩家：{pool.length} 人 → 每组约 {Math.ceil(pool.length / groupCount)} 人</div>

        <Button onClick={handleGroup} disabled={animating || pool.length === 0} className="w-full h-11 text-base font-bold gap-2 bg-amber-600 hover:bg-amber-500">
          <Shuffle size={16} className={animating ? 'animate-spin' : ''} />
          {animating ? '分组中...' : '随机分组'}
        </Button>
      </div>

      {/* 分组结果 */}
      {groups.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">分组结果</div>
          {groups.map((group, gi) => (
            <div key={gi} className="rounded-xl border overflow-hidden" style={{ borderColor: GROUP_COLORS[gi % GROUP_COLORS.length] + '40' }}>
              <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold" style={{ backgroundColor: GROUP_COLORS[gi % GROUP_COLORS.length] + '20', color: GROUP_COLORS[gi % GROUP_COLORS.length] }}>
                <span>第 {gi + 1} 组</span>
                <span className="ml-auto opacity-70">{group.length} 人</span>
              </div>
              <div className="flex flex-wrap gap-1.5 px-3 py-2 bg-secondary/10">
                {group.map(p => (
                  <span key={p.id} className="font-mono-display text-sm font-bold px-2 py-0.5 rounded-lg bg-secondary/50 text-foreground">
                    #{p.number}
                    {p.gender !== 'unknown' && <span className="ml-0.5 text-muted-foreground text-xs">{p.gender === 'male' ? '♂' : '♀'}</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
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
    setTotalSeconds(secs);
    setRemaining(secs);
    setRunning(false);
    setFinished(false);
  };

  const handleReset = () => {
    setRunning(false);
    setFinished(false);
    setRemaining(totalSeconds);
  };

  const handleToggle = () => {
    if (finished) { handleReset(); return; }
    setRunning(r => !r);
  };

  const handleCustomSet = () => {
    const secs = parseInt(customInput);
    if (!secs || secs <= 0) { toast.error('请输入有效秒数'); return; }
    handleSetTime(secs);
    setCustomInput('');
  };

  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  const getColor = () => {
    if (finished) return '#f43f5e';
    if (progress > 0.5) return '#10b981';
    if (progress > 0.25) return '#f59e0b';
    return '#f43f5e';
  };

  const circumference = 2 * Math.PI * 90;

  return (
    <div className="flex flex-col items-center gap-5 h-full overflow-y-auto p-1">
      {/* 圆形进度 */}
      <div className="relative flex items-center justify-center">
        <svg width="220" height="220" className="-rotate-90">
          <circle cx="110" cy="110" r="90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          <circle
            cx="110" cy="110" r="90"
            fill="none"
            stroke={getColor()}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease', filter: `drop-shadow(0 0 8px ${getColor()}80)` }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <div className={cn('font-mono-display text-5xl font-black tabular-nums transition-colors', finished && 'animate-pulse')} style={{ color: getColor() }}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
          {finished && <div className="text-sm font-bold text-rose-400 mt-1 animate-bounce">时间到！</div>}
        </div>
      </div>

      {/* 预设时间 */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {presets.map(p => (
          <button key={p} onClick={() => handleSetTime(p)}
            className={cn('text-xs px-2.5 py-1 rounded-lg border transition-all', totalSeconds === p && !running ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300' : 'border-border text-muted-foreground hover:text-foreground')}>
            {p >= 60 ? `${p / 60}分` : `${p}秒`}
          </button>
        ))}
      </div>

      {/* 自定义时间 */}
      <div className="flex gap-2 w-full">
        <Input
          type="number"
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          placeholder="自定义秒数..."
          className="flex-1 h-8 text-sm bg-secondary/50 border-border"
          onKeyDown={e => e.key === 'Enter' && handleCustomSet()}
        />
        <Button size="sm" variant="outline" onClick={handleCustomSet} className="h-8 px-3">设置</Button>
      </div>

      {/* 控制按钮 */}
      <div className="flex gap-3 w-full">
        <Button
          onClick={handleToggle}
          className={cn('flex-1 h-12 text-base font-bold gap-2', finished ? 'bg-rose-600 hover:bg-rose-500' : running ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500')}
        >
          {finished ? <><RotateCcw size={16} />重置</> : running ? <><Pause size={16} />暂停</> : <><Play size={16} />开始</>}
        </Button>
        <Button variant="outline" onClick={handleReset} className="h-12 px-4">
          <RotateCcw size={16} />
        </Button>
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

  const handleRoll = () => {
    setRolling(true);
    let ticks = 0;
    const maxTicks = 15;
    if (animRef.current) clearInterval(animRef.current);
    animRef.current = setInterval(() => {
      ticks++;
      setDisplayFaces(Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1));
      if (ticks >= maxTicks) {
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
    <div className="flex flex-col items-center gap-5 h-full overflow-y-auto p-1">
      {/* 骰子展示 */}
      <div className="flex flex-col items-center justify-center min-h-[180px] w-full rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.08),transparent_70%)]" />
        {displayFaces.length > 0 ? (
          <div className="flex flex-wrap gap-4 justify-center p-4 relative z-10">
            {displayFaces.map((face, i) => (
              <div key={i} className={cn('text-7xl transition-all select-none', rolling && 'animate-bounce')} style={{ animationDelay: `${i * 0.1}s` }}>
                {DICE_FACES[face - 1]}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-6xl opacity-20 relative z-10">🎲</div>
        )}
        {results.length > 1 && !rolling && (
          <div className="text-sm text-cyan-400 font-bold relative z-10">总点数：{total}</div>
        )}
      </div>

      {/* 骰子数量 */}
      <div className="space-y-1.5 w-full">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">骰子数量</label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <button key={n} onClick={() => setDiceCount(n)}
              className={cn('flex-1 h-9 rounded-lg border text-sm font-bold transition-all', diceCount === n ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300' : 'border-border text-muted-foreground hover:text-foreground')}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={handleRoll} disabled={rolling} className="w-full h-12 text-base font-bold gap-2 bg-cyan-700 hover:bg-cyan-600">
        <Dice5 size={18} className={rolling ? 'animate-spin' : ''} />
        {rolling ? '掷骰中...' : '掷骰子'}
      </Button>

      {/* 历史 */}
      {results.length > 0 && !rolling && (
        <div className="w-full px-3 py-2 rounded-xl bg-secondary/20 border border-border text-center">
          <div className="text-xs text-muted-foreground mb-1">结果</div>
          <div className="font-mono-display text-2xl font-bold text-cyan-300">{results.join(' + ')}{results.length > 1 && ` = ${total}`}</div>
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

  const renderTool = () => {
    switch (activeTool) {
      case 'random-number': return <RandomNumberTool />;
      case 'random-pick': return <RandomPickTool />;
      case 'random-group': return <RandomGroupTool />;
      case 'countdown': return <CountdownTool />;
      case 'dice': return <DiceTool />;
    }
  };

  const activeMeta = TOOLS.find(t => t.id === activeTool)!;

  return (
    <div className="h-full flex overflow-hidden">
      {/* 左侧工具导航 */}
      <div className="w-48 flex-shrink-0 border-r border-border flex flex-col overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border flex-shrink-0">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">工具箱</span>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left',
                activeTool === tool.id
                  ? 'border-opacity-50 text-foreground'
                  : 'border-border bg-secondary/20 hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
              )}
              style={activeTool === tool.id ? { borderColor: tool.color + '60', backgroundColor: tool.color + '15', color: tool.color } : {}}
            >
              <span style={activeTool === tool.id ? { color: tool.color } : {}}>{tool.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{tool.label}</div>
                <div className="text-[10px] text-muted-foreground/60 truncate">{tool.desc}</div>
              </div>
              {activeTool === tool.id && <ChevronRight size={12} style={{ color: tool.color }} />}
            </button>
          ))}
        </div>
      </div>

      {/* 右侧工具内容 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 工具标题栏 */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border flex-shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: activeMeta.color + '20', color: activeMeta.color }}>
            {activeMeta.icon}
          </div>
          <div>
            <div className="font-bold text-foreground">{activeMeta.label}</div>
            <div className="text-xs text-muted-foreground">{activeMeta.desc}</div>
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
