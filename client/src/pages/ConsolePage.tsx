// ============================================================
// 控制台页面 - 游戏编辑 + 身份信息
// Design: 奇妙奇遇 v2 — 专业工具台 + 品牌感
// 气质：专业、清晰、工具化，像"创作后台 + 编排后台"
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
  Eye, X, BookOpen, Edit3, Monitor, Users,
  Check, RotateCcw, Tag, Wrench, Image, ChevronRight,
  Search, FileText, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

const TOOL_OPTIONS: { type: ToolType; label: string; emoji: string; color: string }[] = [
  { type: 'random-number', label: '随机数字', emoji: '🎲', color: 'oklch(0.78 0.16 52)' },
  { type: 'random-pick',   label: '随机选人', emoji: '👤', color: 'oklch(0.65 0.18 155)' },
  { type: 'random-group',  label: '随机分组', emoji: '👥', color: 'oklch(0.60 0.20 285)' },
  { type: 'countdown',     label: '倒计时',   emoji: '⏱',  color: 'oklch(0.75 0.18 65)' },
  { type: 'dice',          label: '骰子',     emoji: '🎯', color: 'oklch(0.62 0.22 10)' },
];

const TAG_COLORS = [
  '#d4a843', '#b84a3a', '#8b5cf6', '#10b981',
  '#06b6d4', '#f59e0b', '#ec4899', '#64748b',
];

