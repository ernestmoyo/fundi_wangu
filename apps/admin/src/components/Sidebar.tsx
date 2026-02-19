'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/kazi', label: 'Kazi za Moja kwa Moja', icon: '🗺️' },
  { href: '/admin/uthibitisho', label: 'Uthibitisho', icon: '✅' },
  { href: '/admin/migogoro', label: 'Migogoro', icon: '⚖️' },
  { href: '/admin/fedha', label: 'Fedha', icon: '💰' },
  { href: '/admin/watumiaji', label: 'Watumiaji', icon: '👥' },
  { href: '/admin/malipo', label: 'Malipo ya Nje', icon: '🏦' },
  { href: '/admin/mipangilio', label: 'Mipangilio', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-gray-100 p-4">
      <Link href="/admin" className="text-lg font-extrabold text-primary-500 px-4 mb-8">
        FW Admin
      </Link>
      <nav className="flex-1 space-y-1">
        {NAV.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-4 py-3 text-xs text-gray-400">
        Fundi Wangu Admin v0.1.0
      </div>
    </aside>
  );
}
