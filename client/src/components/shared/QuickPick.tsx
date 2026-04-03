// ============================================================
// 统一快捷选人组件
// 5列×6行，支持多选、翻页
// ============================================================

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, X, Users, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { Gender, SocialType } from '@/types';

const PAGE_SIZE = 30; // 5列 × 6行
const COLS = 5;

interface QuickPickProps {
  open: boolean;
  title?: string;
  confirmLabel?: string;
  multiSelect?: boolean;
  onConfirm: (playerNumbers: number[]) => void;
  onCancel: () => void;
}

export default function QuickPick({
  open,
  title = '请选择身份号',
  confirmLabel = '确认执行',
  multiSelect = true,
  onConfirm,
  onCancel,
}: QuickPickProps) {
  const { state } = useApp();
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const totalPlayers = state.players.length;
  const totalPages = Math.ceil(totalPlayers / PAGE_SIZE);

  const currentPagePlayers = useMemo(() => {
    const start = page * PAGE_SIZE;
    return state.players.slice(start, start + PAGE_SIZE);
  }, [state.players, page]);

  const getPlayerInfo = (num: number) => {
    const p = state.players.find(p => p.number === num);
    return p;
  };

  const toggleSelect = (num: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(num)) {
        next.delete(num);
      } else {
        if (!multiSelect) next.clear();
        next.add(num);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (selected.size === 0) return;
    onConfirm(Array.from(selected).sort((a, b) => a - b));
    setSelected(new Set());
    setPage(0);
  };

  const handleCancel = () => {
    setSelected(new Set());
    setPage(0);
    onCancel();
  };

  const genderLabel = (g: Gender) => {
    if (g === 'male') return '♂';
    if (g === 'female') return '♀';
    return '';
  };

  const socialLabel = (s: SocialType) => {
    if (s === 'introvert') return '恐';
    if (s === 'extrovert') return '牛';
    return '';
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && handleCancel()}>
      <DialogContent className="max-w-lg bg-card border-border text-card-foreground p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Users size={16} className="text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4">
          {/* 选中状态提示 */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">
              {multiSelect ? `已选 ${selected.size} 人` : selected.size > 0 ? `已选 #${Array.from(selected)[0]}` : '请点击选择'}
            </span>
            {selected.size > 0 && (
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <X size={12} />清空
              </button>
            )}
          </div>

          {/* 号码格 5列 × 6行 */}
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
          >
            {currentPagePlayers.map(player => {
              const isSelected = selected.has(player.number);
              const gl = genderLabel(player.gender);
              const sl = socialLabel(player.socialType);
              return (
                <button
                  key={player.number}
                  onClick={() => toggleSelect(player.number)}
                  className={cn(
                    'relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all duration-150 font-mono-display text-lg font-bold',
                    isSelected
                      ? 'border-primary bg-primary/20 text-primary shadow-lg shadow-primary/20'
                      : 'border-border bg-secondary/50 text-foreground hover:border-primary/50 hover:bg-secondary'
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-1 right-1">
                      <Check size={10} className="text-primary" />
                    </div>
                  )}
                  <span className="text-base leading-none">{player.number}</span>
                  {(gl || sl) && (
                    <span className="text-[9px] mt-0.5 opacity-60 leading-none">
                      {gl}{sl}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 翻页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="h-7 px-2"
              >
                <ChevronLeft size={14} />
              </Button>
              <span className="text-xs text-muted-foreground">
                第 {page + 1} / {totalPages} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="h-7 px-2"
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-5 pb-5 flex gap-2 justify-end border-t border-border pt-3">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            取消
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={selected.size === 0}
            className="bg-primary hover:bg-primary/90"
          >
            {confirmLabel}
            {selected.size > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                {selected.size}
              </Badge>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
