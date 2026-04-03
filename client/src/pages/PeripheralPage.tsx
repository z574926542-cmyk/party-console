// ============================================================
// 周边清单页面
// Design: 奇妙奇遇 v2 — 清单感 · 品牌感 · 夜晚氛围
// ============================================================

import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { PeripheralRecord } from '@/types';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import {
  Plus, Trash2, Check, X, Package, Download,
  Search, SortAsc, SortDesc, Edit3, Save, Image, AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

type SortField = 'serialNumber' | 'playerNumber' | 'createdAt';
type SortDir = 'asc' | 'desc';
type FilterStatus = 'all' | 'pending' | 'completed';
type FilterSource = 'all' | 'game-settlement' | 'wheel-result' | 'manual';

const SOURCE_LABELS: Record<string, string> = {
  'game-settlement': '游戏结算',
  'wheel-result': '轮盘抽取',
  'manual': '手动添加',
};

const SOURCE_COLORS: Record<string, string> = {
  'game-settlement': 'oklch(0.60 0.20 285)',
  'wheel-result': 'oklch(0.78 0.16 52)',
  'manual': 'oklch(0.65 0.18 155)',
};

// ============================================================
// 编辑弹窗
// ============================================================
function EditDialog({ record, onSave, onClose }: { record: PeripheralRecord | null; onSave: (r: PeripheralRecord) => void; onClose: () => void }) {
  const [editing, setEditing] = useState<PeripheralRecord | null>(record ? { ...record } : null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editing) return null;

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setEditing(prev => prev ? { ...prev, previewImage: ev.target?.result as string } : null);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <Dialog open={!!record} onOpenChange={() => onClose()}>
      <DialogContent
        className="max-w-md"
        style={{
          background: 'oklch(0.135 0.025 270)',
          border: '1px solid oklch(0.26 0.025 270)',
          color: 'oklch(0.88 0.008 270)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: 'oklch(0.88 0.008 270)' }}>
            <Edit3 size={15} style={{ color: 'oklch(0.60 0.20 285)' }} />
            {editing.serialNumber ? `编辑周边记录 #${editing.serialNumber}` : '新增周边记录'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-widest uppercase" style={{ color: 'oklch(0.45 0.015 270)', letterSpacing: '0.1em' }}>身份号</label>
              <input
                type="number"
                value={editing.playerNumber}
                onChange={e => setEditing({ ...editing, playerNumber: parseInt(e.target.value) || 0 })}
                className="w-full h-9 px-3 rounded-xl text-sm outline-none"
                style={{ background: 'oklch(0.19 0.022 270)', border: '1px solid oklch(0.28 0.022 270)', color: 'oklch(0.82 0.008 270)' }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-widest uppercase" style={{ color: 'oklch(0.45 0.015 270)', letterSpacing: '0.1em' }}>周边编号</label>
              <input
                value={editing.peripheralCode}
                onChange={e => setEditing({ ...editing, peripheralCode: e.target.value })}
                className="w-full h-9 px-3 rounded-xl text-sm outline-none"
                style={{ background: 'oklch(0.19 0.022 270)', border: '1px solid oklch(0.28 0.022 270)', color: 'oklch(0.82 0.008 270)' }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold tracking-widest uppercase" style={{ color: 'oklch(0.45 0.015 270)', letterSpacing: '0.1em' }}>备注</label>
            <input
              value={editing.notes}
              onChange={e => setEditing({ ...editing, notes: e.target.value })}
              placeholder="备注信息..."
              className="w-full h-9 px-3 rounded-xl text-sm outline-none"
              style={{ background: 'oklch(0.19 0.022 270)', border: '1px solid oklch(0.28 0.022 270)', color: 'oklch(0.82 0.008 270)' }}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold tracking-widest uppercase" style={{ color: 'oklch(0.45 0.015 270)', letterSpacing: '0.1em' }}>周边预览图</label>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs flex items-center gap-1"
                style={{ color: 'oklch(0.60 0.20 285)' }}
              >
                <Plus size={11} />添加
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAddImage} />
            </div>
            {editing.previewImage ? (
              <div className="relative group w-24 h-24">
                <img src={editing.previewImage} alt="预览" className="w-full h-full object-cover rounded-xl" style={{ border: '1px solid oklch(0.28 0.022 270)' }} />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                  <button onClick={() => setEditing({ ...editing, previewImage: undefined })} style={{ color: 'white' }}><Trash2 size={14} /></button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl p-4 text-center text-xs cursor-pointer transition-all"
                style={{ border: '1px dashed oklch(0.30 0.022 270)', color: 'oklch(0.45 0.015 270)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.60 0.20 285 / 0.5)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.30 0.022 270)'; }}
              >
                <Image size={16} className="mx-auto mb-1 opacity-50" />点击添加图片
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'oklch(0.55 0.02 270)' }}>状态</span>
            <button
              onClick={() => setEditing({ ...editing, completed: !editing.completed })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
              style={
                editing.completed
                  ? { background: 'oklch(0.65 0.18 155 / 0.15)', border: '1px solid oklch(0.65 0.18 155 / 0.4)', color: 'oklch(0.65 0.18 155)' }
                  : { background: 'oklch(0.19 0.022 270)', border: '1px solid oklch(0.28 0.022 270)', color: 'oklch(0.55 0.02 270)' }
              }
            >
              {editing.completed ? <><Check size={13} />已完成</> : <><X size={13} />待处理</>}
            </button>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'oklch(0.19 0.022 270)', border: '1px solid oklch(0.28 0.022 270)', color: 'oklch(0.60 0.02 270)' }}
          >
            取消
          </button>
          <button
            onClick={() => onSave(editing)}
            className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all"
            style={{ background: 'oklch(0.60 0.20 285 / 0.2)', border: '1px solid oklch(0.60 0.20 285 / 0.5)', color: 'oklch(0.78 0.18 285)' }}
          >
            <Save size={13} />保存
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 主页面
// ============================================================
export default function PeripheralPage() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('serialNumber');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterSource, setFilterSource] = useState<FilterSource>('all');
  const [editingRecord, setEditingRecord] = useState<PeripheralRecord | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredRecords = useMemo(() => {
    let records = [...state.peripheralRecords];
    if (search) {
      const q = search.toLowerCase();
      records = records.filter(r =>
        r.peripheralCode.toLowerCase().includes(q) ||
        r.playerNumber.toString().includes(q) ||
        r.notes.toLowerCase().includes(q) ||
        (r.sourceGameName || '').toLowerCase().includes(q) ||
        (r.sourceWheelName || '').toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'all') records = records.filter(r => filterStatus === 'completed' ? r.completed : !r.completed);
    if (filterSource !== 'all') records = records.filter(r => r.source === filterSource);
    records.sort((a, b) => {
      const aVal = a[sortField], bVal = b[sortField];
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return records;
  }, [state.peripheralRecords, search, sortField, sortDir, filterStatus, filterSource]);

  const stats = useMemo(() => ({
    total: state.peripheralRecords.length,
    pending: state.peripheralRecords.filter(r => !r.completed).length,
    completed: state.peripheralRecords.filter(r => r.completed).length,
  }), [state.peripheralRecords]);

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const handleToggleComplete = (id: string) => {
    const record = state.peripheralRecords.find(r => r.id === id);
    if (!record) return;
    dispatch({ type: 'UPDATE_PERIPHERAL', payload: { id, updates: { completed: !record.completed } } });
  };

  const handleSaveEdit = (record: PeripheralRecord) => {
    const isNew = !state.peripheralRecords.find(r => r.id === record.id);
    if (isNew) {
      dispatch({ type: 'ADD_PERIPHERAL_RECORD', payload: record });
      toast.success('已添加周边记录');
    } else {
      dispatch({ type: 'UPDATE_PERIPHERAL', payload: { id: record.id, updates: record } });
      toast.success('已保存');
    }
    setEditingRecord(null);
  };

  const handleAddManual = () => {
    const maxSerial = state.peripheralRecords.reduce((max, r) => Math.max(max, r.serialNumber), 0);
    setEditingRecord({
      id: nanoid(),
      serialNumber: maxSerial + 1,
      playerNumber: 1,
      peripheralCode: `P-${String(maxSerial + 1).padStart(4, '0')}`,
      notes: '',
      completed: false,
      source: 'manual',
      createdAt: Date.now(),
    });
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'REMOVE_PERIPHERAL', payload: id });
    setDeleteConfirm(null);
    toast.success('已删除');
  };

  const handleExport = () => {
    const csv = [
      '序号,身份号,周边编号,来源,状态,备注,时间',
      ...filteredRecords.map(r => [
        r.serialNumber, r.playerNumber, r.peripheralCode,
        SOURCE_LABELS[r.source], r.completed ? '已完成' : '待处理',
        r.notes, new Date(r.createdAt).toLocaleString()
      ].join(','))
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `peripheral-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('已导出 CSV');
  };

  const handleClearCompleted = () => {
    const completed = state.peripheralRecords.filter(r => r.completed);
    completed.forEach(r => dispatch({ type: 'REMOVE_PERIPHERAL', payload: r.id }));
    toast.success(`已清除 ${completed.length} 条已完成记录`);
  };

  // 筛选按钮样式
  const filterBtnStyle = (active: boolean) => active
    ? { background: 'oklch(0.60 0.20 285 / 0.15)', border: '1px solid oklch(0.60 0.20 285 / 0.4)', color: 'oklch(0.78 0.18 285)' }
    : { background: 'oklch(0.155 0.022 270)', border: '1px solid oklch(0.22 0.022 270)', color: 'oklch(0.50 0.015 270)' };

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ============================================================
          顶部统计 + 操作栏
          ============================================================ */}
      <div
        className="flex items-center gap-4 px-5 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid oklch(0.20 0.022 270)' }}
      >
        {/* 统计卡片 */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: 'oklch(0.155 0.022 270)', border: '1px solid oklch(0.22 0.022 270)' }}
          >
            <Package size={13} style={{ color: 'oklch(0.55 0.02 270)' }} />
            <span className="text-sm font-bold" style={{ color: 'oklch(0.88 0.008 270)' }}>{stats.total}</span>
            <span className="text-xs" style={{ color: 'oklch(0.45 0.015 270)' }}>总计</span>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: 'oklch(0.78 0.16 52 / 0.08)', border: '1px solid oklch(0.78 0.16 52 / 0.22)' }}
          >
            <span className="text-sm font-bold" style={{ color: 'oklch(0.78 0.16 52)' }}>{stats.pending}</span>
            <span className="text-xs" style={{ color: 'oklch(0.65 0.12 52)' }}>待处理</span>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: 'oklch(0.65 0.18 155 / 0.08)', border: '1px solid oklch(0.65 0.18 155 / 0.22)' }}
          >
            <span className="text-sm font-bold" style={{ color: 'oklch(0.65 0.18 155)' }}>{stats.completed}</span>
            <span className="text-xs" style={{ color: 'oklch(0.55 0.15 155)' }}>已完成</span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleClearCompleted}
            disabled={stats.completed === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: 'oklch(0.155 0.022 270)', border: '1px solid oklch(0.22 0.022 270)', color: 'oklch(0.55 0.02 270)' }}
          >
            清除已完成
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{ background: 'oklch(0.155 0.022 270)', border: '1px solid oklch(0.22 0.022 270)', color: 'oklch(0.55 0.02 270)' }}
          >
            <Download size={12} />导出 CSV
          </button>
          <button
            onClick={handleAddManual}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: 'oklch(0.65 0.18 155 / 0.15)',
              border: '1px solid oklch(0.65 0.18 155 / 0.4)',
              color: 'oklch(0.65 0.18 155)',
            }}
          >
            <Plus size={12} />手动添加
          </button>
        </div>
      </div>

      {/* ============================================================
          搜索 + 筛选栏
          ============================================================ */}
      <div
        className="flex items-center gap-2.5 px-5 py-2.5 flex-shrink-0 flex-wrap"
        style={{ borderBottom: '1px solid oklch(0.20 0.022 270)' }}
      >
        {/* 搜索 */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'oklch(0.45 0.015 270)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索身份号、编号、备注..."
            className="pl-7 pr-3 h-7 text-xs rounded-xl outline-none w-52"
            style={{ background: 'oklch(0.155 0.022 270)', border: '1px solid oklch(0.22 0.022 270)', color: 'oklch(0.82 0.008 270)' }}
          />
        </div>

        {/* 状态筛选 */}
        <div className="flex gap-1">
          {(['all', 'pending', 'completed'] as FilterStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="text-xs px-2.5 py-1 rounded-lg transition-all font-semibold"
              style={filterBtnStyle(filterStatus === s)}
            >
              {s === 'all' ? '全部' : s === 'pending' ? '待处理' : '已完成'}
            </button>
          ))}
        </div>

        {/* 来源筛选 */}
        <div className="flex gap-1">
          {(['all', 'game-settlement', 'wheel-result', 'manual'] as FilterSource[]).map(s => (
            <button
              key={s}
              onClick={() => setFilterSource(s)}
              className="text-xs px-2.5 py-1 rounded-lg transition-all font-semibold"
              style={filterBtnStyle(filterSource === s)}
            >
              {s === 'all' ? '全部来源' : SOURCE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================
          表格头
          ============================================================ */}
      <div
        className="flex items-center gap-2 px-5 py-2 flex-shrink-0 text-xs font-bold tracking-widest uppercase"
        style={{
          borderBottom: '1px solid oklch(0.20 0.022 270)',
          background: 'oklch(0.115 0.022 270)',
          color: 'oklch(0.40 0.015 270)',
          letterSpacing: '0.1em',
        }}
      >
        <div className="w-8 flex-shrink-0 text-center">状态</div>
        <button className="w-12 flex-shrink-0 flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleToggleSort('serialNumber')}>
          序号{sortField === 'serialNumber' && (sortDir === 'asc' ? <SortAsc size={10} /> : <SortDesc size={10} />)}
        </button>
        <button className="w-12 flex-shrink-0 flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleToggleSort('playerNumber')}>
          身份{sortField === 'playerNumber' && (sortDir === 'asc' ? <SortAsc size={10} /> : <SortDesc size={10} />)}
        </button>
        <div className="w-28 flex-shrink-0">周边编号</div>
        <div className="flex-1">来源</div>
        <div className="w-32 flex-shrink-0">备注</div>
        <div className="w-8 flex-shrink-0">图</div>
        <button className="w-24 flex-shrink-0 flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleToggleSort('createdAt')}>
          时间{sortField === 'createdAt' && (sortDir === 'asc' ? <SortAsc size={10} /> : <SortDesc size={10} />)}
        </button>
        <div className="w-16 flex-shrink-0 text-right">操作</div>
      </div>

      {/* ============================================================
          记录列表
          ============================================================ */}
      <div className="flex-1 overflow-y-auto">
        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'oklch(0.78 0.16 52 / 0.06)', border: '1px solid oklch(0.78 0.16 52 / 0.15)' }}
            >
              <Package size={28} style={{ color: 'oklch(0.55 0.12 52)' }} />
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold" style={{ color: 'oklch(0.55 0.02 270)' }}>
                {search || filterStatus !== 'all' || filterSource !== 'all' ? '没有匹配的记录' : '暂无周边记录'}
              </div>
              <div className="text-xs mt-1" style={{ color: 'oklch(0.40 0.015 270)' }}>
                通过游戏结算或轮盘抽奖自动生成，或手动添加
              </div>
            </div>
          </div>
        ) : (
          filteredRecords.map(record => (
            <div
              key={record.id}
              className="flex items-center gap-2 px-5 py-2.5 text-sm group transition-all"
              style={{
                borderBottom: '1px solid oklch(0.18 0.02 270)',
                opacity: record.completed ? 0.55 : 1,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'oklch(0.155 0.022 270)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
            >
              {/* 完成状态 */}
              <div className="w-8 flex-shrink-0 flex justify-center">
                <button
                  onClick={() => handleToggleComplete(record.id)}
                  className="w-5 h-5 rounded-lg flex items-center justify-center transition-all"
                  style={
                    record.completed
                      ? { background: 'oklch(0.65 0.18 155 / 0.2)', border: '1.5px solid oklch(0.65 0.18 155)', color: 'oklch(0.65 0.18 155)' }
                      : { border: '1.5px solid oklch(0.30 0.022 270)' }
                  }
                >
                  {record.completed && <Check size={11} />}
                </button>
              </div>

              {/* 序号 */}
              <div className="w-12 flex-shrink-0 font-mono-display font-bold text-xs" style={{ color: 'oklch(0.60 0.20 285)' }}>
                #{record.serialNumber}
              </div>

              {/* 身份号 */}
              <div className="w-12 flex-shrink-0 font-mono-display font-bold" style={{ color: 'oklch(0.82 0.008 270)' }}>
                #{record.playerNumber}
              </div>

              {/* 周边编号 */}
              <div className="w-28 flex-shrink-0 font-mono text-xs truncate" style={{ color: 'oklch(0.72 0.015 270)' }}>
                {record.peripheralCode}
              </div>

              {/* 来源 */}
              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                  style={{
                    background: SOURCE_COLORS[record.source] + '20',
                    color: SOURCE_COLORS[record.source],
                    border: `1px solid ${SOURCE_COLORS[record.source]}35`,
                  }}
                >
                  {SOURCE_LABELS[record.source]}
                </span>
                {record.sourceGameName && (
                  <span className="text-xs truncate" style={{ color: 'oklch(0.50 0.015 270)' }}>{record.sourceGameName}</span>
                )}
                {record.sourceWheelOption && (
                  <span className="text-xs truncate" style={{ color: 'oklch(0.50 0.015 270)' }}>→ {record.sourceWheelOption}</span>
                )}
              </div>

              {/* 备注 */}
              <div className="w-32 flex-shrink-0 text-xs truncate" style={{ color: 'oklch(0.50 0.015 270)' }}>
                {record.notes || '—'}
              </div>

              {/* 图片 */}
              <div className="w-8 flex-shrink-0 flex justify-center">
                {record.previewImage ? (
                  <img src={record.previewImage} alt="" className="w-6 h-6 rounded-lg object-cover" style={{ border: '1px solid oklch(0.28 0.022 270)' }} />
                ) : <span style={{ color: 'oklch(0.30 0.015 270)' }}>—</span>}
              </div>

              {/* 时间 */}
              <div className="w-24 flex-shrink-0 text-xs" style={{ color: 'oklch(0.40 0.015 270)' }}>
                {new Date(record.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </div>

              {/* 操作 */}
              <div className="w-16 flex-shrink-0 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingRecord({ ...record })}
                  className="p-1 rounded-lg transition-all"
                  style={{ color: 'oklch(0.50 0.015 270)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.82 0.008 270)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.50 0.015 270)'; }}
                >
                  <Edit3 size={13} />
                </button>
                <button
                  onClick={() => setDeleteConfirm(record.id)}
                  className="p-1 rounded-lg transition-all"
                  style={{ color: 'oklch(0.50 0.015 270)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.62 0.22 10)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.50 0.015 270)'; }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 编辑弹窗 */}
      {editingRecord && (
        <EditDialog
          record={editingRecord}
          onSave={handleSaveEdit}
          onClose={() => setEditingRecord(null)}
        />
      )}

      {/* 删除确认 */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent
          className="max-w-xs"
          style={{
            background: 'oklch(0.135 0.025 270)',
            border: '1px solid oklch(0.26 0.025 270)',
            color: 'oklch(0.88 0.008 270)',
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: 'oklch(0.88 0.008 270)' }}>
              <AlertCircle size={15} style={{ color: 'oklch(0.62 0.22 10)' }} />确认删除
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: 'oklch(0.60 0.02 270)' }}>确定要删除这条周边记录吗？此操作不可撤销。</p>
          <DialogFooter className="gap-2">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'oklch(0.19 0.022 270)', border: '1px solid oklch(0.28 0.022 270)', color: 'oklch(0.60 0.02 270)' }}
            >
              取消
            </button>
            <button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'oklch(0.62 0.22 10 / 0.2)', border: '1px solid oklch(0.62 0.22 10 / 0.5)', color: 'oklch(0.72 0.20 10)' }}
            >
              删除
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
