// ============================================================
// ToolOverlay - 工具快捷弹层（从展台快速调用工具）
// Design: Professional Dark Dashboard
// ============================================================

import React, { useState } from 'react';
import { BoundTool } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { X, Hash, Users, Shuffle, Timer, Dice5, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ToolOverlayProps {
  tool: BoundTool;
  onClose: () => void;
}

// ---- 简化版随机数字 ----
function QuickRandomNumber() {
  const { state } = useApp();
  const [result, setResult] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);
  const max = state.players.length || 30;

  const generate = () => {
    setAnimating(true);
    let ticks = 0;
    const interval = setInterval(() => {
      ticks++;
      setResult(Math.floor(Math.random() * max) + 1);
      if (ticks >= 15) {
        clearInterval(interval);
        setResult(Math.floor(Math.random() * max) + 1);
        setAnimating(false);
      }
    }, 60);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className={cn('font-mono-display text-8xl font-black text-indigo-300 tabular-nums min-h-[100px] flex items-center', animating && 'blur-[2px]')}>
        {result !== null ? String(result).padStart(2, '0') : '??'}
      </div>
      <Button onClick={generate} disabled={animating} className="w-full bg-indigo-600 hover:bg-indigo-500 h-11 font-bold">
        生成随机数字
      </Button>
    </div>
  );
}

// ---- 简化版随机选人 ----
function QuickRandomPick() {
  const { state } = useApp();
  const [result, setResult] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);

  const pick = () => {
    if (state.players.length === 0) return;
    setAnimating(true);
    let ticks = 0;
    const interval = setInterval(() => {
      ticks++;
      const p = state.players[Math.floor(Math.random() * state.players.length)];
      setResult(p.number);
      if (ticks >= 15) {
        clearInterval(interval);
        const final = state.players[Math.floor(Math.random() * state.players.length)];
        setResult(final.number);
        setAnimating(false);
      }
    }, 60);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className={cn('font-mono-display text-8xl font-black text-rose-300 tabular-nums min-h-[100px] flex items-center', animating && 'blur-[2px]')}>
        {result !== null ? `#${String(result).padStart(2, '0')}` : '??'}
      </div>
      <Button onClick={pick} disabled={animating} className="w-full bg-rose-600 hover:bg-rose-500 h-11 font-bold">
        随机选人
      </Button>
    </div>
  );
}

// ---- 简化版倒计时 ----
function QuickCountdown() {
  const [seconds, setSeconds] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
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

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const color = finished ? '#f43f5e' : remaining / seconds > 0.5 ? '#10b981' : remaining / seconds > 0.25 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className={cn('font-mono-display text-7xl font-black tabular-nums', finished && 'animate-pulse')} style={{ color }}>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {[30, 60, 90, 120, 180].map(p => (
          <button key={p} onClick={() => { setSeconds(p); setRemaining(p); setRunning(false); setFinished(false); }}
            className={cn('text-xs px-2.5 py-1 rounded-lg border transition-all', seconds === p ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300' : 'border-border text-muted-foreground hover:text-foreground')}>
            {p >= 60 ? `${p / 60}分` : `${p}秒`}
          </button>
        ))}
      </div>
      <div className="flex gap-2 w-full">
        <Button onClick={() => { if (finished) { setRemaining(seconds); setFinished(false); } else setRunning(r => !r); }}
          className={cn('flex-1 h-11 font-bold', finished ? 'bg-rose-600 hover:bg-rose-500' : running ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500')}>
          {finished ? '重置' : running ? '暂停' : '开始'}
        </Button>
        <Button variant="outline" onClick={() => { setRunning(false); setFinished(false); setRemaining(seconds); }} className="h-11 px-4">
          <RotateCcw size={14} />
        </Button>
      </div>
    </div>
  );
}

// ---- 简化版骰子 ----
function QuickDice() {
  const FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  const [result, setResult] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);

  const roll = () => {
    setRolling(true);
    let ticks = 0;
    const interval = setInterval(() => {
      ticks++;
      setResult(Math.floor(Math.random() * 6) + 1);
      if (ticks >= 15) {
        clearInterval(interval);
        setResult(Math.floor(Math.random() * 6) + 1);
        setRolling(false);
      }
    }, 60);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className={cn('text-9xl min-h-[120px] flex items-center transition-all', rolling && 'animate-bounce')}>
        {result !== null ? FACES[result - 1] : '🎲'}
      </div>
      <Button onClick={roll} disabled={rolling} className="w-full bg-cyan-700 hover:bg-cyan-600 h-11 font-bold">
        掷骰子
      </Button>
    </div>
  );
}

// ---- 轮盘快捷调用 ----
function QuickWheel({ wheelId }: { wheelId: string }) {
  const { state } = useApp();
  const wheel = state.wheels.find(w => w.id === wheelId);
  if (!wheel) return <div className="p-4 text-muted-foreground text-sm text-center">轮盘不存在</div>;
  return (
    <div className="p-4 text-center">
      <div className="text-sm text-muted-foreground mb-2">轮盘：{wheel.name}</div>
      <div className="text-xs text-muted-foreground/60">请前往轮盘页面使用完整功能</div>
    </div>
  );
}

// ---- 主弹层 ----
export default function ToolOverlay({ tool, onClose }: ToolOverlayProps) {
  const toolIcons: Record<string, React.ReactNode> = {
    'random-number': <Hash size={16} />,
    'random-pick': <Users size={16} />,
    'random-group': <Shuffle size={16} />,
    'countdown': <Timer size={16} />,
    'dice': <Dice5 size={16} />,
  };

  const toolColors: Record<string, string> = {
    'random-number': '#6366f1',
    'random-pick': '#f43f5e',
    'random-group': '#f59e0b',
    'countdown': '#10b981',
    'dice': '#06b6d4',
  };

  const color = tool.type === 'wheel' ? '#8b5cf6' : (toolColors[tool.toolType || ''] || '#6366f1');

  const renderContent = () => {
    if (tool.type === 'wheel') return <QuickWheel wheelId={tool.wheelId || ''} />;
    switch (tool.toolType) {
      case 'random-number': return <QuickRandomNumber />;
      case 'random-pick': return <QuickRandomPick />;
      case 'countdown': return <QuickCountdown />;
      case 'dice': return <QuickDice />;
      default: return <div className="p-4 text-muted-foreground text-sm text-center">工具不可用</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-card border rounded-2xl w-80 overflow-hidden shadow-2xl animate-pop-in"
        style={{ borderColor: color + '40' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border" style={{ backgroundColor: color + '15' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '30', color }}>
            {tool.type === 'wheel' ? <RotateCcw size={14} /> : toolIcons[tool.toolType || '']}
          </div>
          <span className="font-bold text-sm text-foreground">{tool.label}</span>
          <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* 内容 */}
        {renderContent()}
      </div>
    </div>
  );
}
