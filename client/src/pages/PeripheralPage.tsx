// 奇妙奇遇控制台 - 周边清单页面
// 内联直接编辑（类 Word 表格），无需进入额外编辑界面
// 支持：手动添加行、直接点击编辑、标记完成、筛选统计

import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import type { PeripheralRecord } from '@/types';

type FilterType = 'all' | 'pending' | 'completed';

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  'game-settlement': { label: '游戏结算', color: '#6366f1' },
  'wheel-result':    { label: '轮盘抽奖', color: '#ec4899' },
  'manual':          { label: '手动添加', color: '#10b981' },
};

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
      style={{ ...style }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.6)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      title="点击编辑">
      {value || <span style={{ color: 'oklch(0.70 0.02 280)' }}>{placeholder}</span>}
    </div>
  );
}

export default function PeripheralPage() {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  const records = state.peripheralRecords ?? [];

  const filtered = useMemo(() => records.filter(r => {
    if (filter === 'pending' && r.completed) return false;
    if (filter === 'completed' && !r.completed) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        String(r.serialNumber).includes(q) ||
        String(r.playerNumber).includes(q) ||
        (r.peripheralCode ?? '').toLowerCase().includes(q) ||
        (r.notes ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  }), [records, filter, search]);

  const totalCount = records.length;
  const pendingCount = records.filter(r => !r.completed).length;
  const completedCount = records.filter(r => r.completed).length;

  const handleAdd = () => {
    const maxSerial = records.reduce((max, r) => Math.max(max, r.serialNumber), 0);
    const newRecord: PeripheralRecord = {
      id: nanoid(), serialNumber: maxSerial + 1, playerNumber: 0,
      peripheralCode: `M-${String(maxSerial + 1).padStart(4, '0')}`,
      notes: '', completed: false, source: 'manual', createdAt: Date.now(),
    };
    dispatch({ type: 'ADD_PERIPHERAL_RECORD', payload: newRecord });
    setTimeout(() => {
      document.getElementById('peripheral-table-bottom')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      {/* 顶部统计 + 操作栏 */}
      <div className="flex-shrink-0 px-6 py-4"
        style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(200,180,240,0.2)' }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {([
              { label: '全部', count: totalCount, key: 'all' as FilterType, color: '#7c4dff' },
              { label: '待完成', count: pendingCount, key: 'pending' as FilterType, color: '#f59e0b' },
              { label: '已完成', count: completedCount, key: 'completed' as FilterType, color: '#10b981' },
            ] as const).map(item => (
              <button key={item.key} onClick={() => setFilter(item.key)}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl transition-all font-bold text-sm"
                style={filter === item.key
                  ? { background: `${item.color}18`, border: `1.5px solid ${item.color}55`, color: item.color }
                  : { background: 'rgba(255,255,255,0.6)', border: '1.5px solid rgba(200,180,240,0.2)', color: 'oklch(0.55 0.04 280)' }}>
                <span className="text-lg font-black" style={{ color: item.color }}>{item.count}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="搜索编号、玩家、备注…"
              className="input-glass px-3 py-2 text-sm w-52" />
            {completedCount > 0 && (
              <button onClick={handleClearCompleted}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                清除已完成
              </button>
            )}
            <button onClick={handleAdd}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)', boxShadow: '0 4px 12px rgba(124,77,255,0.3)' }}>
              + 添加记录
            </button>
          </div>
        </div>
      </div>

      {/* 表格区域 */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4" style={{ color: 'oklch(0.60 0.04 280)' }}>
            <div className="text-5xl">🎁</div>
            <div className="text-base font-semibold">
              {search ? '没有找到匹配的记录' : filter === 'completed' ? '还没有已完成的记录' : filter === 'pending' ? '太棒了！没有待完成的记录' : '周边清单为空'}
            </div>
            {!search && filter === 'all' && (
              <>
                <div className="text-sm" style={{ color: 'oklch(0.70 0.02 280)' }}>游戏结算或轮盘抽奖后会自动同步，也可手动添加</div>
                <button onClick={handleAdd} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#ec407a,#7c4dff)' }}>
                  + 手动添加第一条
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(200,180,240,0.2)', boxShadow: '0 4px 20px rgba(100,80,180,0.06)' }}>
            {/* 表头 */}
            <div className="grid text-xs font-bold px-4 py-3"
              style={{ gridTemplateColumns: '40px 56px 56px 130px 1fr 100px 80px 48px',
                background: 'rgba(200,180,240,0.12)', borderBottom: '1px solid rgba(200,180,240,0.2)', color: 'oklch(0.50 0.06 280)' }}>
              <div></div><div>序号</div><div>玩家</div><div>周边编码</div><div>备注</div><div>来源</div><div>状态</div><div></div>
            </div>
            {/* 数据行 */}
            <div>
              {filtered.map(record => {
                const src = SOURCE_LABELS[record.source] ?? { label: record.source, color: '#64748b' };
                return (
                  <div key={record.id}
                    className="grid items-center px-4 py-2 transition-all"
                    style={{ gridTemplateColumns: '40px 56px 56px 130px 1fr 100px 80px 48px',
                      opacity: record.completed ? 0.65 : 1,
                      borderBottom: '1px solid rgba(200,180,240,0.1)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.5)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                    <div className="flex items-center justify-center">
                      <button onClick={() => handleToggleComplete(record.id)}
                        className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
                        style={record.completed
                          ? { background: 'linear-gradient(135deg,#66bb6a,#26c6da)', boxShadow: '0 2px 6px rgba(102,187,106,0.4)' }
                          : { background: 'rgba(255,255,255,0.8)', border: '1.5px solid rgba(200,180,240,0.4)' }}>
                        {record.completed && <span className="text-white text-xs font-bold">✓</span>}
                      </button>
                    </div>
                    <div className="text-sm font-bold" style={{ color: 'oklch(0.40 0.04 280)' }}>#{record.serialNumber}</div>
                    <InlineCell value={record.playerNumber > 0 ? String(record.playerNumber) : ''}
                      onChange={v => handleUpdate(record.id, { playerNumber: parseInt(v) || 0 })}
                      placeholder="玩家号" type="number"
                      style={{ color: 'oklch(0.30 0.04 280)', fontWeight: '600' }} />
                    <InlineCell value={record.peripheralCode ?? ''}
                      onChange={v => handleUpdate(record.id, { peripheralCode: v })}
                      placeholder="周边编码"
                      style={{ color: 'oklch(0.30 0.04 280)', fontFamily: 'monospace', fontSize: '12px' }} />
                    <InlineCell value={record.notes ?? ''}
                      onChange={v => handleUpdate(record.id, { notes: v })}
                      placeholder="点击添加备注…"
                      style={{ color: 'oklch(0.40 0.04 280)' }} />
                    <div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: `${src.color}18`, color: src.color, border: `1px solid ${src.color}33` }}>
                        {src.label}
                      </span>
                    </div>
                    <div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={record.completed
                          ? { background: 'rgba(102,187,106,0.12)', color: '#66bb6a', border: '1px solid rgba(102,187,106,0.3)' }
                          : { background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                        {record.completed ? '已完成' : '待完成'}
                      </span>
                    </div>
                    <div className="flex items-center justify-center">
                      <button onClick={() => handleDelete(record.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all"
                        style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', opacity: 0.4 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0.4'; }}>
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* 底部添加行 */}
            <div id="peripheral-table-bottom"
              className="px-4 py-3 flex items-center gap-2 cursor-pointer transition-all"
              style={{ borderTop: '1px dashed rgba(200,180,240,0.3)' }}
              onClick={handleAdd}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.4)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
              <div className="w-5 h-5 rounded-md flex items-center justify-center"
                style={{ background: 'rgba(200,180,240,0.2)', border: '1.5px dashed rgba(200,180,240,0.5)' }}>
                <span className="text-xs font-bold" style={{ color: 'oklch(0.55 0.06 280)' }}>+</span>
              </div>
              <span className="text-sm" style={{ color: 'oklch(0.60 0.04 280)' }}>点击添加新记录…</span>
            </div>
          </div>
        )}
      </div>

      {/* 底部汇总 */}
      {records.length > 0 && (
        <div className="flex-shrink-0 px-6 py-3 flex items-center justify-between"
          style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(200,180,240,0.2)' }}>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'oklch(0.55 0.04 280)' }}>
            <span>共 <strong style={{ color: 'oklch(0.35 0.04 280)' }}>{totalCount}</strong> 条记录</span>
            <span>待完成 <strong style={{ color: '#f59e0b' }}>{pendingCount}</strong></span>
            <span>已完成 <strong style={{ color: '#10b981' }}>{completedCount}</strong></span>
            {totalCount > 0 && (
              <span>完成率 <strong style={{ color: '#6366f1' }}>{Math.round((completedCount / totalCount) * 100)}%</strong></span>
            )}
          </div>
          <div className="text-xs" style={{ color: 'oklch(0.65 0.02 280)' }}>点击任意单元格可直接编辑</div>
        </div>
      )}
    </div>
  );
}
