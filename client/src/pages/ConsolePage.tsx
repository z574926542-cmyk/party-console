// ============================================================
// 奇妙奇遇控制台 - 控制台页面（完整重构）
// 功能：游戏编排 + 身份信息 + 工具弹窗
// 风格：亮色渐变 · 磨砂卡片
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';
import type { Game, BoundTool, PlayerIdentity } from '@/types';

// ============================================================
// 工具弹窗 - 快速选人
// ============================================================
function QuickPickModal({ players, onClose }: { players: PlayerIdentity[]; onClose: () => void }) {
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
    const picked = shuffled.slice(0, Math.min(count, shuffled.length)).map(p => p.number);
    setResults(picked);
  };

  const FBtn = ({ active, onClick, children, grad }: { active: boolean; onClick: () => void; children: React.ReactNode; grad: string }) => (
    <button onClick={onClick} className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150"
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
            <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.04 280)' }}>共 {eligible.length} 位符合条件</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>x</button>
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
          <div className="mb-5 p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, #e8eaf6, #fce4ec)' }}>
            <div className="section-label mb-2">选中号码</div>
            <div className="flex flex-wrap gap-2">
              {results.map(n => (
                <span key={n} className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm" style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)' }}>{n}</span>
              ))}
            </div>
          </div>
        )}
        <button onClick={handlePick} className="w-full py-3 rounded-2xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)', boxShadow: '0 4px 16px rgba(124,77,255,0.3)' }}>
          {results.length > 0 ? '再次随机' : '开始随机'}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 工具弹窗 - 快速分组
