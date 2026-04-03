// ============================================================
// 周边页面 - 周边清单管理
// Design: Professional Dark Dashboard
// ============================================================

import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { PeripheralRecord } from '@/types';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Plus, Trash2, Check, X, Package, Download, Upload,
  Search, Filter, SortAsc, SortDesc, Edit3, Save,
  ChevronDown, RotateCcw, AlertCircle, Info, Image
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  'game-settlement': '#6366f1',
  'wheel-result': '#f59e0b',
  'manual': '#10b981',
};

// ---- 编辑弹窗 ----
interface EditDialogProps {
  record: PeripheralRecord | null;
  onSave: (record: PeripheralRecord) => void;
  onClose: () => void;
}

function EditDialog({ record, onSave, onClose }: EditDialogProps) {
  const [editing, setEditing] = useState<PeripheralRecord | null>(record ? { ...record } : null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editing) return null;

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setEditing(prev => prev ? { ...prev, previewImage: ev.target?.result as string } : null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <Dialog open={!!record} onOpenChange={() => onClose()}>
      <DialogContent className="bg-card border-border text-card-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 size={16} className="text-primary" />
            编辑周边记录 #{editing.serialNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">身份号</label>
              <Input
                type="number"
                value={editing.playerNumber}
                onChange={e => setEditing({ ...editing, playerNumber: parseInt(e.target.value) || 0 })}
                className="bg-secondary/50 border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">周边编号</label>
              <Input
                value={editing.peripheralCode}
                onChange={e => setEditing({ ...editing, peripheralCode: e.target.value })}
                className="bg-secondary/50 border-border"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">备注</label>
            <Input
              value={editing.notes}
              onChange={e => setEditing({ ...editing, notes: e.target.value })}
              placeholder="备注信息..."
              className="bg-secondary/50 border-border"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">周边预览图</label>
              <button onClick={() => fileInputRef.current?.click()} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                <Plus size={11} />添加
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAddImage} />
            </div>
            {editing.previewImage ? (
              <div className="relative group w-24 h-24">
                <img src={editing.previewImage} alt="预览" className="w-full h-full object-cover rounded-lg border border-border" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <button onClick={() => setEditing({ ...editing, previewImage: undefined })} className="text-white"><Trash2 size={14} /></button>
                </div>
              </div>
            ) : (
              <div onClick={() => fileInputRef.current?.click()} className="border border-dashed border-border rounded-lg p-4 text-center text-xs text-muted-foreground hover:border-primary/50 cursor-pointer">
                <Image size={16} className="mx-auto mb-1 opacity-50" />点击添加图片
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">状态</span>
            <button
              onClick={() => setEditing({ ...editing, completed: !editing.completed })}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all', editing.completed ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400' : 'border-border bg-secondary/50 text-muted-foreground')}
            >
              {editing.completed ? <><Check size={13} />已完成</> : <><X size={13} />待处理</>}
            </button>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
          <Button size="sm" onClick={() => onSave(editing)} className="bg-primary hover:bg-primary/90">
            <Save size={13} className="mr-1" />保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- 主页面 ----
export default function PeripheralPage() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('serialNumber');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterSource, setFilterSource] = useState<FilterSource>('all');
  const [editingRecord, setEditingRecord] = useState<PeripheralRecord | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 过滤 + 排序
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

    if (filterStatus !== 'all') {
      records = records.filter(r => filterStatus === 'completed' ? r.completed : !r.completed);
    }

    if (filterSource !== 'all') {
      records = records.filter(r => r.source === filterSource);
    }

    records.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
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

  const handleToggleComplete = (recordId: string) => {
    const record = state.peripheralRecords.find(r => r.id === recordId);
    if (!record) return;
    dispatch({ type: 'UPDATE_PERIPHERAL', payload: { id: record.id, updates: { completed: !record.completed } } });
  };

  const handleSaveEdit = (record: PeripheralRecord) => {
    dispatch({ type: 'UPDATE_PERIPHERAL', payload: { id: record.id, updates: record } });
    setEditingRecord(null);
    toast.success('已保存');
  };

  const handleAddManual = () => {
    const maxSerial = state.peripheralRecords.reduce((max, r) => Math.max(max, r.serialNumber), 0);
    const newRecord: PeripheralRecord = {
      id: nanoid(),
      serialNumber: maxSerial + 1,
      playerNumber: 1,
      peripheralCode: `P-${String(maxSerial + 1).padStart(4, '0')}`,
      notes: '',
      completed: false,
      source: 'manual',
      createdAt: Date.now(),
    };
    setEditingRecord(newRecord);
  };

  const handleSaveNew = (record: PeripheralRecord) => {
    dispatch({ type: 'ADD_PERIPHERAL_RECORD', payload: record });
    setEditingRecord(null);
    toast.success('已添加周边记录');
  };

  const handleDelete = (recordId: string) => {
    dispatch({ type: 'REMOVE_PERIPHERAL', payload: recordId });
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

  const isNewRecord = editingRecord && !state.peripheralRecords.find(r => r.id === editingRecord.id);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 顶部统计 + 操作 */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border">
            <Package size={13} className="text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">{stats.total}</span>
            <span className="text-xs text-muted-foreground">总计</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <span className="text-sm font-bold text-amber-400">{stats.pending}</span>
            <span className="text-xs text-amber-400/70">待处理</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-sm font-bold text-emerald-400">{stats.completed}</span>
            <span className="text-xs text-emerald-400/70">已完成</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleClearCompleted} className="h-7 px-2 text-xs gap-1" disabled={stats.completed === 0}>
            <RotateCcw size={12} />清除已完成
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport} className="h-7 px-2 text-xs gap-1">
            <Download size={12} />导出CSV
          </Button>
          <Button size="sm" onClick={handleAddManual} className="h-7 px-2 text-xs gap-1 bg-primary hover:bg-primary/90">
            <Plus size={12} />手动添加
          </Button>
        </div>
      </div>

      {/* 搜索 + 过滤 */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border flex-shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索身份号、编号、备注..." className="pl-8 h-7 text-xs bg-secondary/50" />
        </div>

        <div className="flex gap-1">
          {(['all', 'pending', 'completed'] as FilterStatus[]).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={cn('text-xs px-2 py-1 rounded-lg border transition-all', filterStatus === s ? 'border-primary/50 bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
              {s === 'all' ? '全部' : s === 'pending' ? '待处理' : '已完成'}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {(['all', 'game-settlement', 'wheel-result', 'manual'] as FilterSource[]).map(s => (
            <button key={s} onClick={() => setFilterSource(s)}
              className={cn('text-xs px-2 py-1 rounded-lg border transition-all', filterSource === s ? 'border-primary/50 bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
              {s === 'all' ? '全部来源' : SOURCE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* 表格头 */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-secondary/20 flex-shrink-0 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <div className="w-8 flex-shrink-0 text-center">状态</div>
        <button className="w-12 flex-shrink-0 flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleToggleSort('serialNumber')}>
          序号{sortField === 'serialNumber' && (sortDir === 'asc' ? <SortAsc size={10} /> : <SortDesc size={10} />)}
        </button>
        <button className="w-12 flex-shrink-0 flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleToggleSort('playerNumber')}>
          身份号{sortField === 'playerNumber' && (sortDir === 'asc' ? <SortAsc size={10} /> : <SortDesc size={10} />)}
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

      {/* 记录列表 */}
      <div className="flex-1 overflow-y-auto">
        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Package size={40} className="mb-3 opacity-20" />
            <div className="text-sm">{search || filterStatus !== 'all' || filterSource !== 'all' ? '没有匹配的记录' : '暂无周边记录'}</div>
            <div className="text-xs mt-1 opacity-60">通过游戏结算或轮盘抽奖自动生成，或手动添加</div>
          </div>
        ) : (
          filteredRecords.map(record => (
            <div
              key={record.id}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 border-b border-border/50 hover:bg-secondary/20 transition-all text-sm group',
                record.completed && 'opacity-60'
              )}
            >
              {/* 完成状态 */}
              <div className="w-8 flex-shrink-0 flex justify-center">
                <button
                  onClick={() => handleToggleComplete(record.id)}
                  className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all', record.completed ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : 'border-border hover:border-emerald-500/50')}
                >
                  {record.completed && <Check size={11} />}
                </button>
              </div>

              {/* 序号 */}
              <div className="w-12 flex-shrink-0 font-mono-display font-bold text-primary/70">
                #{record.serialNumber}
              </div>

              {/* 身份号 */}
              <div className="w-12 flex-shrink-0 font-mono-display font-bold text-foreground">
                #{record.playerNumber}
              </div>

              {/* 周边编号 */}
              <div className="w-28 flex-shrink-0 font-mono text-xs text-foreground/80 truncate">
                {record.peripheralCode}
              </div>

              {/* 来源 */}
              <div className="flex-1 min-w-0">
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: SOURCE_COLORS[record.source] + '25', color: SOURCE_COLORS[record.source] }}>
                  {SOURCE_LABELS[record.source]}
                </span>
                {record.sourceGameName && <span className="ml-1.5 text-xs text-muted-foreground truncate">{record.sourceGameName}</span>}
                {record.sourceWheelOption && <span className="ml-1.5 text-xs text-muted-foreground truncate">→ {record.sourceWheelOption}</span>}
              </div>

              {/* 备注 */}
              <div className="w-32 flex-shrink-0 text-xs text-muted-foreground truncate">{record.notes || '—'}</div>

              {/* 图片 */}
              <div className="w-8 flex-shrink-0 flex justify-center">
                {record.previewImage ? (
                  <img src={record.previewImage} alt="" className="w-6 h-6 rounded object-cover border border-border" />
                ) : <span className="text-muted-foreground/30">—</span>}
              </div>

              {/* 时间 */}
              <div className="w-24 flex-shrink-0 text-xs text-muted-foreground/60">
                {new Date(record.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </div>

              {/* 操作 */}
              <div className="w-16 flex-shrink-0 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditingRecord({ ...record })} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                  <Edit3 size={13} />
                </button>
                <button onClick={() => setDeleteConfirm(record.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
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
          onSave={isNewRecord ? handleSaveNew : handleSaveEdit}
          onClose={() => setEditingRecord(null)}
        />
      )}

      {/* 删除确认 */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-card border-border text-card-foreground max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle size={16} className="text-destructive" />确认删除
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">确定要删除这条周边记录吗？此操作不可撤销。</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>取消</Button>
            <Button size="sm" variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
