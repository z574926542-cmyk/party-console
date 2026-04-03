// ============================================================
// 主布局 - 侧边栏导航
// Design: 奇妙奇遇 v2 — 微醺夜晚社交娱乐品牌控制台
// Sidebar: 深底，金色品牌标识，精致导航项
// ============================================================

import React from 'react';
import { useLocation, Link } from 'wouter';
import {
  LayoutGrid,
  Tv2,
  Disc3,
  ShoppingBag,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  {
    path: '/',
    label: '控制台',
    icon: LayoutGrid,
    description: '编排 · 身份',
    accent: 'oklch(0.78 0.16 52)',       // 金
    accentBg: 'oklch(0.78 0.16 52 / 0.12)',
    accentBorder: 'oklch(0.78 0.16 52 / 0.3)',
  },
  {
    path: '/stage',
    label: '展台',
    icon: Tv2,
    description: '现场主持',
    accent: 'oklch(0.65 0.18 155)',      // 翠绿
    accentBg: 'oklch(0.65 0.18 155 / 0.12)',
    accentBorder: 'oklch(0.65 0.18 155 / 0.3)',
  },
  {
    path: '/wheel',
    label: '轮盘',
    icon: Disc3,
    description: '抽奖 · 随机',
    accent: 'oklch(0.60 0.20 285)',      // 冷紫
    accentBg: 'oklch(0.60 0.20 285 / 0.12)',
    accentBorder: 'oklch(0.60 0.20 285 / 0.3)',
  },
  {
    path: '/peripheral',
    label: '周边',
    icon: ShoppingBag,
    description: '清单 · 记录',
    accent: 'oklch(0.75 0.18 65)',       // 琥珀
    accentBg: 'oklch(0.75 0.18 65 / 0.12)',
    accentBorder: 'oklch(0.75 0.18 65 / 0.3)',
  },
  {
    path: '/tools',
    label: '工具',
    icon: Zap,
    description: '随机 · 计时',
    accent: 'oklch(0.62 0.22 10)',       // 酒红
    accentBg: 'oklch(0.62 0.22 10 / 0.12)',
    accentBorder: 'oklch(0.62 0.22 10 / 0.3)',
  },
];

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">

      {/* ============================================================
          左侧导航栏
          ============================================================ */}
      <aside
        className="w-52 flex-shrink-0 flex flex-col overflow-hidden"
        style={{
          background: 'var(--sidebar)',
          borderRight: '1px solid oklch(0.20 0.022 270)',
        }}
      >
        {/* ---- Logo 区域 ---- */}
        <div
          className="px-5 py-5 flex-shrink-0"
          style={{ borderBottom: '1px solid oklch(0.18 0.02 270)' }}
        >
          <div className="flex items-center gap-3">
            {/* 品牌图标：金色星芒 */}
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, oklch(0.82 0.17 52), oklch(0.65 0.14 45))',
                boxShadow: '0 2px 8px oklch(0.78 0.16 52 / 0.4)',
              }}
            >
              <span style={{ fontSize: '14px', lineHeight: 1 }}>✦</span>
            </div>
            <div className="min-w-0">
              <div
                className="font-bold leading-tight tracking-wide"
                style={{
                  fontSize: '0.9rem',
                  color: 'oklch(0.90 0.01 270)',
                  fontFamily: "'Sora', sans-serif",
                }}
              >
                奇妙奇遇
              </div>
              <div
                style={{
                  fontSize: '0.6rem',
                  letterSpacing: '0.15em',
                  color: 'oklch(0.45 0.02 270)',
                  textTransform: 'uppercase',
                  fontFamily: "'Sora', sans-serif",
                  marginTop: '1px',
                }}
              >
                Game Console
              </div>
            </div>
          </div>
        </div>

        {/* ---- 导航项 ---- */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = location === item.path;
            const Icon = item.icon;

            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group relative',
                  )}
                  style={
                    isActive
                      ? {
                          background: item.accentBg,
                          border: `1px solid ${item.accentBorder}`,
                        }
                      : {
                          border: '1px solid transparent',
                        }
                  }
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = 'oklch(0.18 0.022 270)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.24 0.022 270)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = '';
                      (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                    }
                  }}
                >
                  {/* 图标 */}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                    style={
                      isActive
                        ? {
                            background: `${item.accent}22`,
                            color: item.accent,
                          }
                        : {
                            color: 'oklch(0.50 0.02 270)',
                          }
                    }
                  >
                    <Icon size={14} />
                  </div>

                  {/* 文字 */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-semibold leading-tight transition-colors"
                      style={{
                        color: isActive ? item.accent : 'oklch(0.65 0.02 270)',
                        fontFamily: "'Sora', 'Noto Sans SC', sans-serif",
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: 'oklch(0.42 0.015 270)',
                        marginTop: '1px',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {item.description}
                    </div>
                  </div>

                  {/* 活跃指示点 */}
                  {isActive && (
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{
                        background: item.accent,
                        boxShadow: `0 0 6px ${item.accent}`,
                      }}
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* ---- 底部状态 ---- */}
        <div
          className="px-4 py-3 flex-shrink-0"
          style={{ borderTop: '1px solid oklch(0.18 0.02 270)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: 'oklch(0.65 0.18 155)' }}
            />
            <span
              style={{
                fontSize: '0.6rem',
                color: 'oklch(0.40 0.015 270)',
                letterSpacing: '0.05em',
                fontFamily: "'Sora', sans-serif",
              }}
            >
              v1.0 · 本地离线
            </span>
          </div>
        </div>
      </aside>

      {/* ---- 右侧内容区 ---- */}
      <main className="flex-1 overflow-hidden animate-fade-in">
        {children}
      </main>
    </div>
  );
}
