// 奇妙奇遇控制台 - 结算清单页面
// 周边奖励 + 惩罚 两类结算记录，内联直接编辑（类 Word 表格）
// 风格：亮色渐变 · 磨砂白卡片

import React, { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import type { PeripheralRecord } from '@/types';

type FilterCategory = 'all' | 'reward' | 'penalty';

function InlineCell({
  value, onChange, placeholder, className, style, type = 'text',
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  className?: string; style?: React.CSSProperties; type?: string;
}) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditing(false); }}
        autoFocus className={`w-full px-2 py-1 rounded-lg text-sm outline-none ${className ?? ''}`}
        style={{ background: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(124,77,255,0.4)', ...style }}
        placeholder={placeholder}
      />
    );
  }
  return (
    <div onClick={() => setEditing(true)}
      className={`px-2 py-1 rounded-lg text-sm cursor-text transition-all min-h-[28px] flex items-center ${className ?? ''}`}
      style={style}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.6)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      title="点击编辑">
      {value || <span style={{ color: 'oklch(0.70 0.02 280)' }}>{placeholder}</span>}
    </div>
  );
}

export default function PeripheralPage() {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [search, setSearch] = useState('');
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);

  const records = state.peripheralRecords ?? [];

  // 从记录中提取所有有效玩家号，排序
  const allPlayerNumbers = useMemo(() => {
    const nums = new Set<number>();
    records.forEach(r => { if (r.playerNumber > 0) nums.add(r.playerNumber); });
    return Array.from(nums).sort((a, b) => a - b);
  }, [records]);

  const filtered = useMemo(() => records.filter(r => {
    if (!showCompleted && r.completed) return false;
    if (filter === 'reward' && r.category !== 'reward') return false;
    if (filter === 'penalty' && r.category !== 'penalty') return false;
    if (selectedPlayer !== null && r.playerNumber !== selectedPlayer) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        String(r.serialNumber).includes(q) ||
        String(r.playerNumber).includes(q) ||
        (r.title ?? '').toLowerCase().includes(q) ||
        (r.notes ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  }), [records, filter, showCompleted, search, selectedPlayer]);

  const stats = {
    total: records.length,
    reward: records.filter(r => r.category === 'reward').length,
    penalty: records.filter(r => r.category === 'penalty').length,
    completed: records.filter(r => r.completed).length,
  };

  const handleAdd = (category: 'reward' | 'penalty') => {
    const maxSerial = records.reduce((max, r) => Math.max(max, r.serialNumber), 0);
    const newRecord: PeripheralRecord = {
      id: nanoid(), serialNumber: maxSerial + 1, playerNumber: 0,
      category,
      title: '',
      notes: '', completed: false, source: 'manual' as const, createdAt: Date.now(),
    };
    dispatch({ type: 'ADD_PERIPHERAL_RECORD', payload: newRecord });
  };

  const handleUpdate = (id: string, updates: Partial<PeripheralRecord>) => {
    dispatch({ type: 'UPDATE_PERIPHERAL', payload: { id, updates } });
  };

  const handleToggleComplete = (id: string) => {
    const record = records.find(r => r.id === id);
    if (!record) return;
    dispatch({ type: 'UPDATE_PERIPHERAL', payload: { id, updates: { completed: !record.completed } } });
    toast.success(record.completed ? '已标记为待完成' : '已标记为已完成');
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'REMOVE_PERIPHERAL', payload: id });
  };

  const handleClearCompleted = () => {
    const completedIds = records.filter(r => r.completed).map(r => r.id);
    completedIds.forEach(id => dispatch({ type: 'REMOVE_PERIPHERAL', payload: id }));
    toast.success(`已清除 ${completedIds.length} 条已完成记录`);
  };

  const handleClearAll = () => {
    dispatch({ type: 'CLEAR_PERIPHERAL_RECORDS' });
    setShowClearAllConfirm(false);
    toast.success('结算列表已清空');
  };

  const SOURCE_LABELS: Record<string, string> = {
    'game-winner': '游戏胜者',
    'game-loser': '游戏败者',
    'wheel-result': '轮盘',
    'wheel': '轮盘',
    'manual': '手动',
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(232,234,246,0.5) 0%, rgba(252,228,236,0.3) 50%, rgba(224,247,250,0.4) 100%)' }}>

      {/* 顶部操作栏 */}
      <div className="flex-shrink-0 px-6 py-4"
        style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(200,180,240,0.2)' }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black mr-3" style={{ color: 'oklch(0.18 0.02 280)' }}>结算清单</h1>
            {/* 分类过滤 */}
            <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.6)', border: '1.5px solid rgba(200,180,240,0.2)' }}>
              {([
                { key: 'all' as const, label: `全部 ${stats.total}`, grad: 'linear-gradient(135deg,#ec407a,#7c4dff)' },
                { key: 'reward' as const, label: `周边奖励 ${stats.reward}`, grad: 'linear-gradient(135deg,#66bb6a,#26c6da)' },
                { key: 'penalty' as const, label: `惩罚 ${stats.penalty}`, grad: 'linear-gradient(135deg,#f48fb1,#ce93d8)' },
              ]).map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={filter === f.key
                    ? { background: f.grad, color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
                    : { background: 'transparent', color: 'oklch(0.50 0.06 280)' }
                  }>
                  {f.label}
                </button>
              ))}
            </div>
            {/* 显示已完成 */}
            <label className="flex items-center gap-1.5 cursor-pointer ml-2">
              <div onClick={() => setShowCompleted(!showCompleted)}
                className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
                style={showCompleted
                  ? { background: 'linear-gradient(135deg,#ec407a,#7c4dff)', boxShadow: '0 2px 8px rgba(124,77,255,0.3)' }
                  : { background: 'rgba(200,180,240,0.2)', border: '1.5px solid rgba(180,160,220,0.3)' }
                }>
                {showCompleted && <span className="text-white text-xs font-bold">✓</span>}
              </div>
              <span className="text-xs font-medium" style={{ color: 'oklch(0.50 0.04 280)' }}>显示已完成</span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="搜索内容…"
              className="px-3 py-1.5 rounded-xl text-sm outline-none w-40"
              style={{ background: 'rgba(255,255,255,0.8)', border: '1.5px solid rgba(200,180,240,0.3)' }} />
            {stats.completed > 0 && (
              <button onClick={handleClearCompleted}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                清除已完成
              </button>
            )}
            {records.length > 0 && (
              !showClearAllConfirm ? (
                <button onClick={() => setShowClearAllConfirm(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}>
                  🗑 清空列表
                </button>
              ) : (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>确认清空？</span>
                  <button onClick={handleClearAll}
                    className="px-2 py-0.5 rounded-lg text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#ef4444,#b91c1c)' }}>
                    确认
                  </button>
                  <button onClick={() => setShowClearAllConfirm(false)}
                    className="px-2 py-0.5 rounded-lg text-xs font-bold"
                    style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.45 0.06 280)' }}>
                    取消
                  </button>
                </div>
              )
            )}
            <button onClick={() => handleAdd('reward')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#66bb6a,#26c6da)', boxShadow: '0 2px 8px rgba(102,187,106,0.3)' }}>
              + 周边奖励
            </button>
            <button onClick={() => handleAdd('penalty')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#f48fb1,#ce93d8)', boxShadow: '0 2px 8px rgba(244,143,177,0.3)' }}>
              + 惩罚
            </button>
          </div>
        </div>
      </div>

      {/* 玩家号快速筛选条 */}
      {allPlayerNumbers.length > 0 && (
        <div className="flex-shrink-0 px-6 py-2 flex items-center gap-2 flex-wrap"
          style={{ background: 'rgba(255,255,255,0.35)', borderBottom: '1px solid rgba(200,180,240,0.15)' }}>
          <span className="text-xs font-semibold flex-shrink-0" style={{ color: 'oklch(0.55 0.04 280)' }}>按玩家：</span>
          <button
            onClick={() => setSelectedPlayer(null)}
            className="px-2.5 py-1 rounded-xl text-xs font-bold transition-all"
            style={selectedPlayer === null
              ? { background: 'linear-gradient(135deg,#ec407a,#7c4dff)', color: 'white', boxShadow: '0 2px 6px rgba(124,77,255,0.3)' }
              : { background: 'rgba(200,180,240,0.15)', color: 'oklch(0.50 0.06 280)', border: '1px solid rgba(200,180,240,0.25)' }
            }>
            全部
          </button>
          {allPlayerNumbers.map(num => {
            const playerRecords = records.filter(r => r.playerNumber === num);
            const pendingCount = playerRecords.filter(r => !r.completed).length;
            return (
              <button
                key={num}
                onClick={() => setSelectedPlayer(selectedPlayer === num ? null : num)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all"
                style={selectedPlayer === num
                  ? { background: 'linear-gradient(135deg,#ec407a,#7c4dff)', color: 'white', boxShadow: '0 2px 6px rgba(124,77,255,0.3)' }
                  : { background: 'rgba(200,180,240,0.15)', color: 'oklch(0.50 0.06 280)', border: '1px solid rgba(200,180,240,0.25)' }
                }>
                <span className="w-5 h-5 rounded-lg flex items-center justify-center font-black text-xs"
                  style={selectedPlayer === num
                    ? { background: 'rgba(255,255,255,0.25)' }
                    : { background: 'linear-gradient(135deg,#ec407a,#7c4dff)', color: 'white' }
                  }>{num}</span>
                {pendingCount > 0 && (
                  <span className="px-1 rounded-full text-xs font-bold"
                    style={selectedPlayer === num
                      ? { background: 'rgba(255,255,255,0.3)', color: 'white' }
                      : { background: 'rgba(239,68,68,0.15)', color: '#ef4444' }
                    }>{pendingCount}</span>
                )}
              </button>
            );
          })}
          {selectedPlayer !== null && (
            <span className="text-xs ml-1" style={{ color: 'oklch(0.60 0.04 280)' }}>
              共 {filtered.length} 条记录，{filtered.filter(r => !r.completed).length} 条待完成
            </span>
          )}
        </div>
      )}

      {/* 表格区域 */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4" style={{ color: 'oklch(0.60 0.04 280)' }}>
            <div className="text-5xl">📋</div>
            <div className="text-base font-semibold">
              {search ? '没有找到匹配的记录' : filter === 'reward' ? '暂无周边奖励记录' : filter === 'penalty' ? '暂无惩罚记录' : '结算清单为空'}
            </div>
            <div className="text-sm" style={{ color: 'oklch(0.70 0.02 280)' }}>
              在展台完成游戏结算后会自动同步，也可手动添加
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleAdd('reward')} className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#66bb6a,#26c6da)' }}>
                + 周边奖励
              </button>
              <button onClick={() => handleAdd('penalty')} className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#f48fb1,#ce93d8)' }}>
                + 惩罚
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(200,180,240,0.2)', boxShadow: '0 4px 20px rgba(100,80,180,0.06)' }}>
            {/* 表头 */}
            <div className="grid text-xs font-bold px-4 py-3"
              style={{
                gridTemplateColumns: '36px 44px 56px 80px 1fr 110px 80px 80px 36px',
                background: 'rgba(200,180,240,0.12)',
                borderBottom: '1px solid rgba(200,180,240,0.2)',
                color: 'oklch(0.50 0.06 280)'
              }}>
              <div></div>
              <div className="text-center">#</div>
              <div className="text-center">玩家</div>
              <div>分类</div>
              <div>结算内容</div>
              <div>备注</div>
              <div>来源</div>
              <div>状态</div>
              <div></div>
            </div>
            {/* 数据行 */}
            {filtered.map(record => {
              const isReward = record.category === 'reward';
              const rowBg = record.completed
                ? 'transparent'
                : isReward ? 'rgba(232,245,233,0.5)' : 'rgba(252,228,236,0.5)';
              return (
                <div key={record.id}
                  className="grid items-center px-4 py-2 transition-all"
                  style={{
                    gridTemplateColumns: '36px 44px 56px 80px 1fr 110px 80px 80px 36px',
                    opacity: record.completed ? 0.6 : 1,
                    borderBottom: '1px solid rgba(200,180,240,0.1)',
                    background: rowBg,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.6)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = rowBg; }}>
                  {/* 完成勾选 */}
                  <div className="flex items-center justify-center">
                    <button onClick={() => handleToggleComplete(record.id)}
                      className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
                      style={record.completed
                        ? { background: 'linear-gradient(135deg,#66bb6a,#26c6da)', boxShadow: '0 2px 6px rgba(102,187,106,0.4)' }
                        : { background: 'rgba(255,255,255,0.8)', border: '1.5px solid rgba(200,180,240,0.4)' }}>
                      {record.completed && <span className="text-white text-xs font-bold">✓</span>}
                    </button>
                  </div>
                  {/* 序号 */}
                  <div className="text-xs font-bold text-center" style={{ color: 'oklch(0.55 0.04 280)' }}>
                    {record.serialNumber}
                  </div>
                  {/* 玩家号 */}
                  <InlineCell
                    value={record.playerNumber > 0 ? String(record.playerNumber) : ''}
                    onChange={v => handleUpdate(record.id, { playerNumber: parseInt(v) || 0 })}
                    placeholder="号" type="number"
                    className="text-center font-black"
                    style={{ color: isReward ? '#2e7d32' : '#b71c1c', textDecoration: record.completed ? 'line-through' : 'none' }}
                  />
                  {/* 分类标签 */}
                  <div>
                    <button
                      onClick={() => handleUpdate(record.id, { category: isReward ? 'penalty' : 'reward' })}
                      className="px-2 py-0.5 rounded-full text-xs font-bold transition-all"
                      style={isReward
                        ? { background: 'linear-gradient(135deg,#66bb6a,#26c6da)', color: 'white' }
                        : { background: 'linear-gradient(135deg,#f48fb1,#ce93d8)', color: 'white' }
                      }
                      title="点击切换分类">
                      {isReward ? '🏆 周边' : '💧 惩罚'}
                    </button>
                  </div>
                  {/* 结算内容 */}
                  <InlineCell
                    value={record.title ?? ''}
                    onChange={v => handleUpdate(record.id, { title: v })}
                    placeholder="点击填写结算内容…"
                    style={{ color: 'oklch(0.25 0.02 280)', fontWeight: '600', textDecoration: record.completed ? 'line-through' : 'none' }}
                  />
                  {/* 备注 */}
                  <InlineCell
                    value={record.notes ?? ''}
                    onChange={v => handleUpdate(record.id, { notes: v })}
                    placeholder="备注…"
                    style={{ color: 'oklch(0.50 0.04 280)', fontSize: '0.8rem' }}
                  />
                  {/* 来源 */}
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: 'rgba(200,180,240,0.2)', color: 'oklch(0.50 0.04 280)' }}>
                      {SOURCE_LABELS[record.source] ?? record.source}
                    </span>
                  </div>
                  {/* 状态 */}
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={record.completed
                        ? { background: 'rgba(102,187,106,0.12)', color: '#2e7d32', border: '1px solid rgba(102,187,106,0.3)' }
                        : { background: 'rgba(245,158,11,0.12)', color: '#b45309', border: '1px solid rgba(245,158,11,0.3)' }}>
                      {record.completed ? '已完成' : '待完成'}
                    </span>
                  </div>
                  {/* 删除 */}
                  <div className="flex items-center justify-center">
                    <button onClick={() => handleDelete(record.id)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-sm transition-all"
                      style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', opacity: 0.3 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0.3'; }}>
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
            {/* 底部添加行 */}
            <div className="flex gap-3 px-4 py-3" style={{ borderTop: '1px solid rgba(200,180,240,0.15)' }}>
              <button onClick={() => handleAdd('reward')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'rgba(102,187,106,0.1)', color: '#2e7d32', border: '1.5px dashed rgba(102,187,106,0.35)' }}>
                + 添加周边奖励行
              </button>
              <button onClick={() => handleAdd('penalty')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'rgba(244,143,177,0.1)', color: '#b71c1c', border: '1.5px dashed rgba(244,143,177,0.35)' }}>
                + 添加惩罚行
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
