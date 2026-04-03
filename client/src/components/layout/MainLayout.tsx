// ============================================================
// 奇妙奇遇控制台 - 顶部导航布局（亮色渐变风）
// ============================================================

import React from 'react';
import { useLocation, Link } from 'wouter';

const NAV_ITEMS = [
  {
    path: '/',
    label: '控制台',
    emoji: '🎮',
    gradient: 'linear-gradient(135deg, #ec407a, #7c4dff)',
    shadow: 'rgba(124, 77, 255, 0.35)',
    hoverBg: 'rgba(236, 64, 122, 0.08)',
  },
  {
    path: '/stage',
    label: '展台',
    emoji: '🎬',
    gradient: 'linear-gradient(135deg, #42a5f5, #26c6da)',
    shadow: 'rgba(66, 165, 245, 0.35)',
    hoverBg: 'rgba(66, 165, 245, 0.08)',
  },
  {
    path: '/wheel',
    label: '轮盘',
    emoji: '🎯',
    gradient: 'linear-gradient(135deg, #ff8a65, #ffca28)',
    shadow: 'rgba(255, 138, 101, 0.35)',
    hoverBg: 'rgba(255, 138, 101, 0.08)',
  },
  {
    path: '/peripheral',
    label: '结算',
    emoji: '🎁',
    gradient: 'linear-gradient(135deg, #66bb6a, #26c6da)',
    shadow: 'rgba(102, 187, 106, 0.35)',
    hoverBg: 'rgba(102, 187, 106, 0.08)',
  },
];

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location === '/';
    return location.startsWith(path);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #fce4ec 0%, #e8eaf6 35%, #e0f7fa 70%, #f3e5f5 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* ---- 顶部导航栏 ---- */}
      <header
        className="sticky top-0 z-40 h-16 flex items-center px-6 gap-3"
        style={{
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 2px 16px rgba(100, 80, 180, 0.08)',
        }}
      >
        {/* 品牌 */}
        <div className="flex items-center gap-2.5 mr-6 shrink-0">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md"
            style={{ background: 'linear-gradient(135deg, #ec407a, #7c4dff)' }}
          >
            奇
          </div>
          <div>
            <div
              className="text-sm font-black leading-tight"
              style={{ color: 'oklch(0.22 0.02 280)', letterSpacing: '-0.01em' }}
            >
              奇妙奇遇控制台
            </div>
            <div className="text-[10px] leading-tight" style={{ color: 'oklch(0.60 0.06 310)' }}>
              v1.0 · 本地离线
            </div>
          </div>
        </div>

        {/* 导航项 */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            return (
              <Link key={item.path} href={item.path}>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200"
                  style={
                    active
                      ? {
                          background: item.gradient,
                          color: 'white',
                          boxShadow: `0 4px 14px ${item.shadow}`,
                        }
                      : {
                          background: 'transparent',
                          color: 'oklch(0.42 0.04 280)',
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.background = item.hoverBg;
                      (e.currentTarget as HTMLButtonElement).style.color = 'oklch(0.30 0.08 310)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color = 'oklch(0.42 0.04 280)';
                    }
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{item.emoji}</span>
                  {item.label}
                </button>
              </Link>
            );
          })}
        </nav>

        {/* 右侧状态 */}
        <div className="ml-auto">
          <div
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
            style={{
              background: 'rgba(200, 180, 240, 0.2)',
              color: 'oklch(0.52 0.08 310)',
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: 'oklch(0.65 0.18 155)' }}
            />
            本地存储
          </div>
        </div>
      </header>

      {/* ---- 内容区域 ---- */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
