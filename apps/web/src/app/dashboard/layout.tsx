'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Nyumbani', icon: '🏠' },
  { href: '/dashboard/kazi', label: 'Kazi Zangu', icon: '📋' },
  { href: '/dashboard/maeneo', label: 'Maeneo', icon: '📍' },
  { href: '/dashboard/wasifu', label: 'Wasifu', icon: '👤' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="container-app flex items-center justify-between h-14">
          <Link href="/dashboard" className="text-lg font-bold text-primary-500">
            Fundi Wangu
          </Link>
          <Link href="/book" className="btn-primary text-xs py-1.5 px-4">
            + Kazi Mpya
          </Link>
        </div>
      </header>

      <div className="container-app py-6 flex gap-6">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:block w-56 shrink-0">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* Bottom nav — mobile */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 flex z-40">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2 text-xs ${
                isActive ? 'text-primary-500' : 'text-gray-400'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
