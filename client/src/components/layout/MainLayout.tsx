// ============================================================
// 主布局 - 左侧导航 + 右侧内容区
// Design: Professional Dark Dashboard, persistent sidebar
// ============================================================

import React from 'react';
import { useLocation, Link } from 'wouter';
import {
  LayoutDashboard,
  Monitor,
  RotateCcw,
  Package,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { path: '/', label: '控制台', icon: LayoutDashboard, description: '编排游戏 · 身份信息', color: '#6366f1' },
  { path: '/stage', label: '展台', icon: Monitor, description: '现场主持展示界面', color: '#10b981' },
  { path: '/wheel', label: '轮盘', icon: RotateCcw, description: '轮盘编辑与抽奖', color: '#8b5cf6' },
  { path: '/peripheral', label: '周边', icon: Package, description: '周边清单管理', color: '#f59e0b' },
  { path: '/tools', label: '工具', icon: Wrench, description: '随机工具集合', color: '#f43f5e' },
];

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* ---- 左侧导航栏 ---- */}
      <aside className="w-56 flex-shrink-0 flex flex-col border-r border-sidebar-border bg-sidebar">
        {/* Logo区域 */}
        <div className="px-4 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
              <Sparkles size={17} className="text-primary" />
            </div>
            <div>
              <div className="text-sm font-bold text-sidebar-foreground leading-tight tracking-wide">奇妙奇遇</div>
              <div className="text-[10px] text-muted-foreground/70 tracking-widest uppercase">Game Console</div>
            </div>
          </div>
        </div>

        {/* 导航项 */}
        <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group relative overflow-hidden',
                    isActive
                      ? 'text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  )}
                  style={isActive ? {
                    backgroundColor: item.color + '18',
                    boxShadow: `inset 0 0 0 1px ${item.color}30`,
                  } : {}}
                >
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                  <div
                    className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                      isActive ? 'shadow-sm' : 'group-hover:scale-105'
                    )}
                    style={isActive ? { backgroundColor: item.color + '25', color: item.color } : {}}
                  >
                    <item.icon
                      size={15}
                      className={cn(
                        'transition-colors',
                        !isActive && 'text-muted-foreground group-hover:text-foreground'
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn('text-sm font-semibold leading-tight', isActive && 'text-foreground')} style={isActive ? { color: item.color } : {}}>
                      {item.label}
                    </div>
                    <div className="text-[10px] text-muted-foreground/50 leading-tight mt-0.5 truncate">{item.description}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* 底部版本信息 */}
        <div className="px-4 py-3 border-t border-sidebar-border">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-[10px] text-muted-foreground/50">v1.0.0 · 本地离线运行</div>
          </div>
        </div>
      </aside>

      {/* ---- 右侧内容区 ---- */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