// ============================================================
// 可拖拽游戏列表项
// ============================================================
function SortableGameItem({ item, isSelected, onSelect, onDelete, getTagById }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group cursor-pointer"
      onClick={onSelect}
    >
      <div
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150"
        style={
          isSelected
            ? {
                background: 'oklch(0.78 0.16 52 / 0.1)',
                border: '1px solid oklch(0.78 0.16 52 / 0.35)',
              }
            : {
                background: 'oklch(0.155 0.022 270)',
                border: '1px solid oklch(0.24 0.022 270)',
              }
        }
        onMouseEnter={e => {
          if (!isSelected) {
            (e.currentTarget as HTMLElement).style.background = 'oklch(0.185 0.025 270)';
            (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.30 0.025 270)';
          }
        }}
        onMouseLeave={e => {
          if (!isSelected) {
            (e.currentTarget as HTMLElement).style.background = 'oklch(0.155 0.022 270)';
            (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.24 0.022 270)';
          }
        }}
      >
        {/* 拖拽手柄 */}
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 opacity-0 group-hover:opacity-40 hover:!opacity-70 transition-opacity cursor-grab active:cursor-grabbing"
          style={{ color: 'oklch(0.55 0.02 270)' }}
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={13} />
        </div>

        {/* 序号 */}
        <span
          className="font-mono-display text-xs font-bold w-5 flex-shrink-0 text-center"
          style={{ color: isSelected ? 'oklch(0.78 0.16 52)' : 'oklch(0.45 0.02 270)' }}
        >
          {item.order}
        </span>

        {/* 游戏名 */}
        <span
          className="flex-1 text-sm font-medium truncate"
          style={{ color: isSelected ? 'oklch(0.92 0.008 270)' : 'oklch(0.75 0.015 270)' }}
        >
          {item.gameData.name}
        </span>

        {/* 标签 */}
        <div className="flex gap-1 flex-shrink-0">
          {item.gameData.tags.slice(0, 2).map((tagId: string) => {
            const tag = getTagById(tagId);
            if (!tag) return null;
            return (
              <span
                key={tagId}
                className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: tag.color + '28', color: tag.color }}
              >
                {tag.name}
              </span>
            );
          })}
        </div>

        {/* 删除 */}
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-60 hover:!opacity-100 flex-shrink-0 transition-all"
          style={{ color: 'oklch(0.62 0.22 10)' }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 标签编辑器
// ============================================================
function TagEditor({ selectedTagIds, onChange }: { selectedTagIds: string[]; onChange: (ids: string[]) => void }) {
  const { state, dispatch } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#d4a843');

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
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {state.tags.map(tag => {
          const isSelected = selectedTagIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className="text-xs px-2.5 py-1 rounded-full font-semibold transition-all duration-150"
              style={
                isSelected
                  ? { background: tag.color, color: '#fff', border: `1px solid ${tag.color}`, boxShadow: `0 0 8px ${tag.color}50` }
                  : { background: 'oklch(0.19 0.022 270)', color: 'oklch(0.60 0.02 270)', border: '1px solid oklch(0.28 0.022 270)' }
              }
            >
              {tag.name}
              {tag.isSystem && <span className="ml-1 opacity-50">·</span>}
            </button>
          );
        })}
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="text-xs px-2.5 py-1 rounded-full font-medium transition-all duration-150"
          style={{
            background: 'transparent',
            color: 'oklch(0.50 0.02 270)',
            border: '1px dashed oklch(0.30 0.022 270)',
          }}
        >
          <Plus size={9} className="inline mr-1" />新标签
        </button>
      </div>

      {showCreate && (
        <div
          className="flex items-center gap-2 p-2.5 rounded-xl animate-pop-in"
          style={{ background: 'oklch(0.155 0.022 270)', border: '1px solid oklch(0.26 0.022 270)' }}
        >
          <Input
            value={newTagName}
            onChange={e => setNewTagName(e.target.value)}
            placeholder="标签名称"
            className="h-7 text-xs"
            style={{ background: 'oklch(0.13 0.022 270)', border: '1px solid oklch(0.26 0.022 270)', color: 'oklch(0.90 0.008 270)' }}
            onKeyDown={e => e.key === 'Enter' && createTag()}
          />
          <div className="flex gap-1">
            {TAG_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setNewTagColor(c)}
                className="w-4 h-4 rounded-full transition-transform"
                style={{
                  background: c,
                  border: newTagColor === c ? '2px solid white' : '2px solid transparent',
                  transform: newTagColor === c ? 'scale(1.25)' : 'scale(1)',
                }}
              />
            ))}
          </div>
          <button
            onClick={createTag}
            className="text-xs px-2.5 py-1 rounded-lg font-semibold flex-shrink-0"
            style={{ background: 'oklch(0.78 0.16 52)', color: 'oklch(0.12 0.02 52)' }}
          >
            添加
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 工具绑定编辑器
// ============================================================
function ToolBindingEditor({ boundTools, onChange }: { boundTools: BoundTool[]; onChange: (tools: BoundTool[]) => void }) {
  const { state } = useApp();

  const toggleTool = (type: ToolType, label: string) => {
    const existing = boundTools.find(t => t.type === 'tool' && t.toolType === type);
    onChange(
      existing
        ? boundTools.filter(t => !(t.type === 'tool' && t.toolType === type))
        : [...boundTools, { id: nanoid(), type: 'tool', toolType: type, label }]
    );
  };

  const toggleWheel = (wheelId: string, wheelName: string) => {
    const existing = boundTools.find(t => t.type === 'wheel' && t.wheelId === wheelId);
    onChange(
      existing
        ? boundTools.filter(t => !(t.type === 'wheel' && t.wheelId === wheelId))
        : [...boundTools, { id: nanoid(), type: 'wheel', wheelId, label: wheelName }]
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {TOOL_OPTIONS.map(opt => {
          const isSelected = boundTools.some(t => t.type === 'tool' && t.toolType === opt.type);
          return (
            <button
              key={opt.type}
              onClick={() => toggleTool(opt.type, opt.label)}
              className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all duration-150 flex items-center gap-1.5"
              style={
                isSelected
                  ? { background: `${opt.color}18`, color: opt.color, border: `1px solid ${opt.color}45`, boxShadow: `0 0 8px ${opt.color}20` }
                  : { background: 'oklch(0.19 0.022 270)', color: 'oklch(0.58 0.02 270)', border: '1px solid oklch(0.28 0.022 270)' }
              }
            >
              <span>{opt.emoji}</span>
              {opt.label}
            </button>
          );
        })}
      </div>
      {state.wheels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {state.wheels.map(wheel => {
            const isSelected = boundTools.some(t => t.type === 'wheel' && t.wheelId === wheel.id);
            return (
              <button
                key={wheel.id}
                onClick={() => toggleWheel(wheel.id, wheel.name)}
                className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all duration-150 flex items-center gap-1.5"
                style={
                  isSelected
                    ? { background: 'oklch(0.60 0.20 285 / 0.15)', color: 'oklch(0.72 0.18 285)', border: '1px solid oklch(0.60 0.20 285 / 0.4)' }
                    : { background: 'oklch(0.19 0.022 270)', color: 'oklch(0.58 0.02 270)', border: '1px solid oklch(0.28 0.022 270)' }
                }
              >
                <RotateCcw size={10} />
                {wheel.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 游戏编辑器主体
// ============================================================
function GameEditor({ game, onSave, onSaveToLibrary, onLoadToStage }: {
  game: Game;
  onSave: (g: Game) => void;
  onSaveToLibrary: (g: Game) => void;
  onLoadToStage: (g: Game) => void;
}) {
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
      {/* 编辑器顶栏 */}
      <div
        className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
        style={{ borderBottom: '1px solid oklch(0.22 0.022 270)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: 'oklch(0.78 0.16 52 / 0.15)' }}
          >
            <Edit3 size={12} style={{ color: 'oklch(0.78 0.16 52)' }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: 'oklch(0.88 0.008 270)' }}>
            游戏编辑器
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: 'oklch(0.50 0.02 270)' }}>实时</span>
            <Switch checked={livePreview} onCheckedChange={setLivePreview} className="scale-75" />
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg, oklch(0.82 0.17 52), oklch(0.72 0.15 45))',
              color: 'oklch(0.12 0.02 52)',
              boxShadow: '0 2px 8px oklch(0.78 0.16 52 / 0.3)',
            }}
          >
            <Save size={11} />保存
          </button>
          <button
            onClick={() => onSaveToLibrary(editing)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: 'oklch(0.19 0.022 270)',
              color: 'oklch(0.65 0.02 270)',
              border: '1px solid oklch(0.28 0.022 270)',
            }}
          >
            <BookOpen size={11} />存库
          </button>
          <button
            onClick={() => onLoadToStage(editing)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: 'oklch(0.65 0.18 155 / 0.15)',
              color: 'oklch(0.72 0.18 155)',
              border: '1px solid oklch(0.65 0.18 155 / 0.35)',
            }}
          >
            <Monitor size={11} />展台
          </button>
        </div>
      </div>

      {/* 编辑器内容 */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

        {/* 游戏名称 */}
        <div className="space-y-1.5">
          <label className="section-label">游戏名称</label>
          <input
            value={editing.name}
            onChange={e => update('name', e.target.value)}
            placeholder="输入游戏名称..."
            className="w-full px-3.5 py-2.5 rounded-xl text-base font-semibold transition-all outline-none"
            style={{
              background: 'oklch(0.14 0.022 270)',
              border: '1px solid oklch(0.26 0.025 270)',
              color: 'oklch(0.92 0.008 270)',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'oklch(0.78 0.16 52 / 0.6)';
              e.target.style.boxShadow = '0 0 0 3px oklch(0.78 0.16 52 / 0.12)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'oklch(0.26 0.025 270)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* 游戏规则 */}
        <div className="space-y-1.5">
          <label className="section-label flex items-center gap-1.5">
            <FileText size={10} />游戏规则
          </label>
          <textarea
            value={editing.rules}
            onChange={e => update('rules', e.target.value)}
            placeholder="描述游戏规则，玩家看得到这里..."
            rows={4}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm resize-none transition-all outline-none leading-relaxed"
            style={{
              background: 'oklch(0.14 0.022 270)',
              border: '1px solid oklch(0.26 0.025 270)',
              color: 'oklch(0.85 0.008 270)',
              minHeight: '90px',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'oklch(0.78 0.16 52 / 0.6)';
              e.target.style.boxShadow = '0 0 0 3px oklch(0.78 0.16 52 / 0.12)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'oklch(0.26 0.025 270)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* 结算方式 */}
        <div className="space-y-2">
          <label className="section-label">结算方式</label>
          <div className="grid grid-cols-2 gap-2.5">
            {/* 胜者 */}
            <div className="space-y-1.5">
              <div
                className="flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: 'oklch(0.68 0.18 155)' }}
              >
                <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: 'oklch(0.65 0.18 155 / 0.2)' }}>
                  <Check size={8} />
                </div>
                胜者结算
              </div>
              <textarea
                value={editing.winnerSettlement}
                onChange={e => update('winnerSettlement', e.target.value)}
                placeholder="胜者获得..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl text-sm resize-none transition-all outline-none leading-relaxed"
                style={{
                  background: 'oklch(0.65 0.18 155 / 0.05)',
                  border: '1px solid oklch(0.65 0.18 155 / 0.2)',
                  color: 'oklch(0.82 0.008 270)',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'oklch(0.65 0.18 155 / 0.5)';
                  e.target.style.boxShadow = '0 0 0 3px oklch(0.65 0.18 155 / 0.08)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'oklch(0.65 0.18 155 / 0.2)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            {/* 败者 */}
            <div className="space-y-1.5">
              <div
                className="flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: 'oklch(0.68 0.20 10)' }}
              >
                <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: 'oklch(0.62 0.22 10 / 0.2)' }}>
                  <X size={8} />
                </div>
                败者结算
              </div>
              <textarea
                value={editing.loserSettlement}
                onChange={e => update('loserSettlement', e.target.value)}
                placeholder="败者需要..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl text-sm resize-none transition-all outline-none leading-relaxed"
                style={{
                  background: 'oklch(0.62 0.22 10 / 0.05)',
                  border: '1px solid oklch(0.62 0.22 10 / 0.2)',
                  color: 'oklch(0.82 0.008 270)',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'oklch(0.62 0.22 10 / 0.5)';
                  e.target.style.boxShadow = '0 0 0 3px oklch(0.62 0.22 10 / 0.08)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'oklch(0.62 0.22 10 / 0.2)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
        </div>

        {/* 结算图片 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="section-label">结算图片</label>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: 'oklch(0.65 0.14 52)' }}
            >
              <Plus size={11} />添加
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddImage} />
          </div>
          {editing.settlementImages.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {editing.settlementImages.map(img => (
                <div key={img.id} className="relative group w-[72px]">
                  <div
                    className="w-[72px] h-[72px] rounded-xl overflow-hidden"
                    style={{ border: '1px solid oklch(0.28 0.022 270)' }}
                  >
                    <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                      <button
                        onClick={() => update('settlementImages', editing.settlementImages.filter(i => i.id !== img.id))}
                        style={{ color: 'oklch(0.72 0.20 10)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="text-[9px] text-center mt-0.5 truncate" style={{ color: 'oklch(0.48 0.015 270)' }}>{img.name}</div>
                </div>
              ))}
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl p-4 text-center text-xs cursor-pointer transition-all"
              style={{
                border: '1px dashed oklch(0.28 0.022 270)',
                color: 'oklch(0.45 0.015 270)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.78 0.16 52 / 0.4)';
                (e.currentTarget as HTMLElement).style.color = 'oklch(0.65 0.14 52)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.28 0.022 270)';
                (e.currentTarget as HTMLElement).style.color = 'oklch(0.45 0.015 270)';
              }}
            >
              <Image size={18} className="mx-auto mb-1.5 opacity-40" />
              点击添加展示图片
            </div>
          )}
        </div>

        {/* 绑定工具 */}
        <div className="space-y-2">
          <label className="section-label flex items-center gap-1.5">
            <Wrench size={10} />绑定工具
          </label>
          <ToolBindingEditor boundTools={editing.tools} onChange={tools => update('tools', tools)} />
        </div>

        {/* 标签 */}
        <div className="space-y-2">
          <label className="section-label flex items-center gap-1.5">
            <Tag size={10} />标签
          </label>
          <TagEditor selectedTagIds={editing.tags} onChange={ids => update('tags', ids)} />
        </div>

        {/* 备注 */}
        <div className="space-y-1.5">
          <label className="section-label">主持人备注</label>
          <textarea
            value={editing.notes}
            onChange={e => update('notes', e.target.value)}
            placeholder="主持人内部备注，不在展台显示..."
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm resize-none transition-all outline-none leading-relaxed"
            style={{
              background: 'oklch(0.14 0.022 270)',
              border: '1px solid oklch(0.26 0.025 270)',
              color: 'oklch(0.72 0.015 270)',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'oklch(0.78 0.16 52 / 0.4)';
              e.target.style.boxShadow = '0 0 0 3px oklch(0.78 0.16 52 / 0.08)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'oklch(0.26 0.025 270)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* 底部间距 */}
        <div className="h-4" />
      </div>
    </div>
  );
}

// ============================================================
// 游戏库面板
// ============================================================
function LibraryPanel({ onAddToList, onClose }: { onAddToList: (g: Game) => void; onClose: () => void }) {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filtered = state.gameLibrary.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));

  const handleExport = () => {
    const json = JSON.stringify({ gameLibrary: state.gameLibrary, tags: state.tags }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `game-library-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success('游戏库已导出');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try { dispatch({ type: 'IMPORT_GAME_LIBRARY', payload: ev.target?.result as string }); toast.success('导入成功'); }
      catch { toast.error('导入失败，请检查文件格式'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="h-full flex flex-col animate-slide-in-right">
      {/* 顶栏 */}
      <div
        className="flex items-center justify-between px-4 py-3.5 flex-shrink-0"
        style={{ borderBottom: '1px solid oklch(0.22 0.022 270)' }}
      >
        <div className="flex items-center gap-2">
          <BookOpen size={14} style={{ color: 'oklch(0.78 0.16 52)' }} />
          <span className="text-sm font-semibold" style={{ color: 'oklch(0.88 0.008 270)' }}>游戏库</span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
            style={{ background: 'oklch(0.78 0.16 52 / 0.15)', color: 'oklch(0.78 0.16 52)' }}
          >
            {state.gameLibrary.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all"
            style={{ color: 'oklch(0.55 0.02 270)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.80 0.01 270)'; (e.currentTarget as HTMLElement).style.background = 'oklch(0.20 0.022 270)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.55 0.02 270)'; (e.currentTarget as HTMLElement).style.background = ''; }}
          >
            <Download size={11} />导出
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all"
            style={{ color: 'oklch(0.55 0.02 270)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.80 0.01 270)'; (e.currentTarget as HTMLElement).style.background = 'oklch(0.20 0.022 270)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.55 0.02 270)'; (e.currentTarget as HTMLElement).style.background = ''; }}
          >
            <Upload size={11} />导入
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-all"
            style={{ color: 'oklch(0.50 0.02 270)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.80 0.01 270)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.50 0.02 270)'; }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 搜索 */}
      <div className="px-3 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid oklch(0.20 0.022 270)' }}>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'oklch(0.45 0.015 270)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索游戏..."
            className="w-full pl-7 pr-3 py-1.5 rounded-lg text-xs outline-none transition-all"
            style={{
              background: 'oklch(0.155 0.022 270)',
              border: '1px solid oklch(0.24 0.022 270)',
              color: 'oklch(0.85 0.008 270)',
            }}
          />
        </div>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {filtered.length === 0 ? (
          <div className="text-center py-10" style={{ color: 'oklch(0.45 0.015 270)' }}>
            <BookOpen size={28} className="mx-auto mb-2 opacity-25" />
            <div className="text-xs">{search ? '没有找到匹配的游戏' : '游戏库为空'}</div>
            <div className="text-[10px] mt-1 opacity-60">保存游戏后会出现在这里</div>
          </div>
        ) : filtered.map(game => (
          <div
            key={game.id}
            className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all"
            style={{
              background: 'oklch(0.155 0.022 270)',
              border: '1px solid oklch(0.24 0.022 270)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'oklch(0.185 0.025 270)';
              (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.30 0.025 270)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'oklch(0.155 0.022 270)';
              (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.24 0.022 270)';
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: 'oklch(0.85 0.008 270)' }}>{game.name}</div>
              <div className="flex gap-1 mt-0.5 flex-wrap">
                {game.tags.slice(0, 3).map(tagId => {
                  const tag = state.tags.find(t => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <span key={tagId} className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: tag.color + '28', color: tag.color }}>
                      {tag.name}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onAddToList(game)}
                className="text-[10px] px-2 py-1 rounded-lg font-semibold transition-all"
                style={{ background: 'oklch(0.78 0.16 52 / 0.15)', color: 'oklch(0.78 0.16 52)', border: '1px solid oklch(0.78 0.16 52 / 0.3)' }}
              >
                加入
              </button>
              <button
                onClick={() => dispatch({ type: 'REMOVE_GAME_FROM_LIBRARY', payload: game.id })}
                className="p-1 rounded-lg transition-all"
                style={{ color: 'oklch(0.55 0.02 270)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.62 0.22 10)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.55 0.02 270)'; }}
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 身份信息编辑器
// ============================================================
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
  const unsetCount = state.players.filter(p => (!p.gender || p.gender === 'unknown') && (!p.socialType || p.socialType === 'unknown')).length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 顶栏 */}
      <div
        className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
        style={{ borderBottom: '1px solid oklch(0.22 0.022 270)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'oklch(0.60 0.20 285 / 0.15)' }}>
            <Users size={12} style={{ color: 'oklch(0.68 0.18 285)' }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: 'oklch(0.88 0.008 270)' }}>身份信息</span>
        </div>

        {/* 统计徽章 */}
        <div className="flex items-center gap-2">
          {[
            { label: '♂', count: maleCount, color: 'oklch(0.65 0.18 220)' },
            { label: '♀', count: femaleCount, color: 'oklch(0.68 0.20 350)' },
            { label: '社恐', count: introvertCount, color: 'oklch(0.65 0.18 285)' },
            { label: '社牛', count: extrovertCount, color: 'oklch(0.75 0.18 65)' },
          ].map(stat => (
            <div
              key={stat.label}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: `${stat.color}18`, color: stat.color }}
            >
              <span>{stat.label}</span>
              <span className="font-mono-display">{stat.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 人数控制 */}
      <div
        className="px-5 py-3 flex items-center gap-4 flex-shrink-0"
        style={{ borderBottom: '1px solid oklch(0.20 0.022 270)' }}
      >
        <span className="text-xs" style={{ color: 'oklch(0.55 0.02 270)' }}>总人数</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleCountChange(playerCount - 1)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-all"
            style={{ background: 'oklch(0.19 0.022 270)', border: '1px solid oklch(0.28 0.022 270)', color: 'oklch(0.70 0.02 270)' }}
          >
            −
          </button>
          <input
            type="number"
            value={playerCount}
            onChange={e => handleCountChange(parseInt(e.target.value) || 1)}
            className="w-14 h-7 text-center text-sm font-mono-display font-semibold rounded-lg outline-none transition-all"
            style={{
              background: 'oklch(0.155 0.022 270)',
              border: '1px solid oklch(0.28 0.022 270)',
              color: 'oklch(0.88 0.008 270)',
            }}
          />
          <button
            onClick={() => handleCountChange(playerCount + 1)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-all"
            style={{ background: 'oklch(0.19 0.022 270)', border: '1px solid oklch(0.28 0.022 270)', color: 'oklch(0.70 0.02 270)' }}
          >
            +
          </button>
        </div>
        <span className="text-xs" style={{ color: 'oklch(0.45 0.015 270)' }}>
          共 <span className="font-mono-display font-semibold" style={{ color: 'oklch(0.78 0.16 52)' }}>{state.players.length}</span> 人
          {unsetCount > 0 && (
            <span className="ml-2" style={{ color: 'oklch(0.55 0.02 270)' }}>· {unsetCount} 人未设置</span>
          )}
        </span>

        {/* 快速重置 */}
        <button
          onClick={() => state.players.forEach(p => dispatch({ type: 'UPDATE_PLAYER', payload: { ...p, gender: 'unknown', socialType: 'unknown' } }))}
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all"
          style={{ color: 'oklch(0.50 0.02 270)', border: '1px solid oklch(0.26 0.022 270)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.72 0.20 10)'; (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.62 0.22 10 / 0.4)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'oklch(0.50 0.02 270)'; (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.26 0.022 270)'; }}
        >
          <RotateCcw size={10} />重置属性
        </button>
      </div>

      {/* 说明 */}
      <div className="px-5 py-2 flex-shrink-0">
        <div className="flex items-center gap-4 text-[10px]" style={{ color: 'oklch(0.45 0.015 270)' }}>
          <span>点击号码卡设置属性 · 属性会同步到工具的随机筛选</span>
        </div>
      </div>

      {/* 玩家格子网格 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(68px, 1fr))' }}>
          {state.players.map(player => {
            const genderClass = (player.gender === 'male') ? 'male' : (player.gender === 'female') ? 'female' : '';
            const socialClass = (player.socialType === 'introvert') ? 'introvert' : (player.socialType === 'extrovert') ? 'extrovert' : '';
            const activeClass = genderClass || socialClass;

            return (
              <div
                key={player.id}
                className={cn('player-cell', activeClass)}
              >
                {/* 号码 */}
                <div
                  className="font-mono-display font-bold text-sm leading-none"
                  style={{ color: activeClass ? 'oklch(0.88 0.008 270)' : 'oklch(0.65 0.02 270)' }}
                >
                  {player.number}
                </div>

                {/* 性别按钮 */}
                <div className="flex gap-0.5 mt-1">
                  <button
                    onClick={() => dispatch({ type: 'UPDATE_PLAYER', payload: { ...player, gender: player.gender === 'male' ? 'unknown' : 'male' } })}
                    className="text-[10px] px-1 py-0.5 rounded transition-all font-bold"
                    style={
                      (player.gender === 'male')
                        ? { background: 'oklch(0.60 0.18 220 / 0.3)', color: 'oklch(0.72 0.18 220)' }
                        : { background: 'oklch(0.18 0.02 270)', color: 'oklch(0.45 0.015 270)' }
                    }
                  >
                    ♂
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'UPDATE_PLAYER', payload: { ...player, gender: player.gender === 'female' ? 'unknown' : 'female' } })}
                    className="text-[10px] px-1 py-0.5 rounded transition-all font-bold"
                    style={
                      player.gender === 'female'
                        ? { background: 'oklch(0.65 0.20 350 / 0.3)', color: 'oklch(0.72 0.20 350)' }
                        : { background: 'oklch(0.18 0.02 270)', color: 'oklch(0.45 0.015 270)' }
                    }
                  >
                    ♀
                  </button>
                </div>

                {/* 社恐/社牛 */}
                <div className="flex gap-0.5 mt-0.5">
                  <button
                    onClick={() => dispatch({ type: 'UPDATE_PLAYER', payload: { ...player, socialType: player.socialType === 'introvert' ? 'unknown' : 'introvert' } })}
                    className="text-[9px] px-1 py-0.5 rounded transition-all font-semibold"
                    style={
                      (player.socialType === 'introvert')
                        ? { background: 'oklch(0.60 0.20 285 / 0.3)', color: 'oklch(0.70 0.18 285)' }
                        : { background: 'oklch(0.18 0.02 270)', color: 'oklch(0.40 0.015 270)' }
                    }
                  >
                    恐
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'UPDATE_PLAYER', payload: { ...player, socialType: player.socialType === 'extrovert' ? 'unknown' : 'extrovert' } })}
                    className="text-[9px] px-1 py-0.5 rounded transition-all font-semibold"
                    style={
                      (player.socialType === 'extrovert')
                        ? { background: 'oklch(0.75 0.18 65 / 0.3)', color: 'oklch(0.78 0.16 65)' }
                        : { background: 'oklch(0.18 0.02 270)', color: 'oklch(0.40 0.015 270)' }
                    }
                  >
                    牛
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 主页面
// ============================================================
export default function ConsolePage() {
  const { state, dispatch } = useApp();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<'games' | 'identity'>('games');
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedListItemId, setSelectedListItemId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const selectedItem = state.currentGameList.find(item => item.id === selectedListItemId);
  const selectedGame = selectedItem?.gameData;

  const createNewGame = useCallback(() => {
    const newGame: Game = {
      id: nanoid(),
      name: '新游戏',
      rules: '',
      winnerSettlement: '',
      loserSettlement: '',
      settlementImages: [],
      tools: [],
      tags: [],
      notes: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    dispatch({ type: 'ADD_GAME_TO_LIST', payload: newGame });
    setTimeout(() => {
      const newItem = state.currentGameList.find((i: any) => i.gameData.id === newGame.id);
      if (newItem) setSelectedListItemId(newItem.id);
    }, 50);
  }, [dispatch, state.currentGameList]);

  const handleSaveGame = useCallback((game: Game) => {
    if (!selectedListItemId) return;
    dispatch({ type: 'UPDATE_GAME_IN_LIST', payload: { itemId: selectedListItemId, gameData: game } });
  }, [dispatch, selectedListItemId]);

  const handleSaveToLibrary = useCallback((game: Game) => {
    dispatch({ type: 'ADD_GAME_TO_LIBRARY', payload: game });
    toast.success(`"${game.name}" 已存入游戏库`);
  }, [dispatch]);

  const handleLoadToStage = useCallback((game: Game) => {
    if (!selectedListItemId) return;
    dispatch({ type: 'SET_STAGE_CURRENT_GAME', payload: selectedListItemId });
    toast.success(`"${game.name}" 已载入展台`);
    navigate('/stage');
  }, [dispatch, selectedListItemId, navigate]);

  const handleAddFromLibrary = useCallback((game: Game) => {
    dispatch({ type: 'ADD_GAME_TO_LIST', payload: game });
    setShowLibrary(false);
    toast.success(`"${game.name}" 已加入列表`);
  }, [dispatch]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = state.currentGameList.findIndex((i: any) => i.id === active.id);
      const newIndex = state.currentGameList.findIndex((i: any) => i.id === over.id);
      const newList = arrayMove(state.currentGameList, oldIndex, newIndex).map((item, idx) => ({ ...item, order: idx + 1 }));
      dispatch({ type: 'REORDER_GAME_LIST', payload: newList });
    }
  }, [dispatch, state.currentGameList]);

  const getTagById = useCallback((id: string) => state.tags.find(t => t.id === id), [state.tags]);

  return (
    <div className="h-full flex overflow-hidden">

      {/* ============================================================
          左栏：游戏列表 / 身份信息切换
          ============================================================ */}
      <div
        className="flex flex-col flex-shrink-0 overflow-hidden"
        style={{
          width: '260px',
          background: 'oklch(0.135 0.024 270)',
          borderRight: '1px solid oklch(0.22 0.022 270)',
        }}
      >
        {/* Tab 切换 */}
        <div
          className="flex-shrink-0 px-3 pt-4 pb-0"
        >
          <div
            className="flex rounded-xl p-1 gap-1"
            style={{ background: 'oklch(0.115 0.022 270)' }}
          >
            {[
              { key: 'games', label: '游戏列表', icon: Layers },
              { key: 'identity', label: '身份信息', icon: Users },
            ].map(tab => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
                  style={
                    isActive
                      ? { background: 'oklch(0.78 0.16 52 / 0.15)', color: 'oklch(0.82 0.14 52)', border: '1px solid oklch(0.78 0.16 52 / 0.25)' }
                      : { color: 'oklch(0.50 0.02 270)', border: '1px solid transparent' }
                  }
                >
                  <Icon size={11} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 游戏列表 Tab */}
        {activeTab === 'games' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 操作栏 */}
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="section-label">
                {state.currentGameList.length} 个游戏
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowLibrary(!showLibrary)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all"
                  style={
                    showLibrary
                      ? { background: 'oklch(0.78 0.16 52 / 0.15)', color: 'oklch(0.78 0.16 52)' }
                      : { color: 'oklch(0.55 0.02 270)' }
                  }
                  onMouseEnter={e => { if (!showLibrary) (e.currentTarget as HTMLElement).style.color = 'oklch(0.80 0.01 270)'; }}
                  onMouseLeave={e => { if (!showLibrary) (e.currentTarget as HTMLElement).style.color = 'oklch(0.55 0.02 270)'; }}
                >
                  <BookOpen size={11} />库
                </button>
                <button
                  onClick={createNewGame}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: 'oklch(0.78 0.16 52 / 0.15)',
                    color: 'oklch(0.82 0.14 52)',
                    border: '1px solid oklch(0.78 0.16 52 / 0.25)',
                  }}
                >
                  <Plus size={11} />新建
                </button>
              </div>
            </div>

            {/* 游戏列表 */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
              {state.currentGameList.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-3xl mb-3 opacity-30">🎮</div>
                  <div className="text-xs" style={{ color: 'oklch(0.45 0.015 270)' }}>暂无游戏</div>
                  <button
                    onClick={createNewGame}
                    className="mt-3 flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: 'oklch(0.78 0.16 52 / 0.12)',
                      color: 'oklch(0.78 0.16 52)',
                      border: '1px solid oklch(0.78 0.16 52 / 0.25)',
                    }}
                  >
                    <Plus size={11} />新建第一个游戏
                  </button>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={state.currentGameList.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
                    {state.currentGameList.map((item: any) => (
                      <SortableGameItem
                        key={item.id}
                        item={item}
                        isSelected={selectedListItemId === item.id}
                        onSelect={() => setSelectedListItemId(item.id)}
                        onDelete={() => {
                          dispatch({ type: 'REMOVE_GAME_FROM_LIST', payload: item.id });
                          if (selectedListItemId === item.id) setSelectedListItemId(null);
                        }}
                        getTagById={getTagById}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        )}

        {/* 身份信息 Tab */}
        {activeTab === 'identity' && (
          <div className="flex-1 overflow-hidden">
            <IdentityEditor />
          </div>
        )}
      </div>

      {/* ============================================================
          右侧：游戏编辑器 / 游戏库
          ============================================================ */}
      <div className="flex-1 overflow-hidden flex">
        {/* 游戏编辑器 */}
        <div
          className="overflow-hidden transition-all duration-300"
          style={{ flex: showLibrary ? '1' : '1' }}
        >
          {selectedGame ? (
            <GameEditor
              key={selectedGame.id}
              game={selectedGame}
              onSave={handleSaveGame}
              onSaveToLibrary={handleSaveToLibrary}
              onLoadToStage={handleLoadToStage}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4 animate-fade-in">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'oklch(0.78 0.16 52 / 0.08)', border: '1px solid oklch(0.78 0.16 52 / 0.2)' }}
              >
                <Edit3 size={24} style={{ color: 'oklch(0.65 0.14 52)' }} />
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold" style={{ color: 'oklch(0.65 0.02 270)' }}>
                  选择一个游戏开始编辑
                </div>
                <div className="text-xs mt-1" style={{ color: 'oklch(0.45 0.015 270)' }}>
                  或点击"新建"创建第一个游戏
                </div>
              </div>
              <button
                onClick={createNewGame}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.82 0.17 52), oklch(0.72 0.15 45))',
                  color: 'oklch(0.12 0.02 52)',
                  boxShadow: '0 2px 12px oklch(0.78 0.16 52 / 0.3)',
                }}
              >
                <Plus size={14} />新建游戏
              </button>
            </div>
          )}
        </div>

        {/* 游戏库侧面板 */}
        {showLibrary && (
          <div
            className="w-72 flex-shrink-0 overflow-hidden"
            style={{
              borderLeft: '1px solid oklch(0.22 0.022 270)',
              background: 'oklch(0.135 0.024 270)',
            }}
          >
            <LibraryPanel
              onAddToList={handleAddFromLibrary}
              onClose={() => setShowLibrary(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
