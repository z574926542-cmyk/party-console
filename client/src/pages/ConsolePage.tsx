// ============================================================
// 控制台页面 - 游戏编辑 + 身份信息
// Design: Professional Dark Dashboard
// ============================================================

import React, { useState, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '@/contexts/AppContext';
import { Game, GameTag, BoundTool, SettlementImage, ToolType } from '@/types';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Plus, Trash2, GripVertical, Save, Upload, Download,
  Eye, X, BookOpen, List, Edit3, Monitor, Users,
  Check, AlertCircle, Info, RotateCcw, Tag, Wrench, Image
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const TOOL_OPTIONS: { type: ToolType; label: string; icon: string }[] = [
  { type: 'random-number', label: '随机数字', icon: '🎲' },
  { type: 'random-pick', label: '随机选人', icon: '👤' },
  { type: 'random-group', label: '随机分组', icon: '👥' },
  { type: 'countdown', label: '倒计时', icon: '⏱️' },
  { type: 'dice', label: '骰子', icon: '🎯' },
];

function SortableGameItem({ item, isSelected, onSelect, onDelete, getTagById }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-all duration-150 group',
        isSelected
          ? 'border-primary/50 bg-primary/10 text-foreground'
          : 'border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground hover:text-foreground'
      )}
      onClick={onSelect}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground flex-shrink-0" onClick={e => e.stopPropagation()}>
        <GripVertical size={14} />
      </div>
      <span className={cn('text-xs font-mono-display font-bold w-5 flex-shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')}>
        {item.order}
      </span>
      <span className="flex-1 text-sm font-medium truncate">{item.gameData.name}</span>
      <div className="flex gap-1 flex-shrink-0">
        {item.gameData.tags.slice(0, 2).map((tagId: string) => {
          const tag = getTagById(tagId);
          if (!tag) return null;
          return (
            <span key={tagId} className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: tag.color + '30', color: tag.color }}>
              {tag.name}
            </span>
          );
        })}
      </div>
      <button onClick={e => { e.stopPropagation(); onDelete(); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all flex-shrink-0">
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function TagEditor({ selectedTagIds, onChange }: { selectedTagIds: string[]; onChange: (ids: string[]) => void }) {
  const { state, dispatch } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366f1');
  const TAG_COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#64748b'];

  const toggleTag = (tagId: string) => {
    onChange(selectedTagIds.includes(tagId) ? selectedTagIds.filter(id => id !== tagId) : [...selectedTagIds, tagId]);
  };

  const createTag = () => {
    if (!newTagName.trim()) return;
    const tag: GameTag = { id: nanoid(), name: newTagName.trim(), color: newTagColor };
    dispatch({ type: 'ADD_TAG', payload: tag });
    onChange([...selectedTagIds, tag.id]);
    setNewTagName('');
    setShowCreate(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {state.tags.map(tag => {
          const isSelected = selectedTagIds.includes(tag.id);
          return (
            <button key={tag.id} onClick={() => toggleTag(tag.id)}
              className={cn('text-xs px-2.5 py-1 rounded-full font-semibold border transition-all duration-150', isSelected ? 'border-transparent text-white shadow-sm' : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground')}
              style={isSelected ? { backgroundColor: tag.color, borderColor: tag.color } : {}}>
              {tag.name}{tag.isSystem && <span className="ml-1 opacity-60">★</span>}
            </button>
          );
        })}
        <button onClick={() => setShowCreate(!showCreate)} className="text-xs px-2.5 py-1 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all">
          <Plus size={10} className="inline mr-1" />新标签
        </button>
      </div>
      {showCreate && (
        <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg border border-border animate-pop-in">
          <Input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="标签名称" className="h-7 text-xs bg-background" onKeyDown={e => e.key === 'Enter' && createTag()} />
          <div className="flex gap-1">
            {TAG_COLORS.map(c => (
              <button key={c} onClick={() => setNewTagColor(c)} className={cn('w-4 h-4 rounded-full border-2 transition-transform', newTagColor === c ? 'scale-125 border-white' : 'border-transparent')} style={{ backgroundColor: c }} />
            ))}
          </div>
          <Button size="sm" className="h-7 px-2 text-xs" onClick={createTag}>添加</Button>
        </div>
      )}
    </div>
  );
}

function ToolBindingEditor({ boundTools, onChange }: { boundTools: BoundTool[]; onChange: (tools: BoundTool[]) => void }) {
  const { state } = useApp();

  const toggleTool = (type: ToolType, label: string) => {
    const existing = boundTools.find(t => t.type === 'tool' && t.toolType === type);
    onChange(existing ? boundTools.filter(t => !(t.type === 'tool' && t.toolType === type)) : [...boundTools, { id: nanoid(), type: 'tool', toolType: type, label }]);
  };

  const toggleWheel = (wheelId: string, wheelName: string) => {
    const existing = boundTools.find(t => t.type === 'wheel' && t.wheelId === wheelId);
    onChange(existing ? boundTools.filter(t => !(t.type === 'wheel' && t.wheelId === wheelId)) : [...boundTools, { id: nanoid(), type: 'wheel', wheelId, label: wheelName }]);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {TOOL_OPTIONS.map(opt => {
          const isSelected = boundTools.some(t => t.type === 'tool' && t.toolType === opt.type);
          return (
            <button key={opt.type} onClick={() => toggleTool(opt.type, opt.label)}
              className={cn('text-xs px-2.5 py-1 rounded-lg border font-medium transition-all duration-150 flex items-center gap-1', isSelected ? 'border-primary/50 bg-primary/15 text-primary' : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:border-primary/30')}>
              <span>{opt.icon}</span>{opt.label}
            </button>
          );
        })}
      </div>
      {state.wheels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {state.wheels.map(wheel => {
            const isSelected = boundTools.some(t => t.type === 'wheel' && t.wheelId === wheel.id);
            return (
              <button key={wheel.id} onClick={() => toggleWheel(wheel.id, wheel.name)}
                className={cn('text-xs px-2.5 py-1 rounded-lg border font-medium transition-all duration-150 flex items-center gap-1', isSelected ? 'border-amber-500/50 bg-amber-500/15 text-amber-400' : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:border-amber-500/30')}>
                <RotateCcw size={10} />{wheel.name}轮盘
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GameEditor({ game, listItemId, onSave, onSaveToLibrary }: { game: Game; listItemId: string | null; onSave: (g: Game) => void; onSaveToLibrary: (g: Game) => void }) {
  const [editing, setEditing] = useState<Game>({ ...game });
  const [livePreview, setLivePreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => { setEditing({ ...game }); }, [game.id]);

  const update = (field: keyof Game, value: any) => {
    const updated = { ...editing, [field]: value };
    setEditing(updated);
    if (livePreview) onSave(updated);
  };

  const handleSave = () => { onSave(editing); toast.success('已保存'); };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const dataUrl = ev.target?.result as string;
        const img: SettlementImage = { id: nanoid(), name: file.name.replace(/\.[^.]+$/, ''), dataUrl };
        update('settlementImages', [...editing.settlementImages, img]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Edit3 size={15} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">游戏编辑器</span>
          {editing.tags.includes('tag-peripheral') && (
            <Badge className="text-[10px] h-4 px-1.5" style={{ backgroundColor: '#f59e0b30', color: '#f59e0b', border: '1px solid #f59e0b50' }}>周边</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>实时预览</span>
            <Switch checked={livePreview} onCheckedChange={setLivePreview} className="scale-75" />
          </div>
          <Button size="sm" onClick={handleSave} className="h-7 px-2 text-xs gap-1 bg-primary hover:bg-primary/90">
            <Save size={12} />保存
          </Button>
          <Button size="sm" variant="outline" onClick={() => onSaveToLibrary(editing)} className="h-7 px-2 text-xs gap-1">
            <BookOpen size={12} />存入游戏库
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">游戏名称</label>
          <Input value={editing.name} onChange={e => update('name', e.target.value)} placeholder="输入游戏名称" className="bg-secondary/50 border-border text-foreground text-base font-semibold h-10" />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">游戏规则</label>
          <Textarea value={editing.rules} onChange={e => update('rules', e.target.value)} placeholder="描述游戏规则..." className="bg-secondary/50 border-border text-foreground resize-none min-h-[80px]" rows={4} />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">结算方式</label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="text-xs text-emerald-400 font-medium flex items-center gap-1"><Check size={11} />胜者结算</div>
              <Textarea value={editing.winnerSettlement} onChange={e => update('winnerSettlement', e.target.value)} placeholder="胜者获得..." className="bg-secondary/50 border-emerald-900/30 text-foreground resize-none min-h-[60px] text-sm" rows={3} />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-rose-400 font-medium flex items-center gap-1"><X size={11} />败者结算</div>
              <Textarea value={editing.loserSettlement} onChange={e => update('loserSettlement', e.target.value)} placeholder="败者需要..." className="bg-secondary/50 border-rose-900/30 text-foreground resize-none min-h-[60px] text-sm" rows={3} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">结算图片</label>
            <button onClick={() => fileInputRef.current?.click()} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              <Plus size={12} />添加图片
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddImage} />
          </div>
          {editing.settlementImages.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {editing.settlementImages.map(img => (
                <div key={img.id} className="relative group w-20">
                  <div className="w-20 h-20 relative">
                    <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover rounded-lg border border-border" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <button onClick={() => update('settlementImages', editing.settlementImages.filter(i => i.id !== img.id))} className="text-white"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="text-[9px] text-center text-muted-foreground mt-0.5 truncate">{img.name}</div>
                </div>
              ))}
            </div>
          ) : (
            <div onClick={() => fileInputRef.current?.click()} className="border border-dashed border-border rounded-lg p-4 text-center text-xs text-muted-foreground hover:border-primary/50 hover:text-primary/70 transition-all cursor-pointer">
              <Image size={20} className="mx-auto mb-1 opacity-50" />点击添加展示图片
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Wrench size={11} />绑定工具</label>
          <ToolBindingEditor boundTools={editing.tools} onChange={tools => update('tools', tools)} />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Tag size={11} />标签</label>
          <TagEditor selectedTagIds={editing.tags} onChange={ids => update('tags', ids)} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">备注（主持人专用）</label>
          <Textarea value={editing.notes} onChange={e => update('notes', e.target.value)} placeholder="主持人备注（不在展台显示）..." className="bg-secondary/50 border-border text-foreground resize-none" rows={2} />
        </div>
      </div>
    </div>
  );
}

function LibraryPanel({ onAddToList, onClose }: { onAddToList: (g: Game) => void; onClose: () => void }) {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filtered = state.gameLibrary.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));

  const handleExport = () => {
    const json = JSON.stringify({ gameLibrary: state.gameLibrary, tags: state.tags }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `game-library-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success('游戏库已导出');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try { dispatch({ type: 'IMPORT_GAME_LIBRARY', payload: ev.target?.result as string }); toast.success('游戏库导入成功'); }
      catch { toast.error('导入失败，请检查文件格式'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen size={15} className="text-primary" />
          <span className="text-sm font-semibold">游戏库</span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{state.gameLibrary.length}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={handleExport} className="h-7 px-2 text-xs gap-1"><Download size={12} />导出</Button>
          <Button size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()} className="h-7 px-2 text-xs gap-1"><Upload size={12} />导入</Button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground ml-1"><X size={15} /></button>
        </div>
      </div>
      <div className="px-3 py-2 border-b border-border flex-shrink-0">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索游戏..." className="h-7 text-xs bg-secondary/50" />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
            <BookOpen size={24} className="mx-auto mb-2 opacity-30" />
            {search ? '没有找到匹配的游戏' : '游戏库为空，保存游戏后会出现在这里'}
          </div>
        ) : filtered.map(game => (
          <div key={game.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 transition-all group">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">{game.name}</div>
              <div className="flex gap-1 mt-0.5">
                {game.tags.slice(0, 3).map(tagId => {
                  const tag = state.tags.find(t => t.id === tagId);
                  if (!tag) return null;
                  return <span key={tagId} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: tag.color + '30', color: tag.color }}>{tag.name}</span>;
                })}
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="sm" variant="outline" onClick={() => onAddToList(game)} className="h-6 px-2 text-[10px]">加入列表</Button>
              <button onClick={() => dispatch({ type: 'REMOVE_GAME_FROM_LIBRARY', payload: game.id })} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IdentityEditor() {
  const { state, dispatch } = useApp();
  const [playerCount, setPlayerCount] = useState(state.players.length);

  const handleCountChange = (count: number) => {
    const c = Math.max(1, Math.min(200, count));
    setPlayerCount(c);
    dispatch({ type: 'SET_PLAYER_COUNT', payload: c });
  };

  const maleCount = state.players.filter(p => p.gender === 'male').length;
  const femaleCount = state.players.filter(p => p.gender === 'female').length;
  const introvertCount = state.players.filter(p => p.socialType === 'introvert').length;
  const extrovertCount = state.players.filter(p => p.socialType === 'extrovert').length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-primary" />
          <span className="text-sm font-semibold">身份信息编辑</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-blue-400">♂ {maleCount}</span>
          <span className="text-rose-400">♀ {femaleCount}</span>
          <span className="text-purple-400">社恐 {introvertCount}</span>
          <span className="text-amber-400">社牛 {extrovertCount}</span>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-border flex items-center gap-3 flex-shrink-0">
        <span className="text-xs text-muted-foreground">总人数</span>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => handleCountChange(playerCount - 1)}>-</Button>
          <input type="number" value={playerCount} onChange={e => handleCountChange(parseInt(e.target.value) || 1)} className="w-14 h-7 text-center text-sm bg-secondary/50 border border-border rounded-md text-foreground" />
          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => handleCountChange(playerCount + 1)}>+</Button>
        </div>
        <span className="text-xs text-muted-foreground">人</span>
        <div className="ml-auto text-[10px] text-muted-foreground/60 flex items-center gap-1">
          <Info size={10} />此处权限最高，修改同步到工具模块
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {state.players.map(player => (
            <div key={player.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 border border-border hover:bg-secondary/50 transition-all">
              <span className="text-sm font-mono-display font-bold text-primary w-7 flex-shrink-0">#{player.number}</span>
              <div className="flex gap-0.5">
                <button
                  onClick={() => dispatch({ type: 'UPDATE_PLAYER', payload: { ...player, gender: player.gender === 'male' ? 'unknown' : 'male' } })}
                  className={cn('text-[10px] px-1.5 py-0.5 rounded font-semibold transition-all', player.gender === 'male' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-muted-foreground/50 hover:text-blue-400')}>♂</button>
                <button
                  onClick={() => dispatch({ type: 'UPDATE_PLAYER', payload: { ...player, gender: player.gender === 'female' ? 'unknown' : 'female' } })}
                  className={cn('text-[10px] px-1.5 py-0.5 rounded font-semibold transition-all', player.gender === 'female' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-muted-foreground/50 hover:text-rose-400')}>♀</button>
              </div>
              <div className="flex gap-0.5">
                <button
                  onClick={() => dispatch({ type: 'UPDATE_PLAYER', payload: { ...player, socialType: player.socialType === 'introvert' ? 'unknown' : 'introvert' } })}
                  className={cn('text-[10px] px-1.5 py-0.5 rounded font-semibold transition-all', player.socialType === 'introvert' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-muted-foreground/50 hover:text-purple-400')}>社恐</button>
                <button
                  onClick={() => dispatch({ type: 'UPDATE_PLAYER', payload: { ...player, socialType: player.socialType === 'extrovert' ? 'unknown' : 'extrovert' } })}
                  className={cn('text-[10px] px-1.5 py-0.5 rounded font-semibold transition-all', player.socialType === 'extrovert' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-muted-foreground/50 hover:text-amber-400')}>社牛</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ConsolePage() {
  const { state, dispatch, createNewGame, getTagById } = useApp();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<'games' | 'identity'>('games');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [duplicateDialog, setDuplicateDialog] = useState<{ game: Game; existingId: string } | null>(null);
  const prevListLength = useRef(state.currentGameList.length);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const selectedItem = state.currentGameList.find(item => item.id === selectedItemId);

  React.useEffect(() => {
    if (state.currentGameList.length > prevListLength.current) {
      const newItem = state.currentGameList[state.currentGameList.length - 1];
      if (newItem) setSelectedItemId(newItem.id);
    }
    prevListLength.current = state.currentGameList.length;
  }, [state.currentGameList.length]);

  const handleAddGame = () => {
    const game = createNewGame();
    dispatch({ type: 'ADD_GAME_TO_LIST', payload: game });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = state.currentGameList.findIndex(i => i.id === active.id);
      const newIndex = state.currentGameList.findIndex(i => i.id === over.id);
      dispatch({ type: 'REORDER_GAME_LIST', payload: arrayMove(state.currentGameList, oldIndex, newIndex) });
    }
  };

  const handleSaveGame = (game: Game) => {
    if (selectedItemId) dispatch({ type: 'UPDATE_GAME_IN_LIST', payload: { itemId: selectedItemId, gameData: game } });
  };

  const handleSaveToLibrary = (game: Game) => {
    const existing = state.gameLibrary.find(g => g.name === game.name && g.id !== game.id);
    if (existing) {
      setDuplicateDialog({ game, existingId: existing.id });
    } else {
      dispatch({ type: 'ADD_GAME_TO_LIBRARY', payload: { ...game, id: nanoid() } });
      toast.success(`"${game.name}" 已保存到游戏库`);
    }
  };

  const handleDuplicateResolve = (action: 'overwrite' | 'new') => {
    if (!duplicateDialog) return;
    if (action === 'overwrite') {
      dispatch({ type: 'UPDATE_GAME_IN_LIBRARY', payload: { ...duplicateDialog.game, id: duplicateDialog.existingId } });
      toast.success('已覆盖原版本');
    } else {
      dispatch({ type: 'ADD_GAME_TO_LIBRARY', payload: { ...duplicateDialog.game, id: nanoid() } });
      toast.success('已另存新版本');
    }
    setDuplicateDialog(null);
  };

  const handleLoadToStage = () => {
    if (state.currentGameList.length === 0) { toast.error('游戏列表为空，请先添加游戏'); return; }
    toast.success(`已载入展台，共 ${state.currentGameList.length} 个游戏`);
    navigate('/stage');
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-1 px-4 py-3 border-b border-border flex-shrink-0">
        <button onClick={() => setActiveTab('games')} className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all', activeTab === 'games' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50')}>
          <List size={15} />游戏编辑
        </button>
        <button onClick={() => setActiveTab('identity')} className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all', activeTab === 'identity' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50')}>
          <Users size={15} />身份信息
        </button>
        <div className="ml-auto">
          {activeTab === 'games' && (
            <Button size="sm" onClick={handleLoadToStage} className="h-8 px-3 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white">
              <Monitor size={13} />载入展台
            </Button>
          )}
        </div>
      </div>

      {activeTab === 'games' ? (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-56 flex-shrink-0 border-r border-border flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border flex-shrink-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">游戏列表 ({state.currentGameList.length})</span>
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => setShowLibrary(!showLibrary)} className={cn('text-muted-foreground hover:text-foreground transition-colors', showLibrary && 'text-primary')}>
                      <BookOpen size={14} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>游戏库</TooltipContent>
                </Tooltip>
                <button onClick={handleAddGame} className="text-muted-foreground hover:text-primary transition-colors"><Plus size={14} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
              {state.currentGameList.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  <List size={20} className="mx-auto mb-2 opacity-30" />
                  <div>点击 + 添加游戏</div>
                  <div className="mt-1 opacity-60">或从游戏库导入</div>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={state.currentGameList.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    {state.currentGameList.map(item => (
                      <SortableGameItem key={item.id} item={item} isSelected={item.id === selectedItemId} onSelect={() => setSelectedItemId(item.id)}
                        onDelete={() => { dispatch({ type: 'REMOVE_GAME_FROM_LIST', payload: item.id }); if (selectedItemId === item.id) setSelectedItemId(null); }}
                        getTagById={getTagById} />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {showLibrary ? (
              <LibraryPanel onAddToList={game => { dispatch({ type: 'ADD_GAME_TO_LIST', payload: { ...game, id: nanoid() } }); toast.success(`"${game.name}" 已加入游戏列表`); }} onClose={() => setShowLibrary(false)} />
            ) : selectedItem ? (
              <GameEditor key={selectedItem.id} game={selectedItem.gameData} listItemId={selectedItem.id} onSave={handleSaveGame} onSaveToLibrary={handleSaveToLibrary} />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Edit3 size={32} className="mx-auto mb-3 opacity-20" />
                  <div className="text-sm">选择左侧游戏进行编辑</div>
                  <div className="text-xs mt-1 opacity-60">或点击 + 新建游戏</div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden"><IdentityEditor /></div>
      )}

      <Dialog open={!!duplicateDialog} onOpenChange={() => setDuplicateDialog(null)}>
        <DialogContent className="bg-card border-border text-card-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertCircle size={16} className="text-amber-400" />游戏名称重复</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">游戏库中已存在名为 "<span className="text-foreground font-medium">{duplicateDialog?.game.name}</span>" 的游戏，请选择处理方式：</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => handleDuplicateResolve('new')}>另存新版本</Button>
            <Button size="sm" onClick={() => handleDuplicateResolve('overwrite')} className="bg-amber-600 hover:bg-amber-500">覆盖原版本</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