// ============================================================
function QuickGroupModal({ players, onClose }: { players: PlayerIdentity[]; onClose: () => void }) {
  const [groupCount, setGroupCount] = useState(2);
  const [balanceGender, setBalanceGender] = useState(false);
  const [balanceSocial, setBalanceSocial] = useState(false);
  const [results, setResults] = useState<number[][]>([]);

  const handleGroup = () => {
    if (players.length === 0) { toast.error('没有玩家'); return; }
    let pool = [...players];
    if (balanceGender) {
      const males = pool.filter(p => p.gender === 'male');
      const females = pool.filter(p => p.gender === 'female');
      const others = pool.filter(p => p.gender === 'unknown');
      pool = [];
      const maxLen = Math.max(males.length, females.length, others.length);
      for (let i = 0; i < maxLen; i++) {
        if (males[i]) pool.push(males[i]);
        if (females[i]) pool.push(females[i]);
        if (others[i]) pool.push(others[i]);
      }
    } else if (balanceSocial) {
      const extroverts = pool.filter(p => p.socialType === 'extrovert');
      const introverts = pool.filter(p => p.socialType === 'introvert');
      const others = pool.filter(p => p.socialType === 'unknown');
      pool = [];
      const maxLen = Math.max(extroverts.length, introverts.length, others.length);
      for (let i = 0; i < maxLen; i++) {
        if (extroverts[i]) pool.push(extroverts[i]);
        if (introverts[i]) pool.push(introverts[i]);
        if (others[i]) pool.push(others[i]);
      }
    } else {
      pool = [...players].sort(() => Math.random() - 0.5);
    }
    const groups: number[][] = Array.from({ length: groupCount }, () => []);
    pool.forEach((p, i) => groups[i % groupCount].push(p.number));
    setResults(groups);
  };

  const grads = [
    'linear-gradient(135deg,#ec407a,#7c4dff)',
    'linear-gradient(135deg,#42a5f5,#26c6da)',
    'linear-gradient(135deg,#ff8a65,#ffca28)',
    'linear-gradient(135deg,#66bb6a,#26c6da)',
    'linear-gradient(135deg,#ce93d8,#f48fb1)',
    'linear-gradient(135deg,#ffcc02,#ff8a65)',
  ];

  const CheckBox = ({ active, onToggle, label }: { active: boolean; onToggle: () => void; label: string }) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <div onClick={onToggle} className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
        style={active ? { background: 'linear-gradient(135deg,#ec407a,#7c4dff)', boxShadow: '0 2px 8px rgba(124,77,255,0.3)' } : { background: 'rgba(200,180,240,0.2)', border: '2px solid rgba(180,160,220,0.3)' }}>
        {active && <span className="text-white text-xs font-bold">v</span>}
      </div>
      <span className="text-sm font-medium" style={{ color: 'oklch(0.35 0.04 280)' }}>{label}</span>
    </label>
  );

  return (
    <div className="tool-modal-backdrop" onClick={onClose}>
      <div className="tool-modal w-[480px] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-black" style={{ color: 'oklch(0.22 0.02 280)' }}>快速分组</h3>
            <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.04 280)' }}>共 {players.length} 位玩家</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>x</button>
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
        {results.length > 0 && (
          <div className="mb-5 grid grid-cols-2 gap-3">
            {results.map((group, gi) => (
              <div key={gi} className="p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(200,180,240,0.3)' }}>
                <div className="text-xs font-bold mb-2" style={{ background: grads[gi % grads.length], WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>第 {gi + 1} 组</div>
                <div className="flex flex-wrap gap-1.5">
                  {group.map(n => (
                    <span key={n} className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs" style={{ background: grads[gi % grads.length] }}>{n}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={handleGroup} className="w-full py-3 rounded-2xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg,#42a5f5,#7c4dff)', boxShadow: '0 4px 16px rgba(66,165,245,0.3)' }}>
          {results.length > 0 ? '重新分组' : '开始分组'}
        </button>
      </div>
    </div>
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
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>x</button>
        </div>
        <div className="flex justify-center mb-5">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg width="192" height="192" className="absolute inset-0 -rotate-90">
              <circle cx="96" cy="96" r="80" fill="none" stroke="rgba(200,180,240,0.2)" strokeWidth="10"/>
              <circle cx="96" cy="96" r="80" fill="none"
                stroke={isDone ? '#66bb6a' : isWarning ? '#ff8a65' : '#7c4dff'}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={strokeDash}
                style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
              />
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
            <input type="number" min="0" max="99" placeholder="分" value={customMin} onChange={e => setCustomMin(e.target.value)}
              className="input-glass text-center w-16" />
            <span className="font-bold" style={{ color: 'oklch(0.45 0.06 280)' }}>:</span>
            <input type="number" min="0" max="59" placeholder="秒" value={customSec} onChange={e => setCustomSec(e.target.value)}
              className="input-glass text-center w-16" />
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
// 游戏编辑器
// ============================================================
interface GameEditorProps {
  game: Game;
  listItemId: string;
  players: PlayerIdentity[];
  wheels: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string; color: string }>;
  onSave: (game: Game) => void;
  onLoadToStage: () => void;
  onSaveToLibrary: () => void;
}

function GameEditor({ game, players, wheels, tags, onSave, onLoadToStage, onSaveToLibrary }: GameEditorProps) {
  const [draft, setDraft] = useState<Game>({ ...game });
  const [showToolModal, setShowToolModal] = useState<'pick' | 'group' | 'countdown' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft({ ...game }); }, [game.id]);

  const update = (patch: Partial<Game>) => {
    const updated = { ...draft, ...patch, updatedAt: Date.now() };
    setDraft(updated);
    onSave(updated);
  };

  const toggleTool = (toolType: BoundTool['toolType'], label: string) => {
    const exists = draft.tools.find(t => t.toolType === toolType);
    if (exists) {
      update({ tools: draft.tools.filter(t => t.toolType !== toolType) });
    } else {
      update({ tools: [...draft.tools, { id: nanoid(), type: 'tool', toolType, label }] });
    }
  };

  const toggleWheel = (wheelId: string, wheelName: string) => {
    const exists = draft.tools.find(t => t.wheelId === wheelId);
    if (exists) {
      update({ tools: draft.tools.filter(t => t.wheelId !== wheelId) });
    } else {
      update({ tools: [...draft.tools, { id: nanoid(), type: 'wheel', wheelId, label: wheelName }] });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      update({ settlementImages: [...draft.settlementImages, { id: nanoid(), name: file.name.replace(/\.[^/.]+$/, ''), dataUrl }] });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toolOptions = [
    { type: 'random-pick' as BoundTool['toolType'], label: '快速选人', emoji: '\uD83D\uDC64', gradient: 'linear-gradient(135deg,#ec407a,#f48fb1)' },
    { type: 'random-group' as BoundTool['toolType'], label: '快速分组', emoji: '\uD83D\uDC65', gradient: 'linear-gradient(135deg,#42a5f5,#26c6da)' },
    { type: 'countdown' as BoundTool['toolType'], label: '倒计时', emoji: '\u23F1', gradient: 'linear-gradient(135deg,#66bb6a,#26c6da)' },
  ];

  const hasTool = (type: BoundTool['toolType']) => draft.tools.some(t => t.toolType === type);
  const hasWheel = (id: string) => draft.tools.some(t => t.wheelId === id);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 顶栏 */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(200,180,240,0.2)', background: 'rgba(255,255,255,0.5)' }}>
        <span className="text-sm font-bold" style={{ color: 'oklch(0.55 0.06 310)' }}>游戏编辑器</span>
        <div className="flex items-center gap-2">
          <button onClick={onSaveToLibrary} className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all" style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>入库</button>
          <button onClick={onLoadToStage} className="px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg,#42a5f5,#26c6da)', boxShadow: '0 2px 8px rgba(66,165,245,0.3)' }}>载入展台</button>
        </div>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* 游戏名称 */}
        <div>
          <div className="section-label">游戏名称</div>
          <input className="input-glass text-base font-bold" placeholder="输入游戏名称..." value={draft.name === '无标题游戏' ? '' : draft.name} onChange={e => update({ name: e.target.value || '无标题游戏' })} />
        </div>

        {/* 游戏规则 */}
        <div>
          <div className="section-label">游戏规则</div>
          <textarea className="input-glass resize-none" rows={3} placeholder="描述游戏规则，玩家看得到这里..." value={draft.rules === '请在此处添加游戏规则' ? '' : draft.rules} onChange={e => update({ rules: e.target.value || '请在此处添加游戏规则' })} />
        </div>

        {/* 结算方式 */}
        <div>
          <div className="section-label">结算方式</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: '#66bb6a' }}>
                <span>\uD83C\uDFC6</span> 胜者结算
              </div>
              <textarea className="input-glass resize-none text-sm" rows={2} placeholder="胜者获得..." value={draft.winnerSettlement === '请在此处添加胜者结算方式' ? '' : draft.winnerSettlement} onChange={e => update({ winnerSettlement: e.target.value || '请在此处添加胜者结算方式' })} />
            </div>
            <div>
              <div className="text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: '#f48fb1' }}>
                <span>\uD83D\uDCA7</span> 败者结算
              </div>
              <textarea className="input-glass resize-none text-sm" rows={2} placeholder="败者需要..." value={draft.loserSettlement === '请在此处添加败者结算方式' ? '' : draft.loserSettlement} onChange={e => update({ loserSettlement: e.target.value || '请在此处添加败者结算方式' })} />
            </div>
          </div>
        </div>

        {/* 周边奖励 */}
        <div>
          <div className="section-label">周边奖励</div>
          <div className="rounded-2xl p-3 flex flex-col gap-2" style={{ background: 'rgba(255,255,255,0.5)', border: '1.5px dashed rgba(200,180,240,0.4)' }}>
            {draft.settlementImages.map((img, idx) => (
              <div key={img.id} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.7)' }}>
                <img src={img.dataUrl} alt={img.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <input className="text-sm font-semibold bg-transparent border-none outline-none w-full" style={{ color: 'oklch(0.25 0.02 280)' }} value={img.name}
                    onChange={e => { const imgs = [...draft.settlementImages]; imgs[idx] = { ...img, name: e.target.value }; update({ settlementImages: imgs }); }} placeholder="周边名称..." />
                  <div className="text-xs mt-0.5" style={{ color: 'oklch(0.60 0.04 280)' }}>周边奖励</div>
                </div>
                <button onClick={() => update({ settlementImages: draft.settlementImages.filter(i => i.id !== img.id) })} className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(244,143,177,0.2)', color: '#e91e63' }}>x</button>
              </div>
            ))}
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all" style={{ color: 'oklch(0.55 0.08 310)', border: '1.5px dashed rgba(200,180,240,0.4)' }}>
              <span>+</span> 添加周边奖励图片
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
        </div>

        {/* 工具绑定 */}
        <div>
          <div className="section-label">绑定工具（展台快速调用）</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {toolOptions.map(opt => (
              <button key={opt.type as string} onClick={() => toggleTool(opt.type, opt.label)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={hasTool(opt.type) ? { background: opt.gradient, color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' } : { background: 'rgba(200,180,240,0.15)', color: 'oklch(0.50 0.06 280)', border: '1.5px solid rgba(200,180,240,0.3)' }}>
                <span>{opt.emoji}</span> {opt.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {wheels.map(w => (
              <button key={w.id} onClick={() => toggleWheel(w.id, w.name)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={hasWheel(w.id) ? { background: 'linear-gradient(135deg,#ff8a65,#ffca28)', color: 'white', boxShadow: '0 2px 8px rgba(255,138,101,0.3)' } : { background: 'rgba(200,180,240,0.15)', color: 'oklch(0.50 0.06 280)', border: '1.5px solid rgba(200,180,240,0.3)' }}>
                <span>\uD83C\uDFAF</span> {w.name}
              </button>
            ))}
          </div>
        </div>

        {/* 标签 */}
        <div>
          <div className="section-label">标签</div>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => {
              const active = draft.tags.includes(tag.id);
              return (
                <button key={tag.id} onClick={() => update({ tags: active ? draft.tags.filter(t => t !== tag.id) : [...draft.tags, tag.id] })}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                  style={active ? { background: tag.color + '22', color: tag.color, border: `1.5px solid ${tag.color}55` } : { background: 'rgba(200,180,240,0.12)', color: 'oklch(0.55 0.04 280)', border: '1.5px solid rgba(200,180,240,0.25)' }}>
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 主持人备注 */}
        <div>
          <div className="section-label">主持人备注（不在展台显示）</div>
          <textarea className="input-glass resize-none text-sm" rows={2} placeholder="主持人内部备注..." value={draft.notes} onChange={e => update({ notes: e.target.value })} />
        </div>
      </div>

      {/* 工具弹窗 */}
      {showToolModal === 'pick' && <QuickPickModal players={players} onClose={() => setShowToolModal(null)} />}
      {showToolModal === 'group' && <QuickGroupModal players={players} onClose={() => setShowToolModal(null)} />}
      {showToolModal === 'countdown' && <CountdownModal onClose={() => setShowToolModal(null)} />}
    </div>
  );
}

// ============================================================
// 身份信息编辑器
// ============================================================
function IdentityEditor({ players, dispatch }: { players: PlayerIdentity[]; dispatch: React.Dispatch<any> }) {
  const updatePlayer = (player: PlayerIdentity, patch: Partial<PlayerIdentity>) => {
    dispatch({ type: 'UPDATE_PLAYER', payload: { ...player, ...patch } });
  };

  const stats = {
    male: players.filter(p => p.gender === 'male').length,
    female: players.filter(p => p.gender === 'female').length,
    extrovert: players.filter(p => p.socialType === 'extrovert').length,
    introvert: players.filter(p => p.socialType === 'introvert').length,
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 顶部统计 */}
      <div className="px-5 py-3 flex-shrink-0 flex items-center gap-4 flex-wrap" style={{ borderBottom: '1px solid rgba(200,180,240,0.2)', background: 'rgba(255,255,255,0.5)' }}>
        <span className="text-sm font-bold" style={{ color: 'oklch(0.55 0.06 310)' }}>身份信息</span>
        <div className="flex items-center gap-3">
          {[
            { label: '男', value: stats.male, grad: 'linear-gradient(135deg,#42a5f5,#1976d2)' },
            { label: '女', value: stats.female, grad: 'linear-gradient(135deg,#f48fb1,#e91e63)' },
            { label: '社牛', value: stats.extrovert, grad: 'linear-gradient(135deg,#ffca28,#ff8a65)' },
            { label: '社恐', value: stats.introvert, grad: 'linear-gradient(135deg,#9fa8da,#7c4dff)' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: s.grad }}>{s.label}</span>
              <span className="text-sm font-black" style={{ color: 'oklch(0.22 0.02 280)' }}>{s.value}</span>
            </div>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs" style={{ color: 'oklch(0.55 0.04 280)' }}>玩家数</span>
          <button onClick={() => dispatch({ type: 'SET_PLAYER_COUNT', payload: Math.max(1, players.length - 1) })} className="w-7 h-7 rounded-lg font-bold text-sm flex items-center justify-center" style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>-</button>
          <span className="text-sm font-bold w-6 text-center" style={{ color: 'oklch(0.22 0.02 280)' }}>{players.length}</span>
          <button onClick={() => dispatch({ type: 'SET_PLAYER_COUNT', payload: players.length + 1 })} className="w-7 h-7 rounded-lg font-bold text-sm flex items-center justify-center" style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>+</button>
        </div>
      </div>

      {/* 玩家网格 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}>
          {players.map(player => (
            <div key={player.id} className="rounded-2xl p-2.5 flex flex-col gap-1.5 transition-all"
              style={{ background: 'rgba(255,255,255,0.75)', border: '1.5px solid rgba(200,180,240,0.25)', boxShadow: '0 2px 8px rgba(100,80,180,0.06)' }}>
              {/* 号码 */}
              <div className="text-center font-black text-lg leading-none" style={{ color: 'oklch(0.22 0.02 280)' }}>{player.number}</div>
              {/* 性别 */}
              <div className="flex gap-1">
                <button onClick={() => updatePlayer(player, { gender: player.gender === 'male' ? 'unknown' : 'male' })} className="flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  style={player.gender === 'male' ? { background: 'linear-gradient(135deg,#42a5f5,#1976d2)', color: 'white', border: '2px solid #42a5f5', boxShadow: '0 2px 8px rgba(66,165,245,0.4)' } : { background: 'rgba(220,235,255,0.9)', color: '#1976d2', border: '2px solid rgba(66,165,245,0.5)', fontWeight: 800 }}>
                  男
                </button>
                <button onClick={() => updatePlayer(player, { gender: player.gender === 'female' ? 'unknown' : 'female' })} className="flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  style={player.gender === 'female' ? { background: 'linear-gradient(135deg,#f48fb1,#e91e63)', color: 'white', border: '2px solid #f48fb1', boxShadow: '0 2px 8px rgba(244,143,177,0.4)' } : { background: 'rgba(255,230,245,0.9)', color: '#e91e63', border: '2px solid rgba(233,30,99,0.45)', fontWeight: 800 }}>
                  女
                </button>
              </div>
              {/* 社交 */}
              <div className="flex gap-1">
                <button onClick={() => updatePlayer(player, { socialType: player.socialType === 'extrovert' ? 'unknown' : 'extrovert' })} className="flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  style={player.socialType === 'extrovert' ? { background: 'linear-gradient(135deg,#ffca28,#ff8a65)', color: 'white', border: '2px solid #ffca28', boxShadow: '0 2px 8px rgba(255,202,40,0.4)' } : { background: 'rgba(255,248,220,0.9)', color: '#e65100', border: '2px solid rgba(255,138,0,0.5)', fontWeight: 800 }}>
                  社牛
                </button>
                <button onClick={() => updatePlayer(player, { socialType: player.socialType === 'introvert' ? 'unknown' : 'introvert' })} className="flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  style={player.socialType === 'introvert' ? { background: 'linear-gradient(135deg,#9fa8da,#7c4dff)', color: 'white', border: '2px solid #9fa8da', boxShadow: '0 2px 8px rgba(159,168,218,0.4)' } : { background: 'rgba(240,238,255,0.9)', color: '#7c4dff', border: '2px solid rgba(124,77,255,0.5)', fontWeight: 800 }}>
                  社恐
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 游戏库弹窗
// ============================================================
function LibraryModal({ library, onAdd, onClose }: { library: Game[]; onAdd: (game: Game) => void; onClose: () => void }) {
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleAdd = (game: Game) => {
    onAdd(game);
    setAddedIds(prev => { const next = new Set(Array.from(prev)); next.add(game.id); return next; });
    toast.success(`已添加「${game.name}」`);
  };

  return (
    <div className="tool-modal-backdrop" onClick={onClose}>
      <div className="tool-modal w-[480px] max-h-[70vh] p-6 flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h3 className="text-lg font-black" style={{ color: 'oklch(0.22 0.02 280)' }}>游戏库</h3>
            <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.04 280)' }}>点击添加，可连续添加多个游戏</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>x</button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {library.length === 0 && (
            <div className="text-center py-12" style={{ color: 'oklch(0.60 0.04 280)' }}>
              <div className="text-3xl mb-2">\uD83D\uDCDA</div>
              <div className="text-sm">库中暂无游戏</div>
            </div>
          )}
          {library.map(game => (
            <div key={game.id} className="flex items-center gap-3 p-3 rounded-2xl transition-all" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(200,180,240,0.2)' }}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold" style={{ color: 'oklch(0.22 0.02 280)' }}>{game.name}</div>
                {game.rules && game.rules !== '请在此处添加游戏规则' && (
                  <div className="text-xs mt-0.5 truncate" style={{ color: 'oklch(0.55 0.04 280)' }}>{game.rules}</div>
                )}
              </div>
              <button onClick={() => handleAdd(game)} className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0"
                style={addedIds.has(game.id) ? { background: 'rgba(102,187,106,0.15)', color: '#388e3c', border: '1.5px solid rgba(102,187,106,0.3)' } : { background: 'linear-gradient(135deg,#ec407a,#7c4dff)', color: 'white', boxShadow: '0 2px 8px rgba(124,77,255,0.25)' }}>
                {addedIds.has(game.id) ? '已添加' : '+ 添加'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 主页面
// ============================================================
type ConsoleTab = 'games' | 'identity';

export default function ConsolePage() {
  const { state, dispatch, createNewGame } = useApp();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<ConsoleTab>('games');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);

  const selectedItem = state.currentGameList.find(item => item.id === selectedItemId);

  const handleNewGame = () => {
    const game = createNewGame();
    dispatch({ type: 'ADD_GAME_TO_LIST', payload: game });
    setTimeout(() => {
      setSelectedItemId(prev => {
        const list = state.currentGameList;
        return list.length > 0 ? list[list.length - 1].id : prev;
      });
    }, 50);
  };

  const handleSaveGame = (itemId: string, game: Game) => {
    dispatch({ type: 'UPDATE_GAME_IN_LIST', payload: { itemId, gameData: game } });
  };

  const handleSaveToLibrary = (game: Game) => {
    dispatch({ type: 'ADD_GAME_TO_LIBRARY', payload: game });
    toast.success(`「${game.name}」已入库`);
  };

  const handleLoadAllToStage = () => {
    if (state.currentGameList.length === 0) { toast.error('游戏列表为空，请先添加游戏'); return; }
    if (state.currentGameList.length > 0) {
      dispatch({ type: 'SET_STAGE_CURRENT_GAME', payload: state.currentGameList[0].id });
    }
    navigate('/stage');
    toast.success(`已载入 ${state.currentGameList.length} 个游戏到展台`);
  };

  const handleAddFromLibrary = (game: Game) => {
    dispatch({ type: 'ADD_GAME_TO_LIST', payload: game });
  };

  useEffect(() => {
    if (state.currentGameList.length > 0 && !selectedItemId) {
      setSelectedItemId(state.currentGameList[0].id);
    }
  }, [state.currentGameList.length]);

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden">
      {/* ---- 左侧面板 ---- */}
      <div
        className="flex flex-col overflow-hidden transition-all duration-300"
        style={{
          width: activeTab === 'identity' ? '100%' : '300px',
          flexShrink: 0,
          borderRight: activeTab === 'identity' ? 'none' : '1px solid rgba(200,180,240,0.2)',
          background: 'rgba(255,255,255,0.45)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* 标签切换 */}
        <div className="flex items-center gap-1 px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(200,180,240,0.2)' }}>
          <button onClick={() => setActiveTab('games')} className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
            style={activeTab === 'games' ? { background: 'linear-gradient(135deg,#ec407a,#7c4dff)', color: 'white', boxShadow: '0 2px 8px rgba(124,77,255,0.25)' } : { background: 'transparent', color: 'oklch(0.50 0.06 280)' }}>
            游戏列表
          </button>
          <button onClick={() => setActiveTab('identity')} className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
            style={activeTab === 'identity' ? { background: 'linear-gradient(135deg,#42a5f5,#26c6da)', color: 'white', boxShadow: '0 2px 8px rgba(66,165,245,0.25)' } : { background: 'transparent', color: 'oklch(0.50 0.06 280)' }}>
            身份信息
          </button>
        </div>

        {/* 游戏列表 */}
        {activeTab === 'games' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(200,180,240,0.15)' }}>
              <span className="text-xs font-semibold" style={{ color: 'oklch(0.55 0.04 280)' }}>{state.currentGameList.length} 个游戏</span>
              <div className="ml-auto flex items-center gap-1.5">
                <button onClick={() => setShowLibrary(true)} className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all" style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.50 0.06 280)' }}>从库添加</button>
                <button onClick={handleNewGame} className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)', boxShadow: '0 2px 8px rgba(124,77,255,0.25)' }}>+ 新建</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {state.currentGameList.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-12" style={{ color: 'oklch(0.60 0.04 280)' }}>
                  <div className="text-4xl mb-3">\uD83C\uDFAE</div>
                  <div className="text-sm font-medium mb-3">暂无游戏</div>
                  <button onClick={handleNewGame} className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)', boxShadow: '0 4px 14px rgba(124,77,255,0.3)' }}>+ 新建第一个游戏</button>
                </div>
              )}
              {state.currentGameList.map((item, idx) => {
                const isSelected = item.id === selectedItemId;
                return (
                  <div key={item.id} onClick={() => setSelectedItemId(item.id)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group"
                    style={isSelected ? { background: 'linear-gradient(135deg, rgba(236,64,122,0.1), rgba(124,77,255,0.1))', border: '1.5px solid rgba(124,77,255,0.25)' } : { background: 'rgba(255,255,255,0.6)', border: '1.5px solid rgba(200,180,240,0.2)' }}>
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{ background: isSelected ? 'linear-gradient(135deg,#ec407a,#7c4dff)' : 'rgba(200,180,240,0.3)' }}>{idx + 1}</span>
                    <span className="flex-1 text-sm font-semibold truncate" style={{ color: isSelected ? 'oklch(0.22 0.02 280)' : 'oklch(0.40 0.04 280)' }}>{item.gameData.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_GAME_FROM_LIST', payload: item.id }); if (selectedItemId === item.id) setSelectedItemId(null); }}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'rgba(244,143,177,0.2)', color: '#e91e63' }}>x</button>
                  </div>
                );
              })}
            </div>
            {state.currentGameList.length > 0 && (
              <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(200,180,240,0.2)' }}>
                <button onClick={handleLoadAllToStage} className="w-full py-3 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#42a5f5,#26c6da)', boxShadow: '0 4px 16px rgba(66,165,245,0.3)' }}>
                  <span>\uD83C\uDFAC</span> 载入展台（{state.currentGameList.length} 个游戏）
                </button>
              </div>
            )}
          </div>
        )}

        {/* 身份信息（全屏） */}
        {activeTab === 'identity' && (
          <div className="flex-1 overflow-hidden">
            <IdentityEditor players={state.players} dispatch={dispatch} />
          </div>
        )}
      </div>

      {/* ---- 右侧编辑器（仅游戏列表模式） ---- */}
      {activeTab === 'games' && (
        <div className="flex-1 overflow-hidden" style={{ background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(8px)' }}>
          {selectedItem ? (
            <GameEditor
              key={selectedItem.id}
              game={selectedItem.gameData}
              listItemId={selectedItem.id}
              players={state.players}
              wheels={state.wheels}
              tags={state.tags}
              onSave={(game) => handleSaveGame(selectedItem.id, game)}
              onLoadToStage={handleLoadAllToStage}
              onSaveToLibrary={() => handleSaveToLibrary(selectedItem.gameData)}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center" style={{ color: 'oklch(0.60 0.04 280)' }}>
              <div className="text-5xl mb-4">\u270F\uFE0F</div>
              <div className="text-base font-semibold mb-1">选择一个游戏开始编辑</div>
              <div className="text-sm mb-5">或点击"新建"创建一个游戏</div>
              <button onClick={handleNewGame} className="px-5 py-2.5 rounded-2xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)', boxShadow: '0 4px 14px rgba(124,77,255,0.3)' }}>+ 新建游戏</button>
            </div>
          )}
        </div>
      )}

      {/* 游戏库弹窗 */}
      {showLibrary && <LibraryModal library={state.gameLibrary} onAdd={handleAddFromLibrary} onClose={() => setShowLibrary(false)} />}
    </div>
  );
}
