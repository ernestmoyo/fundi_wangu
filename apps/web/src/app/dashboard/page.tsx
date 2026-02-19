'use client';

import React from 'react';
import Link from 'next/link';

const QUICK_ACTIONS = [
  { href: '/book', icon: '🔧', label: 'Bomba' },
  { href: '/book', icon: '⚡', label: 'Umeme' },
  { href: '/book', icon: '🪚', label: 'Seremala' },
  { href: '/book', icon: '🎨', label: 'Rangi' },
];

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Karibu!</h1>

      {/* Quick book */}
      <div className="card mb-6">
        <h2 className="font-semibold mb-4">Pata Fundi Haraka</h2>
        <div className="grid grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="text-xs text-gray-600">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Active jobs placeholder */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Kazi Zinazoendelea</h2>
          <Link href="/dashboard/kazi" className="text-sm text-primary-500 hover:underline">
            Angalia Zote
          </Link>
        </div>
        <div className="text-center py-8 text-gray-400">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm">Huna kazi zinazoendelea</p>
          <Link href="/book" className="btn-primary mt-4 text-sm inline-flex">
            Anza Kazi Mpya
          </Link>
        </div>
      </div>

      {/* Recent */}
      <div className="card">
        <h2 className="font-semibold mb-4">Kazi za Hivi Karibuni</h2>
        <div className="text-center py-6 text-gray-400">
          <p className="text-sm">Bado huna historia ya kazi</p>
        </div>
      </div>
    </div>
  );
}
